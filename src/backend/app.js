/** 
 * Project:     planning-poker TODO: Fix
 * Repository:  https://github.com/Aryuko/planning-poker/
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

/* CLIENT CONNECTION */
var clientCount = 0
var channelData = {}
var channelDataIntervals = {}
const gameStates = {
    Inactive: "inactive",
    Active: "active",
    Finished: "finished"
}
io.on('connection', (socket) => {
    console.log(`Client connected, serving ${++clientCount} total connection(s)`)
    socket.on('disconnect', () => { console.log(`Client disconnected, serving ${--clientCount} total connection(s)`) })


    // TODO: leave channel if socket inactive
    // TODO: sync lobster data on init if it already exists
    socket.on('init', (data) => {
        if (data && data.channel) {
            console.log('init id:', socket.CLIENT_ID)
            // TODO: Only join if you are not already part of the channel
            chatClient.join(data.channel)
            if (channelData[data.channel]) {
                console.log("data exists already, syncing")
                syncData(socket, data.channel)
            } else {
                channelData[data.channel] = {
                    "gameState": gameStates.Inactive,
                    "goal": data.config.goal,
                    "winner": null,
                    "lobsters": {}
                }
            }

            socket.on('requestMockData', (data2) => {
                startMockData(socket, data.channel, 100)
            })

            chatClient.onMessage(async (channel, user, message, msg) => {
                if (channel == data.channel && channelData[channel]) {
                    // User messages
                    if (channelData[channel].gameState == gameStates.Active && message.includes("🦞")) {
                        addLobster(socket, channel, user, msg.userInfo.color)
                    } // Mod commands
                    else if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
                        switch (message.trim()) {
                            case "!startrace":
                                startRace(socket, channel)
                                break
                            case "!stoprace":
                                stopRace(socket, channel)
                                break
                            case "!mockdata":
                                startMockData(socket, channel, 100)
                                break
                        }
                    }
                }
            });
        }
    })
})

function syncData(socket, channel) {
    socket.emit("channelData", channelData[channel])
}

function finishRace(socket, channel) {
    if (channelDataIntervals[channel]) {
        clearInterval(channelDataIntervals[channel])
        channelDataIntervals[channel] = null
    }
    if (channelData[channel].gameState != gameStates.Finished) {
        channelData[channel].gameState = gameStates.Finished
        syncData(socket, channel)
        console.log("game over! the winner is:", channelData[channel].winner)

        setTimeout(() => {
            console.log("stopping finish screen")
            stopRace(socket, channel)
        }, config.server.RESET_DELAY)
    }
}

function stopRace(socket, channel) {
    if (channelDataIntervals[channel]) {
        clearInterval(channelDataIntervals[channel])
        channelDataIntervals[channel] = null
    }
    channelData[channel].gameState = gameStates.Inactive
    syncData(socket, channel)
}

function startRace(socket, channel) {
    if (!channelDataIntervals[channel] && channelData[channel].gameState == gameStates.Inactive) {
        channelData[channel].gameState = gameStates.Active
        syncData(socket, channel)
        console.log("new game started")

        channelDataIntervals[channel] = setInterval(() => {
            syncData(socket, channel)
        }, config.server.SYNC_DELAY)
    }
}

function addLobster(socket, channel, user, color = "dd2e44") {
    if (channelData[channel]) {
        channelData[channel].lobsters[user] ??= {
            count: 0,
            color: color,
            points: 0
        }
        if (channelData[channel].lobsters[user].count++ >= channelData[channel].goal) {
            // game over
            channelData[channel].winner = user
            finishRace(socket, channel)
            console.log("game over! the winner is:", user)
        }
    } else {
        console.log(`No '${channel}' channel saved`)
    }
}

function clearLobsters(channel) {
    if (channelData[channel]) {
        channelData[channel].lobsters = {};
        channelData[channel].winner = null;
        channelData[channel].gameState = gameStates.Inactive;
    }
}

let mockActive = false;
function startMockData(socket, channel, count) {
    if (!mockActive) {
        mockActive = true;
        clearLobsters(channel);
        startRace(socket, channel)

        let i = 0;
        const interval = setInterval(() => {
            if (i++ == count) {
                // stopRace(socket, channel)
                return clearInterval(interval)
            } else if (channelData[channel].winner) {
                return clearInterval(interval)
            } else {
                if (Math.random() < 0.5) { addLobster(socket, channel, "aryu", Math.random() * 0xFFFFFF) }
                if (Math.random() < 0.5) { addLobster(socket, channel, "risshella", Math.random() * 0xFFFFFF) }
                if (Math.random() < 0.5) { addLobster(socket, channel, "kokos", Math.random() * 0xFFFFFF) }
                if (Math.random() < 0.5) { addLobster(socket, channel, "wooloo", Math.random() * 0xFFFFFF) }
                if (Math.random() < 0.5) { addLobster(socket, channel, "liv", Math.random() * 0xFFFFFF) }
                if (Math.random() < 0.5) { addLobster(socket, channel, "reila", Math.random() * 0xFFFFFF) }
            }
        }, config.server.SYNC_DELAY)
        mockActive = false;
    }
}


/* channelData structure
[
    "risshella": {
        "gameState": gameState.InProgress,
        "winner": null,
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
        "gameState": false,
        "lobsters": []
    }
]
*/