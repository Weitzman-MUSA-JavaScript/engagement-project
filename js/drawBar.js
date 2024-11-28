const height = Math.max(window.innerHeight * 0.4, 410);
const width = Math.max(window.innerWidth * 0.3, 400);
const margin = { top: 20, right: 10, bottom: 60, left: 25 };

let svg;

async function drawBar(el, data) {
  el.selectAll('svg').remove();
  const processedData = processData(data);
  createBarChart(el, processedData);
}

function processData(data) {
  const filteredData = data.map((d) => ({
    ...d,
    properties: {
      ...d.properties,
      CAT: d.properties.CAT !== null && d.properties.CAT !== ' ' ? d.properties.CAT : 'NA',
    },
  }));

  const aggregatedData = d3.rollups(
    filteredData,
    (v) => v.length,
    (d) => d.properties.CAT,
  ).map(([Type, count]) => ({ Type, count }));

  aggregatedData.sort((a, b) => b.count - a.count);

  return aggregatedData;
}

function createBarChart(el, data) {
  const xScale = d3.scaleBand()
    .domain(data.map((d) => d.Type))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, (d) => d.count)]).nice()
    .range([height - margin.bottom, margin.top]);

  svg = el.append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(0, 0)`);

  svg.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', (d) => xScale(d.Type))
    .attr('y', (d) => yScale(d.count))
    .attr('width', xScale.bandwidth())
    .attr('height', (d) => height - margin.bottom - yScale(d.count))
    .attr('fill', '#bf826a')
    .append('title')
    .text((d) => `${d.Type}: ${d.count.toLocaleString()} buildings`);


  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.selectAll('.x-axis text')
    .attr('transform', 'rotate(-40)')
    .attr('x', -5)
    .attr('y', 5)
    .style('text-anchor', 'end');

  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));
}

export { drawBar };
