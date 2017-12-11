class WorldMap {

	constructor(width, height, svg, continentColorsDict, CountryContinentDict) {

    this.height = height;
    this.width = width;


		let scale = Math.min(width/7.2, height/4.6)

		this.projection = d3.geoMercator()/*d3.geoNaturalEarth1()*//*d3.geoConicConformal()*//*d3.geoEquirectangular() */
		    .scale(scale)
		    //.clipExtent([width/2, height/2])
		    .translate([width / 2, height / 2])
		    .precision(10000);

		this.path = d3.geoPath()
		    .projection(this.projection);

		let graticule = d3.geoGraticule();

		this.map = svg.append("g")

		this.map.append("defs").append("path")
		    .datum({type: "Sphere"})
		    .attr("id", "sphere")
		    .attr("d", this.path);



		this.map.append("path")
		    .datum(graticule)
		    .attr("class", "graticule")
		    .attr("d", this.path);
	}

	resize(width, height) {

  	let scale = Math.min(width/7.2, height/4.6)

	  this.projection
	    .scale(scale)
	    //.clipExtent([width/2, height/2])
	    .translate([width / 2, height / 2.2])

	  d3.selectAll("path").filter(".country")
	    .attr('d', this.path);

	  d3.selectAll("path").filter(".boundary")
	    .style("stroke-width", (width/2000.0) + "px")
	    .attr('d', this.path);
	}

	drawMap(countriesColors, delta) {

	  this.map.selectAll(".country")
	    .data(countries)
	    .enter().insert("path", ".graticule")
	    .attr("class", "country")
	    .attr("d", this.path)
	    //.style("fill", function(d, i) { return color(d.color = d3.max(neighbors[i], function(n) { return countries[n].color; }) + 1 | 0); })
	    .on("mouseover", function(d) {    
	        countryTooltip.transition()    
	            .duration(200)    
	            .style("opacity", 1);    
	        })    
	    .on("mousemove", function(d) {
	        if(d.name) {
	          if(streamsDict[d.alpha2] !== undefined) {
	            countryTooltip .html(d.name + "<br>Yearly Streams: " + streamsDict[d.alpha2])  
	                .style("left", (d3.event.pageX) + "px")   
	                .style("top", (d3.event.pageY - 28) + "px");  
	          }
	          else {
	            countryTooltip .html(d.name)  
	                .style("left", (d3.event.pageX) + "px")   
	                .style("top", (d3.event.pageY - 28) + "px");  
	          }
	        }
	        else {
	          countryTooltip .html(d.id)  
	              .style("left", (d3.event.pageX) + "px")   
	              .style("top", (d3.event.pageY - 28) + "px");  
	        }
	    })
	    .on("mouseout", function(d) {   
	        countryTooltip.transition()    
	            .duration(500)    
	            .style("opacity", 0); 
	    })



	  this.map.selectAll(".boundary").remove()
	  // Draw the boundaries
	  this.map.insert("path", ".graticule")
	    .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
	    .attr("class", "boundary")
	    .attr("d", this.path);


	  let strokeWidth = (width/2000.0) 
	  console.log(strokeWidth);
	  this.map.selectAll(".boundary")
	    .style("stroke-width", strokeWidth + "px")



	  let time = 0
	  if(delta) {
	    time = delta;
	  }

	  this.map.selectAll(".country") 
	    .transition()
	    .duration(time)
	    .style("fill", function(d, i) { 
	      if(d.alpha2 in spotify_dict) {
	        if(countriesColors != undefined) {
	          if(d.alpha2 in countriesColors) {
	            return countriesColors[d.alpha2]
	          }
	          else {
	            return d3.color("#828282")
	          }
	        }
	        else {
	          //return d3.color("#6AE368")
	          return d3.color(continentColorsDict[CountryContinentDict[d.alpha2]])
	        }
	      }
	      else {
	        return d3.color("#424242")
	      }
	    })
	}

}