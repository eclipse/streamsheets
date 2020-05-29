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
import {
	default as JSG,
	TextNode,
	Shape,
	FormatAttributes,
	GraphUtils,
	TextFormatAttributes,
	ItemAttributes,
	Point
} from '@cedalo/jsg-core';
import NodeController from '../controller/NodeController';
import Interaction from './Interaction';
import LayerId from '../view/LayerId';
import PositionFeedbackView from '../view/PositionFeedbackView';
import SnapFeedbackView from '../view/SnapFeedbackView';

/**
 * Defines useful static methods for {{#crossLink "Interaction"}}{{/crossLink}}s.
 *
 * @class InteractionUtils
 * @constructor
 */
class InteractionUtils {
	/**
	 * Adds {{#crossLink "SnapFeedbackView"}}{{/crossLink}}s to the
	 * {{#crossLink "LayerId/SNAPLINES:property"}}{{/crossLink}} layer.
	 *
	 * @method highlightSnapItemofController
	 * @param {Interaction} interaction The interaction which provides possible snap controllers.
	 * @param {Rectangle} box The current selection bounds.
	 * @param {Boolean} snap Deprecated, currently not used.
	 * @static
	 * @deprecated Subject to remove. Please use {{#crossLink "SnapHelper"}}{{/crossLink}} to show
	 * snap-lines.
	 */
	static highlightSnapItemofController(interaction, box, snap) {
		// check if given interaction handles this...
		if (interaction.showSnapLines && interaction.showSnapLines(box)) {
			return;
		}

		const { viewer } = interaction.getInteractionHandler();
		const selection = viewer.getSelection();
		const graphView = viewer.getGraphView();
		const overlap = graphView.getItem().getSnapRadius() * 2;
		const origin = new Point(box.x + box.width / 2, box.y + box.height / 2);
		let verticalTarget;
		let horizontalTarget;
		const bbox = JSG.boxCache.get();
		let snapRect = JSG.rectCache.get();
		const tmpcenter = JSG.ptCache.get();

		const condition = (controller) => {
			// we are only interested in node controllers, so:
			if (!(controller instanceof NodeController)) {
				return false;
			}
			if (!controller.getModel().isVisible()) {
				return false;
			}
			if (
				!controller
					.getModel()
					.getItemAttributes()
					.getSnapTo()
					.getValue()
			) {
				return false;
			}
			return true;
		};

		const partOfSelection = (controller) => {
			let i;
			for (i = 0; i < selection.length; i += 1) {
				if (controller === selection[i]) {
					return true;
				}
				let parent = controller.getParent();
				while (parent) {
					if (parent === selection[i]) {
						return true;
					}
					parent = parent.getParent();
				}
			}
			return false;
		};

		const getHorizontalFeedback = (xStart, xEnd, y) => {
			const fb = new SnapFeedbackView();
			fb.setOrigin(xStart, y);
			fb.setTarget(xEnd, y);
			return fb;
		};

		const getVerticalFeedback = (yStart, yEnd, x) => {
			const fb = new SnapFeedbackView();
			fb.setOrigin(x, yStart);
			fb.setTarget(x, yEnd);
			return fb;
		};

		let layer;
		let target;
		const snapControllers = interaction.getControllerForSnap(box, condition);
		// find the closest vertical and horizontal snap controller

		snapControllers.forEach((snapController) => {
			snapRect = snapController
				.getModel()
				.getTranslatedBoundingBox(viewer.getGraph(), bbox)
				.getBoundingRectangle(snapRect);
			target = snapRect.getCenter(tmpcenter);

			if (
				snapController._snapType & Interaction.SnapType.CENTERY ||
				snapController._snapType & Interaction.SnapType.TOP ||
				snapController._snapType & Interaction.SnapType.BOTTOM
			) {
				if (interaction._horizontalSnapController) {
					if (
						Math.abs(target.x - origin.x) < Math.abs(horizontalTarget.x - origin.x) ||
						partOfSelection(interaction._horizontalSnapController)
					) {
						if (!partOfSelection(snapController)) {
							horizontalTarget = target.copy();
							interaction._horizontalSnapController = snapController;
						}
					}
				} else {
					interaction._horizontalSnapController = snapController;
					horizontalTarget = target.copy();
				}
			}
			if (
				snapController._snapType & Interaction.SnapType.CENTERX ||
				snapController._snapType & Interaction.SnapType.LEFT ||
				snapController._snapType & Interaction.SnapType.RIGHT
			) {
				if (interaction._verticalSnapController) {
					if (
						Math.abs(target.y - origin.y) < Math.abs(verticalTarget.y - origin.y) ||
						partOfSelection(interaction._verticalSnapController)
					) {
						if (!partOfSelection(snapController)) {
							verticalTarget = target.copy();
							interaction._verticalSnapController = snapController;
						}
					}
				} else {
					interaction._verticalSnapController = snapController;
					verticalTarget = target.copy();
				}
			}
		});

		if (interaction._horizontalSnapController) {
			let yPos;
			let originX;
			let targetX;

			snapRect = interaction._horizontalSnapController
				.getModel()
				.getTranslatedBoundingBox(viewer.getGraph(), bbox)
				.getBoundingRectangle(snapRect);
			target = snapRect.getCenter(tmpcenter);
			layer = viewer.getLayer(LayerId.SNAPLINES);

			if (target.x > origin.x) {
				originX = box.x - overlap;
				targetX = snapRect.getRight() + overlap;
			} else {
				originX = box.getRight() + overlap;
				targetX = snapRect.x - overlap;
			}

			if (interaction._horizontalSnapController._snapType & Interaction.SnapType.CENTERY) {
				yPos = snapRect.getCenter(tmpcenter).y;
				layer.push(getHorizontalFeedback(originX, targetX, yPos));
				if (snapRect.height === box.height) {
					layer.push(getHorizontalFeedback(originX, targetX, snapRect.y));
					layer.push(getHorizontalFeedback(originX, targetX, snapRect.getBottom()));
				}
			}

			if (interaction._horizontalSnapController._snapType & Interaction.SnapType.TOP) {
				yPos = snapRect.y;
				layer.push(getHorizontalFeedback(originX, targetX, yPos));
				if (snapRect.height === box.height) {
					layer.push(getHorizontalFeedback(originX, targetX, snapRect.getCenter(tmpcenter).y));
					layer.push(getHorizontalFeedback(originX, targetX, snapRect.getBottom()));
				}
			}

			if (interaction._horizontalSnapController._snapType & Interaction.SnapType.BOTTOM) {
				yPos = snapRect.getBottom();
				layer.push(getHorizontalFeedback(originX, targetX, yPos));
				if (snapRect.height === box.height) {
					layer.push(getHorizontalFeedback(originX, targetX, snapRect.y));
					layer.push(getHorizontalFeedback(originX, targetX, snapRect.getCenter(tmpcenter).y));
				}
			}
		}

		if (interaction._verticalSnapController) {
			snapRect = interaction._verticalSnapController
				.getModel()
				.getTranslatedBoundingBox(viewer.getGraph(), bbox)
				.getBoundingRectangle(snapRect);
			target = snapRect.getCenter(tmpcenter);
			let xPos;
			let originY;
			let targetY;

			layer = viewer.getLayer(LayerId.SNAPLINES);
			if (target.y > origin.y) {
				originY = box.y - overlap;
				targetY = snapRect.getBottom() + overlap;
			} else {
				originY = box.getBottom() + overlap;
				targetY = snapRect.y - overlap;
			}

			if (interaction._verticalSnapController._snapType & Interaction.SnapType.CENTERX) {
				xPos = snapRect.getCenter(tmpcenter).x;
				layer.push(getVerticalFeedback(originY, targetY, xPos));
				if (snapRect.width === box.width) {
					layer.push(getVerticalFeedback(originY, targetY, snapRect.x));
					layer.push(getVerticalFeedback(originY, targetY, snapRect.getRight()));
				}
			}

			if (interaction._verticalSnapController._snapType & Interaction.SnapType.LEFT) {
				xPos = snapRect.x;
				layer.push(getVerticalFeedback(originY, targetY, xPos));
				if (snapRect.width === box.width) {
					layer.push(getVerticalFeedback(originY, targetY, snapRect.getCenter(tmpcenter).x));
					layer.push(getVerticalFeedback(originY, targetY, snapRect.getRight()));
				}
			}

			if (interaction._verticalSnapController._snapType & Interaction.SnapType.RIGHT) {
				xPos = snapRect.getRight();
				layer.push(getVerticalFeedback(originY, targetY, xPos));
				if (snapRect.width === box.width) {
					layer.push(getVerticalFeedback(originY, targetY, snapRect.x));
					layer.push(getVerticalFeedback(originY, targetY, snapRect.getCenter(tmpcenter).x));
				}
			}
		}

		JSG.boxCache.release(bbox);
		JSG.ptCache.release(tmpcenter);
		JSG.rectCache.release(snapRect);
	}

	/**
	 * Returns a ModelController which provides ports to highlight. To create a list of port views for
	 * a special controller use {{#crossLink "InteractionUtils.getPortsFor:method"}}{{/crossLink}}
	 *
	 * @method getPortsController
	 * @param {Event} event The event which determines returned controller.
	 * @param {GraphViewer} viewer The viewer used to display current graph model.
	 * @return {ModelController} A ModelController or <code>undefined</code> if none could be found.
	 * @static
	 */
	static getPortsController(event, viewer) {
		function condition(controller) {
			// we are only interested in node controllers, so:
			if (controller instanceof NodeController) {
				const model = controller.getModel();
				const isTextNode = model instanceof TextNode && model.isAssociated();
				return (
					!isTextNode &&
					model.isVisible() &&
					model
						.getItemAttributes()
						.getPortMode()
						.getValue() !== ItemAttributes.PortMode.NONE
				);
			}
			return false;
		}

		const loc = JSG.ptCache.get().setTo(event.location);

		const controller = viewer.filterFoundControllers(Shape.FindFlags.BOXWITHFRAME, condition);

		JSG.ptCache.release(loc);

		return controller
			? InteractionUtils._checkForChildControllerAt(controller, event, viewer)
			: undefined;
	}

	/**
	 * Checks if the given event occurred in one of the controllers children. If this is the case the corresponding
	 * child controller is returned. If it is not the case the given controller itself is returned.
	 *
	 * @method _checkForChildControllerAt
	 * @param {ModelController} controller A ModelController to check the children of.
	 * @param {Event} event The event which determines returned controller.
	 * @param {GraphViewer} viewer The viewer used to display current graph model.
	 * @return {ModelController} Either passed in controller or one of its children.
	 * @private
	 */
	static _checkForChildControllerAt(controller, event, viewer) {
		// I THINK this method is a workaround for displaying ports of cubes/cylinders which contains child items
		// to represent their shape...
		let child;
		let stopLookUp = false;

		function containsLocation(ctlr, loc) {
			if (stopLookUp === false) {
				// prevent further evaluation! note: this is called on all children!!
				// so we have to check current state first and then set it depending on collapsed state
				stopLookUp = ctlr.isCollapsed(); // test collapsed first, because if collapsed loc test is useless...
				if (ctlr !== controller && ctlr.containsPoint(loc, Shape.FindFlags.AREAWITHFRAME)) {
					const model = ctlr.getModel();
					const isTextNode = model instanceof TextNode && model.isAssociated();
					return (
						!isTextNode &&
						model.isVisible() &&
						model
							.getItemAttributes()
							.getPortMode()
							.getValue() !== ItemAttributes.PortMode.NONE
					);
				}
			}
			return false;
		}

		// don't check collapsed state here, because its useless for nested collapsed nodes...
		if (controller.hasChildren()) {
			const location = JSG.ptCache.get(event.location.x, event.location.y);
			viewer.translateFromParent(location);

			GraphUtils.traverseItemDown(viewer.getGraph(), controller.getModel().getParent(), (item) => {
				item.translateFromParent(location);
				return true;
			});

			child = controller.findControllerByConditionAndLocation(location, containsLocation);
			JSG.ptCache.release(location);
		}
		return child || controller;
	}

	/**
	 * Returns a list of Views which represents all possible ports a given controller can have.</br>
	 *
	 * @method getPortsFor
	 * @param {ModelController} controller The model controller to highlight ports of.
	 * @param {Interaction} interaction The interaction who calls this method.
	 * @param {Boolean} snap Flag which indicates if a port location should be created for each shape coordinate.
	 * @param {Boolean} [active] Flag which indicates that only the port below the Mouse coordinate shall be retrieved,
	 *     if available.
	 * @return {Array} A list of port Views.
	 * @static
	 */
	static getPortsFor(controller, interaction, snap, active) {
		const item = controller.getModel();
		const viewer = interaction.getViewer();
		const parentView = controller.getView();
		const rootView = viewer.rootController.getView();
		const point = JSG.ptCache.get();
		let pointGrid = JSG.ptCache.get();
		const ports = [];

		point.setTo(interaction.currentLocation);
		pointGrid = interaction.alignToGrid(point, viewer, snap, pointGrid);

		GraphUtils.traverseDown(rootView, parentView, (v) => {
			v.translateFromParent(point);
			v.translateFromParent(pointGrid);
			return true;
		});

		let i;
		let n;
		const pointFb = JSG.ptCache.get();
		let portview;
		const graph = item.getGraph();
		const radius = graph.getPortFindRadius();
		const loc = item.getShape().getValidPortLocation(point, pointGrid, item.isClosed(), snap, radius);
		const toItem = rootView.getItem();
		const fromItem = parentView.getItem();

		JSG.ptCache.release(point, pointGrid);

		if (!loc) {
			if (active !== true) {
				if (this.doShowPortHighlights(interaction, graph)) {
					const locs = item.getShape().getValidPortLocations(item.isClosed(), snap);
					if (locs && locs.length) {
						for (i = 0, n = locs.length; i < n; i += 1) {
							pointFb.setTo(locs[i]);
							GraphUtils.translatePointUp(pointFb, fromItem, toItem);
							portview = this._createPortView(item, locs[i]);
							portview.setActive(false);
							portview.setPosition(pointFb);
							portview.setFillColor('rgba(255,255,255, 0.5)');
							ports.push(portview);
						}
					}
				}
			}
		} else {
			pointFb.setTo(loc);
			GraphUtils.translatePointUp(pointFb, fromItem, toItem);
			portview = this._createPortView(item, loc);
			portview.setPosition(pointFb);
			portview.setFillColor('rgba(255,0,0,0.5)');
			ports.push(portview);
		}

		JSG.ptCache.release(pointFb);

		return ports;
	}

	static doShowPortHighlights(interaction, graph) {
		let show = graph.getSettings().getPortHighlightsVisible();
		if (!show) {
			show = graph.getSettings().getPortHighlightDelay(interaction.getViewer()) > 0;
		}
		if (!show) {
			// check kind of interaction
			show = interaction.doShowPortHighlights();
			// console.log(interaction);
		}
		return show;
	}

	/**
	 * Convenience method to create a view at specified location for the given port item. The returned view is based on
	 * a PositionFeedbackView and can be used as a port highlight.
	 *
	 * @method _createPortView
	 * @param {GraphItem} item The GraphItem which represents the port.
	 * @param {Point} location The location for the view.
	 * @return {PositionFeedbackView} A view which can be used as port highlight.
	 * @private
	 */
	static _createPortView(item, location) {
		const portview = new PositionFeedbackView(location);
		portview._model = item;
		portview._location = location;
		return portview;
	}

	/**
	 * Highlights the bounds of given controller. This is used to mark a node as possible drop container.
	 *
	 * @method highlightTargetController
	 * @param {GraphViewer} viewer The viewer used to display current graph model.
	 * @param {ModelController} controller The target model controller.
	 * @static
	 * @deprecated Please use {{#crossLink
	 *     "Highlighter/highlightController:method"}}{{/crossLink}} instead.
	 */
	static highlightTargetController(viewer, controller) {
		const feedback = controller.createFeedback();
		const layer = viewer.getLayer(LayerId.TARGETCONTAINER);

		const fbFormat = feedback.getFormat();
		fbFormat.setFillColor('rgba(144,181,238,0.1)');
		fbFormat.setLineColor('rgba(144,181,238,0.7)');
		fbFormat.setLineWidth(150 / viewer.getZoom());
		fbFormat.setLineStyle(FormatAttributes.LineStyle.SOLID);

		// draw the hint text as decoration:

		// eslint-disable-next-line func-names
		feedback.getFeedbackView().drawDecorations = function(graphics, rect) {
			graphics.setFillColor('#333333');
			graphics.setTextBaseline('top');
			graphics.setTextAlign(TextFormatAttributes.TextAlignment.LEFT);
			graphics.setFontName('Arial');
			graphics.setFontSize(8 / graphics.getCoordinateSystem().getZoom());
			graphics.setFont();
			graphics.fillText(JSG.getLocalizedString('AddContainer'), 0, this._item.getHeight().getValue() + 100);
		};

		layer.push(feedback);
	}

	/**
	 * @method getPortHighlights
	 * @param controller
	 * @param interaction
	 * @param snap
	 * @return {Array} Could be empty, e.g. if port highlighting is disabled via graph settings...
	 * @deprecated DON'T USE!! SUBJECT TO CHANGE!!
	 */
	static getPortHighlights(controller, interaction, snap) {
		const ports = InteractionUtils.getPortsFor(controller, interaction, snap);
		// testing purpose we simply add a gap to the y port position...
		for (let i = 0; i < ports.length; i += 1) {
			// of course, does not work if node is rotated => have to add gap in node/shape coordinate system
			ports[i]._point.y += NodeController.portgap();
		}
		return ports;
	}
}

export default InteractionUtils;
