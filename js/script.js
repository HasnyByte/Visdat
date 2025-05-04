const margin = {top: 40, right: 40, bottom: 60, left: 60};
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#scatterplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("font-family", "Arial, sans-serif")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#scatterplot")
    .append("div")
    .attr("class", "tooltip");

d3.csv("/data/vgsales_clean.csv").then(data => {
    // Parse data: convert Year and Global_Sales to numbers
    data.forEach(d => {
        d.Year = +d.Year;
        d.Global_Sales = +d.Global_Sales;
    });

    // Filter out entries with missing or invalid Year or Global_Sales
    const filteredData = data.filter(d => d.Year && d.Global_Sales);

    // Define scales
    const x = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.Year))
        .range([0, width])
        .nice();

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.Global_Sales)])
        .range([height, 0])
        .nice();

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Axis labels
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + 40)
        .text("Release Year");

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -10)
        .text("Global Sales (millions)");

    // Add dots
    svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Year))
        .attr("cy", d => y(d.Global_Sales))
        .attr("r", 4)
        .attr("fill", "#4285F4")
        .attr("opacity", 0.7)
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`Year: ${d.Year}<br>Global Sales: ${d.Global_Sales}M`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });

    // Calculate linear regression for the line
    function linearRegression(data) {
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        data.forEach(d => {
            sumX += d.Year;
            sumY += d.Global_Sales;
            sumXY += d.Year * d.Global_Sales;
            sumXX += d.Year * d.Year;
        });
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        return {slope, intercept};
    }

    const lr = linearRegression(filteredData);

    // Define start and end points for the regression line
    const xStart = d3.min(filteredData, d => d.Year);
    const xEnd = d3.max(filteredData, d => d.Year);
    const yStart = lr.slope * xStart + lr.intercept;
    const yEnd = lr.slope * xEnd + lr.intercept;

    // Add regression line as dashed line
    svg.append("line")
        .attr("x1", x(xStart))
        .attr("y1", y(yStart))
        .attr("x2", x(xEnd))
        .attr("y2", y(yEnd))
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "6,4");
}).catch(error => {
    console.error("Error loading or parsing data:", error);
    d3.select("#scatterplot").append("p").text("Failed to load data.");
});
