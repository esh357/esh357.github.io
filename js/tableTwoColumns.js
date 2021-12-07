class tableTwoColumns {

    constructor(parentElement, data, languages, features) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = this.data;
        this.languages = languages;
        this.features = features;
        this.language1 = this.languages[0];
        this.language2 = this.languages[3];
        this.nan = "NaN";

        this.initVis();
    }

    /*
     * Initialize visualization (static content; e.g. SVG area, axes)
     */

    initVis() {
        let vis = this;

        vis.margin = {top: 40, right: 40, bottom: 100, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 750 - vis.margin.top - vis.margin.bottom;

        vis.table = d3.select("#"+vis.parentElement).append('div').attr('id', 'tableContainer');

        // (Filter, aggregate, modify data)
        vis.filteredData = {};
        vis.data.forEach(function(e){
            let name = e['name'];
            if (vis.languages.includes(name)) {
                vis.filteredData[name] = {
                    'name': name
                }
                vis.features.forEach(function(f){
                    var new_f = f.substr(f.indexOf(' ')+1);
                    vis.filteredData[name][new_f] = e[f] != "" ? e[f].substring(2, e[f].length) : vis.nan;
                })
            }
        })

        vis.columns = ["Feature", vis.language1, vis.language2]

        // console.log("Filtered data:")
        // console.log(vis.filteredData)

        vis.wrangleData();
    }

    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        vis.displayData = []
        vis.features.forEach(function(f){
            var f = f.substr(f.indexOf(' ')+1)
            if (vis.filteredData[vis.language1][f] != vis.nan && vis.filteredData[vis.language2][f] != vis.nan){
                vis.displayData.push({
                    name: f,
                    language1: vis.filteredData[vis.language1][f],
                    language2: vis.filteredData[vis.language2][f],
                    same: vis.filteredData[vis.language1][f] == vis.filteredData[vis.language2][f]
                })
            }
        })

        console.log(vis.displayData);

        vis.columns = ["Feature", vis.language1, vis.language2]

        // Update the visualization
        vis.updateVis();
    }

    /*
     * The drawing function - should use the D3 update sequence (enter, update, exit)
     */

    updateVis() {
        let vis = this;

        // remove all
        d3.select('#tableContainer').selectAll('*').remove();

        // Add table in new div(s)
        vis.tableEnter = vis.table.append('table')
            .attr('class', 'table table-condensed table-bordered');

        // Append table head in new table(s)
        vis.tableEnter.append('thead')
            .append('tr')
            .selectAll('th')
            // Table column headers (here constant, but could be made dynamic)
            .data(vis.columns)
            .enter().append('th')
            .text(d => d);

        // Append table body in new table(s)
        vis.tbody = vis.tableEnter.append('tbody');

        vis.tbody = vis.tbody.selectAll("tr")
            .data(vis.displayData, d => d.name + d.same)
            .enter()
            .append("tr")
            .attr("class", d => d.same ? "" : "different_row")
            .merge(vis.tbody)

        vis.tbody.selectAll("td")
            .data(d => [d.name, d.language1, d.language2])
            .enter()
            .append("td")
            .text(d => d)
    }
}
