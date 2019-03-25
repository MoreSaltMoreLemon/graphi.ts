interface Coordinate {
  x: number;
  y: number;
}

class Graphi {
  canvas: any;
  cx: CanvasRenderingContext2D;
  tr: Function;
  colorsInUse: string[]
  graphedData: {}

  constructor(canvas: any, offsetX = .1, offsetY = .1, scaleX = .5, scaleY = .5) {
    this.canvas = canvas;
    this.cx = canvas.getContext("2d");
    this.tr = this.absoluteCoordOffset(canvas, offsetX, offsetY, .5, .5);
    this.colorsInUse = [];
    this.graphedData = {};
  }


  draw(canvas: HTMLCanvasElement): void {
    const xAxis = [{x: 0, y: 0}, {x: this.canvas.width, y: 0}];
    const yAxis = [{x: 0, y: 0}, {x: 0, y: this.canvas.height}];
    this.drawAxis(xAxis, "grey", 10, 10);
    this.drawAxis(yAxis, "grey", 10, 10);
  }

  drawPoints(points: Coordinate[], radius: number, color: string): void {
    for (const point of points) this.drawPoint(point, radius, color);
  }

  drawPoint(point: Coordinate, radius: number, color: string): void {
    const newPoint = this.tr(point)
    this.cx.beginPath();
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
    return coords.map(coord => this.tr(coord));
  }

  drawLine(
    coords: Coordinate[],
    color: string = ''
    ): void {
    if (color === '') color = this.randomColorSelector();
    const trCoords = this.transformAll(coords);
    this.cx.strokeStyle = color;
    this.cx.beginPath();
    this.cx.moveTo(trCoords[0].x, trCoords[0].y);
    for (const coord of trCoords) {
      this.cx.lineTo(coord.x, coord.y);
    }
    this.cx.stroke();
  }

  drawAxis(
    coord: Coordinate[],
    color: string,
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
  randomColorSelector(): string {
    const colors = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"];
    let color = colors[Math.floor(Math.random() * colors.length)]
    while (this.colorsInUse.includes(color)) {
      color = colors[Math.floor(Math.random() * colors.length)];
    }
    this.colorsInUse.push(color);
    return color;
  }


  absoluteCoordOffset(
    canvas: HTMLCanvasElement, 
    offsetX: number, offsetY: number, 
    scaleX: number, scaleY: number): Function {

    return (coord: Coordinate): Coordinate => {
      return {x: (coord.x * scaleX) + (canvas.width * offsetX), 
              y: (canvas.height - ((coord.y * scaleY) + (canvas.height * offsetY)))};
    }
  }

  relativeCoordOffset(
    canvas: HTMLCanvasElement, 
    offsetX: number, offsetY: number, 
    scaleX: number, scaleY: number): Function {

    return (coord: Coordinate): Coordinate => {
      return {x: (coord.x * scaleX) + (canvas.width * offsetX), 
              y: (canvas.height - ((coord.y * scaleY) + (canvas.height * offsetY)))};
    }
  }

  trackPos(event) {
    console.log(event.y);
  }
}