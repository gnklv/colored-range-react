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

const useListeners = ({ thumbs, setThumbs, minSizeNear, min, max, refRange }) => {
    let activeI = 0;

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
        const colorRange = {};
        for (let i = 0; i < gradient.length; i += 1) {
            const { value } = gradient[i];
            if (colorValue <= value && value !== 0) {
                colorRange.firstI = i - 1;
                colorRange.secondI = i;
                break;
            }
        }

        const firstColor = gradient[colorRange.firstI].color;
        const secondColor = gradient[colorRange.secondI].color;

        const firstColorX = thumbSize * (gradient[colorRange.firstI].value / 100);
        const secondColorX = (thumbSize * (gradient[colorRange.secondI].value / 100))
            - firstColorX;
        const sliderX = thumbSize * (colorValue / 100) - firstColorX;
        const ratio = sliderX / secondColorX;

        return `rgb(${pickHex(secondColor, firstColor, ratio).join(',')})`;
    };

    const pickHex = (color1, color2, weight) => {
        const w = weight * 2 - 1;
        const w1 = (w + 1) / 2;
        const w2 = 1 - w1;

        return [
            Math.round(color1[0] * w1 + color2[0] * w2),
            Math.round(color1[1] * w1 + color2[1] * w2),
            Math.round(color1[2] * w1 + color2[2] * w2),
        ];
    };

    useEffect(() => {
        initColors();
    }, [thumbs]);

    return { colors };
};

const Range = () => {
    const min = 0;
    const max = 100;

    const thumbSize = 18;
    const minSizeNear = 5;
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

    const [thumbs, setThumbs] = useState([0, 100]);
    const refRange = useRef(null);

    const { colors } = useColors({ gradient, thumbs, thumbSize });
    const { rangeStyles, thumbStyles, thumbValueStyles } = useStyles({ gradient, thumbs, colors });
    const { onThumbMouseDown } = useListeners({ thumbs, setThumbs, minSizeNear, min, max, refRange });

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
