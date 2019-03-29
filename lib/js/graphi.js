"use strict";
class Graphi {
    constructor(canvas, args = {}) {
        const defaults = {
            theme: "default",
            startX: -50,
            endX: 50,
            startY: -50,
            endY: 50
        };
        const a = Object.assign({}, defaults, args);
        // get Canvas Context and wipe any prior contents
        this.canvas = canvas;
        this.cx = canvas.getContext("2d");
        this.clearCanvas();
        // generate transform functions for going from local coordinates
        // to canvas pixels and for going from window pixels to coordinates
        this.tr = transform(canvas, a.startX, a.endX, a.startY, a.endY);
        this.mouse = mouseTransform(canvas, a.startX, a.endX, a.startY, a.endY);
        this.trackPos();
        // store settings for later use (e.g. re-rendering)
        this.settings = { canvas: a };
        this.theme = getTheme(a.theme);
        this.cx.fillStyle = RGBAtoString(this.theme.backgroundColor);
        // store for graphed functions to re-render contents
        this.data = [];
        // add new instance to collection
        Graphi.ALL = [];
        Graphi.ALL.push(this);
        // when a new instance is created, remove past data from all instances
        // graphi in order to prevent it from lingering for the mouse-over fn
        if (Graphi.ALL)
            Graphi.ALL.forEach(g => g.data = []);
    }
    redrawCanvas() {
        // copy and reset instance data
        // will be recreated when each is run
        const graphed = this.data.slice();
        this.data = [];
        // redraw canvas: clear -> grid -> render each fn again
        this.clearCanvas();
        this.drawGrid(this.settings.grid);
        for (const graph of graphed)
            this[graph.fn](graph.coords, graph.args);
    }
    clearGrid() {
        this.clearCanvas();
        this.drawGrid(this.settings.grid);
    }
    drawGrid(args = {}) {
        const defaults = {
            unitsPerTick: 10,
            xAxisLabel: 'x',
            yAxisLabel: 'y'
        };
        const a = Object.assign({}, defaults, args);
        this.settings.grid = a; // save settings for re-rendering
        // wasteful code to make clearer
        const startX = this.settings.canvas.startX;
        const endX = this.settings.canvas.endX;
        const startY = this.settings.canvas.startY;
        const endY = this.settings.canvas.endY;
        // total number of units / units per tick -> total ticks per axis
        const totalXTicks = (Math.abs(startX) + endX) / a.unitsPerTick;
        const totalYTicks = (Math.abs(startY) + endY) / a.unitsPerTick;
        // axis coordinates for length of canvas
        const xAxis = [{ x: startX, y: 0 }, { x: endX, y: 0 }];
        const yAxis = [{ x: 0, y: startY }, { x: 0, y: endY }];
        this.drawAxis(xAxis, this.theme.axisColor, totalXTicks);
        this.drawAxis(yAxis, this.theme.axisColor, totalYTicks);
    }
    drawAxis(coord, color, tickTotal, label = '') {
        // draw axis line
        this.drawSegment(coord, color);
        // Draw Ticks:
        // get direction of axis
        const hyp = hypotenuse(coord[0], coord[1]);
        const angle = angleOfVector(coord[0], coord[1]);
        const isVertical = approxEqual(angle, 1.5707963267948966);
        // calculate length of tick and the offset per vector
        // more complicated this way, but vertical/horizontal agnostic
        const tickLength = this.canvas.width / 200;
        const tickSpace = endOfVector({ x: 0, y: 0 }, angle, (hyp / tickTotal));
        // start at root of axis
        const base = { x: coord[0].x, y: coord[0].y };
        // for each tick draw line segment offset by 1/2 of tickLength
        // on either side of the tick point
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
            this.drawSegment([start, end], color);
        }
    }
    // Generate Coordinates based upon an arbitrary function
    // for the length of the x axis. Can be then rendered as desired.
    genFn(fn, args = {}) {
        const defaults = {
            amplitude: 1,
            frequency: 1,
            step: 1
        };
        const a = Object.assign({}, defaults, args);
        const yOfX = [];
        for (let x = this.settings.canvas.startX; x < this.settings.canvas.endX; x += a.step) {
            const y = fn(x / a.frequency) * a.amplitude;
            if (y)
                yOfX.push({ x, y });
        }
        return yOfX;
    }
    drawBar(coord, args = {}) {
        this.data.push({ fn: "drawBar", coord, args });
        const defaults = {
            color: '',
            width: 10,
            label: ''
        };
        const a = Object.assign({}, defaults, args);
        if (a.color === '')
            a.color = this.getNextColor();
        console.log("TOPLEFT: ", { x: coord.x - (a.width / 2), y: coord.y });
        console.log("BOTTOMRIGHT: ", { x: coord.x + (a.width / 2), y: 0 });
        const topLeft = this.tr({ x: coord.x - (a.width / 2), y: coord.y });
        const bottomRight = this.tr({ x: a.width, y: 0 });
        console.log("ZEROZERO", this.tr({ x: 0, y: 0 }));
        console.log("TOPLEFTTR: ", topLeft);
        console.log("BOTTOMRIGHTTR: ", bottomRight);
        const cx = this.cx;
        cx.rect(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y);
        cx.stroke();
    }
    drawBezier(coords, args = {}) {
        this.data.push({ fn: "drawBezier", coords, args });
        const defaults = {
            color: '',
            weight: 5,
            label: ''
        };
        const a = Object.assign({}, defaults, args);
        if (a.color === '')
            a.color = this.getNextColor();
        const cs = this.transformAll(coords);
        if (cs.length === 0)
            return;
        if (cs.length < 1)
            this.drawPoint(cs[0], 2, a.color);
        const cx = this.cx;
        let prevSlope = getSlopeOf(cs[0], cs[1]);
        for (let i = 1; i < cs.length - 1; i++) {
            const currSlope = getSlopeOf(cs[i - 1], cs[i + 1]);
            const prev = cs[i - 1];
            const curr = cs[i];
            bezierCurve(cx, prev, prevSlope, curr, currSlope, a.weight, a.color);
            prevSlope = currSlope;
        }
        const last = cs[cs.length - 1];
        const nextToLast = cs[cs.length - 2];
        const endingSlope = getSlopeOf(last, nextToLast);
        bezierCurve(cx, nextToLast, prevSlope, last, endingSlope, a.weight);
    }
    drawLineWithPoints(coords, args = {}) {
        this.data.push({ fn: "drawLineWithPoints", coords, args });
        const defaults = {
            radius: 1,
            color: '',
            label: ''
        };
        const a = Object.assign({}, defaults, args);
        if (a.color === '')
            a.color = this.getNextColor();
        this.drawSegment(coords, a.color);
        for (const point of coords)
            this.drawPoint(point, a.radius, a.color);
    }
    drawPoints(coords, args = {}) {
        this.data.push({ fn: "drawPoints", coords, args });
        const defaults = {
            radius: 1,
            color: '',
            label: ''
        };
        const a = Object.assign({}, defaults, args);
        if (a.color === '')
            a.color = this.getNextColor();
        for (const point of coords)
            this.drawPoint(point, a.radius, a.color);
    }
    drawPoint(point, radius = 1, color = '', label = '') {
        const newPoint = this.tr(point);
        this.cx.beginPath();
        color = colorize(color);
        this.cx.strokeStyle = color;
        this.cx.fillStyle = color;
        this.cx.arc(newPoint.x, newPoint.y, radius, 0, 2 * Math.PI);
        this.cx.fill();
        this.cx.stroke();
    }
    drawLine(coords, args = {}) {
        this.data.push({ fn: "drawLine", coords, args });
        const defaults = {
            color: '',
            label: ''
        };
        const a = Object.assign({}, defaults, args);
        if (a.color === '')
            a.color = this.getNextColor();
        this.drawSegment(coords, a.color);
    }
    drawSegment(coords, color) {
        const trCoords = this.transformAll(coords);
        this.cx.strokeStyle = colorize(color);
        this.cx.beginPath();
        this.cx.moveTo(trCoords[0].x, trCoords[0].y);
        for (const coord of trCoords) {
            this.cx.lineTo(coord.x, coord.y);
        }
        this.cx.stroke();
    }
    transformAll(coords) {
        return coords.map(coord => this.tr(coord));
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
        function displayInfoAtCoord(e) {
            if (that.data.length === 0)
                return;
            const mouse = that.mouse({ x: e.x, y: e.y });
            const closestGraph = graphWithClosestCoord(that.data, mouse);
            const closestPoint = closestGraph.closest;
            const globalPoint = globalTransform(that.canvas, that.tr, closestPoint);
            let floater = document.querySelector('#floater');
            if (floater === null) {
                renderMouseOverCard.apply(that);
                floater = document.querySelector('#floater');
            }
            floater.style.top = globalPoint.y + 5;
            floater.style.left = globalPoint.x + 5;
            const label = document.querySelector('#floater-label');
            const labelText = closestGraph.graph.args.label;
            if (!!labelText) {
                label.style.display = "initial";
                label.textContent = labelText;
            }
            else {
                label.style.display = "none";
                label.textContent = "";
            }
            const values = document.querySelector('#floater-values');
            values.textContent = `${that.settings.grid.xAxisLabel}:${closestPoint.x.toFixed(2)}, ${that.settings.grid.yAxisLabel}:${closestPoint.y.toFixed(2)}`;
            let dot = document.querySelector('#dot');
            dot.style.top = globalPoint.y - 5;
            dot.style.left = globalPoint.x - 5;
        }
    }
    clearCanvas() {
        this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    getNextColor() {
        if (this.theme.lastColorIndex >= this.theme.colors.length)
            this.theme.lastColorIndex = 0;
        const nextColor = RGBAtoString(this.theme.colors[this.theme.lastColorIndex]);
        this.theme.lastColorIndex++;
        return nextColor;
    }
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
        const invertY = canvas.offsetHeight - canvasY;
        // transform to grid space by dividing by the of px/unit
        // then offsetting by the gridspace minimum
        const scaleXFactor = canvas.offsetWidth / (Math.abs(minX) + maxX);
        const gridX = (canvasX / scaleXFactor) + minX;
        const scaleYFactor = canvas.offsetHeight / (Math.abs(minY) + maxY);
        const gridY = (invertY / scaleYFactor) + minY;
        return { x: gridX, y: gridY };
    };
}
function closestCoord(coords, mouse) {
    const shallowCopy = coords.slice();
    if (shallowCopy === undefined)
        debugger;
    return shallowCopy.sort((a, b) => hypotenuse(a, mouse) - hypotenuse(b, mouse))[0];
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
    return closestGraph;
}
function renderMouseOverCard() {
    const floater = document.createElement('div');
    floater.id = "floater";
    floater.style.position = "absolute";
    floater.style.textColor = RGBAtoString(this.theme.axisColor);
    const label = document.createElement('p');
    label.id = "floater-label";
    const values = document.createElement('p');
    values.id = "floater-values";
    floater.appendChild(label);
    floater.appendChild(values);
    const dot = document.createElement('div');
    dot.id = "dot";
    dot.style.height = "10px";
    dot.style.width = "10px";
    dot.style.backgroundColor = "red";
    dot.style.borderRadius = "50%";
    dot.style.position = "absolute";
    const main = document.querySelector('main');
    main.appendChild(floater);
    main.appendChild(dot);
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
        backgroundColor: { r: 73, g: 73, b: 73, a: 1 },
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
    },
    {
        name: "dark",
        backgroundColor: { r: 31, g: 32, b: 32, a: 1 },
        axisColor: { r: 212, g: 212, b: 206, a: 1 },
        colors: [{ r: 166, g: 226, b: 46, a: 1 },
            { r: 174, g: 129, b: 225, a: 1 },
            { r: 249, g: 38, b: 114, a: 1 },
            { r: 102, g: 216, b: 238, a: 1 },
            { r: 226, g: 215, b: 115, a: 1 },
            { r: 196, g: 151, b: 111, a: 1 },
            { r: 156, g: 221, b: 254, a: 1 },
            { r: 245, g: 245, b: 66, a: 1 },
            { r: 30, g: 150, b: 140, a: 1 }],
        lastColorIndex: 0
    },
    {
        name: "light",
        backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
        axisColor: { r: 210, g: 210, b: 210, a: 1 },
        colors: [{ r: 255, g: 159, b: 108, a: 1 },
            { r: 0, g: 126, b: 130, a: 1 },
            { r: 164, g: 65, b: 133, a: 1 },
            { r: 88, g: 124, b: 12, a: 1 },
            { r: 0, g: 63, b: 65, a: 1 },
            { r: 81, g: 48, b: 75, a: 1 },
            { r: 41, g: 25, b: 37, a: 1 },
            { r: 144, g: 89, b: 134, a: 1 },
            { r: 134, g: 164, b: 63, a: 1 },
            { r: 220, g: 124, b: 115, a: 1 }],
        lastColorIndex: 0
    }
];
