import 'dotenv/config'
import { AccelByte, createAuthInterceptor } from '@accelbyte/sdk'
import { IamUserAuthorizationClient, UsersAdminApi, UsersV4AdminApi, OAuth20V4Api, UsersApi } from '@accelbyte/sdk-iam'
// import { UserProfileApi } from '@accelbyte/sdk-basic';
import { Lobby } from '@accelbyte/sdk-lobby'
import { MatchTicketsApi, BackfillApi, RuleSetsApi, MatchPoolsApi } from '@accelbyte/sdk-matchmaking'
import { PartyApi, GameSessionApi, ConfigurationTemplateAdminApi} from '@accelbyte/sdk-session'
import { NamespaceAdminApi } from '@accelbyte/sdk-basic'

import { parseArgs } from 'util'

import readline from 'readline';

let currentSessionMembers = new Map(); // Store member info by session ID

const sdk = AccelByte.SDK({
  coreConfig: {
    baseURL: process.env.AB_BASE_URL || '',
    clientId: process.env.AB_CLIENT_ID || '',
    redirectURI: process.env.AB_REDIRECT_URI || '',
    namespace: process.env.AB_NAMESPACE || '',
    useSchemaValidation: false
  },
  axiosConfig: {
    interceptors: [
      createAuthInterceptor({
        clientId: process.env.AB_CLIENT_ID
      })
    ]
  }
})

async function loginWithCredentials(username, password) {
  console.log('Logging in with credentials...')
  const tokenResponse = await new IamUserAuthorizationClient(sdk).loginWithPasswordAuthorization({ username, password })
  console.log('tokenResponse', tokenResponse)
  
  if (!tokenResponse.response?.data.access_token) {
    throw new Error('Credential login failed')
  }
  return tokenResponse.response.data
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function greet(name) {
  console.log(`Hello, ${name}!`);
}

function add(a, b) {
  const result = Number(a) + Number(b);
  console.log(`Result of addition: ${result}`);
}

function subtract(a, b) {
  const result = Number(a) - Number(b);
  console.log(`Result of subtraction: ${result}`);
}

const commands = {
  greet: greet,
  g: greet,  // shortcut for greet
  add: add,
  a: add,    // shortcut for add
  subtract: subtract, 
  s: subtract, // shortcut for subtract
  me: me,
  m: me,     // shortcut for me
  patch_me: patchMe,
  pm: patchMe, // shortcut for patch_me
  create_match_ticket: createMatchTicket,
  cmt: createMatchTicket, // shortcut for create_match_ticket
  create_ruleset: createRuleSet,
  crs: createRuleSet, // shortcut for create_ruleset
  // update_ruleset: updateRuleSet,
  // urs: updateRuleSet, // shortcut for update_ruleset
  create_party: createParty,
  cp: createParty, // shortcut for create_party
  create_party_with_configuration: createPartyWithConfiguration,
  cpc: createPartyWithConfiguration, // shortcut for create_party_with_configuration
  create_match_pool: createMatchPool,
  cmp: createMatchPool, // shortcut for create_match_pool
  join_party: joinParty,
  jp: joinParty, // shortcut for join_party
  create_gamesession: createGameSession,
  cgs: createGameSession, // shortcut for create_gamesession
  createConfiguration: createConfiguration, // shortcut for create_gamesession
  cc: createConfiguration, // shortcut for create_gamesession
  getConfigurations: getConfigurations,
  gc: getConfigurations, // shortcut for getConfigurations
  delete_gamesession: deleteGameSession,
  dgs: deleteGameSession, // shortcut for delete_gamesession
  join_gamesession: joinGameSession,
  jgs: joinGameSession, // shortcut for join_gamesession
  join_gamesession_by_code: joinGameSessionByCode,
  jgc: joinGameSessionByCode, // shortcut for join_gamesession_by_code
  update_gamesession: updateGameSession,
  ugs: updateGameSession, // shortcut for update_gamesession
  browse_gamesessions: browseGameSessions,
  bgs: browseGameSessions, // shortcut for browse_gamesessions
  get_users_me_gamesessions: getUsersMeGamesessions,
  gms: getUsersMeGamesessions, // shortcut for get_users_me_gamesessions
  create_user_bulk: createUserBulk,
  cub: createUserBulk, // shortcut for create_user_bulk
  remove_backfill: deleteBackfill,
  rb: deleteBackfill, // shortcut for remove_backfill
  help: showHelp,
  h: showHelp,
  list_members: listSessionMembers,
  lm: listSessionMembers, // shortcut
  list_sessions: listAllSessions,
  ls: listAllSessions, // shortcut
  get_token: getToken,
  gt: getToken, // shortcut for get_token
  cn: createNamespace,
};

function showHelp() {
  console.log('\nAvailable commands (with shortcuts):\n');
  
  // Basic commands
  console.log('Basic Commands:');
  console.log('help, h - Show this help message');
  console.log('greet, g <name> - Greet the user');
  console.log('add, a <a> <b> - Add two numbers');
  console.log('subtract, s <a> <b> - Subtract two numbers');

  console.log('\nUser Management:');
  console.log('me, m - Get user information');
  console.log('patch_me, pm <displayName> <uniqueDisplayName> - Update user information');
  console.log('create_user_bulk, cub <userIdsJson> - Create users in bulk');
  console.log('get_token, gt - Get current access token');

  console.log('\nMatchmaking:');
  console.log('create_match_ticket, cmt <matchPool> - Create a match ticket');
  console.log('create_ruleset, crs <name> [allianceParams] - Create a ruleset');
  console.log('  allianceParams (optional, defaults):');
  console.log('  - minNumber: 1 (minimum number of alliances)');
  console.log('  - maxNumber: 1 (maximum number of alliances)');
  console.log('  - playerMinNumber: 2 (minimum players per alliance)');
  console.log('  - playerMaxNumber: 10 (maximum players per alliance)');
  console.log('remove_backfill, rb <backfillTicketID> - Remove a backfill ticket');

  console.log('\nParty Management:');
  console.log('create_party, cp <minPlayers> <maxPlayers> - Create a party');
  console.log('create_party_with_configuration, cpc <name> - Create a party with configuration');
  console.log('join_party, jp <code> - Join a party by code');

  console.log('\nSession Management:');
  console.log('create_gamesession, cgs <session_name> - Create a game session');
  console.log('delete_gamesession, dgs <sessionID> - Delete a game session');
  console.log('join_gamesession, jgs <sessionID> - Join a game session');
  console.log('join_gamesession_by_code, jgc <code> - Join a game session by code');
  console.log('update_gamesession, ugs <sessionID> <joinability> - Update a game session');
  console.log('browse_gamesessions, bgs - Browse game sessions');
  console.log('get_users_me_gamesessions, gms - Get user\'s game sessions');
  
  console.log('\nSession Information:');
  console.log('list_members, lm [sessionId] - List members in all sessions or specific session');
  console.log('list_sessions, ls - List all active sessions');

  console.log('\nConfiguration Management:');
  console.log('createConfiguration, cc <name> <minPlayers> <maxPlayers> - Create a configuration template');
  console.log('getConfigurations, gc - Get all configuration templates');
  
  console.log('\nNamespace Management:');
  console.log('createNamespace, cn <displayName> <namespace> - Create a namespace');
}

function createNamespace(displayName, namespace) {
  NamespaceAdminApi(sdk).createNamespace({
    displayName: displayName,
    namespace: namespace,
  }).then(response => { 
    console.log(response.data)
  }
  ).catch(err => {
    console.log(err.response.data)
  })
}

// Add new function after listSessionMembers
function listAllSessions() {
  if (currentSessionMembers.size === 0) {
    console.log('No active sessions');
    return;
  }
  console.log('\nActive Sessions:');
  for (const [sessionId, members] of currentSessionMembers) {
    console.log(`\nSession ID: ${sessionId}`);
    console.log(`Total Members: ${members.length}`);
  }
}

// Add new command function
function listSessionMembers(sessionId, statusFilter) {
  if (!sessionId) {
    // List all sessions and their members
    if (currentSessionMembers.size === 0) {
      console.log('No active sessions');
      return;
    }
    console.log('\nCurrent Session Members:');
    for (const [sid, members] of currentSessionMembers) {
      console.log(`\nSession ${sid}:`);
      const filteredMembers = statusFilter ? 
        members.filter(m => m.status === statusFilter) :
        members;
      filteredMembers.forEach(m => console.log(`- ${m.id} (${m.status})`));
    }
  } else {
    // List specific session
    const members = currentSessionMembers.get(sessionId);
    if (!members) {
      console.log(`No members found for session ${sessionId}`);
      return;
    }
    console.log(`\nMembers in session ${sessionId}:`);
    const filteredMembers = statusFilter ? 
      members.filter(m => m.status === statusFilter) :
      members;
    filteredMembers.forEach(m => console.log(`- ${m.id} (${m.status})`));
  }
}

function getToken() {
  const token = sdk.getToken();
  console.log(token);
}

async function me() {
  let response = await UsersAdminApi(sdk).getUsersMe_v3()
  console.log(response.data)
}

function patchMe(displayName, uniqueDisplayName) {
  UsersV4AdminApi(sdk).patchUserMe_v4({
      displayName: displayName,
      uniqueDisplayName: uniqueDisplayName
  })
  .then(response => {
      console.log(response.data);
  })
  .catch(error => {
      console.error(error);
  });
}

function createMatchTicket(matchPool) {
  const defaultMatchPool = 'match-pool-2'; // Define your default match pool here
  const poolToUse = matchPool || defaultMatchPool;

  MatchTicketsApi(sdk)
    .createMatchTicket({
      matchPool: poolToUse,
      // attributes: {'new_session_only': true}
    })
    .then(response => {
      handleMatchTicketResponse(response);
    })
    .catch(err => {
      console.error(err)
    })
}

function createRuleSet(name,
  minNumber = 1,
  maxNumber = 1,
  playerMinNumber = 2,
  playerMaxNumber = 10
) {
  // Validate parameters
  if (!name) throw new Error('Rule set name is required');
  if (minNumber < 1 || maxNumber < 1) throw new Error('Alliance number must be at least 1');
  
  RuleSetsApi(sdk).createRuleset({
    name: name,
    enable_custom_match_function: true,
    data: {
      alliance: {
        min_number: minNumber,
        max_number: maxNumber,  
        player_min_number: playerMinNumber,
        player_max_number: playerMaxNumber
      },
      auto_backfill: true
    }
  }).then(response => {
    console.info('createRuleSet response.status', response.status)
  }).catch(err => {
    console.error(err)
  })
}

// function updateRuleSet(rulesetID, name) {

function createParty(minPlayers = 2, maxPlayers = 10) {
  //convert string to number
  minPlayers = parseInt(minPlayers)
  maxPlayers = parseInt(maxPlayers)
  PartyApi(sdk).createParty({
    minPlayers: minPlayers,
    maxPlayers: maxPlayers,
  }).then(response => {
    // console.info('createParty response.data', response.data)
    handleSessionResponse(response);
  }).catch(err => {
    console.error(err)
  })
}

function createPartyWithConfiguration(name) {
  //default session name
  name = name || 'my_test_configuration_1'
  PartyApi(sdk).createParty({
    configurationName: name,
  }).then(response => {
    console.info('createParty response.data', response.data)
  }).catch(err => {
    console.error(err)
  })
}

function createMatchPool(name, rule_set, session_template) {
  MatchPoolsApi(sdk).createMatchPool({
    name: name,
    rule_set: rule_set,
    session_template: session_template,
    match_function: 'default',
  }).then(response => {
    console.info('createMatchPool response status', response.status)
  }
  ).catch(err => {
    console.error(err)
  })
}

function joinParty(code) {
  PartyApi(sdk).createPartyUserMeJoinCode({
    code: code
  }).then(response => {
    console.info('joinParty response.data', response.data)
  }).catch(err => {
    console.error(err)
  })
}

function createGameSession(session_name) {
  //default session name
  session_name = session_name || 'my_test_session_1'
  GameSessionApi(sdk).createGamesession({
    configurationName: session_name,
  }).then(response => {
    handleSessionResponse(response);
  }).catch(err => {
    handleSessionError(err);
  })
}

function createConfiguration(name = 'my_test_configuration_1', minPlayers = 2, maxPlayers = 10) {
  // Convert string parameters to numbers
  minPlayers = parseInt(minPlayers);
  maxPlayers = parseInt(maxPlayers);
  
  ConfigurationTemplateAdminApi(sdk).createConfiguration({
    name: name,
    joinability: 'OPEN',
    autoJoin: true,
    autoLeaveSession: true,
    minPlayers: minPlayers,
    maxPlayers: maxPlayers,
  }).then(response => {
    console.info('createConfiguration response.data', response.data)
  }).catch(err => {
    console.error(err)
  })
}

function getConfigurations() {
  ConfigurationTemplateAdminApi(sdk).getConfigurations().then(response => {
    console.info('getConfigurations response.data', response.data)
  }).catch(err => {
    console.error(err)
  })
}


function deleteGameSession(sessionID) {
  //deleteGamesession_BySessionId
  GameSessionApi(sdk).deleteGamesession_BySessionId(sessionID).then(response => {
    console.log(response.status)
  }).catch(err => {
    console.error(err)
  })
}

function browseGameSessions() {
  GameSessionApi(sdk).createGamesession_ByNS().then(response => {
    if (Array.isArray(response.data.data)) {
      if (response.data.data.length === 0) {
        console.log('No game sessions found');
        return;
      }
      response.data.data.forEach((session, index) => {
        console.log(formatSessionDetails(session));
      });
    } else {
      console.error('Expected an array but got:', typeof response.data);
    }
  }).catch(err => {
    console.error(err)
  })
}

// Common formatting constants
const SEPARATOR = '-'.repeat(20);
const INDENT_CHAR = '  ';
const LIST_MARKER = '•';
const TEAM_MARKER = '►';
const TREE_BRANCH = '├─';
const TREE_END = '└─';

/**
 * Shared team formatting function
 */
function formatTeam(team, teamIndex) {
  const usersList = team.userIDs
    .map(id => `${INDENT_CHAR}│${INDENT_CHAR}${LIST_MARKER} ${id}`)
    .join('\n');
    
  const partiesList = team.parties.map((party, partyIndex, parties) => {
    const isLastParty = partyIndex === parties.length - 1;
    const branchChar = isLastParty ? TREE_END : TREE_BRANCH;
    const contentPrefix = isLastParty ? INDENT_CHAR : '│';
    
    const partyUsers = party.userIDs
      .map(id => `${INDENT_CHAR}${INDENT_CHAR}${contentPrefix}${INDENT_CHAR}${INDENT_CHAR}${LIST_MARKER} ${id}`)
      .join('\n');
      
    return `
${INDENT_CHAR}${INDENT_CHAR}${branchChar} Party ${partyIndex + 1}:
${INDENT_CHAR}${INDENT_CHAR}${contentPrefix}${INDENT_CHAR} ID: ${party.partyID || 'N/A'}
${partyUsers}`;
  }).join('');

  return `
${TEAM_MARKER} Team ${teamIndex + 1}:
${INDENT_CHAR}${TREE_BRANCH} Users:
${usersList}
${INDENT_CHAR}${TREE_END} Parties:${partiesList}`;
}

/**
 * Formats session details into a readable string representation
 * @param {Object} data - Session data object
 * @returns {string} Formatted session details
 */
function formatSessionDetails(data) {
  function formatBasicInfo() {
    return `
Session Details:
${SEPARATOR}
ID: ${data.id}
Code: ${data.code}
Leader ID: ${data.leaderID}
Created At: ${data.createdAt}`;
  }

  function formatMembers() {
    if (!data.members?.length) return '';
    
    const membersList = data.members
      .map(member => `- ${member.id}`)
      .join('\n');
      
    return `
Members:
${membersList}`;
  }

  function formatTeams() {
    if (!data.teams?.length) return '';
    
    return `
Teams:
${SEPARATOR}${data.teams.map((team, idx) => formatTeam(team, idx)).join('\n')}
${SEPARATOR}`;
  }

  return `${formatBasicInfo()}${formatMembers()}${formatTeams()}`;
}

function displayMemberChanges(decodedPayload) {
  console.log(`Members changed in session ${decodedPayload.SessionID}
  Joiner: ${decodedPayload.JoinerID}
  Leader: ${decodedPayload.LeaderID}`);

  if (!decodedPayload.Teams) return;

  console.log(`
  Teams Update:
  ${SEPARATOR}${decodedPayload.Teams.map((team, idx) => formatTeam(team, idx)).join('\n')}
  ${SEPARATOR}`);
}

function formatPartyMemberChanges(data) {
  const basicInfo = `
Party Details:
${SEPARATOR}
Party ID: ${data.PartyID}
Leader ID: ${data.LeaderID}
Text Chat: ${data.TextChat}
`;

  const membersInfo = data.Members.map(member => `
Member: ${member.ID}
Status: ${member.Status}
Status V2: ${member.StatusV2}
Updated At: ${member.UpdatedAt}`).join('\n');

  const sessionInfo = data.Session ? `
Session Info:
${SEPARATOR}
ID: ${data.Session.ID}
Code: ${data.Session.Code}
Configuration: ${data.Session.ConfigurationName}
Min Players: ${data.Session.Configuration.MinPlayers}
Max Players: ${data.Session.Configuration.MaxPlayers}
Joinability: ${data.Session.Configuration.Joinability}
Is Full: ${data.Session.IsFull}` : '';

  return `${basicInfo}${membersInfo}${sessionInfo}
${SEPARATOR}`;
}

function formatPartyCreation(data) {
  return `
Party Created:
${SEPARATOR}
Party ID: ${data.PartyID}
Created By: ${data.CreatedBy}
Join Code: ${data.Code}
Text Chat: ${data.TextChat}
Inactive Timeout: ${data.inactiveTimeout}s
${SEPARATOR}`;
}

function formatPartyJoined(data) {
  const membersInfo = data.Members.map(member => `
Member: ${member.ID}
Status: ${member.Status}
Status V2: ${member.StatusV2}
Updated At: ${member.UpdatedAt}`).join('\n');

  return `
Party Joined:
${SEPARATOR}
Party ID: ${data.PartyID}
Join Code: ${data.Code}
Text Chat: ${data.TextChat}
${SEPARATOR}
Members:${membersInfo}
${SEPARATOR}`;
}

function handleSessionResponse(response) {
  const { status, data, config } = response;

  console.log('\n=== Session Response ===');
  console.log('Status:', status);
  console.log('Endpoint:', `${config.method.toUpperCase()} ${config.url}`);

  if (status === 200 || status === 201) {
    console.log(formatSessionDetails(data));
    return {
      status,
      sessionId: data.id,
      code: data.code
    };
  } else {
    console.log('\nError Details:');
    console.log('-'.repeat(20));
    console.log('Code:', data.errorCode);
    console.log('Name:', data.name);
    console.log('Message:', data.errorMessage);

    return {
      status,
      error: {
        code: data.errorCode,
        name: data.name,
        message: data.errorMessage
      }
    };
  }
}

function handleSessionError(error) {
  const {status, data, config} = error.response || {};
  
  console.log('\n=== Join Session Error ===');
  console.log('Status:', status);
  console.log('Endpoint:', `${config?.method?.toUpperCase()} ${config?.url}`);
  
  if (data) {
    console.log('\nError Details:');
    console.log('-'.repeat(20));
    console.log('Code:', data.errorCode);
    console.log('Name:', data.name); 
    console.log('Message:', data.errorMessage);
  }
}

function handleMatchTicketResponse(response) {
  const { status, data, config } = response;

  console.log('\n=== Match Ticket Response ===');
  console.log('Status:', status);
  console.log('Endpoint:', `${config.method.toUpperCase()} ${config.url}`);

  if (status === 200 || status === 201) {
    console.log(`\nMatch Ticket Details:`);
    console.log(SEPARATOR);
    console.log(`Ticket ID: ${data.matchTicketID}`);
    console.log(`Queue Time: ${data.queueTime}`);
    console.log(SEPARATOR);
    return {
      status,
      ticketId: data.matchTicketID,
      queueTime: data.queueTime
    };
  } else {
    console.log('\nError Details:');
    console.log(SEPARATOR);
    console.log('Code:', data.errorCode);
    console.log('Message:', data.errorMessage);
    console.log(SEPARATOR);
    return {
      status,
      error: {
        code: data.errorCode,
        message: data.errorMessage
      }
    };
  }
}

function joinGameSessionByCode(code) {
  if (!code) {
    console.error('Please provide a code to join the game session')
    return
  }
  GameSessionApi(sdk).createGamesessionJoinCode({
    code: code,
  }).then(response => {
    handleSessionResponse(response);
  }).catch(err => {
    handleSessionError(err);
  })
}

//join_gamesession
function joinGameSession(sessionID) {
  //if sessionID is not provided, return
  if (!sessionID) {
    console.error('Please provide a sessionID to join the game session')
    return
  }
  GameSessionApi(sdk).createJoin_BySessionId(sessionID).then(response => {
    handleSessionResponse(response);
  }).catch(err => {
    handleSessionError(err);
  })
}

//update_gamesession
function updateGameSession(sessionID, joinability, version) {
  //if sessionID is not provided, return
  if (!sessionID) {
    console.error('Please provide a sessionID to update the game session')
    return
  }
  //convert string to number
  version = parseInt(version)

  GameSessionApi(sdk).updateGamesession_BySessionId(sessionID, {
    joinability: joinability,
    type: 'P2P',
    version: version
  }).then(response => {
    console.info('updateGamesession_BySessionId response.data', response.data)
  }).catch(err => {
    console.error(err)
  })
}

async function getUsersMeGamesessions() {
  let response = await GameSessionApi(sdk).getUsersMeGamesessions()
  if (response?.data) {
    console.log(response.data.paging)
    response.data.data.forEach(session => {
      console.log(formatSessionDetails(session));
    });
  }
}

async function createUserBulk(userIds) {
  let response = await UsersApi(sdk).createUserBulkBasic_v3({
    userIds: userIds
  })
  console.log(response.data)
}

async function deleteBackfill(backfillTicketID) {
  BackfillApi(sdk).deleteBackfill_ByBackfillId(backfillTicketID).then(response => {
    console.log(response.status)
  }
  ).catch(err => {
    console.error(err)
  })
}

function ask() {
  rl.question('請輸入指令: ', (input) => {
    const [command, ...args] = input.split(' ');

    if (commands[command]) {
      commands[command](...args);
    } else {
      console.log('無效指令，請再試一次。');
    }

    ask();
  });
}

async function loginWithDevice(deviceId) {
  const response = await OAuth20V4Api(sdk, {
    axiosConfig: {
      request: {
        headers: {
          Authorization: `Basic ${Buffer.from(`${sdk.assembly().coreConfig.clientId}:`).toString('base64')}`
        }
      }
    }
  }).postTokenOauth_ByPlatformId_v4('device', { device_id: deviceId })
  
  if (!response.data?.access_token) {
    throw new Error('Device login failed')
  }
  return response.data
}

function decodeBase64Payload(payload) {
  try {
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode payload:', error);
    return null;
  }
}

function handleSessionNotification(topic, payload) {
  const decodedPayload = decodeBase64Payload(payload);
  if (!decodedPayload) return;

  console.log(`\n=== ${topic} ===`);
  
  switch (topic) {
    case 'OnSessionInvited':
      console.log(`Session Invite: ${decodedPayload.SessionID}`);
      console.log(`From: ${decodedPayload.SenderID}`);
      console.log(`Expires: ${decodedPayload.ExpiredAt}`);
      break;

    case 'OnSessionRejected':
      console.log(`Session ${decodedPayload.SessionID} rejected by ${decodedPayload.RejectedID}`);
      console.log('Current members status:');
      decodedPayload.Members.forEach(member => {
        console.log(`- ${member.ID}: ${member.StatusV2}`);
      });
      break;

    case 'OnSessionKicked':
      console.log(`Kicked from session ${decodedPayload.SessionID}`);
      break;

    case 'OnSessionJoined':
      console.log(decodedPayload)
      console.log(`ID: ${decodedPayload.SessionID}`);
      console.log('Members:');
      decodedPayload.Members.forEach(member => {
        console.log(`- ${member.ID}: ${member.StatusV2}`);
      });

      // Store members for this session
      currentSessionMembers.set(decodedPayload.SessionID, 
        decodedPayload.Members.map(member => ({
          id: member.ID,
          status: member.StatusV2
        }))
      );
      break;

    case 'OnGameSessionInviteTimeout':
    case 'OnGameSessionInviteCancelled':
      console.log(`Session ${decodedPayload.SessionID} invitation ${topic.replace('OnGameSession', '').toLowerCase()}`);
      break;

    case 'OnSessionStorageChanged':
      console.log(`Storage changed in session ${decodedPayload.SessionID}`);
      console.log('Changes:', JSON.stringify(decodedPayload.StorageChanges, null, 2));
      console.log(`Changed by: ${decodedPayload.ActorUserID}`);
      break;

    case 'OnSessionNativePlatformSynced':
      console.log(`Session ${decodedPayload.SessionID} synced with ${decodedPayload.PlatformName}`);
      console.log(`Platform session ID: ${decodedPayload.PlatformSessionID}`);
      break;

    case 'OnSessionJoinedSecret':
      console.log(`Received session secret: ${decodedPayload.secret}`);
      break;

    case 'OnSessionMembersChanged':
      console.log(decodedPayload)
      displayMemberChanges(decodedPayload);
      // Update stored members
      currentSessionMembers.set(decodedPayload.SessionID,
        decodedPayload.Members.map(member => ({
          id: member.ID,
          status: member.StatusV2
        }))
      );
      break;
  
      case 'OnGameSessionUpdated':
        console.log(`Session ${decodedPayload.ID} updated`);
        console.log('Configuration:', decodedPayload.Configuration);
        console.log('Version:', decodedPayload.Version);
        console.log('Leader ID:', decodedPayload.LeaderID);
        break;
  
      case 'OnDSStatusChanged':
        console.log(`DS Status changed for session ${decodedPayload.SessionID}`);
        if (decodedPayload.GameServer) {
          console.log('Server Status:', decodedPayload.GameServer.status);
          console.log('IP:', decodedPayload.GameServer.ip);
          console.log('Port:', decodedPayload.GameServer.port);
          console.log('Protocol:', decodedPayload.GameServer.protocol);
        }
        break;
      
      case 'OnSessionEnded':
        console.log(`Session ${decodedPayload.SessionID} ended`);
        // Remove session from stored members
        currentSessionMembers.delete(decodedPayload.SessionID);
        break;
      
      case 'OnPartyCreated':
        console.log(formatPartyCreation(decodedPayload));
        break;

      case 'OnPartyMembersChanged':
        console.log(formatPartyMemberChanges(decodedPayload));
        break;

      case 'OnPartyJoined':
        console.log(formatPartyJoined(decodedPayload));
        break;
      
      default:
        console.log('Unhandled topic:', topic);
        console.log('Payload:', decodedPayload);
  }
}

function handleWebSocketClose(err) {
  const closeInfo = {
    code: err?.[Symbol.for('kCode')] || 0,
    reason: err?.[Symbol.for('kReason')] || 'Unknown',
    wasClean: err?.[Symbol.for('kWasClean')] || false
  };

  console.log('\n=== WebSocket Connection Closed ===');
  console.log('Code:', closeInfo.code);
  console.log('Reason:', closeInfo.reason);
  console.log('Clean Disconnect:', closeInfo.wasClean);

  // Handle specific close codes
  switch (closeInfo.code) {
    case 4020:
      console.log('Session expired or token revoked. Please re-authenticate.');
      break;
    case 1000:
      console.log('Normal closure');
      break;
    default:
      console.log('Unexpected disconnection', err);
  }
}

const main = async () => {
  try {
    const parsedArgs = parseArgs({
      options: {
        username: { type: 'string' },
        password: { type: 'string' },
        deviceId: { type: 'string' },
        loginType: { type: 'string' }
      },
      args: process.argv.slice(2)
    })

    const { values } = parsedArgs
    let tokenData

    console.log('values', values)
    if (values.loginType === 'device' && values.deviceId) {
      tokenData = await loginWithDevice(values.deviceId)
    } else if (values.username && values.password) {
      console.log('Logging in with credentials...')
      tokenData = await loginWithCredentials(values.username, values.password)
    } else {
      throw new Error('Please provide valid credentials or device ID')
    }
  
    sdk.setToken({ 
      accessToken: tokenData.access_token, 
      refreshToken: tokenData.refresh_token 
    })

    console.log('Logged in successfully')

    const lobbyWs = Lobby.WebSocket(sdk)
    lobbyWs.connect()

    lobbyWs.onOpen(() => {
      console.log('websocket connected')
    })

    lobbyWs.onClose(err => handleWebSocketClose(err));
    lobbyWs.onMessage(message => {
      switch (message?.type) {
        case 'connectNotif': {
          break
        }
        case 'messageNotif': {
          break
        }

        case 'messageSessionNotif': {
          handleSessionNotification(message.topic, message.payload);
          break
        }
      }
    })
    lobbyWs.onError(err => console.log('error', err))

    ask();
  } catch (error) {
    console.error(error)
  }
}

main()