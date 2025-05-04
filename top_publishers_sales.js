// top_publishers_sales.js
const margin = { top: 40, right: 20, bottom: 70, left: 160 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#bar-chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

d3.csv("vgsales_clean.csv").then(data => {
  // Aggregate total penjualan per Publisher
  const salesByPublisher = d3.rollup(
    data,
    v => d3.sum(v, d => +d.Global_Sales),
    d => d.Publisher
  );

  // Ambil 10 publisher teratas
  const topPublishers = Array.from(salesByPublisher, ([Publisher, Sales]) => ({ Publisher, Sales }))
    .sort((a, b) => d3.descending(a.Sales, b.Sales))
    .slice(0, 10);

  const x = d3.scaleBand()
    .domain(topPublishers.map(d => d.Publisher))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(topPublishers, d => d.Sales)])
    .range([height, 0]);

  svg.append("g")
    .call(d3.axisLeft(y));

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  svg.selectAll(".bar")
    .data(topPublishers)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.Publisher))
    .attr("y", d => y(d.Sales))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.Sales))
    .attr("fill", "#69b3a2")
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`${d.Publisher}<br/>${d.Sales.toFixed(2)} juta unit`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition().duration(300).style("opacity", 0);
    });

  // Axis labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 60)
    .text("Publisher");

    svg.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -90) // Ditambah jaraknya
    .text("Total Penjualan (juta unit)");  
});
