
const g = new Graphi(canvas);

g.axis({
  type: "grid",
  rotation: 0,
  x: "50%",
  y: "50%",
  xColor: "lightgray",
  yColor: "lightblue",
  xOpacity: .9,
  yOpacity: .9,
  xLabel: "2018",
  yLabel: "Tacos Consumed in Kg",
  xUnit: "month",
  yUnit: "kg"
});

g.graphLineFromPoints([[0,0],[20, 20],[25, 60]]);
// g.lineFromPoints([[0,0],[20, 20],[25, 60]]);
g.graph({
  type: "bar",
  data: [
    {
      label: "March",
      value: 123.0,
      unit: "kg",
      color: "red",
      zdepth: 0

    },{
      label: "March",
      value: 17.0,
      unit: "kg",
      color: "blue",
      zdepth: 1
    },{
      label: "April",
      value: 199.53,
      unit: "kg",
      color: rgba(0, 54, 43, 33),
      zdepth: 0
    }
  ]
});

g.graphFunction(Math.sin);
// g.raphFunction(Math.sin);
g.function(Math.sin);
g.graphFunction((x) => Math.sin(x) * 100 + 50);
g.graphFromAPI(url, fn);