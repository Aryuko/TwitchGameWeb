/** 
 * Project:     lobster-race
 * Repository:  /
 * Author:      Aryuko
 * Version:     0.0.1
*/

const path = require('path')
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const { ChatClient } = require('@twurple/chat');
const { RefreshingAuthProvider } = require('@twurple/auth');

const config = require('./config.json')

/* SERVER */
const publicPath = path.join(__dirname, '../../public')
app.use(express.static(publicPath))
/* Let the React app take care of all other routing */
app.get('*', (req, res) => res.sendFile(path.join(publicPath, '/index.html')))
http.listen(config.server.PORT, () => console.log('listening on port', config.server.PORT))

/* TWITCH CHAT */
const clientId = config.twitch.CLIENT_ID;
const clientSecret = config.twitch.CLIENT_SECRET;
const accessToken = config.twitch.ACCESS_TOKEN;
const refreshToken = config.twitch.REFRESH_TOKEN;
const authProvider = new RefreshingAuthProvider({
    clientId,
    clientSecret,
    refreshToken,
    // onRefresh: (token) => {
    //     console.log("token refresh");
    //     // do things with the new token data, e.g. save them in your database
    // }
});

authProvider.addUser(24000582, { accessToken, refreshToken }, ['chat'])
const chatClient = new ChatClient({ authProvider, channels: [] });

/* TWITCH CHAT EVENTS */
chatClient.connect();
chatClient.onConnect(async () => {
    console.log("Established connection with twitch chat");
});
chatClient.onJoin((channel, user) => {
    if (user == config.twitch.CLIENT_USERNAME) {
        console.log(`Joined channel ${channel}`)
        // console.log(channelData);
    }
})
chatClient.onMessage(async (channel, user, message, msg) => {
    if (channelData[channel]) {
        // User messages
        if (channelData[channel].gameState == gameStates.Active && message.includes("🦞")) {
            addLobster(channel, user, msg.userInfo.color)
        } // Mod commands
        else if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
            switch (message.trim()) {
                case "!startrace":
                    startRace(channel)
                    break
                case "!stoprace":
                    stopRace(channel)
                    break
                case "!mockdata":
                    startMockData(channel, 100)
                    break
            }
        }
    }
})

/* CLIENT CONNECTION */
var clientCount = 0
var channelData = {}
var channelDataIntervals = {}
var channelClients = {}
const gameStates = {
    Inactive: "inactive",
    Active: "active",
    Finished: "finished"
}
io.on('connection', (socket) => {
    console.log(`Client connected, serving ${++clientCount} total connection(s)`)
    socket.on('disconnect', () => {
        // Remove socket from channelClients list
        for (let c in channelClients) {
            let i = channelClients[c].indexOf(socket)
            if (i != -1) {
                channelClients[c].splice(i, 1)
            }
        }
        console.log(`Client disconnected, serving ${--clientCount} total connection(s)`)
    })

    // TODO: leave channel if socket inactive
    socket.on('init', (data) => {
        if (data && data.channel) {
            console.log('init id:', socket.id)
            channelClients[data.channel] ??= []

            if (!channelClients[data.channel].includes(socket)) {
                channelClients[data.channel].push(socket)
            }

            // TODO: Only join if you are not already part of the channel
            chatClient.join(data.channel)

            if (channelData[data.channel]) {
                // console.log("data exists already, syncing")
                syncData(data.channel, socket)
            } else {
                channelData[data.channel] = {
                    "clients": [],
                    "gameState": gameStates.Inactive,
                    "goal": data.config.goal,
                    "winners": [],
                    "lobsters": {}
                }
            }

            channelData[data.channel].clients

            socket.on('requestMockData', (data2) => {
                startMockData(data.channel, 100)
            })
        }
    })
})

function syncData(channel, socket = null) {
    if (socket) {
        socket.emit("channelData", channelData[channel])
    } else {
        // console.log(`syncing channel '${channel}' with ${channelClients[channel].length} clients`)
        for (let client of channelClients[channel]) {
            client.emit("channelData", channelData[channel])
        }
    }
}

function finishRace(channel) {
    if (channelDataIntervals[channel]) {
        clearInterval(channelDataIntervals[channel])
        channelDataIntervals[channel] = null
    }
    if (channelData[channel].gameState != gameStates.Finished) {
        channelData[channel].gameState = gameStates.Finished

        let winners = Object.entries(channelData[channel].lobsters).sort((a, b) => {
            return b[1].count - a[1].count
        }).splice(0, 3).map(item => {
            return {
                "user": item[0],
                ...item[1]
            }
        })

        channelData[channel].winners = winners

        syncData(channel)

        setTimeout(() => {
            // console.log("stopping finish screen")
            stopRace(channel)
        }, config.server.RESET_DELAY)
    }
}

function stopRace(channel) {
    if (channelDataIntervals[channel]) {
        clearInterval(channelDataIntervals[channel])
        channelDataIntervals[channel] = null
    }
    clearLobsters(channel)
    syncData(channel)
}

function startRace(channel) {
    if (!channelDataIntervals[channel] && channelData[channel].gameState == gameStates.Inactive) {
        channelData[channel].gameState = gameStates.Active
        syncData(channel)
        // console.log("new game started")

        channelDataIntervals[channel] = setInterval(() => {
            syncData(channel)
        }, config.server.SYNC_DELAY)
    }
}

function addLobster(channel, user, color = "dd2e44") {
    if (channelData[channel]) {
        channelData[channel].lobsters[user] ??= {
            count: 0,
            color: color,
            points: 0
        }
        if (++channelData[channel].lobsters[user].count >= channelData[channel].goal) {
            // game over
            finishRace(channel)
        }
    } else {
        console.log(`No '${channel}' channel saved`)
    }
}

function clearLobsters(channel) {
    if (channelData[channel]) {
        channelData[channel].lobsters = {};
        channelData[channel].winners = [];
        channelData[channel].gameState = gameStates.Inactive;
    }
}

let mockActive = false;
function startMockData(channel, count) {
    if (!mockActive) {
        mockActive = true;
        clearLobsters(channel);
        startRace(channel)

        let i = 0;
        const interval = setInterval(() => {
            if (i++ == count) {
                // stopRace(channel)
                return clearInterval(interval)
            } else if (channelData[channel].winners.length > 0) {
                return clearInterval(interval)
            } else {
                if (Math.random() < 0.5) { addLobster(channel, "aryu", Math.random() * 0xFFFFFF) }
                if (Math.random() < 0.5) { addLobster(channel, "risshella", Math.random() * 0xFFFFFF) }
                if (Math.random() < 0.5) { addLobster(channel, "kokos", Math.random() * 0xFFFFFF) }
                if (Math.random() < 0.5) { addLobster(channel, "wooloo", Math.random() * 0xFFFFFF) }
                if (Math.random() < 0.5) { addLobster(channel, "liv", Math.random() * 0xFFFFFF) }
                if (Math.random() < 0.5) { addLobster(channel, "reila", Math.random() * 0xFFFFFF) }
            }
        }, config.server.SYNC_DELAY)
        mockActive = false;
    }
}


/* channelData structure
{
    "risshella": {
        "clients": []
        "gameState": gameState.InProgress,
        "winners": [
            {
                user: aryu,
                count: 10,
                color: "C7A3FF"
                points: 0
            }
        ],
        "goal": 100,
        "lobsters": {
            "aryu": {
                count: 0,
                color: "C7A3FF"
                points: 0
            },
            "risshella": {
                count: 0,
                color: "#fcd303"
                points: 0
            },
        },
    }
    "aryu": {
        ...
    }
}
*/

/* channelClients structure
{
    "risshella": [
        client1,
        client2
    ],
    "aryu": [
        client3,
        client4
    ]
}
*/