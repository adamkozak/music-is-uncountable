function chart(data, color) {


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


let margin = {top: 20, right: 40, bottom: 30, left: 60};
let width = 600//document.body.clientWidth - margin.left - margin.right;
let height = 200 - margin.top - margin.bottom;

let tooltip = d3.select("body")
    .append("div")
    .attr("class", "remove")
    .style("position", "absolute")
    .style("z-index", "20")
    .style("visibility", "hidden")
    .style("top", "30px")
    .style("left", "55px");


//d3.select(".chart").select("svg").remove();

let svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    

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
      .scale(x)

  let yAxis = d3.axisLeft()
      .scale(y);

  var area = d3.area()
    .curve(d3.curveBasis)
    .x(function(d, i) { return x(data[i].date); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); });


  console.log(area(layers[0]))

  console.log(layers)

  svg.selectAll("test")
  .data(layers)
  .enter().append("path")
    .attr("class", "layer")
    .attr("d", area)
    .attr("fill", function(d,i) { return z(i); });

/*
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - 10) + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);*/

   var g = svg.append("g")
   // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height-10) + ")")
    .call(xAxis);

  g.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  let mouseOnLayer = false;

  svg.selectAll(".layer")
    .attr("opacity", 1)
    .on("mouseover", function(d, i) {
      svg.selectAll(".layer").transition()
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

      pro = d[mousedate][1] - d[mousedate][0];

      d3.select(this)
      .classed("hover", true)
      .attr("stroke", strokecolor)
      .attr("stroke-width", "0.5px"), 
      tooltip.html( "<p>" + datearray[mousedate] + "<br>" + d.key + "<br>" + pro + "</p>" ).style("visibility", "visible");

    })
    .on("mouseout", function(d, i) {
      mouseOnLayer = false;
     svg.selectAll(".layer")
      .transition()
      .duration(250)
      .attr("opacity", "1");
      d3.select(this)
      .classed("hover", false)
      .attr("stroke-width", "0px"), tooltip.html( "<p>" + d.key + "<br>" + pro + "</p>" ).style("visibility", "hidden");
  })
    
  /*let vertical = d3.select(".chart")
        .append("div")
        .attr("class", "remove")
        //.attr("transform", "translate(" + 0 + "," + -50 + ")")
        .style("position", "absolute")
        .style("z-index", "19")
        .style("width", "1px")
        .style("height", "200px")
        .style("top", "100px")
        .style("left", "0px")
        .style("background", "#fff");*/

   let displayWorldStream = function(mousex, event) {

        let invertedx = x.invert(mousex);
        let selected = (layers[0].values);
        for (let k = 0; k < data.length; k++) {
          datearray[k] = data[k].date
        }

        let mousedate = 0
        let diff = Math.abs(invertedx.getTime() - datearray[0].getTime())
        for(let i = 1; i < data.length; i++) {
          if(Math.abs(invertedx.getTime() - datearray[mousedate].getTime()) > Math.abs(invertedx.getTime() - datearray[i].getTime())) {
            mousedate = i;
          }
        }

        streamsSum = layers.map(x => x[mousedate][1] - x[mousedate][0]).reduce((a, v) => a + v, 0)

        d3.select(event)
              .classed("hover", true)
              .attr("stroke", strokecolor)
              .attr("stroke-width", "0.5px"), 
              tooltip.html( "<p>" + datearray[mousedate] + "<br>" + "World" + "<br>" + streamsSum + "</p>" ).style("visibility", "visible");
              
  }      

  d3.select(".chart")
      .on("mousemove", function(){  
        mousex = d3.mouse(this);
        mousex = mousex[0] + 5;
        //vertical.style("left", mousex + "px" )

        if(!mouseOnLayer) {
          mousex -= (5 + margin.left)
          displayWorldStream(mousex, this)
        }
      })

        //displayWorldStream(mousex)
      .on("mouseover", function(){  
        mousex = d3.mouse(this);
        mousex = mousex[0] + 5;
        //vertical.style("left", mousex + "px")

        if(!mouseOnLayer) {
          mousex -= (5 + margin.left)

          displayWorldStream(mousex, this)
        }
       });
}