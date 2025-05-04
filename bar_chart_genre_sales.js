// Margin konvensi
const margin = { top: 40, right: 20, bottom: 70, left: 160 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Buat SVG
d3.select('#chart')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

// Tooltip
d3.select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0);

// Load CSV
d3.csv('vgsales_clean.csv', d => ({
  Genre: d.Genre,
  Global_Sales: +d.Global_Sales
})).then(data => {
  // Aggregate: jumlahkan Global_Sales per Genre
  const salesByGenre = Array.from(
    d3.rollup(data, v => d3.sum(v, d => d.Global_Sales), d => d.Genre),
    ([Genre, Total]) => ({ Genre, Total })
  );

  // Sort descending
  salesByGenre.sort((a, b) => b.Total - a.Total);

  // Scale
  const x = d3.scaleBand()
    .domain(salesByGenre.map(d => d.Genre))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(salesByGenre, d => d.Total)])
    .nice()
    .range([height, 0]);

  // Axes
  const svg = d3.select('svg g');

  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

  svg.append('g')
    .call(d3.axisLeft(y));

  // Bars
  svg.selectAll('.bar')
    .data(salesByGenre)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.Genre))
    .attr('y', d => y(d.Total))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.Total))
    .on('mouseover', (event, d) => {
      d3.select('.tooltip')
        .transition().duration(200).style('opacity', .9);
      d3.select('.tooltip')
        .html(`<strong>${d.Genre}</strong><br/>Total: ${d.Total.toFixed(2)} juta`)
        .style('left', (event.pageX + 5) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => {
      d3.select('.tooltip')
        .transition().duration(500).style('opacity', 0);
    });

  // Label sumbu
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 10)
    .style('text-anchor', 'middle')
    .text('Genre');

  svg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 20)
    .style('text-anchor', 'middle')
    .text('Total Penjualan (juta unit)');

  // Judul chart
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text('Bar Chart: Genre vs Total Penjualan');
})
.catch(error => console.error('Error loading CSV:', error));
