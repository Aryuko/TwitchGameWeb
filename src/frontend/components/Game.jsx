import React from 'react'
import { useParams } from 'react-router-dom'
import { Stage, Container, Text } from '@pixi/react';
import { TEXT_GRADIENT, TextStyle } from 'pixi.js';
import PlayerLobster from './PlayerLobster.jsx';
import WinnerScreen from './WinnerScreen.jsx';
import { OutlineFilter } from '@pixi/filter-outline';

var socket;

// TODO: Replace temporary config
var screenMargin = 100;
const gameStates = {
    Inactive: "inactive",
    Active: "active",
    Finished: "finished"
}
const outline = new OutlineFilter(2, "#FFFFFF", 0.1, 1)

const titleTextStyle = new TextStyle({
    fill: ['d8a0fe', '7783d9'],
    fillGradientType: TEXT_GRADIENT.LINEAR_VERTICAL,
    fontSize: 50,
    fontWeight: '400',
})

const TitleText = (props) => {
    let text = ""
    if (props.gameState == gameStates.Active) {
        text = "Lobster Race"
    } else if (props.gameState == gameStates.Finished) {
        text = "🎉 We have our winners! 🎉"
    }
    return (
        <Container x={window.innerWidth / 2} y={screenMargin - 25}>
            {/* <LobsterTestSprite /> */}
            <Text text={text} filters={[outline]} align="center" anchor={[0.5, 1]} style={titleTextStyle} />
        </Container>
    )
}
const FinishedText = (props) => {
    return (
        <Container x={window.innerWidth / 2} y={window.innerHeight - screenMargin + 25}>
            <Text text={"!startrace to go again!"} filters={[outline]} align="center" anchor={[0.5, 1]} style={titleTextStyle} />
        </Container>
    )
}

/* -------------------------------------------------- */

function Game() {
    const { channel } = useParams();
    const [config, setConfig] = React.useState({
        "goal": 30, // 30msg/20s = 1.5msg/s. 120s/1.5 = 80
    }); // TODO: Add to url config
    const [lobsters, setLobsters] = React.useState({}); // TODO: Change to reducer?
    const [gameState, setGameState] = React.useState(gameStates.Inactive);
    const [winners, setWinners] = React.useState([]);

    document.title = "Lobster game - " + channel;

    const resetData = () => {
        setLobsters({})
        setGameState(gameStates.Inactive)
        setWinners([])
    }

    React.useEffect(() => {
        // Open persistent connection to server
        socket = io()
        socket.connect()
        socket.emit('init', { channel: channel, config: config })

        // Listen for lobster updates
        socket.on('channelData', (data) => {
            if (data) {
                setLobsters(data.lobsters)
                setGameState(data.gameState)
                setWinners(data.winners)
            }
        })

        socket.on('disconnect', (reason) => {
            console.log('disconnected', reason)
            resetData()
        })

        socket.io.on('reconnect', () => {
            console.log('reconnected')
            socket.emit('init', { channel: channel, config: config })
        })

        return () => {
            socket.disconnect();
        }
    }, [])

    React.useEffect(() => {
        switch (gameState) {
            case (gameStates.Active):
                console.log("game started!")
                break
            case (gameStates.Inactive):
                console.log("game inactivated")
                break
            case (gameStates.Finished):
                console.log("game finsished")
                if (winners) {
                    // console.log(`the winner is ${winners[0]}!`)
                    console.log("the winners are:")
                    console.log(winners)
                }
                break

        }
    }, [gameState])

    const requestMockData = () => {
        if (gameState != gameStates.Active) {
            socket.emit('requestMockData');
        }
    }

    const mockWinners = () => {
        setWinners([
            {
                user: "aryu",
                count: 10,
                color: "C7A3FF",
                points: 0
            },
            {
                user: "kokos",
                count: 9,
                color: "dd2e44",
                points: 0
            },
            {
                user: "shella",
                count: 8,
                color: "7783d9",
                points: 0
            }
        ])
        setGameState(gameStates.Finished)
    }

    let gameWidth = window.innerWidth - screenMargin * 2
    let gameHeight = window.innerHeight - screenMargin * 2

    return (
        <div className="gameContainer">
            {/* <div>players: {lobsters.length}</div> */}
            {/* <div className="list">
                {lobsters.map(lobster => (
                    // <LobsterPlayer key={lobster.user} user={lobster.user} count={lobster.count} points={lobster.points} />
                ))}
            </div> */}
            <div className="mockButton">
                <button onClick={requestMockData}>{gameState == gameStates.Active ? "race active!" : "mock game"}</button>
                <button onClick={mockWinners}>mock winners</button>
            </div>
            <img src="/assets/crabrave.gif" className='topLeft' style={{ display: gameState == gameStates.Active ? "block" : "none" }} />
            <img src="/assets/crabrave.gif" className='topRight' style={{ display: gameState == gameStates.Active ? "block" : "none" }} />
            <img src="/assets/crabrave.gif" className='bottomLeft' style={{ display: gameState == gameStates.Active ? "block" : "none" }} />
            <img src="/assets/crabrave.gif" className='bottomRight' style={{ display: gameState == gameStates.Active ? "block" : "none" }} />
            <Stage width={window.innerWidth} height={window.innerHeight} interactive={'auto'} options={{ resizeTo: window, backgroundAlpha: 0 }} >
                {/* Decorations */}
                {gameState != gameStates.Inactive ? <TitleText gameState={gameState} /> : null}
                {gameState == gameStates.Finished ? <FinishedText /> : null}
                {/* Players */}
                {gameState == gameStates.Active ? (
                    <Container width={gameWidth} height={gameHeight} x={screenMargin} y={screenMargin}>
                        {Object.entries(lobsters).map(([user, lob], index) => <PlayerLobster key={index} gameWidth={gameWidth} gameHeight={gameHeight} goal={config.goal} color={lob.color} lobstercount={Object.keys(lobsters).length} user={user} index={index} count={lob.count} points={lob.points} />)}
                    </Container>
                ) : null}
                {/* Game Over screen */}
                {gameState == gameStates.Finished ? (
                    <WinnerScreen textStyle={titleTextStyle} winners={winners} />
                ) : null}
                {/* <Sprite anchor={0.5} x={300} y={200} height={100} width={100} image="/assets/lobster/png" /> */}
            </Stage>
        </div>
    )
}

export default Game