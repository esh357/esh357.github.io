# [Linguistic features visualization](esh357.github.io)

## Goal

This visualization was created to highlight the language diversity present in the world as
well as a motivation for you to learn a new language!

Section 1 displays statistics about language speakers in the world: what are the top
30 languages and how are the language families represented?

Section 2 allows you to browse 15 linguistic features thought a map of all languages, as well as a stacked barchart
of the feature distribution by region!

Section 3 enables you to pick two languages to compare or find the most similar language from a linguistic
perspective.

## Organization of the repo

`index.html` contains the single page application

### `data`
All the data required to load the visualization (data from wals.com and wikipedia).

### `css`
Simple css file for styling.

### `js`
- `main.js`: entire loading logic as well as interactivity
- `barChart.js`: js class for left visualization in section 1 (horizontal bar chart)
- `pieChart.js`: js class for right visualization in section 1 (donut chart)
- `stackedBarChart.js`: js class for bottom visualization in section 2 (vertical stacked bar chart)
- `tableTwoColumns.js`: js class for table visualization in section 3 (dynamic table)
- `worldMap.js`: js class for top visualization in section 2 (zoomable and draggable map)
