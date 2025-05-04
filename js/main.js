// Variabel state untuk menyimpan data dan grafik aktif
let data = [];
let activeChart = "lineChart";
let svg, tooltip;

// Inisialisasi setelah halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
    // Setup event listener untuk tombol
    document
        .getElementById("lineChartBtn")
        .addEventListener("click", function () {
            setActiveChart("lineChart");
            this.classList.add("active");
            document.getElementById("barChartBtn").classList.remove("active");
        });

    document
        .getElementById("barChartBtn")
        .addEventListener("click", function () {
            setActiveChart("barChart");
            this.classList.add("active");
            document.getElementById("lineChartBtn").classList.remove("active");
        });

    // Inisialisasi tooltip
    tooltip = d3.select("#tooltip");

    // Muat data dari CSV
    loadData();
});

// Fungsi untuk memuat data dari CSV
function loadData() {
    d3.csv("data/vgsales_clean.csv")
        .then(function (csvData) {
            // Konversi string menjadi angka untuk data numerik
            csvData.forEach((d) => {
                d.Year = +d.Year;
                d.NA_Sales = +d.NA_Sales;
                d.EU_Sales = +d.EU_Sales;
                d.JP_Sales = +d.JP_Sales;
                d.Other_Sales = +d.Other_Sales;
                d.Global_Sales = +d.Global_Sales;
            });

            data = csvData;
            processData();
        })
        .catch((error) => {
            console.error("Error loading CSV:", error);
            showError(
                "Gagal memuat file CSV. Pastikan file vgsales_clean.csv tersedia di folder yang sama dengan file HTML ini."
            );
        });
}

// Fungsi untuk menampilkan pesan error
function showError(message) {
    document.querySelector(".loading").style.display = "none";
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
    document.getElementById("chart-container").appendChild(errorDiv);
}

// Fungsi untuk memproses data
function processData() {
    // Hapus pesan loading
    document.querySelector(".loading").style.display = "none";

    // Render grafik default (Line Chart)
    renderChart();
}

// Fungsi untuk mengatur grafik aktif dan merender ulang
function setActiveChart(chartType) {
    activeChart = chartType;
    renderChart();
}

// Fungsi untuk merender grafik berdasarkan tipe yang aktif
function renderChart() {
    // Bersihkan container grafik
    const container = document.getElementById("chart-container");
    container.innerHTML = "";

    // Buat elemen SVG baru
    svg = d3
        .select("#chart-container")
        .append("svg")
        .attr("width", "80%")
        .attr("height", "80%")
        .attr("display", "flex")
        .attr("justify-content", "center")
        .attr("viewBox", "0 0 900 500");

    // Render berdasarkan tipe grafik yang aktif
    if (activeChart === "lineChart") {
        renderLineChart();
    } else {
        renderBarChart();
    }
}

// Fungsi untuk render Line Chart (Tahun vs Total Penjualan Global)
function renderLineChart() {
    // Filter data dengan tahun yang valid
    const validData = data.filter((d) => d.Year && !isNaN(d.Year));

    // Persiapkan data untuk line chart (agregat penjualan per tahun)
    const yearlyData = d3.rollup(
        validData,
        (v) => d3.sum(v, (d) => d.Global_Sales),
        (d) => d.Year
    );

    const lineData = Array.from(yearlyData, ([year, sales]) => ({
        year,
        sales,
    })).sort((a, b) => a.year - b.year); // UrutkFan berdasarkan tahun

    // Setup margin dan dimensi
    const margin = { top: 50, right: 50, bottom: 70, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Append grup untuk grafik dengan margin
    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left + 8},${margin.top})`);

    // Setup skala X dan Y
    const xScale = d3
        .scaleLinear()
        .domain(d3.extent(lineData, (d) => d.year))
        .range([0, width]);

    const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(lineData, (d) => d.sales) * 1.1]) // 10% margin atas
        .range([height, 0]);

    // Buat line generator
    const line = d3
        .line()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.sales))
        .curve(d3.curveMonotoneX);

    // Tambahkan sumbu X
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Tambahkan sumbu Y
    g.append("g").call(d3.axisLeft(yScale));

    // Tambahkan label sumbu X
    g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text("Tahun Rilis");

    // Tambahkan label sumbu Y
    g.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left)
        .style("text-anchor", "middle")
        .text("Total Penjualan Global (Juta Unit)");

    // Tambahkan judul
    svg.append("text")
        .attr("x", 450)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Tren Penjualan Game Global Per Tahun");

    // Tambahkan garis
    g.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", "#4CAF50")
        .attr("stroke-width", 3)
        .attr("d", line);

    // Tambahkan titik data
    g.selectAll(".dot")
        .data(lineData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", (d) => yScale(d.sales))
        .attr("r", 5)
        .attr("fill", "#45a049")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("r", 8).attr("fill", "#2E7D32");

            tooltip
                .style("opacity", 1)
                .html(
                    `<strong>Tahun:</strong> ${
                        d.year
                    }<br><strong>Penjualan:</strong> ${d.sales.toFixed(2)} Juta`
                )
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 30 + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("r", 5).attr("fill", "#45a049");

            tooltip.style("opacity", 0);
        });

    // Update keterangan
    document.getElementById(
        "chart-legend"
    ).innerHTML = `Data menunjukkan total penjualan game (dalam juta unit) untuk setiap tahun rilis. Total ${lineData.length} tahun ditampilkan.`;
}

// Fungsi untuk render Bar Chart (Platform vs Total Penjualan)
function renderBarChart() {
    // Persiapkan data untuk bar chart (agregat penjualan per platform)
    const platformData = d3.rollup(
        data,
        (v) => d3.sum(v, (d) => d.Global_Sales),
        (d) => d.Platform
    );

    const barData = Array.from(platformData, ([platform, sales]) => ({
        platform,
        sales,
    })).sort((a, b) => b.sales - a.sales); // Urutkan dari terbesar ke terkecil

    // Setup margin dan dimensi
    const margin = { top: 50, right: 50, bottom: 70, left: 120 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Truncate data jika terlalu banyak (ambil top 15)
    const displayData = barData.slice(0, 15);

    // Append grup untuk grafik dengan margin
    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left - 24},${margin.top - 12})`);

    // Setup skala X dan Y
    const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(displayData, (d) => d.sales) * 1.1]) // 10% margin kanan
        .range([0, width]);

    const yScale = d3
        .scaleBand()
        .domain(displayData.map((d) => d.platform))
        .range([0, height])
        .padding(0.2);

    // Tambahkan sumbu X
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Tambahkan sumbu Y
    g.append("g").call(d3.axisLeft(yScale));

    // Tambahkan label sumbu X
    g.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom + 10)
        .style("text-anchor", "middle")
        .text("Total Penjualan Global (Juta Unit)");

    // Tambahkan label sumbu Y
    g.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 70)
        .style("text-anchor", "middle")
        .text("Platform");

    // Tambahkan judul
    svg.append("text")
        .attr("x", 450)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Total Penjualan Game Per Platform");

    // Tambahkan bar
    g.selectAll(".bar")
        .data(displayData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", (d) => yScale(d.platform))
        .attr("height", yScale.bandwidth())
        .attr("x", 0)
        .attr("width", (d) => xScale(d.sales))
        .attr("fill", "#4CAF50")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "#2E7D32");

            tooltip
                .style("opacity", 1)
                .html(
                    `<strong>Platform:</strong> ${
                        d.platform
                    }<br><strong>Penjualan:</strong> ${d.sales.toFixed(2)} Juta`
                )
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 30 + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "#4CAF50");

            tooltip.style("opacity", 0);
        });

    // Tambahkan label pada bar
    g.selectAll(".bar-label")
        .data(displayData)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", (d) => xScale(d.sales) + 5)
        .attr("y", (d) => yScale(d.platform) + yScale.bandwidth() / 2 + 5)
        .text((d) => d.sales.toFixed(1))
        .style("font-size", "12px")
        .style("fill", "#666");

    // Update keterangan
    document.getElementById(
        "chart-legend"
    ).innerHTML = `Data menunjukkan 15 platform teratas berdasarkan total penjualan game (dalam juta unit) dari total ${barData.length} platform.`;
}

// ====== 3. Genre dengan Total Penjualan Tertinggi ======
function renderGenreChart() {
    const genreData = d3.rollup(
        data,
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Genre
    );

    const chartData = Array.from(genreData, ([genre, sales]) => ({ genre, sales }))
        .sort((a, b) => b.sales - a.sales);

    const svgGenre = d3.select("#chart-container").append("svg")
        .attr("width", 900).attr("height", 500);

    const margin = { top: 50, right: 30, bottom: 70, left: 100 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svgGenre.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.sales) * 1.1])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(chartData.map(d => d.genre))
        .range([0, height])
        .padding(0.2);

    g.append("g").call(d3.axisLeft(yScale));
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.selectAll(".bar")
        .data(chartData)
        .enter()
        .append("rect")
        .attr("y", d => yScale(d.genre))
        .attr("x", 0)
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScale(d.sales))
        .attr("fill", "#FF9800");

    svgGenre.append("text")
        .attr("x", 450).attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Genre dengan Total Penjualan Tertinggi");
}

// ====== 4. Pie Chart Distribusi Penjualan Wilayah ======
function renderPieChart() {
    const total = {
        NA: d3.sum(data, d => d.NA_Sales),
        EU: d3.sum(data, d => d.EU_Sales),
        JP: d3.sum(data, d => d.JP_Sales),
        Other: d3.sum(data, d => d.Other_Sales)
    };

    const pieData = Object.entries(total).map(([region, sales]) => ({ region, sales }));

    const svgPie = d3.select("#chart-container").append("svg")
        .attr("width", 600).attr("height", 500);

    const g = svgPie.append("g").attr("transform", "translate(300,250)");

    const color = d3.scaleOrdinal()
        .domain(pieData.map(d => d.region))
        .range(["#4CAF50", "#2196F3", "#FFC107", "#E91E63"]);

    const pie = d3.pie().value(d => d.sales);
    const arc = d3.arc().innerRadius(0).outerRadius(200);

    g.selectAll("path")
        .data(pie(pieData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.region))
        .on("mouseover", function (event, d) {
            tooltip
                .style("opacity", 1)
                .html(`<strong>${d.data.region}:</strong> ${d.data.sales.toFixed(2)} Juta`)
                .style("left", event.pageX + "px")
                .style("top", event.pageY - 40 + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

    svgPie.append("text")
        .attr("x", 300).attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Distribusi Total Penjualan Berdasarkan Wilayah");
}

// ====== 5. Publisher dengan Penjualan Tertinggi ======
function renderPublisherChart() {
    const publisherData = d3.rollup(
        data,
        v => d3.sum(v, d => d.Global_Sales),
        d => d.Publisher
    );

    const topPublishers = Array.from(publisherData, ([publisher, sales]) => ({ publisher, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 20);

    const svgPub = d3.select("#chart-container").append("svg")
        .attr("width", 900).attr("height", 500);

    const margin = { top: 50, right: 30, bottom: 80, left: 140 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svgPub.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(topPublishers, d => d.sales) * 1.1])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(topPublishers.map(d => d.publisher))
        .range([0, height])
        .padding(0.2);

    g.append("g").call(d3.axisLeft(yScale));
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));

    g.selectAll(".bar")
        .data(topPublishers)
        .enter()
        .append("rect")
        .attr("y", d => yScale(d.publisher))
        .attr("x", 0)
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScale(d.sales))
        .attr("fill", "#9C27B0");

    svgPub.append("text")
        .attr("x", 450).attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .text("20 Publisher dengan Total Penjualan Tertinggi");
}

// ====== 6. Korelasi Tahun dan Penjualan (Scatter Plot) ======
function renderScatterPlot() {
    const scatterData = data.filter(d => !isNaN(d.Year) && !isNaN(d.Global_Sales));

    const svgScatter = d3.select("#chart-container").append("svg")
        .attr("width", 900).attr("height", 500);

    const margin = { top: 50, right: 30, bottom: 70, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svgScatter.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(scatterData, d => d.Year)).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(scatterData, d => d.Global_Sales)]).range([height, 0]);

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    g.append("g").call(d3.axisLeft(y));

    g.selectAll("circle")
        .data(scatterData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Year))
        .attr("cy", d => y(d.Global_Sales))
        .attr("r", 3)
        .attr("fill", "#03A9F4")
        .attr("opacity", 0.6)
        .on("mouseover", function (event, d) {
            tooltip
                .style("opacity", 1)
                .html(`<strong>${d.Name}</strong><br>Tahun: ${d.Year}<br>Penjualan: ${d.Global_Sales.toFixed(2)} Juta`)
                .style("left", event.pageX + "px")
                .style("top", event.pageY - 30 + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

    svgScatter.append("text")
        .attr("x", 450).attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Korelasi Tahun Rilis dan Total Penjualan Game");
}

// ====== 7. Game Terlaris per Wilayah (Grouped Bar) ======
function renderTopGamesByRegion() {
    const topGames = data.sort((a, b) => b.Global_Sales - a.Global_Sales).slice(0, 10);

    const svgGrouped = d3.select("#chart-container").append("svg")
        .attr("width", 1000).attr("height", 500);

    const margin = { top: 60, right: 40, bottom: 100, left: 100 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const regions = ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"];

    const x0 = d3.scaleBand()
        .domain(topGames.map(d => d.Name))
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(regions)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, d3.max(topGames, d => Math.max(d.NA_Sales, d.EU_Sales, d.JP_Sales, d.Other_Sales)) * 1.2])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(regions)
        .range(["#4CAF50", "#2196F3", "#FFC107", "#9C27B0"]);

    const g = svgGrouped.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
        .selectAll("g")
        .data(topGames)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${x0(d.Name)},0)`)
        .selectAll("rect")
        .data(d => regions.map(region => ({ region, value: d[region] })))
        .enter()
        .append("rect")
        .attr("x", d => x1(d.region))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.region));

    g.append("g").call(d3.axisLeft(y));
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svgGrouped.append("text")
        .attr("x", 500).attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .text("10 Game Terlaris Berdasarkan Penjualan per Wilayah");
}

document.getElementById("lineChartBtn").addEventListener("click", () => {
    clearChart();
    renderLineChart();
});

document.getElementById("barChartBtn").addEventListener("click", () => {
    clearChart();
    renderBarChart();
});

document.getElementById("genreChartBtn").addEventListener("click", () => {
    clearChart();
    renderGenreChart();
});

document.getElementById("pieChartBtn").addEventListener("click", () => {
    clearChart();
    renderPieChart();
});

document.getElementById("publisherChartBtn").addEventListener("click", () => {
    clearChart();
    renderPublisherChart();
});

document.getElementById("scatterChartBtn").addEventListener("click", () => {
    clearChart();
    renderScatterChart();
});

document.getElementById("groupedBarChartBtn").addEventListener("click", () => {
    clearChart();
    renderGroupedBarChart();
});
