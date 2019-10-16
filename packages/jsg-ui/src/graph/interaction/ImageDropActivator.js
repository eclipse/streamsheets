/* global document FileReader */

import {
	default as JSG,
	Point,
	Node,
	FormatAttributes,
	AddImageCommand,
	AddItemCommand,
	GraphUtils
} from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import ClientEvent from '../../ui/events/ClientEvent';

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

	_condition(controller) {
		const model = controller.getModel();
		return model.isVisible() && model.isContainer();
	}

	_getControllerAt(location, dispatcher) {
		const controller = dispatcher.getControllerAt(location, undefined, this._condition);
		return controller;
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
		let controller = this._getControllerAt(event.location, dispatcher);
		if (controller === undefined) {
			controller = viewer.getGraphController();
		}
		if (controller) {
			const node = new Node(new JSG.RectangleShape());
			if (
				!JSG.graphItemFactory.isValidSubItem(
					node,
					controller
						.getModel()
						.getType()
						.getValue(),
					controller.getModel()
				)
			) {
				return;
			}

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
