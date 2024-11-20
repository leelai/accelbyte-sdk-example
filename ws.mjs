import 'dotenv/config'
import { AccelByte } from '@accelbyte/sdk'
import { IamUserAuthorizationClient, UsersAdminApi, UsersV4AdminApi, OAuth20V4Api, UsersApi } from '@accelbyte/sdk-iam'
// import { UserProfileApi } from '@accelbyte/sdk-basic';
import { Lobby } from '@accelbyte/sdk-lobby'
import { MatchTicketsApi, BackfillApi } from '@accelbyte/sdk-matchmaking'
import { PartyApi, GameSessionApi} from '@accelbyte/sdk-session'

import { parseArgs } from 'util'

import readline from 'readline';

const sdk = AccelByte.SDK({
  coreConfig: {
    baseURL: process.env.AB_BASE_URL || '',
    clientId: process.env.AB_CLIENT_ID || '',
    redirectURI: process.env.AB_REDIRECT_URI || '',
    namespace: process.env.AB_NAMESPACE || '',
    useSchemaValidation: false
  }
})

async function loginWithCredentials(username, password) {
  const tokenResponse = await new IamUserAuthorizationClient(sdk)
    .loginWithPasswordAuthorization({ username, password })
  
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
  create_party: createParty,
  cp: createParty, // shortcut for create_party
  join_party: joinParty,
  jp: joinParty, // shortcut for join_party
  create_gamesession: createGameSession,
  cgs: createGameSession, // shortcut for create_gamesession
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
  h: showHelp
};

function showHelp() {
  console.log('Available commands (with shortcuts):');
  console.log('greet, g <name> - Greet the user');
  console.log('add, a <a> <b> - Add two numbers');
  console.log('subtract, s <a> <b> - Subtract two numbers');
  console.log('me, m - Get user information');
  console.log('patch_me, pm <displayName> <uniqueDisplayName> - Update user information');
  console.log('create_match_ticket, cmt <matchPool> - Create a match ticket');
  console.log('create_party, cp <minPlayers> <maxPlayers> - Create a party');
  console.log('join_party, jp <code> - Join a party by code');
  console.log('create_gamesession, cgs <session_name> - Create a game session');
  console.log('join_gamesession, jgs <sessionID> - Join a game session');
  console.log('join_gamesession_by_code, jgc <code> - Join a game session by code');
  console.log('update_gamesession, ugs <sessionID> <joinability> - Update a game session');
  console.log('browse_gamesessions, bgs - Browse game sessions');
  console.log('get_users_me_gamesessions, gms - Get user\'s game sessions');
  console.log('create_user_bulk, cub <userIdsJson> - Create users in bulk');
  console.log('remove_backfill, rb <backfillTicketID> - Remove a backfill ticket');
  console.log('help, h - Show this help message');
}

//getUsersMeGamesessions

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
      console.info(response.data)
    })
    .catch(err => {
      console.error(err)
    })
}

function createParty(minPlayers, maxPlayers) {
  //convert string to number
  minPlayers = parseInt(minPlayers)
  maxPlayers = parseInt(maxPlayers)
  PartyApi(sdk).createParty({
    minPlayers: minPlayers,
    maxPlayers: maxPlayers,
  }).then(response => {
    console.info('createParty response.data', response.data)
  }).catch(err => {
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
      console.log(`ID: ${decodedPayload.SessionID}`);
      console.log('Members:');
      decodedPayload.Members.forEach(member => {
        console.log(`- ${member.ID}: ${member.StatusV2}`);
      });
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
        displayMemberChanges(decodedPayload);
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
      console.log('Unexpected disconnection');
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

    if (values.loginType === 'device' && values.deviceId) {
      tokenData = await loginWithDevice(values.deviceId)
    } else if (values.username && values.password) {
      tokenData = await loginWithCredentials(values.username, values.password)
    } else {
      throw new Error('Please provide valid credentials or device ID')
    }
  
    sdk.setToken({ 
      accessToken: tokenData.access_token, 
      refreshToken: tokenData.refresh_token 
    })

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