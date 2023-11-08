import React from 'react'
import { TextStyle } from 'pixi.js';
import { Container, Sprite, Text, useTick } from '@pixi/react';
import { OutlineFilter } from '@pixi/filter-outline'

const reducer = (_, { data }) => data
const defaultSize = 50
const outline = new OutlineFilter(1, "#FFFFFF", 0.1, 1)

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
 * @param {number} props.gameWidth 
 * @param {number} props.gameHeight 
 * @returns 
 */
function PlayerLobster(props) {
    // x = count/goal*window.innerWidth
    // y = index/totallobsters*window.innerHeight

    const [motion, update] = React.useReducer(reducer);
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
                // height: defaultSize,
                // width: defaultSize,
            },
        });
    });

    const textStyle = new TextStyle({
        fill: props.color,
        fontSize: 20,
        align: "center",
    })

    let x = props.count / props.goal * (props.gameWidth)
    let y = props.index / props.lobstercount * (props.gameHeight)

    return (
        <Container x={x} y={y} key={props.index} anchor={[1, 0.5]}>
            {/* text={props.user + "\n" + props.count} */}
            <Sprite image="/assets/lobstersmall.png" filters={[outline]} anchor={0.5} x={25} y={0} height={defaultSize} width={defaultSize} {...motion} tint={props.color} />
            <Text filters={[outline]} text={props.user} x={-25} y={0} anchor={0.5} style={textStyle} />
        </Container>
    )
}

export default PlayerLobster