class stackedBarChart {

    constructor(parentElement, data, feature) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = this.data;
        this.feature = feature;

        this.transition_time = 300;
        this.stepSize = 10;
        this.colorChart = 'blue';

        this.initVis();
    }

    /*
     * Initialize visualization (static content; e.g. SVG area, axes)
     */

    wrap(text, width) {
        text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 40, right: 40, bottom: 100, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 750 - vis.margin.top - vis.margin.bottom;

        vis.x = d3.scaleBand()
            .rangeRound([0, vis.width]).padding(0.1);
        vis.y = d3.scaleLinear()
            .rangeRound([vis.height, 0]);
        vis.colorRange = d3.scaleOrdinal(d3.schemePaired);
        vis.color = d3.scaleOrdinal(vis.colorRange.range());
        vis.xAxis = d3.axisBottom(vis.x)
        vis.yAxis = d3.axisLeft(vis.y)
            .tickFormat(d3.format(".0%"));

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.divTooltip = d3.select("body").append("div").attr("class", "toolTip");
        var unique = Array.from(new Set(d3.map(vis.data, d => d[vis.feature].length > 0 ? d[vis.feature].substring(2, d[vis.feature].length) : "").filter(e => e != '')));
        vis.color.domain(unique);

        vis.legend = d3.legendColor()
            .shapeWidth(vis.width/unique.length)
            .shapePadding(10)
            .orient('horizontal')
            .scale(vis.color);

        vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis")

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        vis.displayData = {};
        vis.data.forEach(function(e){
            let val = e[vis.feature].substring(2, e[vis.feature].length);
            let area = e['macroarea'];
            // "eurasia": {"name": "eurasia", "type1": 1, "type2": 5, ...}
            if (area !== "" && val !== ""){
                if (area in vis.displayData) {
                    if (val in vis.displayData[area]) {
                        vis.displayData[area][val] += 1;
                    } else {
                        vis.displayData[area][val] = 1;
                    }
                } else {
                    vis.displayData[area] = {"name": area}
                }
            }
        })

        // convert to array
        vis.displayData = Object.values(vis.displayData);

        vis.displayData.forEach(function(e){
            e['total'] = 0;
            Object.keys(e).filter(l => l !== 'name' && l !== 'total').forEach(function(a){
                if (e[a] !== "") {
                    e['total'] += e[a];
                }
            })
        })

        // normalization
        vis.displayData.forEach(function(e){
            Object.keys(e).filter(l => l !== 'name' && l !== 'total').forEach(function(a){
                if (e[a] !== "") {
                    e[a] /= e['total'];
                }
            })
        })

        var unique_ = Array.from(new Set(d3.map(vis.data, d => d[vis.feature].length > 0 ? d[vis.feature] : "").filter(e => e != '')));
        var rank = unique_.map(s => s.substr(0,s.indexOf(' ')));
        vis.unique = unique_.map(s => s.substr(s.indexOf(' ')+1));

        vis.unique.sort((a, b) => rank[vis.unique.indexOf(a)] - rank[vis.unique.indexOf(b)])

        vis.displayData.forEach(function(d) {
            var y0 = 0;
            d.values = vis.unique.map(function(name) { return {name: name, y0: y0,
                y1: y0 += + (name in d ? d[name] : 0)
            }; });
            // d.total = d.values[d.values.length - 1].y1;
        });

        // Update the visualization
        vis.updateVis();
    }

    /*
     * The drawing function - should use the D3 update sequence (enter, update, exit)
     */

    updateVis() {
        let vis = this;

        // var unique_shorten = Array.from(new Set(d3.map(vis.data, d => d[vis.feature].length > 0 ? d[vis.feature].substring(2, d[vis.feature].length) : "").filter(e => e != '')));
        vis.color.domain(vis.unique);

        vis.x.domain(vis.displayData.map(function(d) { return d.name; }));
        vis.y.domain([0.0, 1.0]);

        vis.svg.select('.x-axis')
            .call(vis.xAxis);

        vis.svg.select('.y-axis')
            .call(vis.yAxis);

        vis.svg.selectAll(".bar").remove();

        vis.bar = vis.svg.selectAll(".bar")
            .data(vis.displayData)
            .enter().append("g")
            .attr("class", "bar")
            .attr("transform", function(d) { return "translate(" + vis.x(d.name) + ",0)"; });

        vis.svg.selectAll(".x-axis .tick text")
            .call(vis.wrap, vis.x.bandwidth());

        vis.bar_enter = vis.bar.selectAll("rect")
            .data(d => d.values)
            .enter();

        vis.bar_enter.append("rect")
            .attr("width", vis.x.bandwidth())
            .attr("y", d => vis.y(d.y1))
            .attr("height", d => vis.y(d.y0) - vis.y(d.y1))
            .style("fill", d => vis.color(d.name));

        vis.bar_enter.append("text")
            .filter(d => (d.y1-d.y0) !== 0.0)
            .text(function(d) { return d3.format(".2s")((d.y1-d.y0)*100.0)+"%"; })
            .attr("y", function(d) { return vis.y(d.y1)+(vis.y(d.y0) - vis.y(d.y1))/2+ 5; })
            .attr("x", vis.x.bandwidth()/2 - vis.x.bandwidth()/15)
            .style("fill", '#ffffff');

        vis.bar
            .on("mousemove", function(event, d){
                vis.divTooltip.style("left", event.pageX+10+"px");
                vis.divTooltip.style("top", event.pageY-25+"px");
                vis.divTooltip.style("display", "inline-block");
                var elements = document.querySelectorAll(':hover');
                let l = elements.length-1;
                let element = elements[l].__data__;
                let value = element.y1 - element.y0;
                vis.divTooltip.html("<br>"+vis.feature.substr(vis.feature.indexOf(' ')+1)+": "+element.name+"<br>"+d3.format(".2s")(100.0*value)+"% of "+d.name);
                vis.divTooltip.style("background", hex2rgba(vis.color(element.name), 0.5));
            })
            .on("mouseout", function(d){
                vis.divTooltip.style("display", "none");
            });

        vis.bar.exit().remove();

        vis.legend.shapeWidth(vis.width/vis.unique.length - 7)

        vis.svg.append("g")
            .attr("class", "legendLinear")
            .attr("transform", "translate(0,"+(vis.height+30)+")");

        vis.svg.select(".legendLinear")
            .call(vis.legend);
    }
}

const hex2rgba = (hex, alpha = 1) => {
    const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
};
