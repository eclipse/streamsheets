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
const JSG = require('../../JSG');
const Command = require('./Command');
const Point = require('../../geometry/Point');
const GraphUtils = require('../GraphUtils');

/**
 * This command is used by {{#crossLink "DragDropInteraction"}}{{/crossLink}}
 * to drop a custom {{#crossLink "GraphItem"}}{{/crossLink}} from a
 * {{#crossLink "ShapeLibrary"}}{{/crossLink}} to a {{#crossLink
 * "GraphEditor"}}{{/crossLink}}.</br> To configure this command an options object should be passed to the
 * constructor which has following properties:
 * <code>
 *  libId: {String} the item library id,
 *  libName: {String} the item library name,
 *  newPinPoint: {Point} the new pin location as point,
 *  target: {ModelController} the target controller to drop item at,
 *  editor: {GraphEditor} the graph editor to perform the drop on,
 *  angle: {Number} optional start angle of dropped item, by default it is 0. Set to -1 to apply the
 *               angle of drop target.
 *  insertIndex: {Number} the index to insert at. Only useful for targets which have a {{#crossLink
 * "ContainerLayout"}}{{/crossLink}}.
 * </code>
 *
 * @class DropItemCommand
 * @extends Command
 * @constructor
 * @param {Object} options The options object to configure this command.
 */
class DropItemCommand extends Command {
	constructor(options) {
		super();

		this._editor = options.editor;
		this._target = options.target;
		this._libId = options.libId;
		this._libName = options.libName;
		this._newPinPoint =
			options.newPinPoint !== undefined
				? options.newPinPoint
				: new Point(0, 0);
		this._model = options.target.getModel();
		this._angle = options.angle !== undefined ? options.angle : 0;
		this._nodes = [];
	}

	restoreStateAfterRedo(viewer) {
		// simply select dropped nodes:
		if (this._nodes.length > 0) {
			this.selectAll(this._nodes, viewer);
		}
	}

	getItems() {
		return this._nodes;
	}

	undo() {
		this._nodes.forEach((item) => {
			this._model.removeItem(item);
		});
	}

	redo() {
		this._nodes.forEach((item) => {
			this._model.addItem(item);
		});
	}

	checkItem(item) {
		const size = item.getSizeAsPoint(JSG.ptCache.get());
		const minsize = item.getMinSize();
		size.x = size.x < minsize ? 3000 : size.x;
		size.y = size.y < minsize ? 1000 : size.y;
		item.setSizeToPoint(size);
		JSG.ptCache.release(size);
	}

	execute() {
		const viewer = this._editor._graphViewer;
		viewer.getGraphView().clearFeedback();

		JSG.idUpdater.start();

		const item = JSG.graphItemFactory.createItemFromString(this._libId);
		if (item) {
			this.checkItem(item);
			this._nodes.push(item);
			// item.setSize(3000, 1000);
		} else {
			this._nodes = JSG.graphItemFactory.createShape(this._libId);
		}

		if (this._nodes.length < 1) {
			return;
		}

		const origin = this._newPinPoint.copy();
		const graph = this._editor.getGraph();
		const rootView = viewer.rootController.getView();

		JSG.setDrawingDisabled(true);

		viewer.clearSelection();

		const p = this._nodes[0].getPinPoint();
		let angle = this._angle;

		// translate origin to meet our parent coordinatesystem:
		GraphUtils.traverseDown(rootView, this._target.getView(), (v) => {
			angle -= v.getAngle();
			v.translateFromParent(origin);
			return true;
		});

		angle = this._angle !== -1 ? angle : 0;

		let pn;
		let offset;

		this._nodes.forEach((node) => {
			node.setAngle(angle);

			// set origin
			pn = node.getPinPoint();
			offset = new Point(
				pn.x - (p.x - origin.x),
				pn.y - (p.y - origin.y)
			);
			node.setPinPointTo(offset);
			this._model.addItem(node);
		});

		JSG.idUpdater.end(graph);

		let selController;

		JSG.setDrawingDisabled(false);

		// DON'T select here because we select onMouseUp in canvas on drop target too!! (GraphInteraction.onMouseUp ->
		// MarqueeActivator.onMouseUp) => and that would change selection to a possible inner label!! => so simply
		// comment out because we only have single nodes here anyway...
		this._nodes.forEach((node) => {
			selController = this._target.getModelController(node);
			viewer.select(selController);
		});

		graph.setChanged(true);
		this._editor.invalidate();
		// pass focus to target canvas so subsequent key events are noticed:
		this._editor
			.getGraphicSystem()
			.getCanvas()
			.focus();
	}
}

module.exports = DropItemCommand;
