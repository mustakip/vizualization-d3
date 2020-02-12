const drawCompanies = function(companies) {
  const toLine = b => `<strong>${b.Name}</strong> <i>${b.CMP}</i>`;
  document.querySelector("#chart-data").innerHTML = companies
    .map(toLine)
    .join("<hr/>");

  const chartSize = { width: 600, height: 400 };
  const margin = {
    right: 10,
    left: 100,
    top: 10,
    bottom: 150
  };
  const width = chartSize.width - margin.left - margin.right;
  const height = chartSize.height - margin.top - margin.bottom;

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", chartSize.width)
    .attr("height", chartSize.height);

  g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .text("Companies");

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .text("CMP (Rs)");

  y = d3
    .scaleLinear()
    .domain([0, _.maxBy(companies, b => b.CMP).CMP])
    .range([height, 0]);

  x = d3
    .scaleBand()
    .range([0, width])
    .domain(_.map(companies, "Name"))
    .padding(0.3);

  yAxis = d3
    .axisLeft(y)
    .tickFormat(d => `${d}m`)
    .ticks(5);

  g.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

  const xAxis = d3.axisBottom(x);

  g.append("g")
    .call(xAxis)
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`);

  g.selectAll(".x-axis text")
    .attr("transform", "rotate(-45)")
    .attr("x", -5)
    .attr("y", 10);

  const rects = g.selectAll("rect").data(companies);
  const newRects = rects.enter().append("rect");

  const c = d3.scaleOrdinal(d3.schemeDark2);

  newRects
    .attr("y", b => y(b.CMP))
    .attr("x", b => x(b.Name))
    .attr("width", x.bandwidth)
    .attr("height", b => y(0) - y(b.CMP))
    .attr("fill", (b) => c(b.Name));
};

const main = function() {
  d3.csv("data/companies.csv", function({ Name, ...numerics }) {
    _.forEach(numerics, (v, k) => (numerics[k] = +v));
    return { Name, ...numerics};
  }).then(drawCompanies);
};

window.onload = main;
