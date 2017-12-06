function chart(data, color, svg, histogram) {


let datearray = [];
let colorrange = [];

if(color == "palette") {
  colorrange = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
}
else if (color == "blue") {
  colorrange = ["#045A8D", "#2B8CBE", "#54A9CF", "#86BDDB", "#A0D1E6", "#D1EEF6"];
}

else if (color == "pink") {
  colorrange = ["#980043", "#DD1C77", "#DF65B0", "#C994C7", "#D4B9DA", "#F1EEF6"];
}
else if (color == "orange") {
  colorrange = ["#B30000", "#E34A33", "#FC8D59", "#FDBB84", "#FDD49E", "#FEF0D9"];
}
strokecolor = colorrange[0];

let timeFormat = d3.timeFormat("%Y/%m/%d");


let margin = {top: 20, right: 40, bottom: 30, left: 60};
let width = 600//document.body.clientWidth - margin.left - margin.right;
let height = 200 - margin.top - margin.bottom;


let tooltip = d3.select("body").append("div") 
    .attr("class", "tooltip")     
    .style("max-width", "350px")  
    .style("line-height", 1.5)  
    .style("opacity", 0);

function stackMax(layer) {
    return d3.max(layer, function(d) { return d[1]; });
  }

  let stack = d3.stack()
    .keys(["Europe","North America","South America", "Central America", "Asia","Oceania"])
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

  let layers = stack(data)

  let x = d3.scaleTime()
    .range([0, width])
    .domain(d3.extent(data, function(d) { return d.date; }));

  let y = d3.scaleLinear()
    .range([height-10, 0])
    .domain([0, d3.max(layers, stackMax)]);

  let z = d3.scaleOrdinal()
    .range(colorrange);

  let xAxis = d3.axisBottom()
      .scale(x);

  let yAxis = d3.axisLeft()
      .scale(y)
      .ticks(6)
      .tickFormat(x => nFormatter(x, 3));

  let axishandler;

  var area = d3.area()
    .curve(d3.curveBasis)
    .x(function(d, i) { return x(data[i].date); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); });


  console.log(area(layers[0]))

  console.log(layers)

if(histogram) {

  axishandler = histogram.selectAll(".axishandler")

  console.log("REUSING")

  histogram.selectAll("path")
    .data(layers)
    .transition()
      .duration(1500)
      .attr("d", area);
}

else {

  histogram = svg.append("g")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      
    histogram.selectAll("test")
    .data(layers)
    .enter().append("path")
      .attr("class", "layer")
      .attr("d", area)
      .attr("fill", function(d,i) { return z(i); });

    axishandler = histogram.append("g")
      .attr("class", "axishandler")
     // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    axishandler.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + (height-10) + ")")
      .call(xAxis);

    axishandler.append("g")
      .attr("class", "yaxis")
      .call(yAxis);

  }

  console.log(axishandler.select(".xaxis"))

  axishandler.select(".xaxis")
    .transition()
    .duration(2500)    
    .call(xAxis);

  axishandler.select(".yaxis")
    .transition()
    .duration(2500)    
    .call(yAxis);

  let mouseOnLayer = false;

  histogram.selectAll(".layer")
    .attr("opacity", 1)
    .on("mouseover", function(d, i) {

      tooltip.transition()    
          .duration(200)    
          .style("opacity", 1);

      histogram.selectAll(".layer").transition()
      .duration(250)
      .attr("opacity", function(d, j) {
        return j != i ? 0.6 : 1;
    })})
    .on("mousemove", function(d, i) {
      mouseOnLayer = true;
      mouse = d3.mouse(this);
      mousex = mouse[0];
      let invertedx = x.invert(mousex);

      for (let k = 0; k < data.length; k++) {
        datearray[k] = data[k].date
       // datearray[k] = datearray[k].getMonth() + datearray[k].getDate();
      }

      let mousedate = 0
      let diff = Math.abs(invertedx.getTime() - datearray[0].getTime())
      for(let j = 1; j < datearray.length; j++) {
        if(Math.abs(invertedx.getTime() - datearray[mousedate].getTime()) > Math.abs(invertedx.getTime() - datearray[j].getTime())) {
          mousedate = j;
        }
      }

      regionSum = d[mousedate][1] - d[mousedate][0];

      streamsSum = layers.map(x => x[mousedate][1] - x[mousedate][0]).reduce((a, v) => a + v, 0)

      tooltip.html(/*timeFormat(datearray[mousedate])*/ "Week " + (mousedate+1) + "<br>" + d.key + ": " + nFormatter(regionSum, 3) + "<br> " + "World: " + nFormatter(streamsSum, 3)).style("visibility", "visible");

      tooltip
        .style("left", (d3.event.pageX) + "px")   
        .style("top", (d3.event.pageY - tooltip.node().getBoundingClientRect().height) + "px");  
    })
    .on("mouseout", function(d, i) {
      tooltip.transition()    
          .duration(500)    
          .style("opacity", 0); 

      mouseOnLayer = false;
     histogram.selectAll(".layer")
      .transition()
      .duration(250)
      .attr("opacity", "1");
  })
    
  

  d3.select(".chart")
    .on("mousemove", function(){  
      mousex = d3.mouse(this);
      mousex = mousex[0] + 5;
    })
    .on("mouseover", function(){  
      mousex = d3.mouse(this);
      mousex = mousex[0] + 5;
      //vertical.style("left", mousex + "px")
     });

  return histogram;
}