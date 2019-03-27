"use strict";
window.addEventListener("load", main);
function main() {
    let canvas = document.querySelector("canvas");
    let g = new Graphi(canvas);
    const toTheCorner = [{ x: 0, y: 0 }, { x: 30, y: 30 }];
    g.drawLine(toTheCorner, "magenta");
    g.drawGrid();
    // canvas.addEventListener('mousemove', g.trackPos.bind(g));
    const data = [{ x: 0, y: 0 }, { x: 100, y: 10 }, { x: 200, y: 20 }, { x: 300, y: 30 }];
    g.drawLine(data, "blue");
    // const moarData = [{x: 0, y: 0}, {x: 100, y: 100}, {x: 200, y: 200}, {x: 300, y: 300}];
    // g.drawLine(moarData, "red");
    // const singlePoint = {x: 100, y: 100};
    // g.drawPoint(singlePoint, 5);
    const sine = g.genFn(Math.sin, 10, 1, .1);
    // g.drawPoints(sine, 2);
    g.drawLine(sine);
    // const cos = g.genFn(Math.cos, {x: 0, y: 40}, canvas.width, 100, 50, 20));
    // g.drawLine(cos);
    // const tan = g.genFn(Math.tan, {x: 0, y: 40}, canvas.width, 100, 50, 20));
    // g.drawLine(tan);
    // const sahir = g.genFn(sahirFn, {x: 0, y: 40}, canvas.width, 100, 50, 1));
    // g.drawLine(sahir);
    // const natLog = g.genFn(naturalLog, {x: 0, y: 40}, canvas.width, 100, 50, 1));
    // g.drawLine(natLog);
    // setInterval(() => drawWithResize(canvas), 100)
}
// function naturalLog(x: number): number {
//   return Math.log(x);
// }
// function sahirFn(x: number): number {
//   return Math.pow(Math.atan(x), 1 / 3);
// }
// function trackPos(event) {
//   console.log(event.y);
// }
