declare interface Coordinate {
  x: number;
  y: number;
}

declare interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

declare interface Theme {
  name: string;
  backgroundColor: RGBA;
  axisColor: RGBA;
  colors: RGBA[];
  lastColorIndex: number; 
}

class Graphi {
  canvas: any;
  cx: CanvasRenderingContext2D;
  tr: Function;
  theme: Theme;
  graphedData: {};
  gridPercentX: number;
  gridPercentY: number;
  startX: number;
  endX: number;
  startY: number;
  endY: number;

  constructor(canvas: HTMLCanvasElement, 
              theme: string|Theme = "default", 
              gridPercentX = .9, 
              gridPercentY = .9, 
              startX = -50,
              endX = 50,
              startY = -50,
              endY = 50) {
    this.canvas = canvas;
    this.cx = canvas.getContext("2d");
    this.tr = transform(canvas, gridPercentX, gridPercentY, startX, endX, startY, endY);
    this.theme = getTheme(theme); 
    this.gridPercentX = gridPercentX;
    this.gridPercentY = gridPercentY;
    this.startX = startX;
    this.endX = endX;
    this.startY = startY;
    this.endY = endY;
    this.graphedData = {};
  }

  drawGrid(unitsPerTick: number = 10, xAxisLabel: string = '', yAxisLabel: string = ''): void {
    const totalXTicks = (Math.abs(this.startX) + this.endX) / unitsPerTick
    const totalYTicks = (Math.abs(this.startY) + this.endY) / unitsPerTick

    const xAxis = [{x: this.startX, y: 0}, {x: this.endX, y: 0}];
    const yAxis = [{x: 0, y: this.startY}, {x: 0, y: this.endY}];

    this.drawAxis(xAxis, this.theme.axisColor, totalXTicks, xAxisLabel);
    this.drawAxis(yAxis, this.theme.axisColor, totalYTicks, yAxisLabel);
  }

  drawAxis(
    coord: Coordinate[],
    color: string|RGBA,
    tickTotal: number,
    label: string = ''): void {
    const tickLength = this.canvas.width / 200;

    this.drawLine(coord, color, label);
    
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
      
      
      this.drawLine([start, end], color)
    }
  }

  drawLineWithPoints(coords: Coordinate[], radius: number = 1, color: string|RGBA = '', label: string = ''): void {
    this.drawLine(coords, color, label);
    this.drawPoints(coords, radius, color, label);
  }

  drawPoints(points: Coordinate[], radius: number = 1, color: string|RGBA = '', label: string = ''): void {
    if (color === '') color = this.getNextColor();
    for (const point of points) this.drawPoint(point, radius, color);
  }

  drawPoint(point: Coordinate, radius: number = 1, color: string|RGBA = '', label: string = ''): void {
    if (color === '') color = this.getCurrentColor();
    const newPoint = this.tr(point)
    this.cx.beginPath();
    color = colorize(color);
    this.cx.strokeStyle = color;
    this.cx.fillStyle = color;
    this.cx.arc(newPoint.x, newPoint.y, radius, 0, 2 * Math.PI);
    this.cx.fill();
    this.cx.stroke();
  }

  genFn(
    fn: Function, 
    amplitude: number = 1, 
    frequency: number = 1, 
    step: number = 1, 
    label: string = ''): Coordinate[] {
    const yOfX: Coordinate[] = [];
    for (let x = this.startX; x < this.endX; x += step) {
      yOfX.push({x: x, 
                 y: fn(x / frequency) * amplitude});
    }
    return yOfX;
  }

  transformAll(
    coords: Coordinate[],
    ): Coordinate[] {
    return coords.map(coord => this.tr(coord));
  }

  drawBezier(
    coords: Coordinate[],
    color: string|RGBA = '',
    weight: number = 5,
    label: string = ''): void {
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

  

  drawLine(
    coords: Coordinate[],
    color: string|RGBA = ''
    label: string = ''): void {
    if (color === '') color = this.getNextColor();
    const trCoords = this.transformAll(coords);
    this.cx.strokeStyle = colorize(color);
    this.cx.beginPath();
    this.cx.moveTo(trCoords[0].x, trCoords[0].y);
    for (const coord of trCoords) {
      this.cx.lineTo(coord.x, coord.y);
    }
    this.cx.stroke();
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

  trackPos(event) {
    // console.log(event.y);
  }

  getCurrentColor(): string {
    return RGBAtoString(this.theme.colors[this.theme.lastColorIndex])
  }

  getNextColor(): string {
    if (this.theme.lastColorIndex >= this.theme.colors.length) this.theme.lastColorIndex = 0;
    const nextColor = RGBAtoString(this.theme.colors[this.theme.lastColorIndex])
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
  percentX: number,
  percentY: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number): Function {
  
  return function (c: Coordinate): Coordinate {
    let gridX = (c.x + Math.abs(minX)) / (Math.abs(minX) + maxX) * canvas.width;
    let graphX = gridX * percentX + (canvas.width * (1 - percentX)) / 2;

    let gridY = (c.y + Math.abs(minY)) / (Math.abs(minY) + maxY) * canvas.height;
    let graphY = gridY * percentY + (canvas.height * (1 - percentY)) / 2;
    let globalY = canvas.height - graphY;

    return { x: graphX, y: globalY };
  }
}

function colorize(color: string|RGBA): string {
  if (color instanceof Object) return RGBAtoString(color);
  else return color;
}

function RGBAtoString(color: RGBA): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`
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
    backgroundColor: {r: 202, g: 0, b: 0, a: 1},
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
  }
]