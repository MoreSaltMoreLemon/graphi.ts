#Use

Include a copy of `graphi.js` in your scripts.

To use, attach an instance of Graphi to your canvas:
```js
const canvas = document.getElementById('canvas');
const g = new Graphi(canvas);
```

Graphi.ts is a barebones simple graphing tool designed to make doing simple things accessible. We've done the hard work of wrangling the HTML canvas so you won't have to.

Graphi.ts uses a common settings pattern:
```js
const settings = {
  color: "red",
  radius: 2,
  label: "my function"
};

g.drawBezier(coordinates, settings);
```
Coordinates are passed as the first argument, typically as an array of coordinates. Each coordinate is represented as an object literal: `{x: 10, y: 15.6}`.

Coordinates can be easily generated from arrays using a conversion function:
```js
g.convertToCoord([[0, 0], [1, 5], [3, 5]]);
//> [{x: 0, y: 0}, {x: 1, y: 5}, {x: 3, y: 5}]
```
Or generated with based upon any function which accepts a single numeric argument (x) and returns a number (y):
```js
g.genFn(n => n * Math.log2(n));
```
Or you can simply write them by hand:
```js
g.drawLine([{x: 0, y: 0}, {x: 100, y: 100}]);
```

When each function is drawn on the canvas, it is registered with the current instance of Graphi.ts, allowing the canvas to be re-rendered on command:
```js
g.redrawCanvas();
```
You can use this to implement re-sizing. The canvas width itself *must* be equal to the display size in order to allow for correct mouse-over highlighting. Implement an event-handler which will redraw the canvas as the canvas size changes.

###Constructor Settings
```js
{
  theme: "default"|"dark"|"light",
  startX: number,
  endX: number,
  startY: number,
  endY: number
}

// e.g.
const g = new Graphi(canvas, 
                    {theme: myCustomTheme,
                     startX: -200,
                     endX: 500,
                     startY: 0,
                     endY: 500});
```
The grid system allows you to define the lowest value and the highest value. For example a quadrant style grid might range from -50 to 50 on each axis, while another might start at 0 and go to 100.

###Custom Theme Format
```js
{
  name: string,
  backgroundColor: string|{r, g, b, a},
  axisColor: {r, g, b, a},
  colors: [{r, g, b, a}],
  lastColorIndex: 0
}

// e.g.
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
}
```
Graphi uses RGBA internally, represented as an object literal:
```js
{r: 73, g: 93, b: 45, a: 1}
```
But you can also use CSS keyword colors in your theme or as the color input for a particular drawing:
```js
{
  colors: ["aliceblue", "blanchedalmond", "gainsboro"]
}
```

###Grid Settings
```js
{
  unitsPerTick: number,
  xAxisLabel: string,
  yAxisLabel: string
}

// e.g.
g.drawGrid({unitsPerTick: 10, xAxisLabel: "Time", yAxisLabel: "$"});
```

###`drawLine`
The `drawLine()` function will draw a line between a sequential series of coordinates.
```js
// settings
{
  color: string|{r, g, b, a},
  label: string
}

g.drawLine([{x, y}, {x, y}, ...], {color, label});
```

###`drawPoints`
The `drawPoints()` function will take a series of coordinates and render a point at each coordinate.
```js
// settings
{
  radius: number,
  color: string|{r, g, b, a},
  label: string
}

g.drawPoints([{x, y}, {x, y}, ...], {radius, color, label});
```

###`drawLineWithPoints`
From the makers of `drawLine` and `drawPoints` comes a brand new feature! It does exactly what it sounds like.
```js
// settings
{
  radius: number,
  color: string|{r, g, b, a},
  label: string
}

g.drawLineWithPoints([{x, y}, {x, y}, ...], {radius, color, label});
```

###`drawBezier`
Instead of drawing linear segments between points, or drawing a curve by generating coordinates with an increasingly small 