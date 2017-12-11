timeFormat = d3.timeFormat("%Y/%m/%d");

margin = {top: 20, right: 0, bottom: 30, left: 40};

ratio_width_length = 4.0;

function getTranslation(transform) {
  // Create a dummy g for calculation purposes only. This will never
  // be appended to the DOM and will be discarded once this function 
  // returns.
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  
  // Set the transform attribute to the provided string value.
  g.setAttributeNS(null, "transform", transform);
  
  // consolidate the SVGTransformList containing all transformations
  // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
  // its SVGMatrix. 
  var matrix = g.transform.baseVal.consolidate().matrix;
  
  // As per definition values e and f are the ones for the translation.
  return [matrix.e, matrix.f];
}

function stackMax(layer) {
  return d3.max(layer, function(d) { return d[1]; });
}

class StreamGraph {


  constructor(width, height, data, color, svg) {

    this.colorrange = [];

    if(color == "palette") {
      this.colorrange = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    }
    else if (color == "blue") {
      this.colorrange = ["#045A8D", "#2B8CBE", "#54A9CF", "#86BDDB", "#A0D1E6", "#D1EEF6"];
    }

    else if (color == "pink") {
      this.colorrange = ["#980043", "#DD1C77", "#DF65B0", "#C994C7", "#D4B9DA", "#F1EEF6"];
    }
    else if (color == "orange") {
      this.colorrange = ["#B30000", "#E34A33", "#FC8D59", "#FDBB84", "#FDD49E", "#FEF0D9"];
    }

    this.z = d3.scaleOrdinal()
      .range(this.colorrange);

    let z = this.z

    this.setDimension(width, height);

    this.tooltip = d3.select("body")
      .append("div") 
      .attr("class", "tooltip")     
      .style("max-width", "350px")  
      .style("line-height", 1.5)  
      .style("opacity", 0);

    this.streamGraph = svg.append("g")
      .attr("width", this.graph_width + margin.left + margin.right)
      .attr("height", this.height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
      
    this.createLayers(data);

    this.streamGraph.selectAll("layers")
      .data(this.layers)
      .enter().append("path")
      .attr("class", "layer")
      .attr("d", this.area)
      .attr("fill", function(d,i) { return z(i); });

    this.axishandler = this.streamGraph.append("g")
      .attr("class", "axishandler")
     // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    let xAxis = this.xAxis;
    let yAxis = this.yAxis;
    height = this.height;

    this.axishandler.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + (height-10) + ")")
      .call(xAxis);

    this.axishandler.append("g")
      .attr("class", "yaxis")
      .call(yAxis);

    this.applyNewData();

    this.resize(width, height);

  }

  setData(data) {
    this.createLayers(data);
    this.changeGraph();
    this.applyNewData();
  }

  setDimension(width, height) {
    if(width/height > ratio_width_length) {
      this.width = height * ratio_width_length;
      this.height = height;
    } else {
      this.width = width;
      this.height = width / ratio_width_length;
    }

    this.graph_width = this.width - margin.left - margin.right;
  }

  createLayers(data) {
    let height = this.height
    let width = this.width
    
    this.data = data

    this.datearray = [];

    this.stack = d3.stack()
      .keys(["Europe","North America","South America", "Central America", "Asia","Oceania"])
      .order(d3.stackOrderNone)
      //.offset(d3.stackOffsetSilhouette);
      .offset(d3.stackOffsetNone);

    this.layers = this.stack(this.data)

    this.x = d3.scaleTime()
      .range([0, this.graph_width])
      .domain(d3.extent(this.data, function(d) { return d.date; }));

    this.y = d3.scaleLinear()
      .range([height-10, 0])
      .domain([0, d3.max(this.layers, stackMax)]);

    let x = this.x
    let y = this.y

    this.xAxis = d3.axisBottom()
      .scale(this.x);

    this.yAxis = d3.axisLeft()
      .scale(this.y)
      .ticks(6)
      .tickFormat(x => nFormatter(x, 3));

    this.area = d3.area()
      .curve(d3.curveBasis)
      .x(function(d, i) { return x(data[i].date); })
      .y0(function(d) { return y(d[0]); })
      .y1(function(d) { return y(d[1]); });
  }

  changeGraph() {
    let area = this.area;

    this.streamGraph.selectAll("path")
      .data(this.layers)
      .transition()
        .duration(1500)
        .attr("d", area);
  }

  applyNewData() {

    let data = this.data

    let x = this.x
    let y = this.y

    let xAxis = this.xAxis;
    let yAxis = this.yAxis;

    this.axishandler.select(".xaxis")
      .transition()
      .duration(2500)    
      .call(xAxis);

    this.axishandler.select(".yaxis")
      .transition()
      .duration(2500)    
      .call(yAxis);

    let tooltip = this.tooltip;
    let streamGraph = this.streamGraph;
    let datearray = this.datearray;
    let layers = this.layers;

    this.streamGraph.selectAll(".layer")
      .attr("opacity", 1)
      .on("mouseover", function(d, i) {

        tooltip.transition()    
            .duration(200)    
            .style("opacity", 1);

        streamGraph.selectAll(".layer").transition()
        .duration(250)
        .attr("opacity", function(d, j) {
          return j != i ? 0.6 : 1;
      })})
      .on("mousemove", function(d, i) {
        let mouse = d3.mouse(this);
        let mousex = mouse[0];
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

        let regionSum = d[mousedate][1] - d[mousedate][0];

        let streamsSum = layers.map(x => x[mousedate][1] - x[mousedate][0]).reduce((a, v) => a + v, 0)

        tooltip.html(/*timeFormat(datearray[mousedate])*/ "Week " + (mousedate+1) + "<br>" + d.key + ": " + nFormatter(regionSum, 3) + "<br> " + "World: " + nFormatter(streamsSum, 3)).style("visibility", "visible");

        tooltip
          .style("left", (d3.event.pageX) + "px")   
          .style("top", (d3.event.pageY - tooltip.node().getBoundingClientRect().height) + "px");  
      })
      .on("mouseout", function(d, i) {
        tooltip.transition()    
            .duration(500)    
            .style("opacity", 0); 

       streamGraph.selectAll(".layer")
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

  }


  setTimeStamp(week) {
    this.week = week;
    this.resize(this.width, this.height);
  }

  resize(width, height) {

    let data = this.data

    this.setDimension(width, height)

    height = this.height;


    this.x = d3.scaleTime()
      .range([0, this.graph_width])
      .domain(d3.extent(data, function(d) { return d.date; }));

    this.y = d3.scaleLinear()
      .range([height-10, 0])
      .domain([0, d3.max(this.layers, stackMax)]);

    this.xAxis = d3.axisBottom()
        .scale(this.x);

    this.yAxis = d3.axisLeft()
        .scale(this.y)
        .ticks(6)
        .tickFormat(x => nFormatter(x, 3));

    let x = this.x
    let y = this.y
    let z = this.z


    this.area = d3.area()
      .curve(d3.curveBasis)
      .x(function(d, i) { return x(data[i].date); })
      .y0(function(d) { return y(d[0]); })
      .y1(function(d) { return y(d[1]); });

    this.streamGraph
        .attr("width", this.graph_width + margin.left + margin.right)
        .attr("height", this.height + margin.top + margin.bottom)
        //.append("g")
        //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        
    this.streamGraph.selectAll(".layer")
      .attr("d", this.area);

    this.streamGraph.select(".timeline").remove()
    
    if(this.week) {

      this.streamGraph.append("rect")
        .attr("class", "timeline")
        .attr("x", this.x(this.data[this.week].date))
        .attr("y", -10)
        .attr("width", 2)
        .attr("height", this.height)
        .attr("fill", "#ffffff");
    }

    this.axishandler.selectAll(".xAxis").remove()
    this.axishandler.selectAll(".yAxis").remove()

    this.axishandler.remove()

    this.axishandler = this.streamGraph.append("g")
          .attr("class", "axishandler")
         // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let xAxis = this.xAxis;
    let yAxis = this.yAxis;

    this.axishandler.append("g")
      .attr("class", "xaxis")
      .attr("transform", "translate(0," + (height-10) + ")")
      .call(xAxis);


    this.axishandler.append("g")
      .attr("class", "yaxis")
      .call(yAxis); 

    this.axishandler.select(".xaxis")
      .call(xAxis);

    this.axishandler.select(".yaxis")
      .call(yAxis); 
  }

}