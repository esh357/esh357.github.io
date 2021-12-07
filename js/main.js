d3.csv("data/language_stats.csv").then(data => {

    console.log(data)
    data.forEach(function (e) {
        e["Speakers"] = parseFloat(e["Speakers (millions)"], 10);
    })

    speakersGraph = new BarChart("stat-graph-one", data, 40.0);
    speakersPieChart = new PieChart("stat-graph-two", data)
});

// Create a 'data' property under the window object
// to store the coffee chain data
Object.defineProperty(window, 'data', {
    // data getter
    get: function () {
        return _data;
    },
    // data setter
    set: function (value) {
        _data = value;
        // update the visualization each time the data property is set by using the equal sign (e.g. data = [])
        updateVisualizationSection2()
        updateVisualizationSection3()
    }
});

let map;
let stackedChart;
let table;
var similarities = {};
var languages;
d3.csv("data/language_features.csv").then(data => {
    console.log('Data loaded');
    console.log(data);

    // Get all features and populate dropdown
    not_features = ["wals_code", "iso_code", "glottocode", "name",
        "latitude", "longitude", "genus", "family", "macroarea", "countrycodes"];

    var features = new Set(data.columns);
    not_features.forEach(function (e) {
        features.delete(e);
    });
    features = Array.from(features);
    console.log(features);

    var list = document.getElementById("choice-feature");
    for (var i = 0; i < features.length; i++) {
        // EXAMPLE: <option value="feature">feature</option>
        var value = features[i];
        var option = document.createElement("option");
        option.value = value;
        option.text = value;
        list.appendChild(option);
    }

    d3.select("#choice-feature").on("change", updateVisualizationSection2);

    d3.json("data/world-110m2.json").then(function (d) {
        console.log("World data:")
        console.log(d);

        let value = d3.select("#choice-feature").property("value");
        map = new WorldMap("map", d, data, value);
        stackedChart = new stackedBarChart("feature-graph-one", data, value);
    });

    // compute number of features per languages
    var nb_features = {}
    data.forEach(function (e) {
        nb_features[e.name] = 0
        features.forEach(function (f) {
            if (e[f] != "") {
                nb_features[e.name] += 1
            }
        })
    });

    // we filter out all languages that have less than 8 features
    languages = Array.from(new Set(d3.map(data, d => d.name))).filter(l => nb_features[l] >= 8);
    var languages_set = new Set(languages);

    // compute similarity between all languages O(F*N^2) (with F nb of features, N the number of languages after filtering)
    data.forEach(function (d1) {
        var l1 = d1.name;
        if (languages_set.has(l1)) {
            similarities[l1] = {}
            data.forEach(function (d2) {
                var l2 = d2.name;
                if (languages_set.has(l2) && l1 != l2) {
                    features.forEach(function (f) {
                        if (d1[f] != '' && d2[f] != '') {
                            if (!(l2 in similarities[l1])) {
                                similarities[l1][l2] = {
                                    "total": 0,
                                    "value": 0
                                };
                            }
                            if (d1[f] == d2[f]) {

                                similarities[l1][l2].value += 1;
                            }
                            similarities[l1][l2].total += 1;
                        }
                    })
                }
            })
        }

    })

    var list = document.getElementById("choice-lang1");
    for (var i = 0; i < languages.length; i++) {
        // EXAMPLE: <option value="feature">feature</option>
        var value = languages[i];
        var option = document.createElement("option");
        option.value = value;
        option.text = value;
        list.appendChild(option);
    }

    var list = document.getElementById("choice-lang2");
    for (var i = 0; i < languages.length; i++) {
        // EXAMPLE: <option value="feature">feature</option>
        var value = languages[i];
        var option = document.createElement("option");
        option.value = value;
        option.text = value;
        if (i == 3) {
            option.selected = "selected";
        }
        list.appendChild(option);
    }


    d3.select("#choice-lang1").on("change", updateVisualizationSection3);
    d3.select("#choice-lang2").on("change", updateVisualizationSection3);

    // language-learning part
    table = new tableTwoColumns("learning-graph-one", data, languages, features)
});

function get_top_languages(l, th = 0) {
    let simil = similarities[l];
    let maxSim = Math.max(...Object.values(simil).map(e => e.value));
    var res = []

    for (let [key, value] of Object.entries(simil)) {
        if (value.value >= maxSim - th) {
            res.push(key);
        }
    }
    return res;
}

function updateVisualizationSection2() {
    let valueFeature = d3.select("#choice-feature").property("value");
    // update iframe
    let nbFeature = valueFeature.substring(0, valueFeature.indexOf(' ')-1);
    document.getElementById("frameFeatureWals").setAttribute("src", "https://wals.info/chapter/"+nbFeature)
    // update all data visualizations
    map.feature = valueFeature;
    map.wrangleData();
    stackedChart.feature = valueFeature;
    stackedChart.wrangleData();
}

function updateVisualizationSection3() {
    let valueLang1 = d3.select("#choice-lang1").property("value");
    table.language1 = valueLang1;
    let valueLang2 = d3.select("#choice-lang2").property("value");
    table.language2 = valueLang2;
    table.wrangleData();
}

function similarLanguageUpdate() {
    var th = 1;
    let valueLang1 = d3.select("#choice-lang1").property("value");
    var otherLanguages = get_top_languages(valueLang1, th);

    while (otherLanguages.length <= 2) {
        th += 1;
        otherLanguages = get_top_languages(valueLang1, th);
    }

    var list = document.getElementById("choice-lang2");
    d3.select("#choice-lang2").selectAll('option').remove();
    for (var i = 0; i < otherLanguages.length; i++) {
        // EXAMPLE: <option value="feature">feature</option>
        var value = otherLanguages[i];
        var option = document.createElement("option");
        option.value = value;
        if (similarities[valueLang1][value].total != 0) {
            var percentage = similarities[valueLang1][value].value / similarities[valueLang1][value].total * 100.0
            option.text = value + ' (' + d3.format(".2s")(percentage) + "%)";
        } else {
            option.text = value;
        }

        if (i == 1) {
            option.selected = "selected";
        }
        list.appendChild(option);
    }

    d3.select("#languagePickLabel").node().innerHTML = "Second language (% similarity)";

    updateVisualizationSection3()

}

function resetLanguageUpdate() {

    var list = document.getElementById("choice-lang2");
    d3.select("#choice-lang2").selectAll('option').remove();
    for (var i = 0; i < languages.length; i++) {
        // EXAMPLE: <option value="feature">feature</option>
        var value = languages[i];
        var option = document.createElement("option");
        option.value = value;
        option.text = value;
        if (i == 3) {
            option.selected = "selected";
        }
        list.appendChild(option);
    }
    d3.select("#languagePickLabel").node().innerHTML = "Second language";

    updateVisualizationSection3()
}
