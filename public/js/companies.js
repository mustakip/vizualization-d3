const formats = {
    Rs: d => `${d} ₹`,
    kCrRs: d => `${d / 1000}k Cr ₹`,
    Percent: d => `${d}%`
};
const chartSize = { width: 800, height: 600 };
const margin = {
    left: 100,
    right: 10,
    top: 10,
    bottom: 150
}
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;
const configs = [['CMP', formats.Rs], ['MarketCap', formats.kCrRs], ['PE'], ['DivYld', formats.Percent], ['ROCE', formats.Percent]];

const drawCompanies = function(companies) {
  const toLine = b => `<strong>${b.Name}</strong> <i>${b.CMP}</i>`;
  document.querySelector("#chart-data").innerHTML = companies
    .map(toLine)
    .join("<hr/>");

  const svg = d3
    .select("#chart-area")
    .append("svg")
    .attr("width", chartSize.width)
    .attr("height", chartSize.height);

  g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .text("Companies");

  g.append("text")
    .attr("class", "y axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .text("CMP (₹)");

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
    .attr("class", "y axis")
    .call(yAxis);

  const xAxis = d3.axisBottom(x);

  g.append("g")
    .call(xAxis)
    .attr("class", "x axis")
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
    .attr("fill", b => c(b.Name));
};

const updateChart = (companies, step = 0) => {
    const [fieldName, format] = configs[step % configs.length];
    const svg = d3.select('#chart-area svg');
    const y = d3.scaleLinear()
        .domain([0, _.maxBy(companies, fieldName)[fieldName]])
        .range([height, 0]);
    svg.select('.y.axis-label').text(fieldName);
    const yAxis = d3.axisLeft(y)
        .ticks(10)
        .tickFormat(format);
    svg.select('.y.axis').call(yAxis);
    svg.selectAll('g rect').data(companies)
        .transition().duration(2000).ease(d3.easeLinear)
        .attr('height', b => y(0) - y(b[fieldName]))
        .attr('y', b => y(b[fieldName]))
}
const startVisualization = (companies) => {
    let step = 1;
    drawCompanies(companies);
    setInterval(() => updateChart(companies, step++), 3000);
}

const main = function() {
  d3.csv("data/companies.csv", function({ Name, ...numerics }) {
    _.forEach(numerics, (v, k) => (numerics[k] = +v));
    return { Name, ...numerics };
  }).then(startVisualization);
};



window.onload = main;

const foo = function() {
  console.log("hello");
};
