"use strict";
class Graphi {
    constructor(canvas, theme = "default", startX = -50, endX = 50, startY = -50, endY = 50) {
        this.canvas = canvas;
        this.cx = canvas.getContext("2d");
        this.tr = transform(canvas, startX, endX, startY, endY);
        this.mouse = mouseTransform(canvas, startX, endX, startY, endY);
        this.theme = getTheme(theme);
        this.data = [];
        this.settings = { canvas: { startX, endX, startY, endY } };
        this.trackPos();
        if (Graphi.ALL)
            Graphi.ALL.forEach(g => g.data = []);
        Graphi.ALL = [];
        Graphi.ALL.push(this);
    }
    drawGrid(unitsPerTick = 10, xAxisLabel = '', yAxisLabel = '') {
        const startX = this.settings.canvas.startX;
        const endX = this.settings.canvas.endX;
        const startY = this.settings.canvas.startY;
        const endY = this.settings.canvas.endY;
        const totalXTicks = (Math.abs(startX) + endX) / unitsPerTick;
        const totalYTicks = (Math.abs(startY) + endY) / unitsPerTick;
        const xAxis = [{ x: startX, y: 0 }, { x: endX, y: 0 }];
        const yAxis = [{ x: 0, y: startY }, { x: 0, y: endY }];
        this.drawAxis(xAxis, this.theme.axisColor, totalXTicks);
        this.drawAxis(yAxis, this.theme.axisColor, totalYTicks);
    }
    drawAxis(coord, color, tickTotal, label = '') {
        const tickLength = this.canvas.width / 200;
        this.drawLine(coord, color, label);
        const hyp = hypotenuse(coord[0], coord[1]);
        const angle = angleOfVector(coord[0], coord[1]);
        const isVertical = approxEqual(angle, 1.5707963267948966);
        const tickSpace = endOfVector({ x: 0, y: 0 }, angle, (hyp / tickTotal));
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
            this.drawLine([start, end], color);
        }
    }
    drawLineWithPoints(coords, radius = 1, color = '', label = '') {
        this.drawLine(coords, color, label);
        this.drawPoints(coords, radius, color, label);
    }
    drawPoints(coords, radius = 1, color = '', label = '') {
        this.data.push({ coords, radius, color, label });
        if (color === '')
            color = this.getNextColor();
        for (const point of coords)
            this.drawPoint(point, radius, color);
    }
    drawPoint(point, radius = 1, color = '', label = '') {
        if (color === '')
            color = this.getCurrentColor();
        const newPoint = this.tr(point);
        this.cx.beginPath();
        color = colorize(color);
        this.cx.strokeStyle = color;
        this.cx.fillStyle = color;
        this.cx.arc(newPoint.x, newPoint.y, radius, 0, 2 * Math.PI);
        this.cx.fill();
        this.cx.stroke();
    }
    genFn(fn, amplitude = 1, frequency = 1, step = 1, label = '') {
        const yOfX = [];
        for (let x = this.settings.canvas.startX; x < this.settings.canvas.endX; x += step) {
            yOfX.push({ x: x,
                y: fn(x / frequency) * amplitude });
        }
        return yOfX;
    }
    transformAll(coords) {
        return coords.map(coord => this.tr(coord));
    }
    drawBezier(coords, color = '', weight = 5, label = '') {
        this.data.push({ coords, color, weight, label });
        if (color === '')
            color = this.getNextColor();
        const cs = this.transformAll(coords);
        if (cs.length === 0)
            return;
        if (cs.length < 1)
            this.drawPoint(cs[0], 2, color);
        const cx = this.cx;
        let prevSlope = getSlopeOf(cs[0], cs[1]);
        for (let i = 1; i < cs.length - 1; i++) {
            const currSlope = getSlopeOf(cs[i - 1], cs[i + 1]);
            const prev = cs[i - 1];
            const curr = cs[i];
            bezierCurve(cx, prev, prevSlope, curr, currSlope, weight, color);
            prevSlope = currSlope;
        }
        const last = cs[cs.length - 1];
        const nextToLast = cs[cs.length - 2];
        const endingSlope = getSlopeOf(last, nextToLast);
        bezierCurve(cx, nextToLast, prevSlope, last, endingSlope, weight);
    }
    drawLine(coords, color = '', label = '') {
        if (label !== '')
            this.data.push({ coords, color, label });
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
    trackPos() {
        this.canvas.removeEventListener('mousemove', displayInfoAtCoord);
        this.canvas.addEventListener('mousemove', displayInfoAtCoord);
        const that = this;
        // debugger;
        function displayInfoAtCoord(e) {
            console.log(that.data);
            const mouse = that.mouse({ x: e.x, y: e.y });
            const closestGraph = graphWithClosestCoord(that.data, mouse);
            const closestPoint = closestCoord(closestGraph.coords, mouse);
            // that.clearCanvas();
            // that.drawPoint(closestPoint, 2, "red");
            const globalPoint = globalTransform(that.canvas, that.tr, closestPoint);
            let floater = document.querySelector('#floater');
            let dot = document.querySelector('#dot');
            if (floater === null) {
                floater = document.createElement('div');
                floater.id = "floater";
                floater.style.position = "absolute";
                floater.style.textColor = "white";
                dot = document.createElement('div');
                dot.id = "dot";
                dot.style.height = "10px";
                dot.style.width = "10px";
                dot.style.backgroundColor = "red";
                dot.style.borderRadius = "50%";
                dot.style.position = "absolute";
                window.document.body.appendChild(floater);
                window.document.body.appendChild(dot);
            }
            floater.textContent = `x:${closestPoint.x.toFixed(2)}, y:${closestPoint.y.toFixed(2)}`;
            dot.style.top = globalPoint.y - 5;
            dot.style.left = globalPoint.x - 5;
            floater.style.top = globalPoint.y + 5;
            floater.style.left = globalPoint.x + 5;
        }
    }
    clearCanvas() {
        this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    renderCanvas() {
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
function nearestCoord(coords, mousePos) {
    const valArray = coords.map(coord => [hypotenuse(coord, mousePos), coord])
        .sort((a, b) => a[0] - b[0]);
    return valArray[0][1];
}
function approxEqual(n1, n2, epsilon = 0.0001) {
    return Math.abs(n1 - n2) < epsilon;
}
function hypotenuse(root, end) {
    return Math.hypot(end.x - root.x, end.y - root.y);
}
function endOfVector(root, angle, hypotenuse) {
    const opposite = Math.sin(angle) * hypotenuse;
    const adjacent = Math.cos(angle) * hypotenuse;
    return { x: root.x + adjacent, y: root.y + opposite };
    ;
}
function angleOfVector(root, end) {
    return Math.asin((end.y - root.y) / hypotenuse(root, end));
}
function getSlopeOf(coord1, coord2) {
    const x = coord2.x - coord1.x;
    const y = coord2.y - coord1.y;
    return y / x;
}
function bezierCurve(cx, start, startSlope, end, endSlope, weight, color = '') {
    cx.beginPath();
    cx.strokeStyle = colorize(color);
    cx.moveTo(start.x, start.y);
    cx.bezierCurveTo(start.x + weight, start.y + weight * startSlope, end.x - weight, end.y - weight * endSlope, end.x, end.y);
    cx.stroke();
}
function transform(canvas, minX, maxX, minY, maxY) {
    return function (c) {
        // offset by the minimum grid space, divide by total units to get percent
        // of length, then multiply by canvas dimension to get location in px
        let gridX = (c.x + Math.abs(minX)) / (Math.abs(minX) + maxX) * canvas.width;
        let gridY = (c.y + Math.abs(minY)) / (Math.abs(minY) + maxY) * canvas.height;
        // invert to compensate for updside down Y axis
        let globalY = canvas.height - gridY;
        return { x: gridX, y: globalY };
    };
}
function globalTransform(canvas, transformFn, coord) {
    const gridSpace = transformFn(coord);
    return { x: gridSpace.x + canvas.offsetLeft,
        y: gridSpace.y + canvas.offsetTop };
}
function mouseTransform(canvas, minX, maxX, minY, maxY) {
    return function (coord) {
        // transform mouse x,y coordinates to canvas space
        // subtract the distance from the top left of the window
        // to the top left of the canvas
        const canvasX = coord.x - canvas.offsetLeft + window.scrollX;
        const canvasY = coord.y - canvas.offsetTop + window.scrollY;
        // invert the Y axis, so that it is normal x,y space
        const invertY = canvas.height - canvasY;
        // transform to grid space by dividing by the of px/unit
        // then offsetting by the gridspace minimum
        const scaleXFactor = canvas.width / (Math.abs(minX) + maxX);
        const gridX = (canvasX / scaleXFactor) + minX;
        const scaleYFactor = canvas.height / (Math.abs(minY) + maxY);
        const gridY = (invertY / scaleYFactor) + minY;
        return { x: gridX, y: gridY };
    };
}
function closestCoord(coords, mouse) {
    return coords.sort((a, b) => hypotenuse(a, mouse) - hypotenuse(b, mouse))[0];
}
function graphWithClosestCoord(graphs, mouse) {
    const closestGraph = graphs.reduce((acc, graph) => {
        const closest = closestCoord(graph.coords, mouse);
        if (hypotenuse(closest, mouse) <
            hypotenuse(acc.closest, mouse)) {
            return { closest, graph };
        }
        else
            return acc;
    }, { closest: { x: Infinity, y: Infinity }, graph: {} });
    return closestGraph.graph;
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
