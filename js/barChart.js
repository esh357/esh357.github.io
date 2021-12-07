

/*
 * BarChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data				-- the dataset 'languages_stats'
 */


class BarChart {

	constructor(parentElement, data, min_threshold) {
		this.parentElement = parentElement;
		this.data = data;
		this.displayData = this.data;
		this.min_threshold = min_threshold;

		this.transition_time = 300;
		this.stepSize = 10;

		this.initVis();
	}

	/*
	 * Initialize visualization (static content; e.g. SVG area, axes)
	 */

	initVis() {
		let vis = this;

		// * TO-DO *
		vis.margin = {top: 40, right: 40, bottom: 40, left: 100};
		vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
		vis.height = 750 - vis.margin.top - vis.margin.bottom;

		// SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement)
			.append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

		vis.svg.append("text")
			.text("Number of speakers per language")
			.attr("x", -50)
			.attr("y", -10)

		// Scales and axes

		vis.color = d3.scaleOrdinal(d3.schemePaired);

		vis.y = d3.scaleBand().range([0, vis.height]);

		vis.x = d3.scaleLinear()
			.range([0, vis.width]);

		vis.xAxis = d3.axisBottom()
			.scale(vis.x);

		vis.yAxis = d3.axisLeft()
			.scale(vis.y);

		vis.svg.append("g")
			.attr("class", "y-axis axis");

		// (Filter, aggregate, modify data)
		vis.wrangleData();
	}

	/*
	 * Data wrangling
	 */

	wrangleData() {
		let vis = this;

		vis.displayData = vis.displayData.filter(function(d){
			return d['Speakers'] >= vis.min_threshold;
		})

		console.log("BarChart data:")
		console.log(vis.displayData)

		// sorting by config
		vis.displayData.sort(function(x, y){
			return d3.descending(x.Speakers, y.Speakers);
		})

		// Update the visualization
		vis.updateVis();
	}

	/*
	 * The drawing function - should use the D3 update sequence (enter, update, exit)
	 */

	updateVis() {
		let vis = this;

		// * TO-DO *
		vis.y.domain(vis.displayData.map(d => d.Language))
		vis.x.domain([0, d3.max(vis.displayData, d => d.Speakers)])

		// Add rectangles / bar chart
		let rectangles = vis.svg.selectAll(".rectangles")
			.data(vis.displayData)

		rectangles.enter().append("rect")
			.attr("class", "rectangles")
			.attr("fill", d => vis.color(d["Language family"]))
			.attr("x", 0)
			.attr("y", d => vis.y(d.Language) + vis.stepSize/2)
			.attr("width", d => vis.x(d.Speakers))
			.attr("height", vis.y.bandwidth() - vis.stepSize);

		// add value label to each chart bar
		let labels = vis.svg.selectAll(".labels")
			.data(vis.displayData)

		labels.enter().append("text")
			.attr("class", "labels")
			.text( d => d.Speakers )
			.attr("x", d => 10 + vis.x(d.Speakers))
			.attr("y", d => vis.y(d.Language) + vis.y.bandwidth()/2 + vis.stepSize/2)

		// Update the x-axis
		vis.svg.select(".y-axis").call(vis.yAxis);
	}
}
