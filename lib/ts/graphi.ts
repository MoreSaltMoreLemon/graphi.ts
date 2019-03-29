declare interface Coordinate {
  x: number;
  y: number;
}

class Graphi {
  canvas: HTMLCanvasElement;
  cx: CanvasRenderingContext2D;
  tr: Function;
  mouse: Function;
  theme: Theme;
  data: [];
  settings: {};
  static ALL: []

  constructor(
    canvas: HTMLCanvasElement, 
    theme: string|Theme = "default", 
    startX = -50,
    endX = 50,
    startY = -50,
    endY = 50) {

    // get Canvas Context and wipe any prior contents
    this.canvas = canvas;
    this.cx = canvas.getContext("2d");
    this.clearCanvas()

    // generate transform functions for going from local coordinates
    // to canvas pixels and for going from window pixels to coordinates
    this.tr = transform(canvas, startX, endX, startY, endY);
    this.mouse = mouseTransform(canvas, startX, endX, startY, endY)
    this.trackPos();

    // store settings for later use (e.g. re-rendering)
    this.settings = {canvas: {startX, endX, startY, endY}};
    this.theme = getTheme(theme); 
    this.cx.fillStyle = RGBAtoString(this.theme.backgroundColor);
    
    this.data = [];
    
    if (Graphi.ALL) Graphi.ALL.forEach(g => g.data = []);
    Graphi.ALL = [];
    Graphi.ALL.push(this);
  }

  reRenderCanvas() {
    const graphed = this.data.slice();
    this.data = [];

    this.clearCanvas();

    for (const fn of graphed) this[fn](...fn.args);
  }

  drawGrid(unitsPerTick: number = 10, xAxisLabel: string = '', yAxisLabel: string = ''): void {
    const startX = this.settings.canvas.startX;
    const endX = this.settings.canvas.endX;
    const startY = this.settings.canvas.startY;
    const endY = this.settings.canvas.endY;
    
    const totalXTicks = (Math.abs(startX) + endX) / unitsPerTick;
    const totalYTicks = (Math.abs(startY) + endY) / unitsPerTick;

    const xAxis = [{x: startX, y: 0}, {x: endX, y: 0}];
    const yAxis = [{x: 0, y: startY}, {x: 0, y: endY}];

    this.drawAxis(xAxis, this.theme.axisColor, totalXTicks);
    this.drawAxis(yAxis, this.theme.axisColor, totalYTicks);
  }

  private drawAxis(
    coord: Coordinate[],
    color: string|RGBA,
    tickTotal: number,
    label: string = ''): void {
    const tickLength = this.canvas.width / 200;

    this.drawSegment(coord, color);
    
    const hyp = hypotenuse(coord[0], coord[1]);
    const angle = angleOfVector(coord[0], coord[1]);

    const isVertical = approxEqual(angle, 1.5707963267948966);
    
    const tickSpace = endOfVector({x: 0, y: 0}, angle, (hyp / tickTotal));
    const base = {x: coord[0].x, y: coord[0].y};
    
    for (let i = 0; i < tickTotal; i++) {
      base.x += isVertical ? 0: tickSpace.x;
      base.y += isVertical ? tickSpace.y: 0;
      
      const start = {x: base.x, y: base.y}
      const end = {x: base.x, y: base.y}
      
      if (isVertical) {
        start.x -= tickLength / 2;
        end.x += tickLength / 2
      } else {
        start.y -= tickLength / 2; 
        end.y += tickLength / 2;
      }
      
      this.drawSegment([start, end], color)
    }
  }

  genFn(
    fn: Function, 
    amplitude: number = 1, 
    frequency: number = 1, 
    step: number = 1): Coordinate[] {

    const yOfX: Coordinate[] = [];
    for (let x = this.settings.canvas.startX; x < this.settings.canvas.endX; x += step) {
      const y = fn(x / frequency) * amplitude;
      if (y) yOfX.push({x, y});
    }
    return yOfX;
  }

  drawBezier(
    coords: Coordinate[],
    color: string|RGBA = '',
    weight: number = 5,
    label: string = ''): void {

    this.data.push({fn: "drawBezier", args: [coords, color, weight, label]})
    if (color === '') color = this.getNextColor();
    const cs = this.transformAll(coords);
    if (cs.length === 0) return;
    if (cs.length < 1) this.drawPoint(cs[0], 2, color);
    
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

  drawLineWithPoints(
    coords: Coordinate[], 
    radius: number = 1, 
    color: string|RGBA = '', 
    label: string = ''): void {

    this.drawSegment(coords, color);
    this.drawPoints(coords, radius, color, label);
  }

  drawPoints(
    coords: Coordinate[], 
    radius: number = 1,
    color: string|RGBA = '', 
    label: string = ''): void {

    this.data.push({fn: "drawPoints", args: [coords, radius, color, label]})
    if (color === '') color = this.getNextColor();

    for (const point of coords) this.drawPoint(point, radius, color);
  }

  private drawPoint(
    point: Coordinate, 
    radius: number = 1, 
    color: string|RGBA = '', 
    label: string = ''): void {

    const newPoint = this.tr(point)
    this.cx.beginPath();
    
    color = colorize(color);

    this.cx.strokeStyle = color;
    this.cx.fillStyle = color;
    this.cx.arc(newPoint.x, newPoint.y, radius, 0, 2 * Math.PI);
    this.cx.fill();
    this.cx.stroke();
  }

  drawLine(
    coords: Coordinate[],
    color: string|RGBA = '',
    label: string = ''): void {

    this.data.push({fn: "drawLine", args: [coords, color, label]});
    
    if (color === '') color = this.getNextColor();
    this.drawSegment(coords, color);
  }

  private drawSegment(coords: Coordinate[], color: string): void {
    const trCoords = this.transformAll(coords);
    this.cx.strokeStyle = colorize(color);
    this.cx.beginPath();
    this.cx.moveTo(trCoords[0].x, trCoords[0].y);
    for (const coord of trCoords) {
      this.cx.lineTo(coord.x, coord.y);
    }
    this.cx.stroke();
  }

  private transformAll(
    coords: Coordinate[],
    ): Coordinate[] {
    return coords.map(coord => this.tr(coord));
  }

  convertToCoord(coords: []): Coordinate[] {
    if (Array.isArray(coords) && 
        coords.every(coord =>
          Array.isArray(coord) 
       && coord.length == 2
       && typeof coord[0] === "number"
       && typeof coord[1] === "number"))
      return coords.map(coord => ({x: coord[0], y: coord[1]}))
    else throw new Error("convertToCoord: Incorrect format. [[x, y],[x, y]]");
  }

  private trackPos() {
    this.canvas.removeEventListener('mousemove', displayInfoAtCoord)
    this.canvas.addEventListener('mousemove', displayInfoAtCoord)
    const that = this;

    function displayInfoAtCoord (e) {
      if (that.data.length === 0) return;
      
      const mouse = that.mouse({ x: e.x, y: e.y });
      
      // const closestGraph = graphWithClosestCoord(that.data, mouse);
      // const closestPoint = closestCoord(closestGraph.args[0], mouse);

      const closestGraph = graphWithClosestCoord(that.data, mouse);
      const closestPoint = closestGraph.closest;
      // const closestPoint = closestCoord(closestGraph.args[0], mouse);

      const globalPoint = globalTransform(that.canvas, that.tr, closestPoint);

      let floater = document.querySelector('#floater');
      if (floater === null) renderMouseOverCard.apply(that);
      
      
      floater.style.top = globalPoint.y + 5;
      floater.style.left = globalPoint.x + 5;
      
      const label = document.querySelector('#floater-label');
      const values = document.querySelector('#floater-values');
      // label.textContent = closestGraph.graph.label;
      values.textContent = `x:${closestPoint.x.toFixed(2)}, y:${closestPoint.y.toFixed(2)}`;
      
      let dot = document.querySelector('#dot');
      dot.style.top = globalPoint.y - 5;
      dot.style.left = globalPoint.x - 5;
    }
  }

  private clearCanvas() {
    this.cx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private getCurrentColor(): string {
    return RGBAtoString(this.theme.colors[this.theme.lastColorIndex])
  }

  private getNextColor(): string {
    if (this.theme.lastColorIndex >= this.theme.colors.length) this.theme.lastColorIndex = 0;
    const nextColor = RGBAtoString(this.theme.colors[this.theme.lastColorIndex]);
    this.theme.lastColorIndex++;
    return nextColor;
  }
}

function approxEqual(n1: number, n2: number, epsilon: number = 0.0001): boolean {
  return Math.abs(n1 - n2) < epsilon;
}

function hypotenuse(root: Coordinate, end: Coordinate): number {
  return Math.hypot(end.x - root.x, end.y - root.y);
}

function endOfVector(root: Coordinate, angle: number, hypotenuse: number): Coordinate {
  const opposite = Math.sin(angle) * hypotenuse;
  const adjacent = Math.cos(angle) * hypotenuse;
  
  return { x: root.x + adjacent, y: root.y + opposite };;
}

function angleOfVector(root: Coordinate, end: Coordinate): number {
  return Math.asin((end.y - root.y) / hypotenuse(root, end));
}

function getSlopeOf(coord1: Coordinate, coord2: Coordinate): number {
  const x = coord2.x - coord1.x;
  const y = coord2.y - coord1.y;
  return y / x;
}

function bezierCurve(
  cx: CanvasRenderingContext2D, 
  start: Coordinate, 
  startSlope: number, 
  end: Coordinate, 
  endSlope: number,
  weight: number,
  color: string|RGBA = ''): void {

  cx.beginPath();
  cx.strokeStyle = colorize(color);
  cx.moveTo(start.x, start.y);
  
  cx.bezierCurveTo(
    start.x + weight,
    start.y + weight * startSlope,
    end.x - weight,
    end.y - weight * endSlope,
    end.x,
    end.y
  );
  cx.stroke();
}

function transform(
  canvas: HTMLCanvasElement,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number): Function {
  return function (c: Coordinate): Coordinate {
    // offset by the minimum grid space, divide by total units to get percent
    // of length, then multiply by canvas dimension to get location in px
    let gridX = (c.x + Math.abs(minX)) / (Math.abs(minX) + maxX) * canvas.width;
    let gridY = (c.y + Math.abs(minY)) / (Math.abs(minY) + maxY) * canvas.height;
    // invert to compensate for updside down Y axis
    let globalY = canvas.height - gridY;

    return { x: gridX, y: globalY };
  }
}

function globalTransform(
  canvas: HTMLCanvasElement,
  transformFn: Function, 
  coord: Coordinate): Coordinate {
  const gridSpace: Coordinate = transformFn(coord);
  return {x: gridSpace.x + canvas.offsetLeft, 
          y: gridSpace.y + canvas.offsetTop}
}

function mouseTransform(
  canvas: HTMLCanvasElement,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number): Function {

    return function (coord: Coordinate): Coordinate {
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

      return { x: gridX, y: gridY};
    }
}

function nearestCoord(coords: Coordinate[], mousePos: Coordinate): Coordinate {
  const valArray = coords.map(coord => [hypotenuse(coord, mousePos), coord])
  .sort((a, b) => a[0] - b[0])
  return valArray[0][1]
}

function closestCoord(coords: Coordinate[], mouse: Coordinate): Coordinate {
  if (coords === undefined) debugger;
  return coords.sort((a, b) => hypotenuse(a, mouse) - hypotenuse(b, mouse))[0];
}

function graphWithClosestCoord(graphs: Object[], mouse) {
  const closestGraph = graphs.reduce((acc, graph) => {
    const closest = closestCoord(graph.args[0], mouse); //coords, mouse);
    if (hypotenuse(closest, mouse) < 
        hypotenuse(acc.closest, mouse)) {
      return {closest, graph};
    } else return acc;
  }, {closest: {x: Infinity, y: Infinity}, graph: {}});
  
  return closestGraph;
}

function renderMouseOverCard() {
  const floater = document.createElement('div');
  floater.id = "floater"
  floater.style.position = "absolute";
  floater.style.textColor = RGBAtoString(this.theme.axisColor);
  const label = document.createElement('p');
  label.id = "floater-label"
  const values = document.createElement('p')
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

  window.document.body.appendChild(floater);
  window.document.body.appendChild(dot);
}

// Color Space Management Functions
declare interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function colorize(color: string|RGBA): string {
  if (color instanceof Object) return RGBAtoString(color);
  else return color;
}

function RGBAtoString(color: RGBA): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`
}


// Theme Declaration
declare interface Theme {
  name: string;
  backgroundColor: RGBA;
  axisColor: RGBA;
  colors: RGBA[];
  lastColorIndex: number; 
}

function getTheme(theme: string|Theme) {
  if (theme instanceof Object) return theme;
  else {
    let foundTheme = themes.find(t => t.name === theme);
    if (foundTheme instanceof Object) return foundTheme;
    else throw new Error("getTheme: theme name doesn't match available themes");
  }
}

const themes: Theme[] = [
  {
    name: "default",
    backgroundColor: {r: 73, g: 73, b: 73, a: 1},
    axisColor: {r: 93, g: 93, b: 93, a: 1},
    colors: [ {r: 143, g: 45, b: 45, a: 1}, 
              {r: 45, g: 121, b: 143, a: 1},
              {r: 19, g: 70, b: 170, a: 1},
              {r: 45, g: 121, b: 143, a: 1},
              {r: 143, g: 45, b: 82, a: 1},
              {r: 77, g: 45, b: 143, a: 1},
              {r: 119, g: 45, b: 143, a: 1},
              {r: 235, g: 37, b: 33, a: 1},],
    lastColorIndex: 0
  },
  {
    name: "dark",
    backgroundColor: {r: 31, g: 32, b: 32, a: 1},
    axisColor: {r: 212, g: 212, b: 206, a: 1},
    colors: [ {r: 166, g: 226, b: 46, a: 1}, 
              {r: 174, g: 129, b: 225, a: 1},
              {r: 249, g: 38, b: 114, a: 1},
              {r: 102, g: 216, b: 238, a: 1},
              {r: 226, g: 215, b: 115, a: 1},
              {r: 196, g: 151, b: 111, a: 1},
              {r: 156, g: 221, b: 254, a: 1},
              {r: 245, g: 245, b: 66, a: 1},
              {r: 30, g: 150, b: 140, a: 1}],
    lastColorIndex: 0
  },
  {
    name: "light",
    backgroundColor: {r: 255, g: 255, b: 255, a: 1},
    axisColor: {r: 210, g: 210, b: 210, a: 1},
    colors: [ {r: 255, g: 159, b: 108, a: 1}, 
              {r: 0, g: 126, b: 130, a: 1},
              {r: 164, g: 65, b: 133, a: 1},
              {r: 88, g: 124, b: 12, a: 1},
              {r: 0, g: 63, b: 65, a: 1},
              {r: 81, g: 48, b: 75, a: 1},
              {r: 41, g: 25, b: 37, a: 1},
              {r: 144, g: 89, b: 134, a: 1},
              {r: 134, g: 164, b: 63, a: 1},
              {r: 220, g: 124, b: 115, a: 1}],
    lastColorIndex: 0
  }
]