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
	Arrays,
	Edge,
	Dictionary,
	ItemAttributes,
	FormatAttributes,
	OrthogonalLayout,
	TextFormatAttributes,
	BoundingBox,
	Numbers,
	Point,
	default as JSG
} from '@cedalo/jsg-core';
import View from '../../ui/View';
import Interaction from '../interaction/Interaction';
import NodeSelectionHandler from '../view/selection/NodeSelectionHandler';
import SelectionStyle from '../view/selection/SelectionStyle';

/**
 *
 * @class MoveFeedbackView
 * @extends View
 * @constructor
 * @deprecated Do not use! Subject to change!!
 */
class MoveFeedbackView extends View {
	constructor(index) {
		// one to rule them all or subclasses like: MoveFeedback, ResizeFeedback, DragDropFeedback.... ????

		super();

		this._box = new BoundingBox(0, 0);
		this._point = new Point(0, 0);
		this._activeMarker = index;
		this.feedbackInfoVisible = true;

		this._feedbacks = [];
		this._subfeedbacks = [];
		this.doDrawSubFeedbacks = true;
	}

	// InteractionView....

	getBoundingBox(reusebox) {
		const box = reusebox || new BoundingBox();
		box.setTo(this._box);
		return box;
	}

	// performs a resize... TODO not required for move feedback!!
	setBoundingBoxTo(box) {
		const oldtopleft = this.getLocation(JSG.ptCache.get());
		const offset = box.getTopLeft(JSG.ptCache.get()).subtract(oldtopleft);
		this._moveFeedbacks(offset);

		this._box.setTo(box);
		JSG.ptCache.release(oldtopleft, offset);
	}

	// TODO rename to get/setTopLeft???
	getLocation(reusepoint) {
		const tl = reusepoint || new Point();
		this._box.getTopLeft(tl);
		return tl;
	}

	// performs a move... //TODO rename to moveTo?
	setLocationTo(point) {
		// //TODO this logic should be placed in delegate class, but for testing purpose...
		const offset = this.getLocation(JSG.ptCache.get());
		offset.subtract(point).multiply(-1);
		// move feedbacks according to offset...
		this._moveFeedbacks(offset);
		// move bbox:
		this._box.setTopLeftTo(point);
		JSG.ptCache.release(offset);
	}

	_moveFeedbacks(offset) {
		const origin = JSG.ptCache.get();

		this._feedbacks.forEach((feedback) => {
			feedback.getOrigin(origin);
			feedback.setOriginTo(origin.add(offset));
		});

		JSG.ptCache.release(origin);
	}

	// TODO createFromSelection??? or createFromFeedbacks???
	addSelection(selection, viewer) {
		const edgeFeedbacks = [];
		const nodeFeedbacks = [];

		const hasFeedbackForNode = (node) => {
			if (node) {
				let i;
				const id = node.getOriginal ? node.getOriginal().getId() : node.getId();

				for (i = 0; i < nodeFeedbacks.length; i += 1) {
					if (nodeFeedbacks[i].getOriginalItem().getId() === id) {
						return true;
					}
				}
			}
			return false;
		};

		const detachFeedbackEdge = (fbEdge) => {
			const fbItem = fbEdge.getFeedbackItem();
			if (fbItem.hasSourceAttached()) {
				const sourcePort = fbItem.getSourcePort();
				const sourceNode = sourcePort.getParent();
				if (!hasFeedbackForNode(sourceNode)) {
					fbEdge.detachFromSource();
				}
			}
			if (fbItem.hasTargetAttached()) {
				const targetPort = fbItem.getTargetPort();
				const targetNode = targetPort.getParent();
				if (!hasFeedbackForNode(targetNode)) {
					fbEdge.detachFromTarget();
				}
			}
		};

		const hasManualLayout = (edge) => {
			const layout = edge.getLayout();
			const settings = layout ? layout.getSettings(edge) : undefined;
			return settings && settings.get(OrthogonalLayout.BEHAVIOR) === ItemAttributes.LineBehavior.MANUAL;
		};

		selection.forEach((selitem) => {
			const feedback = this.createFeedback(selitem, viewer);
			if (feedback) {
				this._feedbacks.push(feedback);
				// this.addView(feedback.getFeedbackView());
				if (feedback.getOriginalItem() instanceof Edge) {
					edgeFeedbacks.push(feedback);
				} else {
					nodeFeedbacks.push(feedback);
				}
			}
		});

		// add sub-feedbacks for each node...
		if (this.doAddSubFeedbacks(viewer)) {
			this._addSubFeedbacks(nodeFeedbacks, edgeFeedbacks, viewer);
		}

		// check for edges which might be disconnected or which should not be visible:
		const removeEdgeFeedback = !JSG.feedbackOptions.edges;
		edgeFeedbacks.forEach((feedback) => {
			detachFeedbackEdge(feedback);
			const fbItem = feedback.getItem();
			const _hasManualLayout = hasManualLayout(fbItem);
			if (removeEdgeFeedback) {
				// we hide edge because of feedbackOptions...
				fbItem.getItemAttributes().setVisible(!removeEdgeFeedback);
				// we remove it completely if its not manual layouted and its source & target nodes are moved too...
				if (!_hasManualLayout && fbItem.hasSourceAttached() && fbItem.hasTargetAttached()) {
					Arrays.remove(this._feedbacks, feedback);
				}
			}
		});

		// refresh bbox:
		this.refresh(viewer);
		// translate inner feedbacks:
		// this.translateFeedbacks();
	}

	createFeedback(controller, viewer) {
		return controller.createFeedback();
	}

	createSubFeedback(controller, viewer) {
		return controller.createFeedback();
	}

	// viewer is required to get SelectionStyle for initial bbox angle:
	refresh(viewer) {
		let i;
		let n;
		const feedbacks = this._feedbacks;
		const bbox = JSG.boxCache.get();
		const tmpbox = JSG.boxCache.get();

		if (viewer) {
			i = 0;
			const tl = feedbacks[0]
				.getFeedbackItem()
				.getBoundingBox(tmpbox)
				.getTopLeft(JSG.ptCache.get());
			bbox.setTopLeftTo(tl);
			// rotate according to selection view:
			bbox.setAngle(viewer.getSelectionView().getRotationAngle());
			JSG.ptCache.release(tl);
		} else {
			i = 1;
			feedbacks[0].getFeedbackItem().getBoundingBox(bbox);
		}

		for (n = feedbacks.length; i < n; i += 1) {
			bbox.union(feedbacks[i].getFeedbackItem().getBoundingBox(tmpbox));
		}

		this._box.setTo(bbox);
		JSG.boxCache.release(bbox, tmpbox);
	}

	adjustFeedback(nodeFeedbacks, edgeFeedbacks, viewer) {
		// ??????
	}

	doAddSubFeedbacks(viewer) {
		return !JSG.touchDevice; // && JSG.feedbackOptions.edges;
	}

	_addSubFeedbacks(nodeFeedbacks, edgeFeedbacks, viewer) {
		let fbPort;
		const subfbMap = new Dictionary();
		const graphController = viewer.getGraphController();

		const addEdgeFeedback = (edge) => {
			let edgeController;
			let fbEdge = subfbMap.get(edge.getId());
			if (fbEdge === undefined) {
				edgeController = graphController.getControllerByModelId(edge.getId());
				if (edgeController) {
					fbEdge = this.createSubFeedback(edgeController, viewer);
					if (fbEdge) {
						fbEdge.getFeedbackItem().disableEvents();
						fbEdge
							.getFeedbackItem()
							.getShape()
							.disableNotification();
						subfbMap.put(edge.getId(), fbEdge);
						this._subfeedbacks.push(fbEdge);
					}
				}
			}
			return fbEdge;
		};

		const setTargetPort = (edge) => {
			const fbEdge = addEdgeFeedback(edge);
			if (fbEdge) {
				// we call layout on feedback edge, so
				fbEdge.doAutoLayout = false;
				fbEdge.setTargetPort(fbPort);
				fbEdge.getFeedbackItem().getTargetPort = Edge.prototype.getTargetPort;
			}
		};

		const setSourcePort = (edge) => {
			const fbEdge = addEdgeFeedback(edge);
			if (fbEdge) {
				// we call layout on feedback edge, so
				fbEdge.doAutoLayout = false;
				fbEdge.setSourcePort(fbPort);
				fbEdge.getFeedbackItem().getSourcePort = Edge.prototype.getSourcePort;
			}
		};

		const fillSubFeedbackMap = () => {
			edgeFeedbacks.forEach((feedback) => {
				subfbMap.put(feedback.getOriginalItem().getId(), feedback);
			});
		};

		const subFeedbackForNode = (fbNode) => {
			let edges;
			const node = fbNode.getOriginalItem();
			const fbItem = fbNode.getFeedbackItem();
			const ports = node.getPorts ? node.getPorts() : [];

			ports.forEach((port, i) => {
				fbPort = fbItem.getPortAt(i);
				if (fbPort) {
					edges = port.getIncomingEdges();
					edges.forEach(setTargetPort);
					edges = port.getOutgoingEdges();
					edges.forEach(setSourcePort);
				}
			});
		};

		// we add sub-feedbacks for nodes only...
		// don't add subfeedbacks for edges we already move...
		fillSubFeedbackMap();
		nodeFeedbacks.forEach((feedback) => {
			subFeedbackForNode(feedback);
		});
	}

	getFeedbacks() {
		return this._feedbacks;
	}

	getSubFeedbacks(translated) {
		const feedbacks = this._subfeedbacks;
		// if(translated) {
		// var i, n;
		// var loc = this.getLocation(JSG.ptCache.get());
		// for ( i = 0, n = feedbacks.length; i < n; i++) {
		// this._translateFeedback(feedbacks[i], loc, true);
		// }
		// JSG.ptCache.release(loc);
		// }
		return feedbacks;
	}

	// canBeMovedToTarget(event, viewer) {
	// var feedbacks = this._feedbacks;
	// var isMoveable = feedbacks.length > 0;
	//
	// if(isMoveable) {
	// var i, n;
	// for(i=0,n=feedbacks.length;i<n;i++) {
	//
	// }
	// }
	//
	// return isMoveable;
	//
	// var selection = viewer.getSelection();
	// if (!selection.length) {
	// return undefined;
	// }
	//
	// var i;
	// var parent = selection[0].getParent();
	// for ( i = 0; i < selection.length; i++) {
	// var controller = selection[i];
	// // check if all selected in same parent
	// if (controller.getParent() !== parent || !this._isMoveable(controller, viewer) || controller.getModel() instanceof
	// TextNode) { return undefined; } var moveable =
	// selection[i].getModel().getItemAttributes().getMoveable().getValue(); if (moveable &
	// ItemAttributes.Moveable.LIMITTOCONTAINER) { return undefined; } }  };

	setPoint(point) {
		this._point.setTo(point);
	}

	/**
	 * @deprecated Subject to be removed!
	 * Simply use {{#crossLink "MoveFeedbackView/doDrawSubFeedbacks:property"}}{{/crossLink}} instead.
	 */
	setDrawSubFeedbacks(doIt) {
		this.doDrawSubFeedbacks = doIt;
	}

	drawFeedbacks(graphics) {
		const feedbacks = this._feedbacks;

		feedbacks.forEach((feedback) => {
			feedback.getFeedbackView().draw(graphics);
		});
	}

	drawSubFeedbacks(graphics) {
		const subfeedbacks = this._subfeedbacks;

		subfeedbacks.forEach((feedback) => {
			feedback.getFeedbackView().draw(graphics);
		});
	}

	draw(graphics) {
		this.drawFeedbacks(graphics);
		if (this.doDrawSubFeedbacks) {
			this.drawSubFeedbacks(graphics);
		}
		if (!Interaction.SHOW_ACTION_FEEDBACK) {
			return;
		}

		const cs = graphics.getCoordinateSystem();
		const bbox = JSG.boxCache.get().setTo(this._box);
		const topleft = this.getLocation(JSG.ptCache.get());
		graphics.save();
		graphics.translate(topleft.x, topleft.y);
		// this.drawSubViews(graphics);

		graphics.rotate(bbox.getAngle());
		bbox.translate(-topleft.x, -topleft.y);

		const points = bbox.getPointsUnrotated();
		let rect = JSG.rectCache.get();
		rect.set(
			0,
			0,
			cs.metricToLogXNoZoom(SelectionStyle.MARKER_SIZE),
			cs.metricToLogYNoZoom(SelectionStyle.MARKER_SIZE)
		);

		JSG.boxCache.release(bbox);
		if (this._activeMarker !== 12) {
			graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
			graphics.setFillColor('#FFFFFF');
			graphics.setTransparency(80);
			graphics.fillPolyline(points);
		}

		graphics.setTransparency(100);

		graphics.setFillColor(SelectionStyle.MARKER_FILL_COLOR);
		graphics.setLineColor(SelectionStyle.MARKER_BORDER_COLOR);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);

		switch (this._activeMarker) {
			case 9:
				graphics.setFillColor(NodeSelectionHandler.RESHAPEMARKER_FILL_COLOR);
				rect.x = this._point.x - rect.width / 2;
				rect.y = this._point.y - rect.height / 2;
				graphics.drawMarker(rect, true);
				break;
			case 8: {
				const end = JSG.ptCache.get();
				const start = JSG.ptCache.get();

				// draw line:
				start.set(
					(points[1].x + points[0].x) / 2,
					(points[1].y + points[0].y) / 2 -
						cs.metricToLogXNoZoom(SelectionStyle.ROTATE_MARKER_DISTANCE)
				);
				end.set((points[2].x + points[0].x) / 2, (points[2].y + points[0].y) / 2);

				graphics.setLineColor(SelectionStyle.LINE_COLOR);
				graphics.setLineStyle(FormatAttributes.LineStyle.DASH);
				graphics.drawLine(start, end);
				JSG.ptCache.release(end, start);

				graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);

				rect.x = (points[1].x + points[0].x) / 2 - rect.width / 2;
				rect.y =
					(points[1].y + points[0].y) / 2 -
					rect.height / 2 -
					cs.metricToLogXNoZoom(SelectionStyle.ROTATE_MARKER_DISTANCE);
				graphics.drawMarker(rect, true);

				rect.x = (points[2].x + points[0].x) / 2 - rect.width / 2;
				rect.y = (points[2].y + points[0].y) / 2 - rect.height / 2;
				graphics.drawMarker(rect, false);
				break;
			}
			case 10:
			case 11:
			case 12:
				break;
			default:
				switch (this._activeMarker) {
					case 0:
						rect.x = points[0].x - rect.width / 2;
						rect.y = points[0].y - rect.height / 2;
						break;
					case 1:
						rect.x = (points[1].x + points[0].x) / 2 - rect.width / 2;
						rect.y = (points[1].y + points[0].y) / 2 - rect.height / 2;
						break;
					case 2:
						rect.x = points[1].x - rect.width / 2;
						rect.y = points[1].y - rect.height / 2;
						break;
					case 3:
						rect.x = (points[2].x + points[1].x) / 2 - rect.width / 2;
						rect.y = (points[2].y + points[1].y) / 2 - rect.height / 2;
						break;
					case 4:
						rect.x = points[2].x - rect.width / 2;
						rect.y = points[2].y - rect.height / 2;
						break;
					case 5:
						rect.x = (points[3].x + points[2].x) / 2 - rect.width / 2;
						rect.y = (points[3].y + points[2].y) / 2 - rect.height / 2;
						break;
					case 6:
						rect.x = points[3].x - rect.width / 2;
						rect.y = points[3].y - rect.height / 2;
						break;
					case 7:
						rect.x = (points[3].x + points[0].x) / 2 - rect.width / 2;
						rect.y = (points[3].y + points[0].y) / 2 - rect.height / 2;
						break;
				}
				graphics.drawMarker(rect, true);
				break;
		}

		if (this._activeMarker !== 12) {
			graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);
			graphics.setLineColor(SelectionStyle.LINE_COLOR);
			graphics.setLineStyle(FormatAttributes.LineStyle.DASH);
			graphics.drawPolyline(points, true);
		}

		graphics.restore();

		let text;

		switch (this._activeMarker) {
			case 9:
				break;
			case 12:
				if (JSG.feedbackOptions.position) {
					text = `Position: ${Numbers.format(
						Number(this._point.x / 100),
						2,
						'.',
						',',
						''
					)} x ${Numbers.format(Number(this._point.y / 100), 2, '.', ',', '')} mm`;
				}
				break;
			case 10:
				if (JSG.feedbackOptions.position) {
					text = `Position: ${Numbers.format(
						Number(this._box.getTopLeft(topleft).x / 100),
						2,
						'.',
						',',
						''
					)} x ${Numbers.format(Number(this._box.getTopLeft(topleft).y / 100), 2, '.', ',', '')} mm`;
				}
				break;
			case 8:
				if (JSG.feedbackOptions.angle) {
					text = `Angle: ${Numbers.format(
						Number((this._box.getAngle() * 180) / Math.PI),
						2,
						'.',
						',',
						''
					)} degrees`;
				}
				break;
			default:
				if (JSG.feedbackOptions.size) {
					text = `Size: ${Numbers.format(
						Number(this._box.getWidth() / 100),
						2,
						'.',
						',',
						''
					)} x ${Numbers.format(Number(this._box.getHeight() / 100), 2, '.', ',', '')} mm`;
				}
				break;
		}

		if (text && this.feedbackInfoVisible) {
			graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);
			graphics.setLineColor('#FFFFFF');
			graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
			graphics.setFillColor(JSG.bkColorButton);
			graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
			graphics.setLineCorner(100);

			// var rect = this._box.getBoundingRectangle();
			const height = 600 / cs.getZoom();
			rect = this._box.getBoundingRectangle(rect);
			rect.height = height;
			rect.y = rect.y - height - 100;

			graphics.setFontSize(8 / cs.getZoom());
			graphics.setTextAlign(TextFormatAttributes.TextAlignment.CENTER);
			graphics.setFont();
			graphics.setTextBaseline('middle');
			const textWidth = cs.deviceToLogX(graphics.measureText(text).width) + 200;
			rect.x = rect.getCenterX() - textWidth / 2;
			rect.width = textWidth;

			const p = rect.getPoints();

			graphics.fillPolyline(p);
			graphics.drawPolyline(p, true);

			graphics.setFillColor('#FFFFFF');
			graphics.fillText(text, rect.getCenterX(), rect.getCenterY());
			graphics.setLineCorner(0);
		}
		JSG.rectCache.release(rect);
		JSG.ptCache.release(topleft);
	}

	/**
	 * Calls layout of registered feedbacks.
	 *
	 * @method layout
	 * @since 1.6.18
	 */
	layout() {
		function layoutFeedback(feedback) {
			feedback.layout();
		}

		this._feedbacks.forEach(layoutFeedback);
		this._subfeedbacks.forEach(layoutFeedback);
	}
}

export default MoveFeedbackView;
