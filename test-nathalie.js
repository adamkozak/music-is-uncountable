

let width = 1200,
    height = 600, 
	active = d3.select(null);
	
let projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2 - 60, height / 2 + 80])
    .precision(.1);

let path = d3.geoPath()
    .projection(projection);

let graticule = d3.geoGraticule();

let svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
	.style("stroke_width", "1.5px");

// add a div corresponding to the window oppening when clicking a country

svg.append("div").attr("class", "country_window")
	
svg.append("defs").append("path")
    .datum({type: "Sphere"})
    .attr("id", "sphere")
    .attr("d", path);


svg.append("use")
    .attr("class", "fill")
    .attr("xlink:href", "#sphere");

rect=svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", d3.color("#424242"))
	


svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);



let tooltip = d3.select("#tooltip")
  .append("div")
  .style("position", "absolute")
  .style("z-index", "10")
  .style("visibility", "hidden")
  .text("a simple tooltip");

let div = d3.select("body").append("div") 
    .attr("class", "tooltip")       
    .style("opacity", 0);


const client = new stitch.StitchClient('dataviz-xeqhx');
const db = client.service('mongodb', 'mongodb-atlas').db('music');

let midDate = new Date("2017-07-01T00:00:00.000Z");
let selectedSongID;


/*
client.login().then(() => 
  db.collection('infos').find({name:"songs_list"}).then(songs_list => {
    //console.log(songs_list[0])
    let input = document.getElementById("myinput");
    new Awesomplete(input, {
      list: songs_list[0].value
    });
  })); */

/*
Obtain list of all songs in the database, retrieve only songs id, Artist and Track Name.
Populate the Awesome Complet input using track names and Artist
*/
let countries;
let spotify_countries;
let streamsDict = {};


let getAllDocuments = function(collection, query, callback, documents, projection) {
    //console.log(query)
    //console.log(projection)
    collection.find(query,{project: projection, limit:10000}).then(items => {
      documents = documents.concat(items);
      
      if(items.length >= 10000) {
        let last_id = documents[documents.length - 1]["_id"];
        console.log(last_id);
        query["_id"] = {"$gt":last_id}
        getAllDocuments(collection, query, callback, documents, projection);
      }
      else {
        callback(documents);
      }
    })
  }


client.login().then(() => client.executeNamedPipeline('songsList').then(list => {

  // Map songs to label and value to be displayed in the autocomplete input
  songsList = list.result[0].list.map(function(x) {
    return {
      label: x.n + " - " + x.a, 
      value: { text: x.n, id: x["id"] }
    }
  });

  //console.log(songsList)


  // Set the autocomplete input
  let input = document.getElementById("myinput");
  new Awesomplete(input, {
    list: songsList, 
    replace: function(item) {
      //console.log(item.value.id);
      selectedSongID = item.value.id;
      this.input.value = item.value.text;
    }
  });

  // Display the autocomplete input
  input.hidden = false;

  let button = document.getElementById("go_button");
  button.hidden = false;
  button.onclick = function() {    
    if(selectedSongID && spotify_countries) {


      let callback = function(timeLine) {
        console.log(timeLine.length)
        spotify_countries.forEach(function(d, i) {
          let filtered = timeLine.filter(x => d == x.r);
          let aggregation = filtered.map(x => parseInt(x.s)).reduce(function(a, v) {
              return a + v;
          }, 0)
          //console.log(d)
          streamsDict[d] = aggregation;
          //console.log(streamsDict);
        })
      }

      getAllDocuments(db.collection('entries'), {"id":selectedSongID}, callback, [], {_id: 1, s: 1, r:1})
    }
  }
}));

/*
client.login().then(() => 
  db.collection('songs').find({},{project: {_id: 0, "id":1, "Artist":1, "Track Name": 1}}).then(list => {
    console.log(list)
    let input = document.getElementById("myinput");
    input.hidden = false;
    new Awesomplete(input, {
      list: list.map(function(x) {
        return {
                  label: x["Track Name"] + " - " + x["Artist"], 
                  value: { text: x["Track Name"], id: x["id"] }
                }
      }), 

      replace: function(item) {
        console.log(item.value.id);
        selectedSongID = item.value.id;
        this.input.value = item.value.text;
      }
    }

 //
  );

    let button = document.getElementById("go_button");
    button.hidden = false;
    button.onclick = function() {

      
      if(selectedSongID && spotify_countries) {

        db.collection('entries').find({"id":selectedSongID, "d":{ $lt: midDate }},{project:{_id: 0, s: 1, r:1}, limit:20000}).then(firstTimeLine => {
          db.collection('entries').find({"id":selectedSongID, "d":{ $gte: midDate }},{project:{_id: 0, s: 1, r:1}, limit:20000}).then(secondTimeLine => {
            timeLine = firstTimeLine.concat(secondTimeLine);
            console.log(timeLine);

            spotify_countries.forEach(function(d, i) {
              let filtered = timeLine.filter(x => d == x.r);
              let aggregation = filtered.map(x => parseInt(x.s)).reduce(function(a, v) {
                  return a + v;
              }, 0)
              console.log(d)
              streamsDict[d] = aggregation;
            })
            
            console.log(streamsDict);
          })
        
        });  
      }
    }

  }));

*/

// Need to add a group inside the svg in order for the zooming to work 

g = svg.append("g")
    .style("stroke-width", "1.5px");
	
// Downloads the data to show the map and countries 	
	
d3.json("world-50m.json", function(error, world) {
//d3.json("https://unpkg.com/world-atlas@1/world/110m.json", function(error, world) {


  if (error) throw error;

  countries = topojson.feature(world, world.objects.countries).features, neighbors = topojson.neighbors(world.objects.countries.geometries);
  d3.json("id_dict.json", function(error, dict) {
    countries.forEach(function(d, i) {
      if(dict["" + parseInt(d.id)]) {
        d.name = dict[d.id][1]
        d.alpha2 = dict[d.id][0]
      }
    })

    d3.json("Datasets/countries.json", function(error, c) {
        spotify_countries = c;
        let spotify_dict = {}
        spotify_countries.forEach(function(d, i) {
          spotify_dict[d] = d
        })
		
	// Function that sets a different color for countries in the dataset
		let color = function(d) { 
            if(d.alpha2 in spotify_dict) {
              return ("green")
            }
            else {
              return ("black")
            }
          }
	
	
	
	
	// Function that zooms on and changes color of a country when clicked 
	
		let zoom = function (d) {
			if (active.node() === this) return reset(d);
				active.classed("active", false);
				active = d3.select(this).classed("active", true);

						
			let bounds = path.bounds(d),
				xmin = bounds[0][0]
				xmax = bounds[1][0]
				ymin = bounds[0][1]
				ymax = bounds[1][1]
				dx = xmax - xmin,
				dy = ymax - ymin,
				x_mid = (xmin + xmax) / 2,
				y_mid = (ymin + ymax) / 2;
		
				scale = 0.9 / Math.max(dx / width, dy / height),
				translate = [width / 2 - scale * x_mid, height / 2 - scale * y_mid];
				
			  g.transition()
				
				  .duration(1000)
				  .ease(d3.easeExp)
				  .style("stroke-width", 1.5 / scale + "px")
				  .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
			
			//changes the color of the selected country
			/*let region=d.alpha2;
			g.selectAll('.country')
				.transition()
				.ease(d3.easeElastic)
				.duration(5000)
				.style('fill', function(d){
					if (d.alpha2 === region){return('blue')}
					else {return(color(d))}})
			  */
			 };
		
		// Function that resets the properties of the country and dezoom when re-clicked
		let reset = function (d) {
				active.classed("active", false);
				active = d3.select(null);

		  g.transition()
			  .duration(750)
			  .style("stroke-width", "1.5px")
			  .style("fill", "red")
			  .attr("transform", "");
			  
			let region=d.alpha2;
			
			g.selectAll('.country')
				.transition()
				.duration(1000)
				.style('fill', function(d){ return(color(d)) })
		}
		
		
		//Mouse over a country shows info of country 
		
        g.selectAll(".country")
          .data(countries)
          .enter().insert("path", ".graticule")
          .attr("class", "country")
          .attr("d", path)
          //.style("fill", function(d, i) { return color(d.color = d3.max(neighbors[i], function(n) { return countries[n].color; }) + 1 | 0); })
          .style("fill", function(d) { return (color(d)) } ) 
          /*.on("mouseover", function(d, i) {reporter(d)})*/
          /*.on("mouseover", function(d, i){tooltip.text(d.name); return tooltip.style("visibility", "visible");})
          .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
          .on("mouseout", function(){return tooltip.style("visibility", "hidden");})*/
          .on("mouseover", function(d) {    
              div.transition()    
                  .duration(200)    
                  .style("opacity", 1);   

                  console.log(d.alpha2)
				  
			let region = d.alpha2;
			g.selectAll('.country')
				.transition()
				.duration(0)
				.style('fill', function(d){
					if (d.alpha2 === region){return('lightgreen')}
					else {return(color(d))}})
              })          
			  
          .on("mousemove", function(d) {
              if(d.name) {
                if(streamsDict[d.alpha2] !== undefined) {
                  div .html(d.name + "<br>Streams Count: " + streamsDict[d.alpha2])  
                      .style("left", (d3.event.pageX) + "px")   
                      .style("top", (d3.event.pageY - 28) + "px");  
                }
                else {
                  div .html(d.name)  
                      .style("left", (d3.event.pageX) + "px")   
                      .style("top", (d3.event.pageY - 28) + "px");  
                }
              }
              else {
                div .html(d.id)  
                    .style("left", (d3.event.pageX) + "px")   
                    .style("top", (d3.event.pageY - 28) + "px");  
              }
          })
          .on("mouseout", function(d) {   
              div.transition()    
                  .duration(500)    
                  .style("opacity", 0); 
				  
			let region = d.alpha2;
			g.selectAll('.country')
				.transition()
				.duration(0)
				.style('fill', function(d){return(color(d))})
          })
		  
			.on("click", zoom)
			
			/*function(d) {
			console.log(d)
			let region=d.alpha2;
			svg.selectAll('.country')
			.transition()
			.duration(1000)
			.style('fill', function(d){
				if (d.alpha2 === region){return('blue')}
				else {return('nothing')}
			
			})*/
			
			//getAllDocuments(db.collection('entries'), {"r":region}, callback, [], {_id: 1, s: 1, r:1, p:1})
			


		  });

          g.insert("path", ".graticule")
            .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
            .attr("class", "boundary")
            .attr("d", path);

			
    });

  });
  

  function reporter(x) {
      //console.log(x.name)
      d3.select("#report").text(function() {
          if(x.name) {
            return (x.name);
          }
          return (x.id);
      });
  }


d3.select(self.frameElement).style("height", height + "px");