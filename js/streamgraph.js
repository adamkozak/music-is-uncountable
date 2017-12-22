let timeFormat = d3.timeFormat("%Y/%m/%d");

let margin = {top: 20, right: 0, bottom: 30, left: 40};

let ratio_width_length = 4.0;

let timelapseSpeeds = [0.1, 0.15, 0.225, 0.3, 0.45, 0.6, 0.9, 1.2];

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


  constructor(width, height, data, svg, listener, colorrange = null, color = "blue", keys) {

    this.week = 0;
    this.keys = keys;

    this.speed_idx = 3;
    this.timelapseSpeed = timelapseSpeeds[this.speed_idx];

    this.listener = listener;

    this.colorrange = [];

    if(colorrange) {
      this.colorrange = colorrange
    } 
    else {
      if(color == "palette") {
        this.colorrange = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6"];
      }
      else if (color == "blue") {
        this.colorrange = ["#045A8D", "#2B8CBE", "#54A9CF", "#86BDDB", "#A0D1E6", "#D1EEF6"];
      }
      else if (color == "spotify_green") {
        this.colorrange = ["#0A4820", "#0E6429", "#1A893F", "#1DB954", "#2BD974", "#5DFFA4"];
      }
      else if (color == "pink") {
        this.colorrange = ["#980043", "#DD1C77", "#DF65B0", "#C994C7", "#D4B9DA", "#F1EEF6"];
      }
      else if (color == "orange") {
        this.colorrange = ["#B30000", "#E34A33", "#FC8D59", "#FDBB84", "#FDD49E", "#FEF0D9"];
      }
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

    // text label for the y axis
    this.streamGraph.append("text")
        .attr("transform", "rotate(0)")
        .attr("y", -10)
        .attr("x",0)
        .attr("dy", "0em")
        .style("fill", "white")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Streams/week"); 
 

    this.applyNewData();

    this.drawPlayButton();
    this.playing = false;

    this.resize(width, height);
  }

  drawPlayButton(delay = 0) {
    /*
    this.streamGraph.select(".pausebutton").remove();
    this.streamGraph.select(".fastbutton").remove();
    this.streamGraph.select(".slowbutton").remove();
    */
    let buttonSize = this.height/3;

    this.streamGraph.select(".playbutton").remove();

    if(this.pauseButton) {
      this.pauseButton.on("click", null);

      this.pauseButton.transition()
        .duration(delay)
        .attr("opacity", 0)
    }

    if(this.fastButton) {
      this.fastButton.on("click", null);

      this.fastButton.transition()
        .duration(delay)
        .attr("x", (this.width/2 - buttonSize))
        .attr("opacity", 0)
    }

    if(this.slowButton) {
      this.slowButton.on("click", null);

      this.slowButton.transition()
        .duration(delay)
        .attr("x", (this.width/2 - this.height/3))
        .attr("opacity", 0)
    }


    this.playButton = this.streamGraph.append("image")
      .attr("class", "playbutton")
      .attr("xlink:href","img/play2.svg")
      .attr("width", buttonSize)
      .attr("height", buttonSize)
      .attr("x", (this.width - margin.left)/2 - buttonSize/2)
      .attr("y", this.height + buttonSize/2)
      .attr("opacity", 0);

    this.playButton.transition()
      .duration(delay)
      .attr("opacity", 1)

    let _this = this;

    this.playButton.on("click", function() { 
      _this.playing = true;
      _this.listener.buttonPressed(true, _this.week);
      _this.drawPauseButton(250);
    });
  }

  drawPauseButton(delay) {
    let buttonSize = this.height/3;
    /*
    this.streamGraph.select(".playbutton").remove();*/
    this.streamGraph.select(".pausebutton").remove();
    this.streamGraph.select(".fastbutton").remove();
    this.streamGraph.select(".slowbutton").remove();

    if(this.playButton) {
      this.playButton.on("click", null);      
      this.playButton.transition()
        .duration(delay)
        .attr("opacity", 0)
    }

    this.pauseButton = this.streamGraph.append("image")
      .attr("class", "pausebutton")
      .attr("xlink:href","img/pause2.svg")
      .attr("width", buttonSize)
      .attr("height", buttonSize)
      .attr("x", (this.width - margin.left)/2 - buttonSize/2)
      .attr("y", this.height + buttonSize/2)
      .attr("opacity", 0);

    this.pauseButton.transition()
      .duration(delay)
      .attr("opacity", 1)

    let _this = this;

    this.pauseButton.on("click", function() { 
      _this.playing = false;
      _this.listener.buttonPressed(false);
      _this.drawPlayButton(250);
    });

    this.fastButton = this.streamGraph.append("image")
      .attr("class", "fastbutton")
      .attr("xlink:href","img/forward.svg")
      .attr("width", buttonSize)
      .attr("height", buttonSize)
      .attr("x", (this.width - margin.left)/2 - buttonSize/2)
      .attr("y", this.height + buttonSize/2)
      .attr("opacity", 0);

    this.fastButton.transition()
      .duration(delay)
      .attr("x", (this.width - margin.left)/2 + buttonSize)
      .attr("opacity", 1)

    this.fastButton.on("click", function() {
      _this.changeSpeed(1)
    });

    this.slowButton = this.streamGraph.append("image")
      .attr("class", "slowbutton")
      .attr("xlink:href","img/backward.svg")
      .attr("width", buttonSize)
      .attr("height", buttonSize)
      .attr("x", (this.width - margin.left)/2 - buttonSize/2)
      .attr("y", this.height + buttonSize/2)
      .attr("opacity", 0);

    this.slowButton.transition()
      .duration(delay)
      .attr("x", (this.width - margin.left)/2 - 2 * buttonSize)
      .attr("opacity", 1)

    this.slowButton.on("click", function() {
      _this.changeSpeed(-1)
    });


  }

  changeSpeed(increment) {
    let buttonSize = this.height/3;

    this.speed_idx = Math.min(this.speed_idx + increment, timelapseSpeeds.length - 1);
    this.speed_idx = Math.max(this.speed_idx, 0);
    this.timelapseSpeed = timelapseSpeeds[this.speed_idx];

    let speed = (timelapseSpeeds[this.speed_idx] / timelapseSpeeds[3]).toPrecision(2);

    this.streamGraph.select(".speedtext").remove();

    this.speedText = this.streamGraph.append("text")
      .attr("class", "speedtext")
      .attr("x", (this.width - margin.left)/2 + (5*buttonSize)/2)
      .attr("y", this.height + buttonSize/2)
      .style("fill", "white")
      .style("font-size", "18px")
      .attr("dy", "1em")
      .attr("opacity", 1)
      .text("x" + speed); 

    this.speedText
      .transition()
      .attr("opacity", 0)
      .delay(1000)
      .duration(800);
  }

  setData(data) {
    this.week = 0;

    this.speed_idx = 3;
    this.timelapseSpeed = timelapseSpeeds[this.speed_idx];

    this.setTimeStamp(0);
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
      .keys(this.keys)
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

    let _this = this;
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

        if(_this.keys.length > 1) {
          tooltip.html(/*timeFormat(datearray[mousedate])*/ "Week " + (mousedate+1) + "<br>" + d.key + ": " + nFormatter(regionSum, 3) + "<br> " + "World: " + nFormatter(streamsSum, 3))
            .style("visibility", "visible");
        } else {
          tooltip.html(/*timeFormat(datearray[mousedate])*/ "Week " + (mousedate+1) + "<br>" + "Total streams" + ": " + nFormatter(regionSum, 3))
            .style("visibility", "visible");
        }
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
    this.drawTimeLine();
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
        .ticks(4)
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


    this.drawTimeLine();

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

    if(this.playing) {
      this.drawPauseButton();
    } else {
      this.drawPlayButton();
    }
  }

  drawTimeLine() {
    this.streamGraph.select(".timeline").remove()
    
    if(this.week) {

      if(this.week >= this.data.length - 1) {
        this.week = this.data.length - 1;
      }

      let date1 = this.data[Math.floor(this.week)].date
      let date2 = this.data[Math.ceil(this.week)].date

      let dateRate = this.week - Math.floor(this.week);

      let date = new Date(date1.getTime() + dateRate * (date2.getTime() - date1.getTime()))

      this.streamGraph.append("rect")
        .attr("class", "timeline")
        .attr("x", this.x(date))
        .attr("y", -10)
        .attr("width", 2)
        .attr("height", this.height)
        .attr("fill", "#ffffff");
    }
  }

  pause() {
    this.playing = false;
    this.drawPlayButton();
  }

  remove() {
    this.tooltip.remove();
    this.streamGraph.remove();
  }



}