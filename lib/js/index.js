"use strict";
window.addEventListener("load", main);
function main() {
    let canvas = document.querySelector("canvas");
    let g = new Graphi(canvas, "default", .95, .95, -50, 200, -50, 200);
    const toTheCorner = [{ x: 0, y: 0 }, { x: 30, y: 30 }];
    g.drawLine(toTheCorner, "magenta");
    g.drawGrid();
    const data = [{ x: 0, y: 0 }, { x: 100, y: 10 }, { x: 200, y: 20 }, { x: 300, y: 30 }];
    g.drawLine(data, "blue");
    const moarData = [{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 200, y: 200 }, { x: 300, y: 300 }];
    g.drawLine(moarData, "red");
    const singlePoint = { x: 100, y: 100 };
    g.drawPoint(singlePoint);
    const sine = g.genFn(Math.sin, 10, 1, .1);
    g.drawPoints(sine);
    g.drawLine(sine);
    const cos = g.genFn(Math.cos, 20, 5, .2);
    g.drawLine(cos);
    const tan = g.genFn(Math.tan, 10, 5, .1);
    g.drawLine(tan);
    const sahir = g.genFn(sahirFn, 20, 10, 1);
    g.drawLine(sahir);
    const natLog = g.genFn(naturalLog, 20, 5, 1);
    g.drawLine(natLog);
}
function naturalLog(x) {
    return Math.log(x);
}
function sahirFn(x) {
    return Math.pow(Math.atan(x), 1 / 3);
}
function trackPos(event) {
    console.log(event.y);
}
