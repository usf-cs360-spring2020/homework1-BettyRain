// location of data file
let csv = 'fulldata.csv';

// function to convert into date
// try: parseRowDate('197912');
let parseRowDate = d3.timeParse('%Y%m');

// configuration of svg/plot area
let config = {
  'svg': {},
  'margin': {},
  'plot': {}
};

config.svg.height = 450;
config.svg.width = config.svg.height * 1.618; // golden ratio

config.margin.top = 10;
config.margin.right = 10;
config.margin.bottom = 30;
config.margin.left = 10;

config.plot.x = config.margin.left;
config.plot.y = config.margin.top;
config.plot.width = config.svg.width - config.margin.left - config.margin.right;
config.plot.height = config.svg.height - config.margin.top - config.margin.bottom;

// setup svg
let svg = d3.select('body').select('#line-chart');
svg.attr('width', config.svg.width);
svg.attr('height', config.svg.height);


d3.csv(csv, convertRow).then(drawLine)

// function to convert each row
// we need sum of passengers && activity period in days
// https://github.com/d3/d3-fetch/blob/master/README.md#csv
function convertRow(row, index) {
  let out = {};
  out.date = new Date()
  out.num = 0;

  for (let col in row) {
    switch (col) {
      case 'Activity Period':
        out.date = parseRowDate(row[col]);
        break;

      case 'Passenger Count':
        out.num = parseInt(row[col]);
        break;
    }
  }
  return out;
}


function drawLine(inputData) {
  var monthsNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  //count num of pas for each month (combine months)
  let monthly = Object.values(inputData.reduce((r, o) => {
    r[o.date.getMonth()] = r[o.date.getMonth()] || {
      month: monthsNames[o.date.getMonth()],
      num: 0
    };
    r[o.date.getMonth()].num += +o.num;
    return r;
  }, {}));

  let nums = monthly.map(d => d.num);

  let min = 0;
  let max = Math.max(...nums);
  if (isNaN(max)) {
    max = 0;
  }
  console.log("count bounds:", [min, max]);

  let svg = d3.select("body").select("#line-chart");
  console.assert(svg.size() == 1);

  let margin = {
    top: 25,
    right: 15,
    bottom: 30,
    left: 110
  };

  // now we can calculate how much space we have to plot
  let bounds = svg.node().getBoundingClientRect();
  let plotWidth = bounds.width - margin.right - margin.left;
  let plotHeight = bounds.height - margin.top - margin.bottom;

  let countScale = d3.scaleLinear()
    .domain([min, max])
    .range([plotHeight, 0])
    .nice(); // rounds the domain a bit for nicer output

  let months = monthly.map(d => d.month);
  let monthsScale = d3.scaleBand()
    .domain(months) // all region (not using the count here)
    .rangeRound([0, plotWidth])

  let plot = svg.append("g").attr("id", "plot");
  plot.attr("transform", translate(margin.left, margin.top));

  console.assert(plot.size() == 1);

  let xAxis = d3.axisBottom(monthsScale);

  let yAxis = d3.axisLeft(countScale);
  yAxis
    .ticks(5, "f")
    .tickFormat(d3.formatPrefix(".0", 1e6))


  let xGroup = plot.append("g").attr("id", "x-axis");
  xGroup.call(xAxis);
  xGroup.attr("transform", translate(0, plotHeight));

  let yGroup = plot.append("g").attr("id", "y-axis");
  yGroup.call(yAxis);

  let pairs = Array.from(monthly);

  plot.append("path")
    .datum(pairs)
    .attr("fill", "none")
    .attr("stroke", "#FFD700")
    .attr("stroke-width", 2.5)
    .attr("width", monthsScale.bandwidth())
    .attr("height", function(d) {
      return plotHeight - countScale(d.num)
    })
    .attr("d", d3.line()
      .x(function(d) {
        return monthsScale(d.month) + 40
      })
      .y(function(d) {
        return countScale(d.num) + 5
      })
      //.curve(d3.curveMonotoneX)
    )

  // text label for the y axis
  plot.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 5 - margin.left)
    .attr("x", 0 - (plotHeight / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Passenger Number");


  //grid lines
  var gridlines = d3.axisLeft()
    .tickFormat("")
    .tickSize(-plotWidth)
    .scale(countScale)
    .ticks(5, "f");

  svg.append("g")
    .attr("class", "grid")
    .attr("transform", translate(margin.left, margin.top))
    .attr("drawBorder", false)
    .call(gridlines);

}

// helper method to make translating easier
function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}
