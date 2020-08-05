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
/* global document FileReader */

import {
	default as JSG,
	Point,
	Node,
	FormatAttributes,
	AddImageCommand,
	AddItemCommand,
	GraphUtils, Shape
} from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import ClientEvent from '../../ui/events/ClientEvent';
import ConnectionController from "../controller/ConnectionController";
import PortController from "../controller/PortController";
import GraphController from "../controller/GraphController";

/**
 * An InteractionActivator used to activate a {{#crossLink "LinkInteraction"}}{{/crossLink}}.
 *
 * @class ImageDropActivator
 * @extends InteractionActivator
 * @constructor
 */
class ImageDropActivator extends InteractionActivator {
	getKey() {
		return ImageDropActivator.KEY;
	}

	_findParentControllerAt(location, viewer) {
		const constraint = (controller) => {
			const model = controller.getModel();
			if (this._node) {
				if (
					!JSG.graphItemFactory.isValidSubItem(
						this._node,
						model.getType().getValue(),
						model
					)
				) {
					return false;
				}
			}


			return (
				model.isVisible() && model.isContainer() && !model.isProtected() &&
				!(controller instanceof ConnectionController) &&
				!(controller instanceof PortController) &&
				!(controller instanceof GraphController)
			);
		};

		if (viewer.getDefaultController()) {
			return viewer.getDefaultController();
		}
		return viewer.findControllerAt(location, Shape.FindFlags.AREA, constraint);
	}


	/**
	 * Returns the position of given event relative to given canvas.
	 *
	 * @method getPosition
	 * @param {ClientEvent} event The current event which provides location.
	 * @param {CoordinateSystem} cs The CoordinateSystem to use for translating event location.
	 * @param {Canvas} canvas The HTML5 canvas element.
	 * @return {Point} The event position relative to given canvas.
	 */
	getPosition(event, cs, canvas) {
		let pos;

		const getRelativeCoords = (levent) => {
			if (levent.offsetX !== undefined && levent.offsetY !== undefined) {
				return {
					x: levent.offsetX,
					y: levent.offsetY
				};
			}
			return {
				x: levent.layerX,
				y: levent.layerY
			};
		};

		if (event.event.clientX && event.event.clientY) {
			const canvasRectTrg = canvas.getBoundingClientRect();
			const canvasRectSrc = event.canvasRect;

			pos = getRelativeCoords(event.event);

			if (event.event.target.id !== canvas.id) {
				pos.x += canvasRectSrc.left - canvasRectTrg.left;
				pos.y += canvasRectSrc.top - canvasRectTrg.top;
			}

			ClientEvent.currentLocation.set(pos.x, pos.y);
		} else if (ClientEvent.currentLocation.x && ClientEvent.currentLocation.y) {
			pos = new Point(ClientEvent.currentLocation.x, ClientEvent.currentLocation.y);
		}

		return cs.deviceToLogPoint(pos);
	}

	onDragEnter(event, viewer, dispatcher) {
		event.event.dataTransfer.dropEffect = 'copy';
	}

	onDragOver(event, viewer, dispatcher) {
		event.event.dataTransfer.dropEffect = 'copy';
	}

	onDrop(event, viewer, dispatcher) {
		const node = new Node(new JSG.RectangleShape());
		this._node = node;
		const controller = this._findParentControllerAt(event.location.copy(), viewer);
		// if (controller === undefined) {
		// 	controller = viewer.getGraphController();
		// }
		if (controller) {
			const { files } = event.event.dataTransfer;
			// Array of all files
			const cs = viewer.getCoordinateSystem();

			const position = this.getPosition(event, viewer.getCoordinateSystem(), viewer.getCanvas(), false);
			viewer.translateFromParent(position);

			GraphUtils.traverseDown(viewer.getGraphView(), controller.getView(), (v) => {
				v.translateFromParent(position);
				return true;
			});

			for (let i = 0; i < files.length; i += 1) {
				const file = files[i];
				const reader = new FileReader();
				// finished reading file data.
				reader.onload = (e2) => {
					const id = `dataimage${JSG.imagePool.getNewId()}`;
					// TODO: need command to inform server
					// const image = JSG.imagePool.add(reader.result, id);
					const cmd = new AddImageCommand(id, reader.result);
					dispatcher.getInteractionHandler().execute(cmd);
					// loaded in execute
					const image = cmd._imageElement;

					image.onload = () => {
						node.setCenter(position.x, position.y);
						node.setSize(cs.deviceToLogXNoZoom(image.width), cs.deviceToLogYNoZoom(image.height));
						node.getFormat().setFillStyle(FormatAttributes.FillStyle.PATTERN);
						node.getFormat().setLineStyle(FormatAttributes.LineStyle.NONE);
						node.getFormat().setPattern(id);
						node.getItemAttributes().setContainer(false);
						if (controller.getView().checkMaximumImageDimensions(image)) {
							dispatcher.getInteractionHandler().execute(new AddItemCommand(node, controller.getModel()));
						}
					};
				};
				reader.readAsDataURL(file);
			}
		}
	}
	static get KEY() {
		return 'imagedrop.activator';
	}
}

export default ImageDropActivator;
