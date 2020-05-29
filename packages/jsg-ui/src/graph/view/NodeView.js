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
import { Arrays, default as JSG } from '@cedalo/jsg-core';
import GraphItemView from './GraphItemView';

/**
 * This view is for a {{#crossLink "Node"}}{{/crossLink}} model.</br>
 * The NodeView class maintains a list of {{#crossLink "PortView"}}{{/crossLink}}s as
 * additional sub views. Although it can be instantiated directly the recommended way to create
 * this view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 *
 * @class NodeView
 * @extends GraphItemView
 * @param {TextNode} item The corresponding TextNode model.
 * @constructor
 */
class NodeView extends GraphItemView {
	constructor(item) {
		super(item);

		this._portViews = [];
	}

	/**
	 * Adds given sub view to the list of PortViews.
	 *
	 * @method addPortView
	 * @param {PortView} view The PortView to add as sub view.
	 */
	addPortView(view) {
		this._portViews.push(view);
		view._parent = this;
	}

	/**
	 * Removes given sub view from the list of PortViews.
	 *
	 * @method removePortView
	 * @param {PortView} view The PortView to remove.
	 */
	removePortView(view) {
		const removed = Arrays.remove(this._portViews, view);
		if (removed) {
			view._parent = undefined;
		}
		return removed;
	}

	drawDecorations(graphics, rect) {
		super.drawDecorations(graphics, rect);

		const graph = this._item.getGraph();
		if (!graph) {
			return;
		}

		const settings = graph.getSettings();
		if (settings.getPortsVisible()) {
			this._portViews.forEach((port) => {
				port.draw(graphics);
			});
		}

		if (settings.getAvailablePortsVisible()) {
			const points = this._item.getShape().getValidPortLocations(this._item.isClosed(), false);
			if (points) {
				const tmprect = JSG.rectCache.get();
				graphics.setLineColor('#00FF00');
				graphics.setLineWidth(5);
				const size = graphics.getCoordinateSystem().metricToLogXNoZoom(400);

				points.forEach((point) => {
					tmprect.set(point.x - size / 2, point.y - size / 2, size, size);
					graphics.drawRect(tmprect);
				});
				JSG.rectCache.release(tmprect);
			}
		}

		const drawPin = (node, origin) => {
			const pin = node.getPin();
			const angle = node.getAngle().getValue();
			const pinpoint = pin.getPoint(JSG.ptCache.get());
			// graphics is already translated and rotated, so we have to adjust pinpoint:
			pinpoint.subtract(origin).rotate(-angle);
			// draw it...
			const tmprect = JSG.rectCache.get();
			tmprect.x = pinpoint.x - 200;
			tmprect.y = pinpoint.y - 200;
			tmprect.width = 400;
			tmprect.height = 400;
			graphics.setLineColor('#ff0000');
			graphics.drawEllipse(tmprect);
			JSG.rectCache.release(tmprect);
			JSG.ptCache.release(pinpoint);
		};
	}

	/*
	 _drawTestLines(graphics) {
	 var node = this._item;
	 var port = getFirstPort();
	 var edge = getFirstEdge(port);
	 if (edge === undefined) {
	 return;
	 }
	 var origin = port.getOrigin(JSG.ptCache.get());
	 var portpoint = port.getCenter(JSG.ptCache.get()).add(origin);
	 var nodeangle = node.getAngle().getValue();
	 var pinline = new Point(0, -1).setLength(2000);
	 pinline.x += portpoint.x;
	 graphics.setLineColor("#ff0000");
	 graphics.drawLine(portpoint, pinline);

	 var edgeangle = edge.getAngle().getValue();
	 var edgedirs = [];
	 edgedirs.push(new Point(0, -1));
	 edgedirs.push(new Point(1, 0));
	 edgedirs.push(new Point(0, 1));
	 edgedirs.push(new Point(-1, 0));
	 var colors = [];
	 colors.push("#00ff00");
	 colors.push("#0000ff");
	 colors.push("#00ffff");
	 colors.push("#dddddd");
	 for (var i = 0; i < edgedirs.length; i++) {
	 var edgeline = edgedirs[i].copy().setLength(1000).rotate(-nodeangle).rotate(edgeangle);
	 edgeline.add(portpoint);
	 graphics.setLineColor(colors[i]);
	 graphics.drawLine(portpoint, edgeline);
	 }
	 JSG.ptCache.release(origin, portpoint);

	 // //determine minAngle:
	 // var idx = 0;
	 // var idx2 = 0;
	 // var minAngle = 2 * 360;
	 // var minAngle2 = Math.PI * 1000;
	 // var odir = new Point(0, -1);
	 // for (var i = 0; i < edgedirs.length; i++) {
	 // var edgeline = edgedirs[i].copy().rotate(-nodeangle).rotate(edgeangle).setLength(2000);
	 // edgeline.x += pinline.x;
	 // var angle = MathUtils.getAngleBetweenLines(pinline, edgeline, portpoint);
	 // var angle2degrees = (360 + MathUtils.toDegrees(angle)) % 360;
	 // angle2degrees = (angle2degrees < 180) ? angle2degrees : 360 - angle2degrees;
	 // if(angle2degrees < minAngle) {
	 // minAngle = angle2degrees;
	 // idx = i;
	 // }
	 // //var angle2 = MathUtils.getAngleBetweenPoints(odir,
	 //  edgedirs[i].copy().rotate(-nodeangle).rotate(edgeangle));
	 // var angle2 = MathUtils.getAngleBetweenLines(odir,
	 //  edgedirs[i].copy().rotate(-nodeangle).rotate(edgeangle), new Point(0, 0));
	 // angle2 = Math.abs(angle2);
	 // if(angle2 < minAngle2) {
	 // minAngle2 = angle2;
	 // idx2 = i;
	 // }
	 // }
	 // if(!edgedirs[idx2].isEqualTo(layouterdir)) {
	 // console.log("DIFFERENT DIRECTION!!!");
	 // console.log("  => layouter: "+layouterdir.toString());
	 // console.log("  => view: "+edgedirs[idx2].toString());
	 // } else {
	 // console.log("orthodir: "+edgedirs[idx2].toString());
	 // }

	 function getFirstPort() {
	 var ports = node.getPorts();
	 return ports.length > 0 ? ports[0] : undefined;
	 }

	 function getFirstEdge(_port) {
	 if (_port != undefined) {
	 var edges = _port.getEdges();
	 return edges.length > 0 ? edges[0] : undefined;
	 }
	 return undefined;
	 }

	 };
	 */
}

export default NodeView;
