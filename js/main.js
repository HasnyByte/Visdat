// Variabel state untuk menyimpan data dan grafik aktif
let data = [];
let activeChart = "lineChart";
let svg, tooltip;

const colorRed = "#fb4141";
const colorShamrock400 = "#25e2a8";
const colorShamrock500 = "#00dfa2";
const buttonIdList = [
    "lineChartBtn",
    "barChartBtn",
    "barChartGenreSales",
    "barChartTopPublisher",
    "pieChartBtn",
    "scatterPlotBtn",
    "multiBarChartBtn",
];
const regions = [
    { key: "NA_Sales", name: "Amerika Utara", color: "#FB4141" },
    { key: "EU_Sales", name: "Eropa", color: "#FFC145" },
    { key: "JP_Sales", name: "Jepang", color: "#2a9df4" },
    { key: "Other_Sales", name: "Lainnya", color: "#5CB338" },
];

// Inisialisasi setelah halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
    // Setup event listener untuk tombol
    document
        .getElementById("lineChartBtn")
        .addEventListener("click", function () {
            setActiveChart("lineChart");
            this.classList.add("active");

            for (const buttonId of buttonIdList) {
                if (buttonId !== "lineChartBtn") {
                    document
                        .getElementById(buttonId)
                        .classList.remove("active");
                }
            }
        });

    document
        .getElementById("barChartBtn")
        .addEventListener("click", function () {
            setActiveChart("barChart");
            this.classList.add("active");

            for (const buttonId of buttonIdList) {
                if (buttonId !== "barChartBtn") {
                    document
                        .getElementById(buttonId)
                        .classList.remove("active");
                }
            }
        });

    document
        .getElementById("barChartGenreSales")
        .addEventListener("click", function () {
            setActiveChart("barChartGenre");
            this.classList.add("active");

            for (const buttonId of buttonIdList) {
                if (buttonId !== "barChartGenreSales") {
                    document
                        .getElementById(buttonId)
                        .classList.remove("active");
                }
            }
        });

    document
        .getElementById("barChartTopPublisher")
        .addEventListener("click", function () {
            setActiveChart("barChartTopPublish");
            this.classList.add("active");

            for (const buttonId of buttonIdList) {
                if (buttonId !== "barChartTopPublisher") {
                    document
                        .getElementById(buttonId)
                        .classList.remove("active");
                }
            }
        });

    document
        .getElementById("pieChartBtn")
        .addEventListener("click", function () {
            setActiveChart("pieChart");
            this.classList.add("active");

            for (const buttonId of buttonIdList) {
                if (buttonId !== "pieChartBtn") {
                    document
                        .getElementById(buttonId)
                        .classList.remove("active");
                }
            }
        });

    document
        .getElementById("scatterPlotBtn")
        .addEventListener("click", function () {
            setActiveChart("scatterPlot");
            this.classList.add("active");

            for (const buttonId of buttonIdList) {
                if (buttonId !== "scatterPlotBtn") {
                    document
                        .getElementById(buttonId)
                        .classList.remove("active");
                }
            }
        });

    document
        .getElementById("multiBarChartBtn")
        .addEventListener("click", function () {
            setActiveChart("multiBarChart");
            this.classList.add("active");

            for (const buttonId of buttonIdList) {
                if (buttonId !== "multiBarChartBtn") {
                    document
                        .getElementById(buttonId)
                        .classList.remove("active");
                }
            }
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
    errorDiv.className =
        "error-message text-center p-[24px] rounded-[8px] text-[12pt] my-[20px]";
    errorDiv.innerHTML = `Error: ${message}`;
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

// Fungsi untuk memotong teks panjang
function truncateLabel(label, size = 1) {
    return label.split(" ").slice(0, size);
}

// Fungsi untuk merender grafik berdasarkan tipe yang aktif
function renderChart(dataLength = 10, salesSum = 10_000_000) {
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
        .attr("class", "overflow-visible")
        .attr("viewBox", "0 0 900 500");

    // Render berdasarkan tipe grafik yang aktif
    if (activeChart === "lineChart") {
        renderLineChart();
    } else if (activeChart === "barChart") {
        renderBarChart(dataLength);
    } else if (activeChart === "barChartGenre") {
        renderBarChartGameSales(dataLength);
    } else if (activeChart === "barChartTopPublish") {
        renderBarChartTopPublisher(dataLength);
    } else if (activeChart === "pieChart") {
        renderPieChart();
    } else if (activeChart === "scatterPlot") {
        renderScatterPlot(salesSum);
    } else {
        renderMultibarChart(dataLength);
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
    const margin = { top: 72, right: 48, bottom: 72, left: 86 };
    const width = 916 - margin.left - margin.right;
    const height = 486 - margin.top - margin.bottom;

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
        .attr("dy", ".16em")
        .attr("transform", "rotate(-45)");

    // Tambahkan sumbu Y
    g.append("g").call(d3.axisLeft(yScale));

    // Tambahkan label sumbu X
    g.append("text")
        .attr("class", "axis-label text-[10pt] opacity-[0.5]")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 12)
        .style("text-anchor", "middle")
        .text("Tahun Rilis");

    // Tambahkan label sumbu Y
    g.append("text")
        .attr("class", "axis-label text-[10pt] opacity-[0.5]")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left)
        .style("text-anchor", "middle")
        .text("Total Penjualan Global (Juta Unit)");

    // Tambahkan judul
    const chartTitle = document.getElementById("chart-title");
    chartTitle.innerText = "Tren Penjualan Game Global Per Tahun";

    // Membuat path untuk line chart
    const path = g
        .append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", "#FB4141")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Menghitung panjang path
    const totalLength = path.node().getTotalLength();

    // Menambahkan style dan transisi pada path
    path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .attr("opacity", 1)
        .transition()
        .delay(500)
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);

    // Tambahkan titik data
    g.selectAll(".dot")
        .data(lineData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", yScale(0))
        .attr("opacity", 0)
        .attr("r", 5)
        .attr("fill", "#FFC145")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("r", 8);

            tooltip
                .style("opacity", 1)
                .style("font-size", "10pt")
                .html(
                    `Tahun: ${d.year}<br>Penjualan: ${d.sales
                        .toFixed(0)
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                )
                .style("left", event.pageX + 12 + "px")
                .style("top", event.pageY + "px")
                .transition()
                .ease(d3.easeCubicOut)
                .duration(320)
                .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("r", 5);

            tooltip.style("opacity", 0);
        })
        .transition()
        .ease(d3.easeCubicOut)
        .duration(500)
        .attr("cy", (d) => yScale(d.sales))
        .attr("opacity", 1);

    g.selectAll(".dashed-line")
        .data(lineData)
        .enter()
        .append("line")
        .attr("class", "dashed-line")
        .attr("x1", (d) => xScale(d.year))
        .attr("x2", (d) => xScale(d.year))
        .attr("y1", (d) => yScale(d.sales))
        .attr("y2", (d) => yScale(0))
        .attr("stroke", "#FFC145")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 2")
        .attr("opacity", 0)
        .transition()
        .delay(500)
        .duration(500)
        .attr("opacity", 1);

    // Update keterangan
    document.getElementById(
        "chart-legend"
    ).innerHTML = `Data menunjukkan total penjualan game (dalam juta unit) untuk setiap tahun rilis. Total ${lineData.length} tahun ditampilkan.`;
}

// Fungsi untuk render Bar Chart (Platform vs Total Penjualan)
function renderBarChart(dataLength) {
    const optionList = ["5", "10", "15", "20", "25"];
    const chartContainer = document.getElementById("chart-container");
    const optionButton = document.createElement("div");

    optionButton.classList.add(
        "mt-[16px]",
        "flex",
        "flex-row",
        "w-fit",
        "gap-[8px]"
    );
    chartContainer.appendChild(optionButton);

    for (let index = 0; index < optionList.length; index++) {
        const option = document.createElement("button");

        option.id = `option-button-${index + 1}`;
        option.classList.add("option-btn");
        option.textContent = optionList[index];
        option.addEventListener("click", function () {
            renderChart(Number(option.innerText));
        });

        if (option.innerText === `${dataLength}`) {
            option.classList.add("active");
        }

        optionButton.appendChild(option);
    }

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
    const margin = { top: 48, right: 48, bottom: 72, left: 128 };
    const width = 916 - margin.left - margin.right;
    const height = 472 - margin.top - margin.bottom;

    // Truncate data jika terlalu banyak
    const displayData = barData.slice(0, dataLength);

    // Append grup untuk grafik dengan margin
    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left - 32},${margin.top + 8})`);

    g.id = "bar-chart-container";

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
        .attr("dy", ".16em")
        .attr("transform", "rotate(-45)");

    // Tambahkan sumbu Y
    g.append("g").call(d3.axisLeft(yScale));

    // Tambahkan label sumbu X
    g.append("text")
        .attr("class", "axis-label text-[10pt] opacity-[0.5]")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom + 12)
        .style("text-anchor", "middle")
        .text("Total Penjualan Global (Juta Unit)");

    // Tambahkan label sumbu Y
    g.append("text")
        .attr("class", "axis-label text-[10pt] opacity-[0.5]")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 80)
        .style("text-anchor", "middle")
        .text("Platform");

    const chartTitle = document.getElementById("chart-title");
    chartTitle.innerText = "Total Penjualan Game Per Platform";

    // Tambahkan bar
    g.selectAll(".bar")
        .data(displayData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", (d) => yScale(d.platform))
        .attr("height", yScale.bandwidth())
        .attr("x", 0)
        .attr("width", 0)
        .attr("fill", colorShamrock500)
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", colorShamrock400);

            tooltip
                .style("opacity", 1)
                .style("font-size", "10pt")
                .html(
                    `Platform: ${d.platform}<br>Penjualan: ${d.sales
                        .toFixed(0)
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                )
                .style("left", event.pageX + 24 + "px")
                .style("top", event.pageY - 28 + "px")
                .transition()
                .ease(d3.easeCubicOut)
                .duration(320)
                .style("left", event.pageX + 12 + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", colorShamrock500);
            tooltip.style("opacity", 0);
        })
        // Transisi animasi
        .transition()
        .delay((d, i) => i * 100)
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("width", (d) => xScale(d.sales));

    // Tambahkan label pada bar
    g.selectAll(".bar-label")
        .data(displayData)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", 0)
        .attr("y", (d) => yScale(d.platform) + yScale.bandwidth() / 2 + 5)
        .attr("opacity", 0)
        .text((d) =>
            d.sales
                .toFixed(0)
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        )
        .style("font-size", "10pt")
        .transition()
        .delay((d, i) => i * 100)
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("opacity", 1)
        .attr("x", (d) => xScale(d.sales) + 8);

    // Update keterangan
    document.getElementById(
        "chart-legend"
    ).innerHTML = `Data menunjukkan ${dataLength} platform teratas berdasarkan total penjualan game (dalam juta unit) dari total ${barData.length} platform.`;
}

// Fungsi render barchart (Genre vs Penjualan)
function renderBarChartGameSales(dataLength) {
    const optionList = ["2", "4", "6", "8", "10", "12"];
    const chartContainer = document.getElementById("chart-container");
    const optionButton = document.createElement("div");

    optionButton.classList.add(
        "mt-[16px]",
        "flex",
        "flex-row",
        "w-fit",
        "gap-[8px]"
    );
    chartContainer.appendChild(optionButton);

    for (let index = 0; index < optionList.length; index++) {
        const option = document.createElement("button");

        option.id = `option-button-${index + 1}`;
        option.classList.add("option-btn");
        option.textContent = optionList[index];
        option.addEventListener("click", function () {
            renderChart(Number(option.innerText));
        });

        if (option.innerText === `${dataLength}`) {
            option.classList.add("active");
        }

        optionButton.appendChild(option);
    }

    // Persiapkan data untuk bar chart (agregat penjualan per platform)
    const genreData = d3.rollup(
        data,
        (v) => d3.sum(v, (d) => d.Global_Sales),
        (d) => d.Genre
    );

    const barData = Array.from(genreData, ([genre, total]) => ({
        genre,
        total,
    })).sort((a, b) => b.total - a.total);

    // Setup margin dan dimensi
    const margin = { top: 48, right: 48, bottom: 72, left: 116 };
    const width = 916 - margin.left - margin.right;
    const height = 472 - margin.top - margin.bottom;

    // Truncate data jika terlalu banyak
    const displayData = barData.slice(0, dataLength);

    // Append grup untuk grafik dengan margin
    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left - 32},${margin.top + 8})`);

    g.id = "bar-chart-container";

    // Setup skala X dan Y
    const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(displayData, (d) => d.total) * 1.1])
        .range([0, width]);

    const yScale = d3
        .scaleBand()
        .domain(displayData.map((d) => d.genre))
        .range([0, height])
        .padding(0.2);

    // Tambahkan sumbu X
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".16em")
        .attr("transform", "rotate(-45)");

    // Tambahkan sumbu Y
    g.append("g").call(d3.axisLeft(yScale));

    // Tambahkan label sumbu X
    g.append("text")
        .attr("class", "axis-label text-[10pt] opacity-[0.5]")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom + 12)
        .style("text-anchor", "middle")
        .text("Total Penjualan Global (Juta Unit)");

    // Tambahkan label sumbu Y
    g.append("text")
        .attr("class", "axis-label text-[10pt] opacity-[0.5]")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 36)
        .style("text-anchor", "middle")
        .text("Genre");

    const chartTitle = document.getElementById("chart-title");
    chartTitle.innerText = "Total Penjualan Game Per Genre";

    // Tambahkan bar
    g.selectAll(".bar")
        .data(displayData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", (d) => yScale(d.genre))
        .attr("height", yScale.bandwidth())
        .attr("x", 0)
        .attr("width", 0)
        .attr("fill", colorShamrock500)
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", colorShamrock400);

            tooltip
                .style("opacity", 1)
                .style("font-size", "10pt")
                .html(
                    `Genre: ${d.genre}<br>Penjualan: ${d.total
                        .toFixed(0)
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                )
                .style("left", event.pageX + 24 + "px")
                .style("top", event.pageY - 28 + "px")
                .transition()
                .ease(d3.easeCubicOut)
                .duration(320)
                .style("left", event.pageX + 12 + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", colorShamrock500);
            tooltip.style("opacity", 0);
        })
        // Transisi animasi
        .transition()
        .delay((d, i) => i * 100)
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("width", (d) => xScale(d.total));

    // Tambahkan label pada bar
    g.selectAll(".bar-label")
        .data(displayData)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", 0)
        .attr("y", (d) => yScale(d.genre) + yScale.bandwidth() / 2 + 5)
        .attr("opacity", 0)
        .text((d) =>
            d.total
                .toFixed(0)
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        )
        .style("font-size", "10pt")
        .transition()
        .delay((d, i) => i * 100)
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("opacity", 1)
        .attr("x", (d) => xScale(d.total) + 8);

    // Keterangan
    document.getElementById(
        "chart-legend"
    ).innerHTML = `Data menampilkan ${dataLength} genre teratas berdasarkan total penjualan global (dalam juta unit).`;
}

// Fungsi render genre (publishre teratas)
function renderBarChartTopPublisher(dataLength) {
    const optionList = ["5", "10", "15", "20", "25"];
    const chartContainer = document.getElementById("chart-container");
    const optionButton = document.createElement("div");

    optionButton.classList.add(
        "mt-[16px]",
        "flex",
        "flex-row",
        "w-fit",
        "gap-[8px]"
    );
    chartContainer.appendChild(optionButton);

    for (let index = 0; index < optionList.length; index++) {
        const option = document.createElement("button");

        option.id = `option-button-${index + 1}`;
        option.classList.add("option-btn");
        option.textContent = optionList[index];
        option.addEventListener("click", function () {
            renderChart(Number(option.innerText));
        });

        if (option.innerText === `${dataLength}`) {
            option.classList.add("active");
        }

        optionButton.appendChild(option);
    }

    // Persiapkan data untuk bar chart (agregat penjualan per platform)
    const publisherData = d3.rollup(
        data,
        (v) => d3.sum(v, (d) => d.Global_Sales),
        (d) => d.Publisher
    );

    const barData = Array.from(publisherData, ([publisher, total]) => ({
        publisher,
        total,
    })).sort((a, b) => b.total - a.total);

    // Setup margin dan dimensi
    const margin = { top: 48, right: 48, bottom: 72, left: 108 };
    const width = 916 - margin.left - margin.right;
    const height = 472 - margin.top - margin.bottom;

    // Truncate data jika terlalu banyak
    const displayData = barData.slice(0, dataLength);

    // Append grup untuk grafik dengan margin
    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left - 32},${margin.top + 8})`);

    g.id = "bar-chart-container";

    // Setup skala X dan Y
    const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(displayData, (d) => d.total) * 1.1])
        .range([0, width]);

    const yScale = d3
        .scaleBand()
        .domain(displayData.map((d) => d.publisher))
        .range([0, height])
        .padding(0.2);

    const yScaleTruncate = d3
        .scaleBand()
        .domain(displayData.map((d) => truncateLabel(d.publisher)))
        .range([0, height])
        .padding(0.2);

    // Tambahkan sumbu X
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".16em")
        .attr("transform", "rotate(-45)");

    // Tambahkan sumbu Y
    g.append("g").call(d3.axisLeft(yScaleTruncate)).style("width", "20px");

    // Tambahkan label sumbu X
    g.append("text")
        .attr("class", "axis-label text-[10pt] opacity-[0.5]")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom + 12)
        .style("text-anchor", "middle")
        .text("Total Penjualan Global (Juta Unit)");

    // Tambahkan label sumbu Y
    g.append("text")
        .attr("class", "axis-label text-[10pt] opacity-[0.5]")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 32)
        .style("text-anchor", "middle")
        .text("Publisher");

    const chartTitle = document.getElementById("chart-title");
    chartTitle.innerText = "Top Publisher Berdasarkan Total Penjualan Global";

    // Tambahkan bar
    g.selectAll(".bar")
        .data(displayData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", (d) => yScale(d.publisher))
        .attr("height", yScale.bandwidth())
        .attr("x", 0)
        .attr("width", 0)
        .attr("fill", colorShamrock500)
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", colorShamrock400);

            tooltip
                .style("opacity", 1)
                .style("font-size", "10pt")
                .html(
                    `Genre: ${d.publisher}<br>Penjualan: ${d.total
                        .toFixed(0)
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                )
                .style("left", event.pageX + 24 + "px")
                .style("top", event.pageY - 28 + "px")
                .transition()
                .ease(d3.easeCubicOut)
                .duration(320)
                .style("left", event.pageX + 12 + "px");
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", colorShamrock500);
            tooltip.style("opacity", 0);
        })
        // Transisi animasi
        .transition()
        .delay((d, i) => i * 100)
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("width", (d) => xScale(d.total));

    // Tambahkan label pada bar
    g.selectAll(".bar-label")
        .data(displayData)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", 0)
        .attr("y", (d) => yScale(d.publisher) + yScale.bandwidth() / 2 + 5)
        .attr("opacity", 0)
        .text((d) =>
            d.total
                .toFixed(0)
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        )
        .style("font-size", "10pt")
        .transition()
        .delay((d, i) => i * 100)
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("opacity", 1)
        .attr("x", (d) => xScale(d.total) + 8);

    // Keterangan
    document.getElementById(
        "chart-legend"
    ).innerHTML = `Data menampilkan ${dataLength} publisher teratas berdasarkan total penjualan global (dalam juta unit).`;
}

// Function to render a pie chart
function renderPieChart() {
    // Agregasi penjualan berdasarkan region
    let totalNA = 0,
        totalEU = 0,
        totalJP = 0,
        totalOther = 0;

    data.forEach((d) => {
        totalNA += +d.NA_Sales || 0;
        totalEU += +d.EU_Sales || 0;
        totalJP += +d.JP_Sales || 0;
        totalOther += +d.Other_Sales || 0;
    });

    const regionsData = [
        { region: "Amerika Utara", sales: totalNA, color: regions[0].color },
        { region: "Eropa", sales: totalEU, color: regions[1].color },
        { region: "Jepang", sales: totalJP, color: regions[2].color },
        { region: "Lainnya", sales: totalOther, color: regions[3].color },
    ];

    const totalSales = regionsData.reduce((sum, d) => sum + d.sales, 0);

    const width = 900;
    const height = 480;
    const radius = Math.min(width, height) / 2.5;

    // Kosongkan svg sebelum menggambar ulang (hanya elemen pie)
    svg.selectAll("*").remove();

    const pieGroup = svg
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2 + 24})`);

    const pie = d3
        .pie()
        .value((d) => d.sales)
        .sort(null);

    const arc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(radius * 0.8);

    const outerArc = d3
        .arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

    // Pie slices
    pieGroup
        .selectAll("path")
        .data(pie(regionsData))
        .enter()
        .append("path")
        .attr("fill", (d) => d.data.color)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("opacity", 0)
        .on("mouseover", function (event, d) {
            d3.select(this).style("opacity", 0.75).attr("stroke-width", 2);

            const percent = ((d.data.sales / totalSales) * 100).toFixed(2);
            tooltip
                .html(
                    `${d.data.region}<br>
                Penjualan: ${d.data.sales
                    .toFixed(0)
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}<br>
                Persentase: ${percent}%`
                )
                .style("top", event.pageY - 12 + "px")
                .style("opacity", 0)
                .transition()
                .ease(d3.easeCubicOut)
                .duration(320)
                .style("left", event.pageX + 12 + "px")
                .style("top", event.pageY - 28 + "px")
                .style("opacity", 1);
        })
        .on("mouseout", function () {
            d3.select(this).style("opacity", 1).attr("stroke-width", 2);

            tooltip
                .transition()
                .ease(d3.easeCubicOut)
                .duration(320)
                .style("opacity", 0);
        })
        .transition()
        .ease(d3.easeCubicOut)
        .duration(1000)
        .style("opacity", 1)
        .attrTween("d", function (d) {
            const i = d3.interpolate(
                { startAngle: d.startAngle, endAngle: d.startAngle },
                { startAngle: d.startAngle, endAngle: d.endAngle }
            );
            return function (t) {
                return arc(i(t));
            };
        });

    // Labels
    pieGroup
        .selectAll("text")
        .data(pie(regionsData))
        .enter()
        .append("text")
        .attr("transform", (d) => {
            const pos = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return `translate(${pos})`;
        })
        .style("text-anchor", (d) => {
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return midAngle < Math.PI ? "start" : "end";
        })
        .style("font-size", "10pt")
        .style("font-weight", "bold")
        .text((d) => `${((d.data.sales / totalSales) * 100).toFixed(2)}%`);

    // Connecting lines
    pieGroup
        .selectAll("polyline")
        .data(pie(regionsData))
        .enter()
        .append("polyline")
        .attr("points", (d) => {
            const pos = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos];
        })
        .style("fill", "none")
        .style("stroke", "#080808")
        .style("opacity", 0.5)
        .style("stroke-width", 1);

    const chartTitle = document.getElementById("chart-title");
    chartTitle.innerText = "Distribusi Penjualan Berdasarkan Wilayah";

    // Legend
    const legendContainer = document.getElementById("chart-legend");
    legendContainer.innerHTML = "";
    regionsData.forEach((d) => {
        const item = document.createElement("div");
        item.classList.add("legend-item");

        const colorBox = document.createElement("div");
        colorBox.classList.add("legend-color");
        colorBox.style.backgroundColor = d.color;

        const label = document.createElement("div");
        label.textContent = `${d.region}: ${d.sales
            .toFixed(0)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

        item.appendChild(colorBox);
        item.appendChild(label);
        legendContainer.appendChild(item);
    });
}

// Function to render a Scatter plot
function renderScatterPlot(dataLength) {
    const optionList = ["2 Juta", "5 Juta", "10 Juta", "20 Juta"];
    const chartContainer = document.getElementById("chart-container");
    const optionButton = document.createElement("div");

    optionButton.classList.add(
        "mt-[16px]",
        "flex",
        "flex-row",
        "w-fit",
        "gap-[8px]"
    );
    chartContainer.appendChild(optionButton);

    for (let index = 0; index < optionList.length; index++) {
        const option = document.createElement("button");

        option.id = `option-button-${index + 1}`;
        option.classList.add("option-btn");
        option.style = "width: 64px";
        option.textContent = optionList[index];
        option.addEventListener("click", function () {
            let optionInner = option.innerText.split(" ")[0];

            renderChart(0, Number(optionInner) * 1_000_000);
        });

        if (
            Number(optionList[index].split(" ")[0]) * 1_000_000 ===
            dataLength
        ) {
            option.classList.add("active");
        }

        optionButton.appendChild(option);
    }

    const margin = { top: 32, right: -16, bottom: -16, left: 128 };
    const width = 860 - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    const filteredData = [];

    for (let i = 0; i < data.length; i++) {
        const d = data[i];
        if (d.Year && d.Global_Sales && d.Global_Sales <= dataLength) {
            filteredData.push({
                ...d,
                Year: +d.Year,
                Global_Sales: +d.Global_Sales,
            });
        }
    }

    requestAnimationFrame(() => {
        const scaleX = d3
            .scaleLinear()
            .domain(d3.extent(filteredData, (d) => d.Year))
            .range([0, width])
            .nice();

        const scaleY = d3
            .scaleLinear()
            .domain([0, d3.max(filteredData, (d) => d.Global_Sales)])
            .range([height, 0])
            .nice();

        const g = svg
            .append("g")
            .attr(
                "transform",
                `translate(${margin.left - 32},${margin.top + 8})`
            );

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(scaleX).tickFormat(d3.format("d")));

        g.append("g").call(d3.axisLeft(scaleY));

        g.append("text")
            .attr("text-anchor", "end")
            .attr("x", width / 2 + 36)
            .attr("y", height + 48)
            .style("opacity", 0.5)
            .text("Release Year");

        g.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -80)
            .attr("x", height / 2 - 300)
            .style("opacity", 0.5)
            .text("Global Sales (millions)");

        g.selectAll("circle")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("cx", (d) => scaleX(d.Year))
            .attr("cy", (d) => scaleY(0))
            .attr("r", 4)
            .attr("fill", colorShamrock500)
            .attr("opacity", 0.75)
            .on("mouseover", (event, d) => {
                tooltip
                    .style("opacity", 0)
                    .style("top", event.pageY - 12 + "px")
                    .html(`Year: ${d.Year}<br>Global Sales: ${d.Global_Sales.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`)
                    .transition()
                    .ease(d3.easeCubicOut)
                    .duration(320)
                    .style("opacity", 1)
                    .style("left", event.pageX + 12 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", function () {
                d3.select(this).style("opacity", 1).attr("stroke-width", 2);

                tooltip
                    .transition()
                    .ease(d3.easeCubicOut)
                    .duration(320)
                    .style("opacity", 0);
            })
            .transition()
            .ease(d3.easeCubicOut)
            .duration(1000)
            .attr("cy", (d) => scaleY(d.Global_Sales));

        const lr = linearRegression(filteredData);
        const xStart = d3.min(filteredData, (d) => d.Year);
        const xEnd = d3.max(filteredData, (d) => d.Year);
        const yStart = lr.slope * xStart + lr.intercept;
        const yEnd = lr.slope * xEnd + lr.intercept;

        g.append("line")
            .attr("x1", scaleX(xStart))
            .attr("y1", scaleY(yStart))
            .attr("x2", scaleX(xEnd))
            .attr("y2", scaleY(yEnd))
            .attr("stroke", colorRed)
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "6,4");

        const chartTitle = document.getElementById("chart-title");
        chartTitle.innerText = "Korelasi Antara Tahun Rilis dan Penjualan";

        // Keterangan
        document.getElementById(
            "chart-legend"
        ).innerHTML = `Data menampilkan korelasi antara tahun rilis dan total penjualan global (dalam juta unit).`;
    });
}

// Fungsi regresi linear
function linearRegression(data) {
    const n = data.length;
    let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumXX = 0;
    data.forEach((d) => {
        sumX += d.Year;
        sumY += d.Global_Sales;
        sumXY += d.Year * d.Global_Sales;
        sumXX += d.Year * d.Year;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

// Fungsi untuk merende multi bar chart
function renderMultibarChart(dataLength) {
    const optionList = ["2", "4", "6", "8", "10"];
    const chartContainer = document.getElementById("chart-container");
    const optionButton = document.createElement("div");

    optionButton.classList.add(
        "mt-[16px]",
        "flex",
        "flex-row",
        "w-fit",
        "gap-[8px]"
    );
    chartContainer.appendChild(optionButton);

    for (let index = 0; index < optionList.length; index++) {
        const option = document.createElement("button");

        option.id = `option-button-${index + 1}`;
        option.classList.add("option-btn");
        option.textContent = optionList[index];
        option.addEventListener("click", function () {
            renderChart(Number(option.innerText));
        });

        if (option.innerText === String(dataLength)) {
            option.classList.add("active");
        }

        optionButton.appendChild(option);
    }

    // Preprocess data
    data.forEach((d) => {
        d.NA_Sales = +d.NA_Sales;
        d.EU_Sales = +d.EU_Sales;
        d.JP_Sales = +d.JP_Sales;
        d.Other_Sales = +d.Other_Sales;
    });

    const regions = ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"];
    const topGamesByRegion = {};

    regions.forEach((region) => {
        topGamesByRegion[region] = data
            .filter((d) => d[region] > 0)
            .sort((a, b) => b[region] - a[region])
            .slice(0, dataLength)
            .map((d) => ({ name: d.Name, sales: d[region] }));
    });

    const gameSet = new Set();
    regions.forEach((region) => {
        topGamesByRegion[region].forEach((d) => gameSet.add(d.name));
    });
    const games = Array.from(gameSet);

    const chartData = [];
    games.forEach((game) => {
        regions.forEach((region) => {
            const gameData = topGamesByRegion[region].find(
                (d) => d.name === game
            );
            chartData.push({
                game: game,
                region: region,
                sales: gameData ? gameData.sales : 0,
            });
        });
    });

    // Chart dimensions
    const margin = { top: 40, right: 30, bottom: 100, left: 70 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    svg.selectAll("*").remove(); // Clear previous chart

    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x0 = d3.scaleBand().domain(games).range([0, width]).paddingInner(0.1);
    const x01 = d3
        .scaleBand()
        .domain(games.map((g) => truncateLabel(g)))
        .range([0, width])
        .paddingInner(0.1);

    const x1 = d3
        .scaleBand()
        .domain(regions)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3
        .scaleLinear()
        .domain([0, d3.max(chartData, (d) => d.sales)])
        .nice()
        .range([height, 0]);

    const color = d3
        .scaleOrdinal()
        .domain(regions)
        .range(["#FB4141", "#FFC145", "#2a9df4", "#5CB338"]);

    // Axes
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x01))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    g.append("g").call(d3.axisLeft(y));

    // Labels
    g.append("text")
        .attr("text-anchor", "end")
        .attr("x", width / 2)
        .attr("y", height + 64)
        .style("opacity", 0.5)
        .text("Game");

    g.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -78)
        .attr("x", -108)
        .style("opacity", 0.5)
        .text("Sales (millions)");

    // Bars
    const gameGroups = g
        .selectAll(".gameGroup")
        .data(games)
        .enter()
        .append("g")
        .attr("class", "gameGroup")
        .attr("transform", (d) => `translate(${x0(d)},0)`);

    gameGroups
        .selectAll("rect")
        .data((game) => chartData.filter((d) => d.game === game))
        .enter()
        .append("rect")
        .attr("x", (d) => x1(d.region))
        .attr("y", (d) => y(0))
        .attr("width", x1.bandwidth())
        .attr("height", 0)
        .attr("fill", (d) => color(d.region))
        .on("mouseover", (event, d) => {
            tooltip
                .style("opacity", 0)
                .style("top", event.pageY - 12 + "px")
                .html(
                    `Game: ${d.game}<br>Region: ${d.region.replace(
                        "_Sales",
                        ""
                    )}<br>Sales: ${d.sales.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                )
                .transition()
                .ease(d3.easeCubicOut)
                .duration(320)
                .style("opacity", 1)
                .style("left", event.pageX + 12 + "px")
                .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", function () {
            tooltip
                .transition()
                .ease(d3.easeCubicOut)
                .duration(320)
                .style("opacity", 0);
        })
        .transition()
        .ease(d3.easeCubicOut)
        .duration(1000)
        .attr("y", (d) => y(d.sales))
        .attr("height", (d) => height - y(d.sales));

    // Legend
    const legend = g
        .append("g")
        .attr("transform", `translate(${width - 120}, 0)`);

    regions.forEach((region, i) => {
        const legendRow = legend
            .append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        legendRow
            .append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(region));

        legendRow
            .append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(region.replace("_Sales", ""))
            .attr("font-size", "10pt")
            .attr("fill", "#080808");
    });

    // Judul chart
    const chartTitle = document.getElementById("chart-title");
    chartTitle.innerText = `Penjualan Game Teratas per Wilayah (Top ${dataLength})`;

    // Keterangan chart
    document.getElementById(
        "chart-legend"
    ).innerHTML = `Data menampilkan ${dataLength} game teratas berdasarkan penjualan per region.`;
}
