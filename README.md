# Graphi.ts.dev

## TypeScript Canvas Grapher
### TODO
[ ] Resizing  
[ ] Axis Labels  
[ ] Styles  
[ ] Legend  
[ ] Popup labels  
[ ] Opacity  
[ ] Negative Axis  
[ ] Points  

##Project Requirements
<!-- * Single Page App -->
* 2 domain minimum: one -< to Many
<!-- * HTML/CSS/JS frontend, rails backend -->
<!-- * use Rails API and page form to generate a resource on backend and display without re-rendering the page. -->
<!-- * no user Authentication -->
<!-- * uses Fetch to load AJAX from Rails APi -->


##Project goals:
* Hosted on AWS EC2
* Graph generator based upon form selections
* Serve up past examples of graphs
* Allow favoriting of past graph examples
* Show past graph examples in order of most liked / newest, etc.
* Generate js needed to display graph
* graphits logo with two colors

* CodeSandbox.io or CodeMirror.net for playground

#Stage 1
<!-- * 1 graph type: line graph -->
<!-- * accepts form inputs  -->
<!-- * we supply data -->
* save user inputs 
<!-- * output JS needed to generate form -->
  <!-- * button copies to clipboard (clipboard.js) -->
<!-- * github link -->
<!-- * home page -->
* user examples page
* documentation page for how to use library
  * MPA: md -> html (Rubygem redcarpet)
* documentation page for library internals
  * MPA: md -> html

#Stage 2
<!-- * more graph types: scatter graphs -->
<!-- * lines with points -->
* labels for graphed stuff and axis
* styling
  * rgb constraints / string
* allowing user data input and save to server

#Stage 3
* hover over points, overlay data
<!-- * curved graph lines using bezier curves -->

#Further Buildout
* more graph types
* refine documentation
<!-- * ability to save image? -->
* ability to pull from api: give url and code needed to extract the relevant information and it will,
on load, pull the data down and display it.

#Graphits changes
* rename offset to padding, ensure values match the rest of the page
  * Stretch: allow multiple unit types, px, %, etc.
* adjustable 0,0 point of graph: quadrant chart


#Graph Types
* L graph
* Sideways T graph
* quadrant
* bar graph
* column
* bubble chart

#Graph Options
* axis labels
* gridlines display
* hover and show data on mouseover
* fill under or above x axis
* position legend
* set position of x and y axis zero points
* axis type: yearly, monthly, hourly
* logarithmic axis


#Day 1 Goals
* RGB color generator