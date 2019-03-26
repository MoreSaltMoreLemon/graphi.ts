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