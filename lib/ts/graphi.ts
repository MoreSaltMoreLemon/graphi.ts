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

  drawGrid(unitsPerTick: number = 10): void {
    const totalXTicks = (this.startX + this.endX) / unitsPerTick
    const xAxis = [{x: this.startX, y: 0}, {x: this.endX, y: 0}];
    const yAxis = [{x: 0, y: this.startY}, {x: 0, y: this.endY}];
    this.drawAxis(xAxis, this.theme.axisColor, 10, 10);
    this.drawAxis(yAxis, this.theme.axisColor, 10, 10);
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

  drawPoints(points: Coordinate[], radius: number, color: string): void {
    for (const point of points) this.drawPoint(point, radius, color);
  }

  drawPoint(point: Coordinate, radius: number, color: string = ''): void {
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
    amplitude: number, 
    frequency: number, 
    step: number): Coordinate[] {
    const yOfX: Coordinate[] = [];
    for (let x = this.startX; x < this.endX; x += step) {
      yOfX.push({x: x, 
                 y: fn(x / frequency) * amplitude});
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
    return coords.map(coord => this.tr(coord));
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
    let globalY = canvas.height - gridY;

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