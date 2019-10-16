'use strict';

var JSG_HOME = "../dist/lib";

/**
 * Handler, called, when scripts are loaded
 */
function onLoaded() {
    // initialize library
    JSG.init(JSG_HOME);

    // create a graph editor and attach it to the canvas element
    var graphEditor = new GraphEditor("canvas1");

    var graph = new Graph();
    // create a graph and attach it to the graph editor
    graphEditor.setGraph(graph);

    // create a simple node
    var node = graph.addItem(new Node(new RectangleShape()));
    node.getPin().setCoordinate(3000, 3000);
    node.setSize(5000, 3000);
    node.addLabel("My first Node");

    // initial resize
    var canvas = document.getElementById("canvas1");
    graphEditor.resizeContent(canvas.width, canvas.height);
}


