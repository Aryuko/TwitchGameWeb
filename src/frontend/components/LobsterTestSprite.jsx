import React from 'react'

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

export default LobsterTestSprite