// Refactored MultiBarChart.js to isolate visualization in #barchart container
(function() {
    const container = d3.select("#barchart");
    if (container.empty()) return;

    const margin = {top: 40, right: 30, bottom: 100, left: 70};
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("font-family", "Arial, sans-serif")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = container
        .append("div")
        .attr("class", "tooltip");

    d3.csv("/data/vgsales_clean.csv").then(data => {
        data.forEach(d => {
            d.NA_Sales = +d.NA_Sales;
            d.EU_Sales = +d.EU_Sales;
            d.JP_Sales = +d.JP_Sales;
            d.Other_Sales = +d.Other_Sales;
        });

        const regions = ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"];

        const topGamesByRegion = {};
        regions.forEach(region => {
            topGamesByRegion[region] = data
                .filter(d => d[region] > 0)
                .sort((a, b) => b[region] - a[region])
                .slice(0, 5)
                .map(d => ({name: d.Name, sales: d[region]}));
        });

        const gameSet = new Set();
        regions.forEach(region => {
            topGamesByRegion[region].forEach(d => gameSet.add(d.name));
        });
        const games = Array.from(gameSet);

        const chartData = [];
        games.forEach(game => {
            regions.forEach(region => {
                const gameData = topGamesByRegion[region].find(d => d.name === game);
                chartData.push({
                    game: game,
                    region: region,
                    sales: gameData ? gameData.sales : 0
                });
            });
        });

        const x0 = d3.scaleBand()
            .domain(games)
            .range([0, width])
            .paddingInner(0.1);

        const x1 = d3.scaleBand()
            .domain(regions)
            .range([0, x0.bandwidth()])
            .padding(0.05);

        const y = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.sales)]).nice()
            .range([height, 0]);

        const color = d3.scaleOrdinal()
            .domain(regions)
            .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + 80)
            .text("Game");

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -10)
            .text("Sales (millions)");

        const gameGroups = svg.selectAll(".gameGroup")
            .data(games)
            .enter()
            .append("g")
            .attr("class", "gameGroup")
            .attr("transform", d => `translate(${x0(d)},0)`);

        gameGroups.selectAll("rect")
            .data(game => chartData.filter(d => d.game === game))
            .enter()
            .append("rect")
            .attr("x", d => x1(d.region))
            .attr("y", d => y(d.sales))
            .attr("width", x1.bandwidth())
            .attr("height", d => height - y(d.sales))
            .attr("fill", d => color(d.region))
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(`Game: ${d.game}<br>Region: ${d.region.replace('_Sales', '')}<br>Sales: ${d.sales}M`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });

        const legend = svg.append("g")
            .attr("transform", `translate(${width - 120}, 0)`);

        regions.forEach((region, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", color(region));

            legendRow.append("text")
                .attr("x", 20)
                .attr("y", 12)
                .text(region.replace('_Sales', ''))
                .attr("font-size", "12px")
                .attr("fill", "#000");
        });
    }).catch(error => {
        console.error("Error loading or parsing data:", error);
        container.append("p").text("Failed to load data.");
    });
})();
