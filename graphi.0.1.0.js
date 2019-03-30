"use strict";
(function anonymousGraphiIIFE(window) {
    class Graphi {
        constructor(canvas, options = {}) {
            const defaults = { theme: "default", startX: -50, endX: 50, startY: -50, endY: 50 };
            const a = Object.assign({}, defaults, options);
            // get Canvas Context and wipe any prior contents
            this.canvas = canvas;
            this.cx = canvas.getContext("2d");
            this.clearCanvas();
            // generate transform functions for going from local coordinates
            // to canvas pixels and for going from window pixels to coordinates
            this.tr = transform(canvas, a.startX, a.endX, a.startY, a.endY);
            this.mouse = mouseTransform(canvas, a.startX, a.endX, a.startY, a.endY);
            this.global = globalTransform(canvas, this.tr);
            this.trackPos();
            // store settings for later use (e.g. re-rendering)
            this.settings = { canvas: a };
            if (typeof a.theme === "string")
                this.theme = getTheme(a.theme);
            else
                this.theme = a.theme;
            // apply background color
            this.cx.fillStyle = RGBtoString(this.theme.backgroundColor);
            this.cx.fillRect(0, 0, canvas.width, canvas.height);
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
        // resets the coordinate positioning based upon new canvas configuration
        recalcCoordSystems() {
            const a = this.settings.canvas;
            this.tr = transform(this.canvas, a.startX, a.endX, a.startY, a.endY);
            this.mouse = mouseTransform(this.canvas, a.startX, a.endX, a.startY, a.endY);
            this.global = globalTransform(this.canvas, this.tr);
        }
        // repaints canvas. May be used for animation in the future
        redrawCanvas() {
            // copy and reset instance data
            // will be recreated when each is run
            const graphed = this.data.slice();
            this.data = [];
            const a = this.settings.canvas;
            this.clearCanvas();
            // reset coordinate space in case canvas has been changed
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            this.recalcCoordSystems();
            // redraw canvas: clear -> grid -> render each fn again
            this.drawGrid(this.settings.grid);
            for (const graph of graphed)
                this[graph.fn](graph.coords, graph.options);
        }
        // Clears canvas and redraws grid from existing settings
        clearGrid() {
            this.clearCanvas();
            this.drawGrid(this.settings.grid);
        }
        // Draws an X and Y axis as the 0 coordinate
        // creates tick marks at a spacing determined by unitsPerTick
        drawGrid(options = {}) {
            const defaults = { unitsPerTick: 10, xAxisLabel: 'x', yAxisLabel: 'y' };
            const a = Object.assign({}, defaults, options);
            // save settings for re-rendering
            this.settings.grid = a;
            // used to abbriate code for clarity
            const c = this.settings.canvas;
            const color = this.colorize(this.theme.axisColor);
            // total number of units / units per tick -> total ticks per axis
            const totalXTicks = (Math.abs(c.startX) + c.endX) / a.unitsPerTick;
            const totalYTicks = (Math.abs(c.startY) + c.endY) / a.unitsPerTick;
            // axis coordinates for length of canvas
            const xAxis = [{ x: c.startX, y: 0 }, { x: c.endX, y: 0 }];
            const yAxis = [{ x: 0, y: c.startY }, { x: 0, y: c.endY }];
            this.drawAxis(xAxis, color, totalXTicks);
            this.drawAxis(yAxis, color, totalYTicks);
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
        genFn(fn, options = {}) {
            const defaults = { amplitude: 1, offset: 1, step: 1 };
            const a = Object.assign({}, defaults, options);
            const yOfX = [];
            for (let x = this.settings.canvas.startX; x < this.settings.canvas.endX; x += a.step) {
                const y = fn(x / a.amplitude) + a.offset;
                if (y)
                    yOfX.push({ x, y });
            }
            return yOfX;
        }
        // draw bezier curve from collection of coordinates
        // each segment ends where the next one begins. The position of control points
        // of each segment are determined by the slope of the previous and next
        // point, which is then increased or decreated by the weight option
        //    0--x--0  0--x--0
        //    /    \    /
        //  /       \ /
        //x--0    0--x--0
        // as the start and end coordinates do not have a preceding/following value
        // which can be used to create a slope to place the first/last control point
        // so the next/previous point is used instead.
        drawBezier(coords, options = {}) {
            this.data.push({ fn: "drawBezier", coords, options });
            const defaults = { color: '', weight: 1, label: '' };
            const a = Object.assign({}, defaults, options);
            a.color = this.colorize(a.color);
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
                const weight = ((hypotenuse(prev, curr) / 10) * 3) * a.weight;
                bezierCurve(cx, prev, prevSlope, curr, currSlope, weight, a.color);
                prevSlope = currSlope;
            }
            const last = cs[cs.length - 1];
            const nextToLast = cs[cs.length - 2];
            const endingSlope = getSlopeOf(last, nextToLast);
            bezierCurve(cx, nextToLast, prevSlope, last, endingSlope, 1, a.color);
        }
        // draw both a line and points at each coordinate given
        drawLineWithPoints(coords, options = {}) {
            this.data.push({ fn: "drawLineWithPoints", coords, options });
            const defaults = { radius: 1, color: '', label: '' };
            const a = Object.assign({}, defaults, options);
            a.color = this.colorize(a.color);
            this.drawSegment(coords, a.color);
            for (const point of coords)
                this.drawPoint(point, a.radius, a.color);
        }
        // draws points from an array of coordinates
        drawPoints(coords, options = {}) {
            this.data.push({ fn: "drawPoints", coords, options });
            const defaults = { radius: 1, color: '', label: '' };
            const a = Object.assign({}, defaults, options);
            a.color = this.colorize(a.color);
            for (const point of coords)
                this.drawPoint(point, a.radius, a.color);
        }
        // internal function used to draw a single point
        drawPoint(point, radius, color) {
            const newPoint = this.tr(point);
            this.cx.beginPath();
            this.cx.strokeStyle = color;
            this.cx.fillStyle = color;
            this.cx.arc(newPoint.x, newPoint.y, radius, 0, 2 * Math.PI);
            this.cx.fill();
            this.cx.stroke();
        }
        // draws line from sequence of coordinates
        drawLine(coords, options = {}) {
            this.data.push({ fn: "drawLine", coords, options });
            const defaults = { color: '', label: '' };
            const a = Object.assign({}, defaults, options);
            a.color = this.colorize(a.color);
            this.drawSegment(coords, a.color);
        }
        // draws line segments between two points
        drawSegment(coords, color) {
            const trCoords = this.transformAll(coords);
            this.cx.strokeStyle = color;
            this.cx.beginPath();
            this.cx.moveTo(trCoords[0].x, trCoords[0].y);
            for (const coord of trCoords) {
                this.cx.lineTo(coord.x, coord.y);
            }
            this.cx.stroke();
        }
        // transforms array of coordinates into canvas pixel coordinates
        transformAll(coords) {
            return coords.map(coord => this.tr(coord));
        }
        // generates an array of coordinates ( [{x, y}, {x, y}, ...] )
        // from an array of arrays ( [[x, y], [x, y], ...])
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
        // track the mouse position and match it with the 
        // closest coordinate point on the canvas
        trackPos() {
            const that = this;
            this.canvas.removeEventListener('mousemove', displayInfoAtCoord);
            this.canvas.addEventListener('mousemove', displayInfoAtCoord);
            function displayInfoAtCoord(e) {
                if (that.data.length === 0)
                    return;
                that.recalcCoordSystems();
                const mouse = that.mouse({ x: e.x, y: e.y });
                const closestGraph = graphWithClosestCoord(that.data, mouse);
                const closestPoint = closestGraph.closest;
                const globalPoint = that.global(closestPoint);
                let floater = document.querySelector('#floater');
                if (floater === null) {
                    renderMouseOverCard.apply(that);
                    floater = document.querySelector('#floater');
                }
                floater.style.top = globalPoint.y + 5;
                floater.style.left = globalPoint.x + 5;
                const label = document.querySelector('#floater-label');
                const labelText = closestGraph.graph.options.label;
                if (!!labelText) {
                    label.style.display = "initial";
                    label.textContent = labelText;
                }
                else {
                    label.style.display = "none";
                    label.textContent = "";
                }
                const values = document.querySelector('#floater-values');
                values.textContent = `${that.settings.grid.xAxisLabel}:${closestPoint.x.toFixed(2)},` +
                    ` ${that.settings.grid.yAxisLabel}:${closestPoint.y.toFixed(2)}`;
                let dot = document.querySelector('#dot');
                dot.style.top = globalPoint.y - 5;
                dot.style.left = globalPoint.x - 5;
            }
        }
        clearCanvas() {
            this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        // if given RGB type, return "rgb(n, n, n)", otherwise
        // assume that the given string was a valid CSS string name
        colorize(color) {
            if (color instanceof Object)
                return RGBtoString(color);
            if (typeof color === "string" && color === '')
                return this.getNextColor();
            else
                return color;
        }
        getNextColor() {
            if (this.theme.lastColorIndex >= this.theme.colors.length)
                this.theme.lastColorIndex = 0;
            const nextColor = RGBtoString(this.theme.colors[this.theme.lastColorIndex]);
            this.theme.lastColorIndex++;
            return nextColor;
        }
    }
    // allows for equality comparisons when there is only a minor difference
    // e.g. .1 + .2 === .3 -> false, approxEqual(.1 + .2, .3) -> true
    function approxEqual(n1, n2, epsilon = 0.0001) {
        return Math.abs(n1 - n2) < epsilon;
    }
    // returns length between two coordinates
    function hypotenuse(root, end) {
        return Math.hypot(end.x - root.x, end.y - root.y);
    }
    // returns coordinate at end of vector (length + angle -> vector)
    function endOfVector(root, angle, hypotenuse) {
        const opposite = Math.sin(angle) * hypotenuse;
        const adjacent = Math.cos(angle) * hypotenuse;
        return { x: root.x + adjacent, y: root.y + opposite };
        ;
    }
    function angleOfVector(root, end) {
        return Math.asin((end.y - root.y) / hypotenuse(root, end));
    }
    // returns slope between two coordinates, e.g. y = 3x, slope: 3
    function getSlopeOf(coord1, coord2) {
        const x = coord2.x - coord1.x;
        const y = coord2.y - coord1.y;
        return y / x;
    }
    // draws bezier curve on canvas, uses weight and slope to
    // position the control points of the curve
    function bezierCurve(cx, start, startSlope, end, endSlope, weight, color) {
        cx.beginPath();
        cx.strokeStyle = color;
        cx.moveTo(start.x, start.y);
        // bezierCurveTo(start x, y, control point1 x, y, 
        //               control point2 x, y, end x, y)
        cx.bezierCurveTo(start.x + weight, start.y + weight * startSlope, end.x - weight, end.y - weight * endSlope, end.x, end.y);
        cx.stroke();
    }
    // Returns transformation function with canvas and grid details baked in. 
    // Returned function transforms grid x,y coordinates to canvas pixel space
    function transform(canvas, minX, maxX, minY, maxY) {
        return function (c) {
            // offset by the minimum grid space, divide by total units to get percent
            // of length, then multiply by canvas dimension to get location in px
            let gridX = (c.x + Math.abs(minX)) / (Math.abs(minX) + maxX) * canvas.width;
            let gridY = (c.y + Math.abs(minY)) / (Math.abs(minY) + maxY) * canvas.height;
            // invert to compensate for updside down Y axis
            let invertedY = canvas.height - gridY;
            return { x: gridX, y: invertedY };
        };
    }
    // Transforms coord in grid space to global window space in pixels
    // must compensate for the offsets due to styling: padding, border and margin
    function globalTransform(canvas, transformFn) {
        const paddingTop = parseInt(getElementProperty(canvas, "paddingTop"));
        const paddingRight = parseInt(getElementProperty(canvas, "paddingRight"));
        const paddingBottom = parseInt(getElementProperty(canvas, "paddingBottom"));
        const paddingLeft = parseInt(getElementProperty(canvas, "paddingLeft"));
        const marginTop = parseInt(getElementProperty(canvas, "marginTop"));
        const marginRight = parseInt(getElementProperty(canvas, "marginRight"));
        const marginBottom = parseInt(getElementProperty(canvas, "marginBottom"));
        const marginLeft = parseInt(getElementProperty(canvas, "marginLeft"));
        const borderTop = parseInt(getElementProperty(canvas, "borderTop"));
        const borderRight = parseInt(getElementProperty(canvas, "borderRight"));
        const borderBottom = parseInt(getElementProperty(canvas, "borderBottom"));
        const borderLeft = parseInt(getElementProperty(canvas, "borderLeft"));
        const actualWidth = canvas.offsetWidth - (paddingLeft + paddingRight + marginLeft + marginRight + borderLeft + borderRight);
        const actualHeight = canvas.offsetHeight - (paddingTop + paddingBottom + marginTop + marginBottom + borderTop + borderBottom);
        return function globalSpace(coord) {
            const gridSpace = transformFn(coord);
            return { x: gridSpace.x * (actualWidth / canvas.width) + canvas.offsetLeft + paddingLeft + marginLeft + borderLeft,
                y: gridSpace.y * (actualHeight / canvas.height) + canvas.offsetTop + paddingTop + marginTop + borderTop };
        };
    }
    // Returns transformation function with canvas and grid details baked in. 
    // Returned function transforms mouse x,y coordinates to grid space coordinates.
    // Note: mouse coordinates are offset from top left corner of the *visible* window
    // so scrolling must be accounted for.
    function mouseTransform(canvas, minX, maxX, minY, maxY) {
        return function (coord) {
            // subtract the offset from the top left of the window
            // to the top left of the canvas
            const canvasX = coord.x - canvas.offsetLeft + window.scrollX;
            const canvasY = coord.y - canvas.offsetTop + window.scrollY;
            // invert the Y axis, so that it is normal x,y space from bottom left corner
            const invertY = canvas.offsetHeight - canvasY;
            // transform to grid space by dividing by the of px/unit
            // then offsetting by the gridspace minimum
            const scaleXFactor = canvas.offsetWidth / (Math.abs(minX) + maxX);
            const scaleYFactor = canvas.offsetHeight / (Math.abs(minY) + maxY);
            const gridX = (canvasX / scaleXFactor) + minX;
            const gridY = (invertY / scaleYFactor) + minY;
            return { x: gridX, y: gridY };
        };
    }
    // given a collection of coordinates, returns the one closest to the target
    function closestCoord(coords, target) {
        const shallowCopy = coords.slice();
        if (shallowCopy === undefined)
            throw new Error("closestCoord: no coordinates given");
        return shallowCopy.sort((a, b) => hypotenuse(a, target) - hypotenuse(b, target))[0];
    }
    // given a collection of stored data already used to draw the current graph
    // check for which graphed collection has the closest coordinate and return
    // that particular collection wrapped in an object literal with a pointer
    // to the closest coordinate.
    function graphWithClosestCoord(drawData, target) {
        const closestGraph = drawData.reduce((acc, graph) => {
            const closest = closestCoord(graph.coords, target);
            if (hypotenuse(closest, target) <
                hypotenuse(acc.closest, target)) {
                return { closest, graph };
            }
            else
                return acc;
        }, { closest: { x: Infinity, y: Infinity }, graph: {} });
        return closestGraph;
    }
    // generate HTML for mouseOver overlay
    function renderMouseOverCard() {
        const floater = document.createElement('div');
        floater.id = "floater";
        floater.style.position = "absolute";
        floater.style.textColor = RGBtoString(this.theme.axisColor);
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
        let main = document.querySelector('main');
        if (main === null)
            main = window;
        main.appendChild(floater);
        main.appendChild(dot);
    }
    // wrapper function for ugly vanilla js code
    function getElementProperty(element, property) {
        return window.getComputedStyle(element)[property];
    }
    // wrapper function for vanilla fetch function
    function httpRequest(url, method = 'GET', data = {}) {
        const init = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: method,
            body: JSON.stringify(data)
        };
        if (method.toLowerCase() === 'get')
            delete init.body;
        if (method.toLowerCase() === 'post' && init.body.id)
            delete init.body.id;
        return fetch(url, init);
    }
    // convert RGB type to string "rgb(n, n, n)"
    function RGBtoString(color) {
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
    // accepts either a string name and searches for a saved
    // theme by that name, or determines that the given argument
    // is an object and is thus assumed to be a compatible theme object
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
            backgroundColor: { r: 73, g: 73, b: 73 },
            axisColor: { r: 93, g: 93, b: 93 },
            colors: [{ r: 143, g: 45, b: 45 },
                { r: 45, g: 121, b: 143 },
                { r: 19, g: 70, b: 170 },
                { r: 45, g: 121, b: 143 },
                { r: 143, g: 45, b: 82 },
                { r: 77, g: 45, b: 143 },
                { r: 119, g: 45, b: 143 },
                { r: 235, g: 37, b: 33 }],
            lastColorIndex: 0
        },
        {
            name: "dark",
            backgroundColor: { r: 31, g: 32, b: 32 },
            axisColor: { r: 212, g: 212, b: 206 },
            colors: [{ r: 166, g: 226, b: 46 },
                { r: 174, g: 129, b: 225 },
                { r: 249, g: 38, b: 114 },
                { r: 102, g: 216, b: 238 },
                { r: 226, g: 215, b: 115 },
                { r: 196, g: 151, b: 111 },
                { r: 156, g: 221, b: 254 },
                { r: 245, g: 245, b: 66 },
                { r: 30, g: 150, b: 140 }],
            lastColorIndex: 0
        },
        {
            name: "light",
            backgroundColor: { r: 255, g: 255, b: 255 },
            axisColor: { r: 210, g: 210, b: 210 },
            colors: [{ r: 255, g: 159, b: 108 },
                { r: 0, g: 126, b: 130 },
                { r: 164, g: 65, b: 133 },
                { r: 88, g: 124, b: 12 },
                { r: 0, g: 63, b: 65 },
                { r: 81, g: 48, b: 75 },
                { r: 41, g: 25, b: 37 },
                { r: 144, g: 89, b: 134 },
                { r: 134, g: 164, b: 63 },
                { r: 220, g: 124, b: 115 }],
            lastColorIndex: 0
        }
    ];
    // attach Graphi class to window, keeping the remaining
    // helper functions private within the IIFE
    window.Graphi = Graphi;
})(window);
