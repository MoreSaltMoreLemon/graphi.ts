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
  cv: Function;
  gra: Function;
  gri: Function;
  theme: Theme;
  graphedData: {};

  constructor(canvas: HTMLCanvasElement, 
              theme: string|Theme = "default", 
              gridPercentX = .9, 
              gridPercentY = .9, 
              maxX = 30,
              maxY = 30,
              minX = 30,
              minY = 30) {
    this.canvas = canvas;
    this.cx = canvas.getContext("2d");
    this.cv = globalCoord(canvas);
    this.gra = graphCoord(canvas, this.cv, gridPercentX, gridPercentY);
    this.gri = gridCoord(this.gra, maxX, maxY, minX, minY);
    this.theme = getTheme(theme); 
    this.graphedData = {};
  }

  drawGrid(xPercent: number = 0, yPercent: number = 0): void {
    const height = this.canvas.height;
    const width = this.canvas.width;
    const xAxis = [{x: 0, y: height * xPercent}, {x: width, y: height * xPercent}];
    const yAxis = [{x: width * yPercent, y: 0}, {x: width * yPercent, y: height}];
    console.log("width", width, xPercent)
    console.log("height", height, yPercent)
    this.drawAxis(xAxis, this.theme.axisColor, 10, 10);
    this.drawAxis(yAxis, this.theme.axisColor, 10, 10);
  }


  drawPoints(points: Coordinate[], radius: number, color: string): void {
    for (const point of points) this.drawPoint(point, radius, color);
  }

  drawPoint(point: Coordinate, radius: number, color: string = ''): void {
    if (color === '') color = this.getCurrentColor();
    const newPoint = this.gri(point)
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
    start: Coordinate, 
    end: number, 
    amplitude: number, 
    frequency: number, 
    step: number): Coordinate[] {
    const yOfX: Coordinate[] = [];
    for (; start.x < end; start.x += step) {
      yOfX.push(
        {x: start.x, 
          y: fn(start.x / frequency) * amplitude + start.y});
    }
    return yOfX;
  }

  genSine(
      start: Coordinate, 
      end: number, 
      amplitude: number, 
      frequency: number, 
      step: number): Coordinate[] {
    const sine: Coordinate[] = [];
    for (; start.x < end; start.x += step) {
      sine.push(
        {x: start.x, 
        y: Math.sin(start.x / frequency) * amplitude + start.y});
    }
    return sine;
  }

  transformAll(
    coords: Coordinate[],
    ): Coordinate[] {
    return coords.map(coord => this.gri(coord));
  }

  drawLine(
    coords: Coordinate[],
    color: string|RGBA = ''
    ): void {
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

  drawAxis(
    coord: Coordinate[],
    color: string|RGBA,
    tickTotal: number,
    tickLength: number
  ): void {
    this.drawLine(coord, color);
    
    const hyp = this.hypotenuse(coord[0], coord[1]);
    const angle = this.angleOfVector(coord[0], coord[1]);

    const isVertical = this.approxEqual(angle, 1.5707963267948966);
    
    const tickSpace = this.endOfVector({x: 0, y: 0}, angle, (hyp / tickTotal));
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
      
      // console.log("THE TICK", start, end);
      this.drawLine([start, end], color)
    }
  }

  approxEqual(n1: number, n2: number, epsilon: number = 0.0001): boolean {
    return Math.abs(n1 - n2) < epsilon;
  }

  hypotenuse(root: Coordinate, end: Coordinate): number {
    return Math.hypot(end.x - root.x, end.y - root.y);
  }

  endOfVector(root: Coordinate, angle: number, hypotenuse: number): Coordinate {
    const opposite = Math.sin(angle) * hypotenuse;
    const adjacent = Math.cos(angle) * hypotenuse;
    
    return { x: root.x + adjacent, y: root.y + opposite };;
  }

  angleOfVector(root: Coordinate, end: Coordinate): number {
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

// this.canvas = canvas;
// this.cx = canvas.getContext("2d");
// this.cv = globalCoord(canvas);
// this.gra = graphCoord(canvas, this.cv, gridPercentX, gridPercentY);
// this.gri = gridCoord(this.gra, maxX, maxY, minX, minY);

function globalCoord(canvas: HTMLCanvasElement) {
  return function (coord: Coordinate): Coordinate {
    const globalSpace = {x: coord.x, y: canvas.height - coord.y}
    console.log("GLOBAL: ", globalSpace);
    return globalSpace;
  };
}

function graphCoord(canvas: HTMLCanvasElement,
                    globalCoordFn: Function,
                    percentX: number,
                    percentY: number): Coordinate {
  return function (coord: Coordinate): Coordinate {
    const graphSpace = {x: coord.x + ((canvas.width * (1 - percentX)) / 2), 
                        y: coord.y + ((canvas.height * (1 - percentY)) / 2)}
    console.log("GRAPH: ", graphSpace);
    return globalCoordFn(graphSpace);
  }
}

function gridCoord(graphCoordFn: Function,
                   maxX: number,
                   maxY: number,
                   minX: number,
                   minY: number): Coordinate {
  return function (coord: Coordinate): Coordinate {
    const totalWidth = Math.abs(minX) + maxX;
    const totalHeight = Math.abs(minY) + maxY;
    const offsetX = Math.abs(minX);
    const offsetY = Math.abs(minY);
    console.log("StartCoord: ", coord);
    const gridSpace = {x: (coord.x + offsetX) / totalWidth, 
                       y: (coord.y + offsetY) / totalHeight}
    console.log("GRID: ", gridSpace);
    return graphCoordFn(gridSpace);
  }
}

function absoluteCoordOffset(
  canvas: HTMLCanvasElement, 
  offsetX: number, offsetY: number, 
  scaleX: number, scaleY: number): Function {

  return (coord: Coordinate): Coordinate => {

    return {x: (coord.x * scaleX) + (canvas.width * offsetX), 
            y: (canvas.height - ((coord.y * scaleY) + (canvas.height * offsetY)))};
  }
}

function relativeCoordOffset(
  canvas: HTMLCanvasElement, 
  offsetX: number, offsetY: number, 
  scaleX: number, scaleY: number): Function {

  return (coord: Coordinate): Coordinate => {
    return {x: (coord.x * scaleX) + (canvas.width * offsetX), 
            y: (canvas.height - ((coord.y * scaleY) + (canvas.height * offsetY)))};
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