legendHeightWidthRation = 8;

function setRankLegend(width, height, colorScale, svg) {

    if(height / width > legendHeightWidthRation) {
        height = width * legendHeightWidthRation;
    } else {
        width = height / legendHeightWidthRation;
    }

    scale = []
    for(let i = 10; i >= 0; i--) {
      scale.push(colorScale(i/10.0))
    }

    removeRankLegend(svg)

    // append gradient bar
    var gradient = svg.append('defs')
        .attr("class", "legend")
        .append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%') // bottom
        .attr('y1', '100%')
        .attr('x2', '0%') // to top
        .attr('y2', '0%')
        .attr('spreadMethod', 'pad');

    // programatically generate the gradient for the legend
    // this creates an array of [pct, colour] pairs as stop
    // values for legend
    var pct = linspace(0, 100, scale.length).map(function(d) {
        return Math.round(d) + '%';
    });

    var colourPct = d3.zip(pct, scale);

    colourPct.forEach(function(d) {
        gradient.append('stop')
            .attr('offset', d[0])
            .attr('stop-color', d[1])
            .attr('stop-opacity', 1);
    });

    let legend = svg.append("g");

    legend.append('rect')
        .attr("class", 'legendrect')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'url(#gradient)');

    // create a scale and axis for the legend
    let legendScale = d3.scaleLinear()
        .domain([1, 100])
        .range([0, height]);

    let legendAxis = d3.axisRight()
        .scale(legendScale)
        .tickValues([1, 10, 50, 100])
        .tickFormat(x => { return "Rank: " + x});

    legend.append("g")
        .attr("transform", "translate(" + width + ", 0)")
        .attr("class", "rightaxis")
        .call(legendAxis);

    return legend;
}

function removeRankLegend(svg) {

    // clear current legend
    svg.selectAll('.legend').remove();
    svg.selectAll('.legendrect').remove();
    svg.selectAll('.rightaxis').remove();
}