import React from 'react'
import { useParams } from 'react-router-dom'
import { Stage, Container, Text } from '@pixi/react';
import { TEXT_GRADIENT, TextStyle } from 'pixi.js';
import PlayerLobster from './PlayerLobster.jsx';

var socket;

// TODO: Replace temporary config
var screenMargin = 50;
const gameStates = {
    Inactive: "inactive",
    Active: "active",
    Finished: "finished"
}

const titleTextStyle = new TextStyle({
    fill: ['d8a0fe', '7783d9'],
    fillGradientType: TEXT_GRADIENT.LINEAR_VERTICAL,
    fontSize: 50,
    fontWeight: '400',
    stroke: 'white',
    strokeThickness: 3
})
const TitleText = () => {

    return (
        <Container x={window.innerWidth / 2} y={100}>
            {/* <LobsterTestSprite /> */}
            <Text text="Lobster Race" align="center" anchor={0.5} style={titleTextStyle} />
        </Container>
    )
}

/* -------------------------------------------------- */

function Game() {
    const { channel } = useParams();
    const [config, setConfig] = React.useState({
        "goal": 10, // 5 mins x 1 message/second
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
    }, [gameState, winners])

    const requestMockData = () => {
        if (gameState != gameStates.Active) {
            socket.emit('requestMockData');
        }
    }

    return (
        <div className="gameContainer">
            {/* <div>players: {lobsters.length}</div> */}
            {/* <div className="list">
                {lobsters.map(lobster => (
                    // <LobsterPlayer key={lobster.user} user={lobster.user} count={lobster.count} points={lobster.points} />
                ))}
            </div> */}
            <button className='mockButton' onClick={requestMockData}>{gameState == gameStates.Active ? "race active!" : "mock"}</button>
            <img src="/assets/crabrave.gif" className='topLeft' style={{ display: gameState == gameStates.Active ? "block" : "none" }} />
            <img src="/assets/crabrave.gif" className='topRight' style={{ display: gameState == gameStates.Active ? "block" : "none" }} />
            <img src="/assets/crabrave.gif" className='bottomLeft' style={{ display: gameState == gameStates.Active ? "block" : "none" }} />
            <img src="/assets/crabrave.gif" className='bottomRight' style={{ display: gameState == gameStates.Active ? "block" : "none" }} />
            <Stage width={window.innerWidth} height={window.innerHeight} interactive={'auto'} options={{ resizeTo: window, backgroundAlpha: 0 }} >
                {/* Decorations */}
                {gameState != gameStates.Inactive ? <TitleText /> : null}
                {/* Players */}
                {/* <Container width={window.innerWidth - margin * 2} height={window.innerHeight - margin * 2} anchor={0.5} x={window.innerWidth / 2} y={window.innerHeight / 2}> */}
                {gameState == gameStates.Active ? (
                    <Container width={window.innerWidth - screenMargin * 2} height={window.innerHeight - screenMargin * 2} x={screenMargin} y={screenMargin}>
                        {Object.entries(lobsters).map(([user, lob], index) => <PlayerLobster key={index} screenMargin={screenMargin} goal={config.goal} color={lob.color} lobstercount={Object.keys(lobsters).length} user={user} index={index} count={lob.count} points={lob.points} />)}
                    </Container>
                ) : null}
                {/* Game Over screen */}
                {gameState == gameStates.Finished ? (
                    <Container x={window.innerWidth / 2} y={window.innerHeight / 2}>
                        <Text anchor={0.5} text={`${winners[0].user} wins!`} style={titleTextStyle} />
                    </Container>
                ) : null}
                {/* <Sprite anchor={0.5} x={300} y={200} height={100} width={100} image="/assets/lobster/png" /> */}
            </Stage>
        </div>
    )
}

export default Game