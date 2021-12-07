

/*
 * BarChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data				-- the dataset 'languages_stats'
 */


class WorldMap {

    constructor(parentElement, world_topology, data, feature) {
        this.parentElement = parentElement;
        this.topology = world_topology;
        this.data = data;
        this.feature = feature;
        this.displayData = this.data;
        this.circleSize = 4;

        this.initVis();
    }

    /*
     * Initialize visualization (static content; e.g. SVG area, axes)
     */

    initVis() {
        let vis = this;

        // * TO-DO *
        vis.margin = {top: 0, right: 0, bottom: 0, left: 0};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.center = [vis.width / 2, vis.height / 2];

        vis.projection = d3.geoMercator()
            .center([-60, 40]).scale([220]);

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            // .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.group = vis.svg.append("g");

        vis.colorScale = d3.scaleOrdinal()
            .range(d3.schemePaired);

        vis.colorLegendG = vis.svg.append('g')
            .attr('class', 'legendPanel')
            .attr('transform', `translate(${vis.width - vis.margin.right - 400}, 150)`);

        vis.legend_text = vis.colorLegendG.append('text')
            .attr('class', 'legend-label')
            .attr('x', 10)
            .attr('y', -40);

        vis.colorLegend = d3.legendColor()
            .scale(vis.colorScale)
            .shape('circle');

        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.zoom = d3.zoom()
            .scaleExtent([1, 12])
            .on('zoom', function(event) {
                vis.group.selectAll('path')
                    .attr('transform', event.transform);
                vis.svg.selectAll("circle.mapCircle")
                    .attr('transform', event.transform)
                    .attr('r', vis.circleSize / event.transform.k);
            });

        vis.tip = d3.tip().attr('class', 'd3-tip').html(
            (event,d) => `<span class="tooltip-title">${d.name}</span><br><span class="tootltip-value">${d.value}</span>`
        );

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        vis.globalIteration += 1;
        vis.displayData = [];
        vis.data.forEach(function(e){
            var val = e[vis.feature];
            var name = vis.feature.substring(4, vis.feature.length) + ": " + val.substring(2, val.length);
            if (val != ""){
                vis.displayData.push({
                    "name": e['name'],
                    "value": name,
                    "raw_value": val.substring(2, val.length),
                    "longitude": e['longitude'],
                    "latitude": e['latitude'],
                })
            }
        })

        var unique_ = Array.from(new Set(d3.map(vis.data, d => d[vis.feature].length > 0 ? d[vis.feature] : "").filter(e => e != '')));
        var rank = unique_.map(s => s.substr(0,s.indexOf(' ')));
        vis.unique = unique_.map(s => s.substr(s.indexOf(' ')+1));
        vis.unique.sort((a, b) => rank[vis.unique.indexOf(a)] - rank[vis.unique.indexOf(b)])


        // Update the visualization
        vis.updateVis();
    }

    /*
     * The drawing function - should use the D3 update sequence (enter, update, exit)
     */

    updateVis() {
        let vis = this;

        vis.svg.call(vis.zoom);
        vis.svg.call(vis.tip);
        vis.colorValue = d => d.raw_value;

        vis.colorScale.domain(vis.unique)

        vis.group.selectAll("path")
            .data(topojson.object(vis.topology, vis.topology.objects.countries).geometries)
            .enter()
            .append("path")
            .attr("d", vis.path);

        var mouseover = function(d) {
            vis.tooltip.style("opacity", 1)
        }

        vis.circles = vis.group.selectAll("circle.mapCircle")
            .data(vis.displayData, d => vis.feature + d.value)

        vis.circles.enter()
            .append("circle")
            .attr("class", "mapCircle")
            .attr("cx", function (d) {
                return vis.projection([d.longitude, d.latitude])[0];
            })
            .attr("cy", function (d) {
                return vis.projection([d.longitude, d.latitude])[1];
            })
            .attr("r", vis.circleSize)
            .attr('fill', d => vis.colorScale(vis.colorValue(d)))
            .on('mouseover', vis.tip.show)
            .on('mouseout', vis.tip.hide)
            .merge(vis.circles);

        vis.circles.exit().remove();

        vis.colorLegendG.call(vis.colorLegend)
            .selectAll('.cell text')
            .attr('dy', '0.1em');

        vis.legend_text.merge(vis.legend_text).text(vis.feature);

    }
}