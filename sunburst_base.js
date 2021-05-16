var width = 1100,
    height = 800,
    radius = (Math.min(width, height) / 2) - 10;

var formatNumber = d3.format(",d");

var x = d3.scaleLinear()
    .range([0, 2 * Math.PI]);

var y = d3.scaleSqrt()
    .range([0, radius]);

var color = d3.scaleOrdinal(d3.schemeCategory20);

var partition = d3.partition();

var arc = d3.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
    .outerRadius(function(d) { return Math.max(0, y(d.y1)); });

var svg = d3.select("svg"),
    margin = 20,
    diameter = +svg.attr("width"),
    g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");


d3.csv("./data/sunburstfinal.csv",function(error, data) {

    if (error) throw error;

    var anidados = d3.nest()
        .key(function(d){return d.rangoedad;})
        .key(function(d){return d.superliga;})        
        .key(function(d){return d.clasificacion;})                        
        .rollup(function(leaves) { return leaves.length; })
        .entries(data);

    root = d3.hierarchy({values: anidados}, function(d) { return d.values; })
        .sum(function(d) { return d.value; })
        .sort(function(a, b) { return b.value - a.value; });

    var layout = partition(root);
    var descendants = layout.descendants();

    g.selectAll("path")
        .data(descendants)
        .enter().append("path")
        .attr("d", arc)
        .style("fill", function(d) {
            if(d.depth===0){return "#FFFFFF";}
            else{
                return color((d.children ? d : d.parent).data.key);
            }
        })
        .on("click", click)
        .append("title")
        .text(function(d) { 
            if(d.depth===0){return "Total\n" + formatNumber(d.value);}
            else{
                return d.data.key + "\n" + formatNumber(d.value);
            }
        });

    var legend_containers = g.selectAll(".legend-unit")
        .data(descendants.filter(function(d){
            if(d.children && d.data.key){
                return 1;
            }
        }))
        .enter().append("g")
        .attr("class","legend-unit");
        
    legend_containers.append("circle")
        .attr("cx",-50)
        .attr("cy",function(d,i){
            return ( i * 20 ) - 80;
        })
        .attr("r",10)
        .style("fill", function(d) {
            if(d.depth===0){return "#FFFFFF";}
            else{
                return color((d.children ? d : d.parent).data.key);
            }
        });

    legend_containers.append("text")
        .attr("x",20)
        .attr("y",function(d,i){
            return ( i * 20 ) - 80;
        })
        .text(function(d){
            return d.data.key;
        })
        .style("pointer-events","none");
});

function click(d) {

    if(d.children && !d.data.key){
        d3.selectAll(".legend-unit").transition().duration(750)
            .style("opacity",1.0)
            .style("display","block");
    }
    else{
        d3.selectAll(".legend-unit")
            .style("opacity",0.000001)
            .style("display","none");
    }

    g.transition()
        .duration(750)
        .tween("scale", function() {
            var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                yd = d3.interpolate(y.domain(), [d.y0, 1]),
                yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
            return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
        })
        .selectAll("path")
        .attrTween("d", function(d) { return function() { return arc(d); }; });
}


d3.select(self.frameElement).style("height", height + "px");