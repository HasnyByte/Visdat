// Define region colors for consistency across charts
const regions = [
    {key: "NA_Sales", name: "Amerika Utara", color: "#1565C0"},
    {key: "EU_Sales", name: "Eropa", color: "#7CB342"},
    {key: "JP_Sales", name: "Jepang", color: "#E53935"},
    {key: "Other_Sales", name: "Lainnya", color: "#FFA000"}
];

// Load the CSV data
d3.csv("data/vgsales_clean.csv").then(function(data) {
    // Process data for both charts
    createPieChart(data);
    createStackedBarChart(data);
}).catch(function(error) {
    console.log("Error loading or processing data:", error);
    document.getElementById("pie-chart").innerHTML =
        "<p style='color:red'>Error loading data. Please check if the file 'vgsales_clean.csv' is available.</p>";
    document.getElementById("stacked-chart").innerHTML =
        "<p style='color:red'>Error loading data. Please check if the file 'vgsales_clean.csv' is available.</p>";
});

// Function to create the pie chart
function createPieChart(data) {
    // Aggregate sales by region
    let totalNA = 0;
    let totalEU = 0;
    let totalJP = 0;
    let totalOther = 0;

    data.forEach(d => {
        totalNA += +d.NA_Sales || 0;
        totalEU += +d.EU_Sales || 0;
        totalJP += +d.JP_Sales || 0;
        totalOther += +d.Other_Sales || 0;
    });

    // Create data array for pie chart
    const pieData = [
        { region: "Amerika Utara", sales: totalNA, color: regions[0].color },
        { region: "Eropa", sales: totalEU, color: regions[1].color },
        { region: "Jepang", sales: totalJP, color: regions[2].color },
        { region: "Lainnya", sales: totalOther, color: regions[3].color }
    ];

    // Calculate total for percentage display
    const totalSales = pieData.reduce((sum, d) => sum + d.sales, 0);

    // Set up dimensions
    const width = 750;
    const height = 500;
    const radius = Math.min(width, height) / 2;

    // Create SVG container
    const svg = d3.select("#pie-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Set up pie layout
    const pie = d3.pie()
        .value(d => d.sales)
        .sort(null);

    // Set up arc generator
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius * 0.8);

    // Set up outer arc for labels
    const outerArc = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    // Create pie chart
    const path = svg.selectAll("path")
        .data(pie(pieData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => d.data.color)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("transition", "opacity 0.3s")
        .on("mouseover", function(event, d) {
            // Highlight segment
            d3.select(this)
                .style("opacity", 0.8)
                .attr("stroke-width", 3);

            // Show tooltip
            const percent = (d.data.sales / totalSales * 100).toFixed(1);
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`<strong>${d.data.region}</strong><br>
                          Penjualan: ${d.data.sales.toFixed(2)} juta<br>
                          Persentase: ${percent}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Reset segment
            d3.select(this)
                .style("opacity", 1)
                .attr("stroke-width", 2);

            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add percentage labels
    const text = svg.selectAll("text")
        .data(pie(pieData))
        .enter()
        .append("text")
        .attr("transform", d => {
            const pos = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return `translate(${pos})`;
        })
        .style("text-anchor", d => {
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return midAngle < Math.PI ? "start" : "end";
        })
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(d => {
            const percent = (d.data.sales / totalSales * 100).toFixed(1);
            return `${percent}%`;
        });

    // Add polylines between pie and labels
    const polyline = svg.selectAll("polyline")
        .data(pie(pieData))
        .enter()
        .append("polyline")
        .attr("points", d => {
            const pos = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos];
        })
        .style("fill", "none")
        .style("stroke", "#555")
        .style("stroke-width", 1);

    // Create legend
    const legend = d3.select("#pie-legend");

    pieData.forEach(d => {
        const legendItem = legend.append("div")
            .attr("class", "legend-item");

        legendItem.append("div")
            .attr("class", "legend-color")
            .style("background-color", d.color);

        legendItem.append("div")
            .text(`${d.region}: ${d.sales.toFixed(2)} juta`);
    });
}

// Function to create the stacked bar chart
function createStackedBarChart(data) {
    // Make sure Year is available and in correct format
    data = data.filter(d => d.Year && !isNaN(d.Year) && d.Year !== "N/A" && d.Year !== "");

    // Convert Year to number
    data.forEach(d => {
        d.Year = +d.Year;
        d.NA_Sales = +d.NA_Sales || 0;
        d.EU_Sales = +d.EU_Sales || 0;
        d.JP_Sales = +d.JP_Sales || 0;
        d.Other_Sales = +d.Other_Sales || 0;
    });

    // Group by year and sum sales for each region
    const yearSales = d3.rollup(
        data,
        v => ({
            NA_Sales: d3.sum(v, d => d.NA_Sales),
            EU_Sales: d3.sum(v, d => d.EU_Sales),
            JP_Sales: d3.sum(v, d => d.JP_Sales),
            Other_Sales: d3.sum(v, d => d.Other_Sales)
        }),
        d => d.Year
    );

    // Convert map to array and sort by year
    const yearSalesArray = Array.from(yearSales, ([year, sales]) => ({
        year,
        ...sales
    })).sort((a, b) => a.year - b.year);

    // Filter out extreme outliers or invalid years (keeping reasonable range)
    const filteredData = yearSalesArray.filter(d =>
        d.year >= 1980 && d.year <= 2020
    );

    // Set up the dimensions and margins
    const margin = {top: 40, right: 10, bottom: 90, left: 80};
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#stacked-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Stack the data
    const stack = d3.stack()
        .keys(regions.map(r => r.key))
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const stackedData = stack(filteredData);

    // Create X scale
    const x = d3.scaleBand()
        .domain(filteredData.map(d => d.year))
        .range([0, width])
        .padding(0.1);

    // Create Y scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1]) * 1.1])
        .range([height, 0]);

    // Create color scale
    const color = d3.scaleOrdinal()
        .domain(regions.map(r => r.key))
        .range(regions.map(r => r.color));

    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickValues(x.domain().filter((d, i) => !(i % 5))) // Show every 5th year
        )
        .selectAll("text")
        .attr("transform", "translate(-10,5)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y).ticks(10).tickFormat(d => d + " M"));

    // Create the stacked bars
    svg.append("g")
        .selectAll("g")
        .data(stackedData)
        .enter()
        .append("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.year))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", function(event, d) {
            const regionKey = d3.select(this.parentNode).datum().key;
            const regionName = regions.find(r => r.key === regionKey).name;
            const regionValue = (d[1] - d[0]).toFixed(2);
            const year = d.data.year;
            const total = (d.data.NA_Sales + d.data.EU_Sales + d.data.JP_Sales + d.data.Other_Sales).toFixed(2);
            const percentage = ((regionValue / total) * 100).toFixed(1);

            // Highlight bar segment
            d3.select(this)
                .style("opacity", 0.8)
                .style("stroke", "white")
                .style("stroke-width", 2);

            // Show tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`<strong>${year}: ${regionName}</strong><br>
                          Penjualan: ${regionValue} juta<br>
                          Total tahun ini: ${total} juta<br>
                          Persentase: ${percentage}%`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Reset bar segment
            d3.select(this)
                .style("opacity", 1)
                .style("stroke", "none");

            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add X axis label
    svg.append("text")
        .attr("class", "axis-title")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Tahun");

    // Add Y axis label
    svg.append("text")
        .attr("class", "axis-title")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .text("Penjualan (juta)");

    // Create legend
    const legend = d3.select("#stacked-legend");

    regions.forEach(region => {
        const legendItem = legend.append("div")
            .attr("class", "legend-item");

        legendItem.append("div")
            .attr("class", "legend-color")
            .style("background-color", region.color);

        legendItem.append("div")
            .text(region.name);
    });
}