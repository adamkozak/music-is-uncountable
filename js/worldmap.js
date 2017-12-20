//dictionary representing which polygon of multipolygon coordinate countries represent them the best (e.g. metropolitan France)
/*
let dictPolygon = {
  "fr": 9,
  "no" : 20,
  "ca" : 100,
  "us" : 58,
  "nz" : 8,
  "es" : 11,
  "pt" : 8 ,
  "cl" : 30,
  "au" : 38,
  "nl" : 7,
}
*/



let dictPolygon = {
  "fr": 2,
  "no" : 0,
  "ca" : 10,
  "us" : 5,
  //"nz" : 0,
  //"es" : 0,
  //"pt" : 0,
  "cl" : 1,
  //"au" : 1,
  //"nl" : 1,
}


let widthHeightRatio = 8/5.8;

class WorldMap {

	constructor(width, height, svg, continentColorsDict, CountryContinentDict, dataReadyCallback, zoomCallback) {
		let _this = this;

		this.active = null
		this.zoomCallback = zoomCallback;

		// Load the TopoJSON 
		d3.json("world-110m.json", function(error, w) {
		  if (error) throw error;

		  _this.world = w;
		  _this.countries = topojson.feature(_this.world, _this.world.objects.countries).features

		  //Singapore and HongKong are not present in the low quality TopoJSON
		  _this.countries.push({"id":702})
		  _this.countries.push({"id":344})

		  //let neighbors = topojson.neighbors(world.objects.countries.geometries)
		  d3.json("id_dict.json", function(error, dict) {
		    _this.countries.forEach(function(d, i) {
		      if(dict["" + parseInt(d.id)]) {
		        d.name = dict[d.id][1]
		        d.alpha2 = dict[d.id][0]
		      }
		    })
		    _this.countries = _this.countries.filter(d => d.alpha2 != "aq")
		    d3.json("Datasets/countries.json", function(error, c) {
	        _this.spotify_countries = c;
	        _this.spotify_dict = {}
	        _this.spotify_countries.forEach(function(d, i) {
	          for(let i = 0; i < _this.countries.length; i++) {
	            if(d == _this.countries[i].alpha2) {
	              _this.spotify_dict[d] = _this.countries[i]
	            }
	          }
	        })

	        _this.drawMap();
	  			dataReadyCallback();
		    });
		  });
		});


		if(width > widthHeightRatio * height) {
			width = height * widthHeightRatio;
		} else {
			height = width / widthHeightRatio;
		}

		this.height = height;
    this.width = width;

  	let scale = width / 6.6

		this.projection = d3.geoMercator()/*d3.geoNaturalEarth1()*//*d3.geoConicConformal()*//*d3.geoEquirectangular() */
		    .scale(scale)
		    //.clipExtent([width/2, height/2])
		    .translate([width / 2, height / 1.8])
		    .precision(10000);

		this.path = d3.geoPath()
		    .projection(this.projection);

		let graticule = d3.geoGraticule()

		this.map = svg.append("g")

		this.map.append("defs").append("path")
		    .datum({type: "Sphere"})
		    .attr("id", "sphere")
		    .attr("d", this.path);

		this.map.append("path")
		    .datum(graticule)
		    .attr("class", "graticule")
		    .attr("d", this.path);

		this.svg = svg;
	}

	resize(width, height) {

		if(width > widthHeightRatio * height) {
			width = height * widthHeightRatio;
		} else {
			height = width / widthHeightRatio;
		}

		this.height = height;
    this.width = width;
    

  	let scale = width / 6.2

	  this.projection
	    .scale(scale)
	    //.clipExtent([width/2, height/2])
	    .translate([width / 2, height / 1.8])

	  d3.selectAll("path").filter(".country")
	    .attr('d', this.path);

	  d3.selectAll("path").filter(".boundary")
	    .style("stroke-width", (width/2000.0) + "px")
	    .attr('d', this.path);
	}

	drawMap(countriesColors, delta) {

	  this.map.selectAll(".country")
	    .data(this.countries)
	    .enter().insert("path", ".graticule")
	    .attr("class", "country")
	    .attr("d", this.path)
	    //.style("fill", function(d, i) { return color(d.color = d3.max(neighbors[i], function(n) { return countries[n].color; }) + 1 | 0); })
	    .on("click", function(d) {
			if (mode == 'country' & (d.alpha2 in _this.spotify_dict)){
	    	_this.zoom(d.alpha2)
			}
	    })
	    .on("mouseover", function(d) {    
	        countryTooltip.transition()    
	            .duration(200)    
	            .style("opacity", 1);    
	        })    
	    .on("mousemove", function(d) {
	        if(d.name) {
	          if(streamsDict[d.alpha2] !== undefined) {
	            countryTooltip .html(d.name + "<br>Yearly Streams: " + nFormatter(streamsDict[d.alpha2], 3))  
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
	    .datum(topojson.mesh(this.world, this.world.objects.countries, function(a, b) { return a !== b; }))
	    .attr("class", "boundary")
	    .attr("d", this.path);


	  let strokeWidth = (width/2000.0) 
	  this.map.selectAll(".boundary")
	    .style("stroke-width", strokeWidth + "px")



	  let time = 0
	  if(delta) {
	    time = delta;
	  }

	  let _this = this;
	  this.map.selectAll(".country") 
	    .transition()
	    .duration(time)
	    .style("fill", function(d, i) { 
	      if(d.alpha2 in _this.spotify_dict) {
	        if(countriesColors != undefined) {
	          if(d.alpha2 in countriesColors) {
	            return countriesColors[d.alpha2]
	          }
	          else {
	            return d3.color("#666")
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
	

	
	
	//---------------------------------------
	// Zoom when country selected in the list 
	//Zooming function
	zoom(AlphA) {

		/*
		count_list.selectAll("li").style("color","inherit");
		count_list.select("#"+AlphA).style("color", "DarkSeaGreen");
		*/
		
		let country ;
		this.countries.forEach((ctry) => {
			if (ctry.alpha2 == AlphA) {
				country = ctry;
			} 
		});
		
		let final_country = country;

		if (this.active == AlphA) return this.reset(AlphA);

		this.zoomCallback(AlphA);

		let delay = 0;
		
		if(this.active != null) {
			delay = 1000;
		}

		this.reset();
		let _this = this;


		setTimeout(function() {

			_this.active = AlphA;
					
			
			//if the country needs a modification for zooming 
			if (AlphA in dictPolygon ) { 
				//copy of the country dict
				final_country = JSON.parse(JSON.stringify(country));
				//select the polygon number that needs to be zoomed
				let polNum = dictPolygon[AlphA];
				//resets the country dict to only this polynom for the bounds

				let	pointsCountry = final_country.geometry.coordinates[polNum];
				final_country.geometry.coordinates = pointsCountry;
				final_country.geometry.type = "Polygon";
			}
					
			let bounds = _this.path.bounds(final_country)

			let
				xmin = bounds[0][0],
				xmax = bounds[1][0],
				ymin = bounds[0][1],
				ymax = bounds[1][1],
				dx = xmax - xmin,
				dy = ymax - ymin,
				x_mid = (xmin + xmax) / 2,
				y_mid = (ymin + ymax) / 2;
				
			let scale = 0.9 / Math.max(dx / width, dy / height),
			translate = [width / 2 - scale * x_mid, height / 2 - scale * y_mid];
			
		  worldMap.map.transition()
			  .duration(1000)
			  .ease(d3.easeExp)
			  .style("stroke-width", 1.5 / scale + "px")
			  .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

		  //this.map.selectAll(".boundary").remove()

		  let strokeWidth = (_this.width/8000.0) 

		  _this.map.selectAll(".boundary")
		  	.transition()
		    .duration(1000)
		    .style("stroke-width", strokeWidth + "px")
		}, delay)

	}
		 
	// Function that resets the properties of the country and dezooms when re-clicked
	reset(a) {
		console.log("reset")

		let strokeWidth = (this.width/2000.0) 

	  this.map.selectAll(".boundary")
	  	.transition()
	    .duration(1000)
	    .style("stroke-width", strokeWidth + "px")
	

	  worldMap.map.transition()
		  .duration(750)
		  .style("stroke-width", "1.5px")
		  .style("fill", "red")
		  .attr("transform", "");


		this.active = null;
		
		//count_list.select("#"+a).style("color", "inherit");
		  
	}
		
}