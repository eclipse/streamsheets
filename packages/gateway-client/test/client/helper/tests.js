const {
	JSONToGraph
} = require('./helper');

const graphJSON = require('./graph');

const graph = JSONToGraph(JSON.stringify(graphJSON));
console.log(graph.getItemAt(0).getStreamSheet());
