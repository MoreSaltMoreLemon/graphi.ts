"use strict";
class Graphi {
    constructor(canvas, theme = "default", paddingX = .1, paddingY = .1, scaleX = .5, scaleY = .5) {
        this.canvas = canvas;
        this.cx = canvas.getContext("2d");
        this.paddingX = paddingX;
        this.paddingY = paddingY;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.cv = absoluteCoordOffset(canvas, 0, 0, 0, 0);
        this.tr = absoluteCoordOffset(canvas, paddingX, paddingY, scaleX, scaleY);
        this.theme = getTheme(theme);
        this.graphedData = {};
    }
    drawGrid(xPercent = 0, yPercent = 0) {
        const height = this.canvas.height;
        const width = this.canvas.width;
        const xAxis = [{ x: 0, y: height * xPercent }, { x: width, y: height * xPercent }];
        const yAxis = [{ x: width * yPercent, y: 0 }, { x: width * yPercent, y: height }];
        console.log("width", this.paddingX, width, xPercent);
        console.log("height", this.paddingY, height, yPercent);
        this.gr = absoluteCoordOffset(this.canvas, this.paddingX, // + width * xPercent, 
        this.paddingY, // + height * yPercent, 
        this.scaleX, this.scaleY);
        this.drawAxis(xAxis, this.theme.axisColor, 10, 10);
        this.drawAxis(yAxis, this.theme.axisColor, 10, 10);
    }
    drawPoints(points, radius, color) {
        for (const point of points)
            this.drawPoint(point, radius, color);
    }
    drawPoint(point, radius, color = '') {
        if (color === '')
            color = this.getCurrentColor();
        const newPoint = this.gr(point);
        this.cx.beginPath();
        color = colorize(color);
        this.cx.strokeStyle = color;
        this.cx.fillStyle = color;
        this.cx.arc(newPoint.x, newPoint.y, radius, 0, 2 * Math.PI);
        this.cx.fill();
        this.cx.stroke();
    }
    genFn(fn, start, end, amplitude, frequency, step) {
        const yOfX = [];
        for (; start.x < end; start.x += step) {
            yOfX.push({ x: start.x,
                y: fn(start.x / frequency) * amplitude + start.y });
        }
        return yOfX;
    }
    genSine(start, end, amplitude, frequency, step) {
        const sine = [];
        for (; start.x < end; start.x += step) {
            sine.push({ x: start.x,
                y: Math.sin(start.x / frequency) * amplitude + start.y });
        }
        return sine;
    }
    transformAll(coords) {
        return coords.map(coord => this.gr(coord));
    }
    drawLine(coords, color = '') {
        if (color === '')
            color = this.getNextColor();
        const trCoords = this.transformAll(coords);
        this.cx.strokeStyle = colorize(color);
        this.cx.beginPath();
        this.cx.moveTo(trCoords[0].x, trCoords[0].y);
        for (const coord of trCoords) {
            this.cx.lineTo(coord.x, coord.y);
        }
        this.cx.stroke();
    }
    drawAxis(coord, color, tickTotal, tickLength) {
        this.drawLine(coord, color);
        const hyp = this.hypotenuse(coord[0], coord[1]);
        const angle = this.angleOfVector(coord[0], coord[1]);
        const isVertical = this.approxEqual(angle, 1.5707963267948966);
        const tickSpace = this.endOfVector({ x: 0, y: 0 }, angle, (hyp / tickTotal));
        const base = { x: coord[0].x, y: coord[0].y };
        for (let i = 0; i < tickTotal; i++) {
            base.x += isVertical ? 0 : tickSpace.x;
            base.y += isVertical ? tickSpace.y : 0;
            const start = { x: base.x, y: base.y };
            const end = { x: base.x, y: base.y };
            if (isVertical) {
                start.x -= tickLength / 2;
                end.x += tickLength / 2;
            }
            else {
                start.y -= tickLength / 2;
                end.y += tickLength / 2;
            }
            // console.log("THE TICK", start, end);
            this.drawLine([start, end], color);
        }
    }
    approxEqual(n1, n2, epsilon = 0.0001) {
        return Math.abs(n1 - n2) < epsilon;
    }
    hypotenuse(root, end) {
        return Math.hypot(end.x - root.x, end.y - root.y);
    }
    endOfVector(root, angle, hypotenuse) {
        const opposite = Math.sin(angle) * hypotenuse;
        const adjacent = Math.cos(angle) * hypotenuse;
        return { x: root.x + adjacent, y: root.y + opposite };
        ;
    }
    angleOfVector(root, end) {
        return Math.asin((end.y - root.y) / this.hypotenuse(root, end));
    }
    // TODO: rgb to deselect bad color ranges
    // randomColorSelector(): string {
    //   const colors = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"];
    //   let color = colors[Math.floor(Math.random() * colors.length)]
    //   while (this.colorsInUse.includes(color)) {
    //     color = colors[Math.floor(Math.random() * colors.length)];
    //   }
    //   this.colorsInUse.push(color);
    //   return color;
    // }
    convertToCoord(coords) {
        if (Array.isArray(coords) &&
            coords.every(coord => Array.isArray(coord)
                && coord.length == 2
                && typeof coord[0] === "number"
                && typeof coord[1] === "number"))
            return coords.map(coord => ({ x: coord[0], y: coord[1] }));
        else
            throw new Error("convertToCoord: Incorrect format. [[x, y],[x, y]]");
    }
    trackPos(event) {
        // console.log(event.y);
    }
    getCurrentColor() {
        return RGBAtoString(this.theme.colors[this.theme.lastColorIndex]);
    }
    getNextColor() {
        if (this.theme.lastColorIndex >= this.theme.colors.length)
            this.theme.lastColorIndex = 0;
        const nextColor = RGBAtoString(this.theme.colors[this.theme.lastColorIndex]);
        this.theme.lastColorIndex++;
        return nextColor;
    }
}
function absoluteCoordOffset(canvas, offsetX, offsetY, scaleX, scaleY) {
    return (coord) => {
        return { x: (coord.x * scaleX) + (canvas.width * offsetX),
            y: (canvas.height - ((coord.y * scaleY) + (canvas.height * offsetY))) };
    };
}
function relativeCoordOffset(canvas, offsetX, offsetY, scaleX, scaleY) {
    return (coord) => {
        return { x: (coord.x * scaleX) + (canvas.width * offsetX),
            y: (canvas.height - ((coord.y * scaleY) + (canvas.height * offsetY))) };
    };
}
function colorize(color) {
    if (color instanceof Object)
        return RGBAtoString(color);
    else
        return color;
}
function RGBAtoString(color) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
function getTheme(theme) {
    if (theme instanceof Object)
        return theme;
    else {
        let foundTheme = themes.find(t => t.name === theme);
        if (foundTheme instanceof Object)
            return foundTheme;
        else
            throw new Error("getTheme: theme name doesn't match available themes");
    }
}
const themes = [
    {
        name: "default",
        backgroundColor: { r: 202, g: 0, b: 0, a: 1 },
        axisColor: { r: 93, g: 93, b: 93, a: 1 },
        colors: [{ r: 143, g: 45, b: 45, a: 1 },
            { r: 45, g: 121, b: 143, a: 1 },
            { r: 19, g: 70, b: 170, a: 1 },
            { r: 45, g: 121, b: 143, a: 1 },
            { r: 143, g: 45, b: 82, a: 1 },
            { r: 77, g: 45, b: 143, a: 1 },
            { r: 119, g: 45, b: 143, a: 1 },
            { r: 235, g: 37, b: 33, a: 1 },],
        lastColorIndex: 0
    }
];