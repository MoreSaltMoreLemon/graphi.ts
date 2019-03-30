#Use

Include a copy of `graphi.js` in your scripts.

To use, attach an instance of Graphi to your canvas:
```js
const canvas = document.getElementById('canvas');
const g = new Graphi(canvas);
```

Graphi.ts is a barebones simple graphing tool designed to make doing simple things accessible. We've done the hard work of wrangling the HTML canvas so you won't have to.

Graphi.ts uses a common options pattern:
```js
const options = {
  color: "red",
  radius: 2,
  label: "my function"
};

g.drawBezier(coordinates, options);
```
Coordinates are passed as the first argument, typically as an array of coordinates. Each coordinate is represented as an object literal: `{x: 10, y: 15.6}`.

Options are optional. You can specify none, some or all, and do so without concern for order.

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

##Configuration

###Constructor Settings
```js
options = {
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
options = {
  name: string,
  backgroundColor: string|{r, g, b},
  axisColor: {r, g, b},
  colors: [{r, g, b}],
  lastColorIndex: 0
}

// e.g.
{
  name: "dark",
  backgroundColor: {r: 31, g: 32, b: 32},
  axisColor: {r: 212, g: 212, b: 206},
  colors: [ {r: 166, g: 226, b: 46}, 
            {r: 174, g: 129, b: 225},
            {r: 249, g: 38, b: 114},
            {r: 102, g: 216, b: 238},
            {r: 226, g: 215, b: 115},
            {r: 196, g: 151, b: 111},
            {r: 156, g: 221, b: 254},
            {r: 245, g: 245, b: 66},
            {r: 30, g: 150, b: 140}],
  lastColorIndex: 0
}
```
Graphi uses RGBA internally, represented as an object literal:
```js
options = {r: 73, g: 93, b: 45}
```
But you can also use CSS keyword colors in your theme or as the color input for a particular drawing:
```js
options = {
  colors: ["aliceblue", "blanchedalmond", "gainsboro"]
}
```

###Grid Settings
```js
options = {
  unitsPerTick: number,
  xAxisLabel: string,
  yAxisLabel: string
}

// e.g.
g.drawGrid({unitsPerTick: 10, xAxisLabel: "Time", yAxisLabel: "$"});
```

##Drawing Methods
###`drawLine`
The `drawLine()` function will draw a line between a sequential series of coordinates.
```js
options = {
  color: string|{r, g, b},
  label: string
}

g.drawLine([{x, y}, {x, y}, ...], {color, label});
```

###`drawPoints`
The `drawPoints()` function will take a series of coordinates and render a point at each coordinate.
```js
options = {
  radius: number,
  color: string|{r, g, b},
  label: string
}

g.drawPoints([{x, y}, {x, y}, ...], {radius, color, label});
```

###`drawLineWithPoints`
From the makers of `drawLine` and `drawPoints` comes a brand new feature! It does exactly what it sounds like.
```js
options = {
  radius: number,
  color: string|{r, g, b},
  label: string
}

g.drawLineWithPoints([{x, y}, {x, y}, ...], {radius, color, label});
```

###`drawBezier`
Instead of drawing linear segments between points, or drawing a curve by generating coordinates with an increasingly small segment length, you can use bezier curves to smoothly transition between points.

Bezier curves have a `weight` property which is used to determine how far from each coordinate a control point is placed. This value can simply be left at `1`, and the bezier will automatically adjust itself.
```js
options = {
  color: string|{r, g, b},
  weight: number,
  label: string
}

g.drawBezier([{x, y}, {x, y}, ...], {color, weight, label});
```

###`genFn`
If you want to generate a series of coordinates from a function which responds to a single numeric input (x) and graph the returned coordinates on the canvas, you can easily do so using the `genFn` method.

```js
options = {
  amplitude: number,
  offset: number,
  step: number
}

const absoluteLinearGraph = g.genFn((x) => Math.abs(x));

// higher resolution curve:
const xSquared = g.genFn(x => x**2 + 5, {step: .1});

// the effect of the equation can be altered using the 
// amplitude and offset options. The following are equivalent:
const sine = g.genFn(x => Math.sin(x), {amplitude: 5, offset: 20});
const sin2 = g.genFn(x => 5 * Math.sin(x) + 5);
```
##Utility Methods

###`redrawCanvas`
If you need to repaint the canvas, simply call the `redrawCanvas()` method:
```js
g.redrawCanvas()
```
This may be needed in the event of CSS resizing where you've altered the proportions of the canvas. The method will take the new CSS sizing and set the canvas element to that size, allowing pixels to be re-rendered at the proper proportion instead of being re-scaled.

###`recalcCoordSystems`
While this shouldn't be a concern, if the mouseover highlighting starts skewing, try running this function after whatever events are causing the funkiness.
```js
g.recaclCoordSystems()
```

###`clearGrid`
Wipes the canvas and redraws the grid only.
```js
g.clearGrid()
```