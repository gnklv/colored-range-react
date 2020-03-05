import React from "react";
import './Range.css';

export default class Range extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            thumbs: [0, 100],
            colors: [],
            activeI: 0,
            gradient: [
                {
                    value: 0,
                    color: this.hexToRgb(this.indexLow),
                },
                {
                    value: 50,
                    color: this.hexToRgb(this.indexMedium),
                },
                {
                    value: 100,
                    color: this.hexToRgb(this.indexHigh),
                }
            ]
        }
    }

    indexLow = '#ff0624';
    indexMedium = '#ffd306';
    indexHigh = '#008209';
    min = 0;
    max = 100;
    minSizeNear = 5;

    rangeStyles() {
        const gradient = this.state.gradient.map(({ value, color }) => color && `rgb(${color.join(', ')}) ${value}%`);
        const direction = 'to right';

        return {
            background: `linear-gradient(${direction}, ${gradient.join(', ')})`,
        }
    }

    thumbStyles(i) {
        return {
            left: `${this.state.thumbs[i]}%`,
            borderColor: this.state.colors[i],
        }
    }

    thumbValueStyles(i) {
        return { color: this.state.colors[i] };
    }

    setColors() {
        const colors = [...this.state.colors];
        this.state.thumbs.forEach((value, index) => {
            colors[index] = this.calculateColor(value);
        });
        this.setState({ ...this.state, colors });
    }

    calculateColor(colorValue) {
        const colorRange = {};
        for (let i = 0; i < this.state.gradient.length; i += 1) {
            const { value } = this.state.gradient[i];
            if (colorValue <= value && value !== 0) {
                colorRange.firstI = i - 1;
                colorRange.secondI = i;
                break;
            }
        }

        const sliderWidth = this.refRange.offsetWidth;
        const firstColor = this.state.gradient[colorRange.firstI].color;
        const secondColor = this.state.gradient[colorRange.secondI].color;

        const firstColorX = sliderWidth * (this.state.gradient[colorRange.firstI].value / 100);
        const secondColorX = (sliderWidth * (this.state.gradient[colorRange.secondI].value / 100))
            - firstColorX;
        const sliderX = sliderWidth * (colorValue / 100) - firstColorX;
        const ratio = sliderX / secondColorX;

        return `rgb(${this.pickHex(secondColor, firstColor, ratio).join(',')})`;
    }

    pickHex(color1, color2, weight) {
        const w = weight * 2 - 1;
        const w1 = (w + 1) / 2;
        const w2 = 1 - w1;

        return [
            Math.round(color1[0] * w1 + color2[0] * w2),
            Math.round(color1[1] * w1 + color2[1] * w2),
            Math.round(color1[2] * w1 + color2[2] * w2),
        ];
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? [
            parseInt(result[1], 16), // r
            parseInt(result[2], 16), // g
            parseInt(result[3], 16), // b
        ] : [255, 255, 255];
    }

    componentDidMount() {
        this.setColors();
    }

    render() {
        return (
            <div className='wrapper'>
                <div className='container'>
                    <div
                        className='range'
                        style={this.rangeStyles()}
                        ref={(node) => this.refRange = node}
                    />
                    {this.state.thumbs.map((value, index) => (
                        <button
                            className='thumb'
                            key={index}
                            style={this.thumbStyles(index)}
                        >
                            <span
                                className='value'
                                style={this.thumbValueStyles(index)}
                            >
                                { value }
                            </span>
                        </button>
                    ))}
                </div>
                <div className='limits'>
                    <span className='limit'>{ this.min }</span>
                    <span className='limit'>{ this.max }</span>
                </div>
            </div>
        );
    }
}
