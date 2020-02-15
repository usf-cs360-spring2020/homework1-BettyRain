// location of data file
let csv = 'barchartdata.csv';

// configuration of svg/plot area
let config = {
  'svg': {},
  'margin': {},
  'plot': {}
};

config.svg.height = 450;
config.svg.width = config.svg.height * 1.618; // golden ratio

config.margin.top = 15;
config.margin.right = 10;
config.margin.bottom = 30;
config.margin.left = 10;

config.plot.x = config.margin.left;
config.plot.y = config.margin.top;
config.plot.width = config.svg.width - config.margin.left - config.margin.right;
config.plot.height = config.svg.height - config.margin.top - config.margin.bottom;

// setup svg
let svg = d3.select('body').select('#bar-chart-code');
svg.attr('width', config.svg.width);
svg.attr('height', config.svg.height);

//get data
d3.csv(csv, convertRow).then(buildBars)

// helper method to make translating easier
function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}

// function to convert each row
// we need only two columns for bar chart
function convertRow(row, index) {
  let out = {};
  out.values = []
  out.values.region = ""
  out.values.num = 0

  for (let col in row) {
    switch (col) {
      case 'GEO Region':
        out.values.region = row[col];
        break;

      case 'Passenger Count':
        out.values.num = parseInt(row[col]);
        break;
    }
  }
  return out;
}

function buildBars(data) {
  let svg = d3.select("body").select("#bar-chart-code");
  console.assert(svg.size() == 1);

  // get all of the value objects (with date and value) from the rows
  let values = data.map(d => d.values);
  var merged = Object.values(values.reduce((r, o) => {
    r[o.region] = r[o.region] || {
      region: o.region,
      num: 0
    };
    r[o.region].num += +o.num;
    return r;
  }, {}));

  let countMax = d3.max(merged);

  let min = 0;
  let max = countMax.num;
  if (isNaN(max)) {
    max = 0;
  }
  console.log("count bounds:", [min, max]);

  let margin = {
    top: 15,
    right: 15,
    bottom: 30,
    left: 85
  };

  // now we can calculate how much space we have to plot
  let bounds = svg.node().getBoundingClientRect();
  console.log(bounds.height);
  let plotWidth = bounds.width - margin.right - margin.left;
  let plotHeight = bounds.height - margin.top - margin.bottom;

  let countScale = d3.scaleLinear()
    .domain([min, max])
    .range([plotHeight, 0])
    .nice(); // rounds the domain a bit for nicer output

  let regions = merged.map(d => d.region);
  regions.sort();
  let regionScale = d3.scaleBand()
    .domain(regions) // all region (not using the count here)
    .rangeRound([0, plotWidth])
    .paddingInner(0.23); // space between bars

  let plot = svg.append("g").attr("id", "plot");
  plot.attr("transform", translate(margin.left, margin.top));

  console.assert(plot.size() == 1);

  let xAxis = d3.axisBottom(regionScale);
  let yAxis = d3.axisLeft(countScale);
  yAxis
    .tickFormat(d3.formatPrefix(".0", 1e3))

  let xGroup = plot.append("g").attr("id", "x-axis");
  xGroup.call(xAxis);
  xGroup.attr("transform", translate(0, plotHeight));

  let yGroup = plot.append("g").attr("id", "y-axis");
  yGroup.call(yAxis);


  let pairs = Array.from(merged);

  console.log("pairs:", pairs);
  let bars = plot.selectAll("rect")
    .data(pairs)

  console.log(plotHeight);


  //grid lines before bars
  var gridlines = d3.axisLeft()
    .tickFormat("")
    .tickSize(-plotWidth)
    .scale(countScale);

  svg.append("g")
    .attr("class", "grid")
    .attr("transform", translate(margin.left, margin.top))
    .call(gridlines);

  //bars
  svg.selectAll(".bar")
    .data(pairs)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) {
      return regionScale(d.region) + 88;
    })
    .attr("width", regionScale.bandwidth())
    .attr("y", function(d) {
      return countScale(d.num) + 15;
    })
    .attr("height", function(d) {
      return plotHeight - countScale(d.num);
    });

  // text label for the y axis
  plot.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 10 - margin.left)
    .attr("x", 0 - (plotHeight / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Passenger Number");

  // text label for the x axis
  plot.append("text")
    .attr("transform", translate(plotWidth / 2, 17))
    .style("text-anchor", "middle")
    .text("GEO Region");
}
