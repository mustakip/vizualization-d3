const chartSize = { width: 1000, height: 600 };
const margin = { left: 100, right: 10, top: 20, bottom: 150 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;
const initChart = () => {
  const svg = d3
    .select("#chart-area svg")
    .attr("height", chartSize.height)
    .attr("width", chartSize.width);
  const g = svg
    .append("g")
    .attr("class", "nifty")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - margin.top);
  g.append("text")
    .attr("class", "y axis-label")
    .attr("x", -(height / 2))
    .attr("y", -60);
  g.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${height})`);
  g.append("g").attr("class", "y axis");
};
const updateChart = (equity, fieldName) => {
  const firstDate = new Date(_.first(equity).Date);
  const lastDate = new Date(_.last(equity).Date);
  const svg = d3.select("#chart-area svg .nifty");
  const minDomain = Math.min(
    _.minBy(equity, fieldName)[fieldName],
    _.minBy(equity, "Average")["Average"]
  );
  const maxDomain = Math.max(
    _.maxBy(equity, fieldName)[fieldName],
    _.maxBy(equity, "Average")["Average"]
  );
  svg.selectAll("path").remove();
  const y = d3
    .scaleLinear()
    .domain([minDomain, maxDomain])
    .range([height, 0]);
  svg.select(".y.axis-label").text(fieldName);
  svg.select(".x.axis-label").text("Year");
  const yAxis = d3
    .axisLeft(y)
    .ticks(10)
    .tickFormat(y(equity[fieldName]));
  svg.select(".y.axis").call(yAxis);
  const x = d3
    .scaleTime()
    .domain([firstDate, lastDate])
    .range([0, width]);
  const xAxis = d3.axisBottom(x);
  svg.select(".x.axis").call(xAxis);
  const line = field =>
    d3
      .line()
      .x(q => x(new Date(q.Date)))
      .y(q => y(q[field]));
  svg
    .append("path")
    .attr("class", "close")
    .attr("d", line(fieldName)(equity));
  svg
    .append("path")
    .attr("class", "average")
    .attr("d", line("Average")(equity));
};
const findAverage = data => {
  let sum = data.reduce(
    (x, y) => {
      return { Close: x.Close + y.Close };
    },
    { Close: 0 }
  ).Close;
  return Math.round(sum / data.length);
};
const rangeSlider = equity => {
  const slider = createD3RangeSlider(0, equity.length, "#slider-container");
  slider.range(0, 500);
  slider.onChange(newRange => {
    const firstDate = equity[newRange.begin].Date;
    const lastDate = equity[newRange.end - 1].Date;
    d3.select("#range-label").text(firstDate + " - " + lastDate);
    updateChart(equity.slice(newRange.begin, newRange.end), "Close");
  });
};
const analyseData = data => {
  data.forEach((d, i) => {
    let startingIndex = 0;
    if (i >= 100) startingIndex = i - 99;
    d.Average = findAverage(data.slice(startingIndex, ++i));
  });
  return data;
};

const positions = {
  LONG: "LONG",
  SHORT: "SHORT",
  NEUTRAL: "NEUTRAL"
};

const recordTransactions = quotes => {
  const market = quotes.reduce(
    (market, quote) => {
      if (quote.Close > quote.Average && market.status != positions.LONG) {
        market.status = positions.LONG;
        market.transactions.push({ buy: quote });
        return market;
      }
      if (quote.Close <= quote.Average && market.status == positions.LONG) {
        market.status = positions.SHORT;
        _.last(market.transactions).sell = quote;
        return market;
      }
      return market;
    },
    { status: positions.NEUTRAL, transactions: [] }
  );
  _.last(market.transactions).sell = _.last(quotes);
  return market.transactions;
};

const tableFormat = transactions => {
  return transactions.map(transaction => {
    return {
      buyingDate: transaction.buy.Date,
      buyingPrice: Math.round(transaction.buy.Close),
      sellingDate: transaction.sell.Date,
      sellingPrice: Math.round(transaction.sell.Close),
      profit: Math.round(transaction.buy.Close - transaction.sell.Close)
    };
  });
};

const createProfitTable = transactions => {
  const table = d3
    .select("#profit-table")
    .append("table")
    .attr(
      "class",
      "objecttable table table-striped table-bordered table-hover"
    );

  const titles = {
    buyingDate: "Buying Date",
    buyingPrice: "Buying Price",
    sellingDate: "Selling Date",
    sellingPrice: "Selling Price",
    profit: "Profit / Loss"
  };

  const headers = table
    .append("thead")
    .append("tr")
    .selectAll("th")
    .data(_.values(titles))
    .enter()
    .append("th")
    .text(t => t);

  const tableFormattedData = tableFormat(transactions);

  const rows = table
    .append("tbody")
    .selectAll("tr")
    .data(tableFormattedData)
    .enter()
    .append("tr");

  rows
    .selectAll("td")
    .data(d => _.keys(titles).map(k => ({ value: d[k], name: k })))
    .enter()
    .append("td")
    .text(d => d.value);
};

const startVisualization = equity => {
  const buySellTransactions = recordTransactions(equity.slice(99));
  createProfitTable(buySellTransactions);
  initChart();
  updateChart(equity, "Close");
  rangeSlider(equity);
};

const parseequity = ({ Date, Volume, AdjClose, ...rest }) => {
  _.forEach(rest, (v, k) => (rest[k] = +v));
  const Time = new this.Date();
  return { Date, ...rest, Time };
};
const main = () => {
  d3.csv("data/nifty.csv", parseequity)
    .then(analyseData)
    .then(startVisualization);
};
window.onload = main;
