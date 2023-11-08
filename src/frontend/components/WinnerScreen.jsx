import React from 'react'
import { Container, Sprite, Text, useTick } from '@pixi/react';
import { TextStyle } from 'pixi.js';
import { OutlineFilter } from '@pixi/filter-outline';

const podiumSize = 800 //TODO: add scaling
const lobsterSize = 200
const textOffset = -150
const outline = new OutlineFilter(2, "#FFFFFF", 0.1, 1)
const reducer = (_, { data }) => data

/**
 * 
 * @param {object} props
 * @param {number} props.x
 * @param {number} props.y
 * @param {number} props.size
 * @param {number} props.index
 * @param {object} props.winner
 * @param {TextStyle} props.textStyle
 * @returns 
 */
function WinnerLobster(props) {
    const [motion, update] = React.useReducer(reducer);
    const iter = React.useRef(0);

    const textStyle = new TextStyle({
        fill: [props.winner.color],
        fontSize: 50,
        fontWeight: '400',
        // stroke: 'white',
        // strokeThickness: 3
    })

    useTick((delta) => {
        const i = (iter.current += 0.05 * delta);

        update({
            type: 'update',
            data: {
                // rotation: Math.sin(i) * Math.PI,
                // anchor: Math.sin(i / 2),
                // rotation: Math.PI / 2 + (Math.sin(i * 4) * Math.PI / 20),
                // anchor: 0.5,
                // x: 0,
                y: props.y - Math.max(0, Math.sin(props.index + i * 2) * 50),
                // y: props.y - Math.abs(Math.sin(props.index + i * 2) * 50), // constant jumps 
            },
        });
    });
    return (
        <Container anchor={0.5} x={props.x} y={props.y} {...motion}>
            <Sprite image="/assets/lobsterbig.png" filters={[outline]} anchor={0.5} height={props.size} width={props.size} tint={props.winner.color} />
            <Text anchor={0.5} y={textOffset} filters={[outline]} text={props.winner.user} style={textStyle} />
        </Container>
    )
}

/**
 * 
 * @param {object} props
 * @param {object} props.winners
 * @param {TextStyle} props.textStyle
 * @returns 
 */
function WinnerScreen(props) {
    return (
        <Container x={window.innerWidth / 2} y={window.innerHeight / 2}>
            <Sprite image="/assets/podium.png" anchor={0.5} filters={[outline]} height={podiumSize} width={podiumSize} y={200} />
            <WinnerLobster index={1} x={0} y={-160} size={lobsterSize} winner={props.winners[0]} textStyle={props.textStyle} />
            <WinnerLobster index={2} x={-265} y={-30} size={lobsterSize} winner={props.winners[1]} textStyle={props.textStyle} />
            <WinnerLobster index={3} x={265} y={35} size={lobsterSize} winner={props.winners[2]} textStyle={props.textStyle} />
        </Container>
    )
}

export default WinnerScreen
