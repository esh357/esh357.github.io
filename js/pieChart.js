/* * * * * * * * * * * * * *
*         PieChart         *
* * * * * * * * * * * * * */

class PieChart {

    // constructor method to initialize Timeline object
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.aggField = "Language family";
        this.title = "Distribution of speakers by language family"

        // call initVis method
        this.initVis()
    }

    initVis() {
        let vis = this;

        // margin conventions
        vis.margin = {top: 40, right: 50, bottom: 10, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.radius = Math.min(vis.width, vis.height) / 2 - vis.margin.top

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // add title
        vis.svg.append('g')
            .attr('class', 'title pie-title')
            .append('text')
            .text(vis.title)
            .attr('transform', `translate(${vis.width / 2}, 0)`)
            .attr('text-anchor', 'middle');

        // pie chart setup
        vis.pieChartGroup = vis.svg
            .append('g')
            .attr('class', 'pie-chart')
            .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")");

        // Define a default pie layout
        vis.pie = d3.pie().value(d => d.value);

        // Ordinal color scale (10 default colors)
        vis.color = d3.scaleOrdinal(d3.schemePaired);

        // Pie chart settings
        vis.outerRadius = vis.width / 2;
        vis.innerRadius = 0;      // Relevant for donut charts

        // Path generator for the pie segments
        vis.arc = d3.arc()
            .innerRadius(vis.innerRadius)
            .outerRadius(vis.outerRadius);

        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'pieTooltip')

        // call next method in pipeline
        this.wrangleData();
    }

    // wrangleData method
    wrangleData() {
        let vis = this;

        vis.displayData = {}

        vis.data.forEach(function(d){
            var key = d[vis.aggField];
            if (key in vis.displayData) {
                vis.displayData[key]["value"] += d.Speakers;
            } else {
                vis.displayData[key] = {
                    "key": d[vis.aggField],
                    "value": d.Speakers,
                    "color": "#" + ((1<<24)*Math.random() | 0).toString(16)
                };
            }
        })

        vis.displayData = Object.values(vis.displayData);
        // console.log(vis.displayData)

        vis.updateVis()

    }

    // updateVis method
    updateVis() {
        let vis = this;

        // Bind data
        vis.arcs = vis.pieChartGroup.selectAll(".arc")
            .data(vis.pie(vis.displayData))

        // Append paths
        vis.arcs.enter()
            .append("path")
            .attr("d", vis.arc
                .innerRadius(200)
                .outerRadius(vis.radius))
            .style("fill", function(d) { return vis.color(d.value); })
            .on('mouseover', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', 'rgba(173,222,255,0.62)')

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                         <div style="border-radius: 5px; background: ${hex2rgba(vis.color(d.data.value), .4)}; padding: 20px">
                             <h5>Category: ${d.data.key}</h5>
                             <p>Speakers (millions): ${d3.format(".3s")(d.data.value)}</p>                             
                         </div>`
                    );
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .attr("fill", d => d.data.color)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })

    }
}
// const hex2rgba = (hex, alpha = 1) => {
//     const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
//     return `rgba(${r},${g},${b},${alpha})`;
// };