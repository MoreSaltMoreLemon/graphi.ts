window.addEventListener("load", main);
function main() {
    let canvas = document.querySelector("canvas");
    let g = new Graphi(canvas);
    g.draw(canvas);
    canvas.addEventListener('mousemove', g.trackPos.bind(g));
    // const toTheCorner = [{x: 0, y: 0}, {x: canvas.width, y: canvas.height}];
    // g.drawLine(toTheCorner, "magenta")
    // const data = [{x: 0, y: 0}, {x: 100, y: 10}, {x: 200, y: 20}, {x: 300, y: 30}]);
    // g.drawLine(data, "blue");
    // const moarData = [{x: 0, y: 0}, {x: 100, y: 100}, {x: 200, y: 200}, {x: 300, y: 300}]);
    // g.drawLine(moarData, "red");
    const singlePoint = { x: 100, y: 100 };
    g.drawPoint(singlePoint, 5, "red");
    const sine = g.genFn(Math.sin, { x: 0, y: 40 }, canvas.width, 100, 50, 15);
    g.drawPoints(sine, 2, "blue");
    g.drawLine(sine, "blue");
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
function naturalLog(x) {
    return Math.log(x);
}
function sahirFn(x) {
    return Math.pow(Math.atan(x), 1 / 3);
}
function trackPos(event) {
    console.log(event.y);
}
