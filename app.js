const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, `cricketMatchDetails.db`)

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertPlayerDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
const convertMatchDbObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

const convertPlayerMatchScoreDbObjectToResponseObject = dbObject => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  }
}

// API 1

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player details;`
  const playersArray = await database.all(getPlayersQuery)
  response.send(convertPlayerDbObjectToResponseObject(eachPlayer))
})

// API 2

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
    SELECT 
      * 
    FROM 
      player details 
    WHERE 
      player_id = ${playerId};`
  const player = await database.get(getPlayerQuery)
  response.send(convertPlayerDbObjectToResponseObject(player))
})

// API 3

app.put('/players/:playerId/', async (request, response) => {
  const {playerName} = request.body
  const {playerId} = request.params

  const updatePlayerQuery = ` UPDATE player_details
SET
player_name = '${playerName}'
WHERE player_id = ${playerId};`
  await database.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

// API 4

app.get(`/matches/:matchId/`, async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `
    SELECT 
      * 
    FROM 
      match details
    WHERE 
      match_id = ${matchId};`
  const match = await database.get(getMatchQuery)
  response.send(convertMatchDbObjectToResponseObject(match))
})

// API 5

app.get(`/players/:playerId/matches`, async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
  SELECT 
   *
   FROM player_match_score
     NATURAL JOIN match_details
     WHERE
       player_id = ${playerId};`
  const playerMatches = await database.all(getPlayerMatchesQuery)
  response.send(
    playerMatches.map(eachMatch =>
      convertMatchDbObjectToResponseObject(eachMatch),
    ),
  )
})

// API 6

app.get(`/matches/:matchId/players`, async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`
  const MatchPlayers = await database.all(getMatchPlayersQuery)
  response.send({
    playerId: score[' player_details.player_id'],
    playerName: score['player_details.player_name'],
  })
})

// API 7

app.get(`/players/:playerId/playerScores`, async (request, response) => {
  const {playerId} = request.params
  const getPlayerScoredQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `
  const PlayerScored = await database.all(getPlayerScoredQuery)
  response.send({
    playerId: score[' player_details.player_id'],
    playerName: score['player_details.player_name'],
    totalScores: score['SUM(player_match_score.score)'],
    totatFours: score['SUM(fours)'],
    totatSixes: score['SUM(sixes)'],
  })
})
module.exports = app
