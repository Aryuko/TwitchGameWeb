import React from 'react'
import { useParams } from 'react-router-dom'
import { Stage, Container, Sprite, Text, useTick } from '@pixi/react';
import { TEXT_GRADIENT, TextStyle, fillGradientType } from 'pixi.js';
import { OutlineFilter } from '@pixi/filter-outline'

var socket;

// TODO: Replace temporary config
var margin = 50;
const gameStates = {
    Inactive: "inactive",
    Active: "active",
    Finished: "finished"
}

const reducer = (_, { data }) => data;

const LobsterTestSprite = () => {
    const [motion, update] = React.useReducer(reducer);
    const iter = React.useRef(0);

    useTick((delta) => {
        const i = (iter.current += 0.05 * delta);

        update({
            type: 'update',
            data: {
                // x: Math.sin(i) * 10,
                // y: Math.sin(i / 1.5) * 10,
                // rotation: Math.sin(i) * Math.PI,
                // anchor: Math.sin(i / 2),
                anchor: 0.5,
                rotation: iter.current,
                x: 0,
                y: 50,
                // x: window.innerWidth / 2,
                // y: window.innerHeight / 2,
                height: 100,
                width: 100,
            },
        });
    });

    return <Sprite image="/assets/lobster.png" {...motion} />;
};

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

const reducer2 = (_, { data }) => data;
/**
 * 
 * @param {object} props
 * @param {number} props.index 
 * @param {number} props.lobstercount 
 * @param {string} props.user 
 * @param {string} props.color
 * @param {number} props.count 
 * @param {number} props.points 
 * @param {number} props.goal 
 * @returns 
 */
const PlayerLobster = (props) => {
    // x = count/goal*window.innerWidth
    // y = index/totallobsters*window.innerHeight

    const [motion, update] = React.useReducer(reducer2);
    const iter = React.useRef(0);

    useTick((delta) => {
        const i = (iter.current += 0.05 * delta);

        update({
            type: 'update',
            data: {
                // rotation: Math.sin(i) * Math.PI,
                // anchor: Math.sin(i / 2),
                rotation: Math.PI / 2 + (Math.sin(i * 4) * Math.PI / 20),
                anchor: 0.5,
                x: 25,
                y: 0,
                height: 50,
                width: 50,
            },
        });
    });

    const textStyle = new TextStyle({
        fill: props.color,
        fontSize: 20,
        align: "center",
        // trim: true,
        // stroke: 'black',
        // strokeThickness: 2
    })
    const outline = new OutlineFilter(1, "#FFFFFF", 0.1, 0.5)

    let y = props.index / props.lobstercount * (window.innerHeight - margin * 2)
    let x = props.count / props.goal * (window.innerWidth - margin * 2)

    return (
        <Container x={x} y={y} key={props.index} anchor={0}>
            <Text filters={[outline]} text={props.user + "\n" + props.count} x={-25} y={0} anchor={0.5} style={textStyle} />
            <Sprite image="/assets/lobsterwhite.png" filters={[outline]} anchor={0.5} x={25} y={0} height={50} width={50} {...motion} tint={props.color} />
            {/* <Text text={props.count} x={0} y={100} anchor={0.5} style={textStyle} /> */}
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
    const [winner, setWinner] = React.useState(null);

    document.title = "Lobster game - " + channel;

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
                setWinner(data.winner)
            }
        })

        return () => {
            socket.disconnect();
        }
    }, [])

    // React.useEffect(() => {
    //     console.log("lobsters updated", lobsters)

    //     // TODO: check for changes, this always triggers
    // }, [lobsters])

    React.useEffect(() => {
        // TODO: finish implementing
        switch (gameState) {
            case (gameStates.Active):
                console.log("game started!")
                break
            case (gameStates.Inactive):
                console.log("game inactivated")
                break
            case (gameStates.Finished):
                console.log("game finsished")
                if (winner) {
                    console.log(`the winner is ${winner}!`)
                }
                break

        }
    }, [gameState, winner])


    // const addlobstercount = (user) => {
    //     const i = lobsters.find(e => e.user == user);
    //     if (i) {
    //         i.count++;
    //         console.log("existing user", lobsters)
    //     } else {
    //         setLobsters([...lobsters, {
    //             user: user,
    //             count: 1,
    //             points: 0
    //         }])
    //         console.log("new user", lobsters)
    //     }
    //     //forceUpdate();
    // }

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
                    <Container width={window.innerWidth - margin * 2} height={window.innerHeight - margin * 2} x={margin} y={margin}>
                        {Object.entries(lobsters).map(([user, lob], index) => <PlayerLobster key={index} goal={config.goal} color={lob.color} lobstercount={Object.keys(lobsters).length} user={user} index={index} count={lob.count} points={lob.points} />)}
                    </Container>
                ) : null}
                {/* Game Over screen */}
                {gameState == gameStates.Finished ? (
                    <Container x={window.innerWidth / 2} y={window.innerHeight / 2}>
                        <Text anchor={0.5} text={`${winner} wins!`} style={titleTextStyle} />
                    </Container>
                ) : null}
                {/* <Sprite anchor={0.5} x={300} y={200} height={100} width={100} image="/assets/lobster/png" /> */}
            </Stage>
        </div>
    )
}

export default Game