import 'dotenv/config'
import { AccelByte } from '@accelbyte/sdk'
import { IamUserAuthorizationClient, UsersAdminApi, UsersV4AdminApi, OAuth20V4Api } from '@accelbyte/sdk-iam'
// import { UserProfileApi } from '@accelbyte/sdk-basic';
import { Lobby } from '@accelbyte/sdk-lobby'
import { MatchTicketsApi } from '@accelbyte/sdk-matchmaking'
import { PartyApi, GameSessionApi} from '@accelbyte/sdk-session'

import { parseArgs } from 'util'

import readline from 'readline';
import { create } from 'domain'
import { join } from 'path'

const sdk = AccelByte.SDK({
  coreConfig: {
    baseURL: process.env.AB_BASE_URL || '',
    clientId: process.env.AB_CLIENT_ID || '',
    redirectURI: process.env.AB_REDIRECT_URI || '',
    namespace: process.env.AB_NAMESPACE || ''
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
  add: add,
  subtract: subtract,
  me: me,
  patch_me: patchMe,
  create_match_ticket: createMatchTicket,
  create_party: createParty,
  join_party: joinParty,
  create_gamesession: createGameSession,
  browse_gamesessions: browseGameSessions,
  join_gamesession: joinGameSession,
  join_gamesession_by_code: joinGameSessionByCode,
  update_gamesession: updateGameSession,
  get_users_me_gamesessions: getUsersMeGamesessions,
  help: showHelp,
  h: showHelp
};

function showHelp() {
  console.log('Available commands:');
  console.log('greet <name> - Greet the user');
  console.log('add <a> <b> - Add two numbers');
  console.log('subtract <a> <b> - Subtract two numbers');
  console.log('me - Get user information');
  console.log('patch_me <displayName> <uniqueDisplayName> - Update user information');
  console.log('create_match_ticket <matchPool> - Create a match ticket');
  console.log('create_party <minPlayers> <maxPlayers> - Create a party');
  console.log('join_party <code> - Join a party by code');
  console.log('create_gamesession <session_name> - Create a game session');
  console.log('join_gamesession <sessionID> - Join a game session');
  console.log('join_gamesession_by_code <code> - Join a game session by code');
  console.log('update_gamesession <sessionID> <joinability> - Update a game session, joinability: "OPEN" or "CLOSED"');
  console.log('help or h - Show this help message');
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
      console.info('createMatchTicket response.data', response.data)
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
    console.info('createGameSession response.data', response.data)
  }).catch(err => {
    console.error(err)
  })
}

//browse_gamesessions
function browseGameSessions() {
  //createGamesession_ByNS
  GameSessionApi(sdk).createGamesession_ByNS({
    namespace: 'default',
    limit: 10,
    offset: 0,
    sortBy: 'createdAt',
    sort: 'desc',
  }).then(response => {
    console.info('createGamesession_ByNS response.data', response.data)
  }).catch(err => {
    console.error(err)
  })
}

//join_gamesession_by_code
function joinGameSessionByCode(code) {
  //if code is not provided, return
  if (!code) {
    console.error('Please provide a code to join the game session')
    return
  }
  GameSessionApi(sdk).createGamesessionJoinCode({
    code: code,
  }).then(response => {
    console.info('joinGameSession response.data', response.data)
  }).catch(err => {
    console.error(err)
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
    console.info('createJoin_BySessionId response.data', response.data)
  }).catch(err => {
    console.error(err)
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

//get_users_me_gamesessions
async function getUsersMeGamesessions() {
  let response = await GameSessionApi(sdk).getUsersMeGamesessions()
  console.log(response.data)
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

const main = async () => {
  try {
    const parsedArgs = parseArgs({
      options: {
        username: { type: 'string' },
        password: { type: 'string' },
        deviceId: { type: 'string' },
        loginType: { type: 'string' },
        createMatchTicket: { type: 'boolean' },
        sessionID: { type: 'string' },
        createParty: { type: 'boolean' },
        joinParty: { type: 'string' },
        createSession: { type: 'boolean' },
        joinSession : { type: 'string' }
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

    lobbyWs.onClose(err => console.log('closed', err))
    lobbyWs.onMessage(message => {
      switch (message?.type) {
        case 'connectNotif': {
          console.log('>>connectNotif')
          break
        }
        case 'messageNotif': {
          console.log('>>messageNotif')
          try {
            if (!message?.payload) {
              console.log('No message or payload found');
              return;
            }
          
            const data = JSON.parse(atob(message.payload));
            console.log('data:', data);

            if (data?.Teams?.[0]?.UserIDs) {
              console.log('UserIDs:', data.Teams[0].UserIDs);
              return;
            }
          } catch (error) {
            console.error('Error processing payload:', error.message);
          }
          break
        }

        case 'messageSessionNotif': {
          console.log('>>messageSessionNotif')
          if (message?.payload) {
            const payload = JSON.parse(atob(message.payload));
            if ('SessionID' in payload && 'SenderID' in payload && 'ExpiredAt' in payload) {
              console.log('Received invitation:');
              console.log('SessionID:', payload.sessionID);
              console.log('SenderID:', payload.SenderID);
              console.log('ExpiredAt:', payload.ExpiredAt);
            } else {
              console.log('Payload:', payload);
            }
          }

          try {
            const data = JSON.parse(atob(message.payload));
          
            if (data?.Teams) {
              data.Teams.forEach(team => {
                console.log('UserIDs:', team.userIDs || 'No UserIDs found');
                console.log('Parties:', team.parties || 'No Parties found');
              });
            }

            //Members: [ [Object] ], 印出來
            if (data?.Members) {
              data.Members.forEach(member => {
                console.log('Members:', member || 'No Members found');
              });
            }
          } catch (error) {
            console.error('Error processing payload:', error.message);
            //
          }
          break
        }

        default: {
          console.info(message)
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