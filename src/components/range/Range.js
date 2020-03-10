import React, { useState, useEffect, useRef } from "react";
import './Range.css';

const useStyles = ({ gradient, thumbs, colors }) => {
    const rangeStyles = () => {
        const gradientMap = gradient.map(({ value, color }) => color && `rgb(${color.join(', ')}) ${value}%`);
        const direction = 'to right';

        return {
            background: `linear-gradient(${direction}, ${gradientMap.join(', ')})`,
        }
    };

    const thumbStyles = (i) => {
        return {
            left: `${thumbs[i]}%`,
            borderColor: colors[i],
        }
    };

    const thumbValueStyles = (i) => {
        return { color: colors[i] };
    };

    return {
        rangeStyles,
        thumbStyles,
        thumbValueStyles
    }
};

const useListeners = ({ thumbs, setThumbs, min, max, refRange }) => {
    let activeI = 0;
    const minSizeNear = 5;

    const addEventListenerOnce = (eventName, cb) => {
        const once = (event) => {
            cb(event);
            document.removeEventListener(eventName, once);
        };
        document.addEventListener(eventName, once);
    };

    const thumbPosOverlapping = (position) => {
        let pos = position;

        // for first
        if (activeI - 1 >= 0
            && thumbs[activeI - 1] + minSizeNear > pos) {
            pos = thumbs[activeI - 1] + minSizeNear;
        }
        // for last
        if (activeI + 1 < thumbs.length
            && thumbs[activeI + 1] - minSizeNear < pos) {
            pos = thumbs[activeI + 1] - minSizeNear;
        }

        return pos;
    };

    const parseMouseMove = (event) => {
        const start = 'left';
        const length = 'width';
        const click = 'clientX';

        const {
            [start]: trackStart,
            [length]: trackLength
        } = refRange.current.getBoundingClientRect();

        const clickOffset = event[click];
        const clickPos = Math.min(Math.max((clickOffset - trackStart) / trackLength, 0), 1) || 0;

        return min + clickPos * (max - min);
    };

    const onMouseMove = (event) => {
        const pos = thumbPosOverlapping(parseMouseMove(event));

        const newThumbs = [...thumbs];
        newThumbs[activeI] = Math.round(pos);
        setThumbs(newThumbs);
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
    };

    const onThumbMouseDown = (event, index) => {
        activeI = index;
        document.addEventListener('mousemove', onMouseMove);
        addEventListenerOnce('mouseup', onMouseUp);
    };

    return { onThumbMouseDown };
};

const useColors = ({ thumbs, gradient, thumbSize }) => {
    const [colors, setColors] = useState([]);

    const initColors = () => {
        const colorsLocal = [...colors];
        thumbs.forEach((value, index) => {
            colorsLocal[index] = calculateColor(value);
        });
        setColors(colorsLocal);
    };

    const calculateColor = (colorValue) => {
        // colorValue: 75
        const colorRange = {};
        for (let i = 0; i < gradient.length; i += 1) {
            const { value } = gradient[i];
            if (colorValue <= value && value !== 0) {
                colorRange.firstI = i - 1;
                colorRange.secondI = i;
                break;
            }
        }
        // colorRange.firstI: 1
        // colorRange.secondI: 2

        const firstColor = gradient[colorRange.firstI].color;
        const secondColor = gradient[colorRange.secondI].color;
        // firstColor: [255, 211, 6]
        // secondColor: [0, 130, 9]

        const firstColorX = thumbSize * (gradient[colorRange.firstI].value / 100);
        // firstColorX: 18 * (50 / 100) = 9
        const secondColorX = (thumbSize * (gradient[colorRange.secondI].value / 100))
            - firstColorX;
        // secondColorX: (18 * (100 / 100) - 9) = 9
        const sliderX = thumbSize * (colorValue / 100) - firstColorX;
        // sliderX: 18 * (75 / 100) - 9 = 4.5
        const ratio = sliderX / secondColorX;
        // ratio: 4.5 / 9 = 0.5

        return `rgb(${pickColor(firstColor, secondColor, ratio).join(',')})`;
    };

    const pickColor = (color1, color2, ratio) => {
        // color1: [255, 211, 6]
        // color2: [0, 130, 9]
        // ration: 0.5
        const r = ratio * 2 - 1;
        // r: 0.5 * 2 - 1 = 0
        const r1 = (r + 1) / 2;
        // r1 = (0 + 1) / 2 = 0.5
        const r2 = 1 - r1;
        // r2 = (1 - 0.5) = 0.5

        return [
            Math.round(color2[0] * r1 + color1[0] * r2), // 255 * 0.5 + 0 * 0.5 = 128 (red)
            Math.round(color2[1] * r1 + color1[1] * r2), // 211 * 0.5 + 130 * 0.5 = 171 (green)
            Math.round(color2[2] * r1 + color1[2] * r2), // 6 * 0.5 + 9 * 0.5 = 8 (blue)
        ];
    };

    useEffect(initColors, [thumbs]);

    return { colors };
};

const Range = () => {
    const min = 0;
    const max = 100;

    const thumbSize = 18;
    const gradient = [
        {
            value: 0,
            color: [255, 6, 36],
        },
        {
            value: 50,
            color: [255, 211, 6],
        },
        {
            value: 100,
            color: [0, 130, 9],
        }
    ];

    const [thumbs, setThumbs] = useState([75, 100]);
    const refRange = useRef(null);

    const { colors } = useColors({ gradient, thumbs, thumbSize });
    const { rangeStyles, thumbStyles, thumbValueStyles } = useStyles({ gradient, thumbs, colors });
    const { onThumbMouseDown } = useListeners({ thumbs, setThumbs, min, max, refRange });

    return (
        <div className='wrapper'>
            <div className='container' ref={refRange}>
                <div
                    className='range'
                    style={rangeStyles()}
                />
                {thumbs.map((value, index) => (
                    <button
                        className='thumb'
                        key={index}
                        style={thumbStyles(index)}
                        onMouseDown={(e) => { onThumbMouseDown(e, index) }}
                    >
                        <span
                            className='value'
                            style={thumbValueStyles(index)}
                        >
                            { value }
                        </span>
                    </button>
                ))}
            </div>
            <div className='limits'>
                <span className='limit'>{ min }</span>
                <span className='limit'>{ max }</span>
            </div>
        </div>
    );
};

export default Range;
