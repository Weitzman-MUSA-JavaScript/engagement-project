const height = Math.max(window.innerHeight * 0.16, 0);
const width = Math.max(window.innerWidth * 0.1, 0);
const radius = Math.min(width, height) / 2;
const textSize = radius * 0.11;
const mouseoverSize = radius * 0.08;

let svg;

async function drawDonut(el, input, data, palette) {
  el.selectAll('svg').remove();
  donutChart(el, input, data, palette);
}

function donutChart(el, input, data, palette) {
  const arc = d3.arc()
    .innerRadius(radius * 0.7)
    .outerRadius(radius - 1);

  const pie = d3.pie()
    .padAngle(1 / radius)
    .sort(null)
    .value((d) => d.IMPACTEDP);

  const color = d3.scaleOrdinal().range(palette);

  svg = el.append('svg')
    .attr('width', '100%')
    .attr('height', 'auto')
    .attr('viewBox', [-width / 2, -height / 2, width+10, height+10].join(' '))
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('style', 'max-width: 100%; height: auto; display: block;');

  svg.append('g')
    .selectAll('path')
    .data(pie(data))
    .join('path')
    .attr('fill', (d) => color(d.data.IMPACTEDP))
    .attr('d', arc)
    .append('title')
    .text((d) => `${d.data.BCAT}: ${d.data.IMPACTEDP.toLocaleString()}`);

  svg.append('text')
    .style('font', `bold ${textSize}px 'Lato', sans-serif`)
    .attr('class', 'title')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('transform', 'translate(0, -10)')
    .text('At Inundation Level');

  svg.append('text')
    .style('font', `bold ${textSize}px 'Lato', sans-serif`)
    .attr('class', 'subtitle')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('transform', 'translate(0, 10)')
    .text(`${input} Feet`);


  const tip = svg.append('g').style('visibility', 'hidden');

  tip.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 75)
    .attr('height', 26)
    .attr('fill', 'white');

  const value = tip.append('text')
    .attr('x', 5)
    .attr('y', 10)
    .style('font', `bold ${mouseoverSize}px 'Lato', sans-serif`)
    .attr('font-weight', 'bold');

  const count = tip.append('text')
    .attr('x', 5)
    .attr('y', 20)
    .style('font', `${mouseoverSize}px 'Lato', sans-serif`);

  const polygon = svg.selectAll('path');

  polygon.on('mouseover', (evt, d) => {
    let [mx, my] = d3.pointer(evt);
    mx -= 75;
    my += 20;
    mx = Math.max(0, Math.min(width - 120, mx));

    d3.select(evt.target).attr('fill', 'rgb(255, 171, 171)');
    tip.attr('transform', `translate(${mx}, ${my})`).style('visibility', 'visible');
    value.text(`${d.data.BCAT}:`);
    count.text(`Impacted Pop: ${d.data.IMPACTEDP} `);
  })
    .on('mouseout', (evt, d) => {
      d3.select(evt.target).attr('fill', (d) => color(d.data.IMPACTEDP));
      tip.style('visibility', 'hidden');
    });
}

export {
  drawDonut,
};
