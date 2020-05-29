/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
'use strict';
const JSG = require('..');
const JSONWriter = require('../src/commons/JSONWriter');
const XMLWriter = require('../src/commons/XMLWriter');
const Graph = require('../src/graph/model/Graph');
const Node = require('../src/graph/model/Node');
const RectangleShape = require('../src/graph/model/shapes/RectangleShape');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4000 });

var connections = new Map();
var connectionIDCounter = 0;

// create server Graph
let graph = new Graph();
let node = graph.addItem(new Node(new RectangleShape()));
node.getPin().setCoordinate(3000, 3000);
node.setSize(5000, 3000);
node = graph.addItem(new Node(new RectangleShape()));
node.getPin().setCoordinate(6000, 8000);
node.setSize(5000, 3000);
// console.log(graph.getItemAt(0).getTextSubItem().getText().getValue());

wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		// command send from client
		// update server graph
		let data = JSON.parse(message);
		if (data === undefined) {
			return;
		}

		if (data.selection) {
			console.log(message);
			ws.selection = message;
		} else {
			if (!executeCommands(data)) {
				return;
			}
		}

		// broadcast changes
		wss.clients.forEach(function each(client) {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		});

		console.log(message);
	});

	ws.id = connectionIDCounter++;
	connections[ws.id] = ws;

	ws.send('connected');

	let file = new JSONWriter();
	file.writeStartDocument();
	graph.save(file);
	file.writeEndDocument();
	let stream = file.flush();

	ws.send(stream);

	wss.clients.forEach(function each(client) {
		if (client !== ws && client.readyState === WebSocket.OPEN) {
			ws.send(client.selection);
		}
	});
});

function executeCommands(command) {

	console.log('command', command.name);

	if (command.commands) {
		command.commands.forEach(function (subcommand) {
			executeCommands(subcommand);
		});
	} else {
		// change server graph
		let cmd = JSG.commandFactory.createCommand(graph, command);
		if (cmd === undefined) {
			console.log('unknown command received: %s', command.name);
			return false;
		} else {
			cmd.execute();
		}
	}

	return true;
}


