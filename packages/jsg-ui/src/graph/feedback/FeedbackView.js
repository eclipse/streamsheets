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
	Node,
	Numbers,
	FormatAttributes,
	TextFormatAttributes,
	ItemAttributes,
	BoundingBox,
	Point,
	default as JSG
} from '@cedalo/jsg-core';

import View from '../../ui/View';
import NodeSelectionHandler from '../view/selection/NodeSelectionHandler';
import SelectionStyle from '../view/selection/SelectionStyle';

/**
 *
 * @class FeedbackView
 * @extends View
 * @constructor
 * @deprecated Do not use! Subject to change!!
 */
class FeedbackView extends View {
	constructor(index) {
		super(index);

		// one to rule them all or subclasses like: MoveFeedback, ResizeFeedback, DragDropFeedback.... ????

		this._box = new BoundingBox(0, 0);
		this._point = new Point(0, 0);
		this._activeMarker = index;
		this.feedbackInfoVisible = true;

		this._feedbacks = [];
		this._subfeedbacks = [];
		this._useInnerFeedbacks = !true;
		this._lastloc = new Point(0, 0);
	}

	getBoundingBox(reusebox) {
		const box = reusebox || new BoundingBox();
		box.setTo(this._box);
		return box;
	}

	// performs a resize...
	setBoundingBoxTo(box) {
		this._box.setTo(box);
	}

	// TODO rename to get/setTopLeft???
	getLocation(reusepoint) {
		const tl = reusepoint || new Point();
		this._box.getTopLeft(tl);
		return tl;
	}

	// performs a move...
	setLocationTo(point, currpoint, lastpoint) {
		let loc = this.getLocation(JSG.ptCache.get());
		let offset = JSG.ptCache
			.get()
			.setTo(point)
			.subtract(loc);
		const feedbacks = this.getFeedbacks();

		if (this._useInnerFeedbacks) {
			// TODO this logic should be placed in delegate class, but for testing purpose...
			loc = this.getLocation(JSG.ptCache.get());
			offset = JSG.ptCache
				.get()
				.setTo(currpoint)
				.subtract(lastpoint);

			feedbacks.forEach((feedback) => {
				this._adjustOffset(feedback, offset);
			});

			point.setTo(loc).add(offset);
			JSG.ptCache.release(loc, offset);
			// ~
			this._box.setTopLeftTo(point);
		}

		feedbacks.forEach((feedback) => {
			this._moveFeedback(feedback, point, offset);
		});

		this.refresh();
		this._lastloc.setTo(point);
		JSG.ptCache.release(loc, offset);
	}

	_adjustOffset(feedback, offset, viewer) {
		const item = feedback.getOriginalItem();
		// var origin = feedback.getFeedbackItem().getOrigin(JSG.ptCache.get());
		// var _offset = JSG.ptCache.get().setTo(offset);
		const moveable = item
			.getItemAttributes()
			.getMoveable()
			.getValue();

		if ((moveable & ItemAttributes.Moveable.BOTH) !== ItemAttributes.Moveable.BOTH) {
			if (moveable & ItemAttributes.Moveable.VERTICAL) {
				offset.x = 0;
			} else if (moveable & ItemAttributes.Moveable.HORIZONTAL) {
				offset.y = 0;
			}
		}
		// TODO:
		// if (moveable & ItemAttributes.Moveable.LIMITTOCONTAINER) {
		// var i, j;
		// var originalBox = item.getTranslatedBoundingBox(viewer.getGraph());
		// var parentBox = item.getParent().getTranslatedBoundingBox(viewer.getGraph());
		// var parentPoints = parentBox.getPoints();
		// var points = originalBox.getPoints();
		// var parentCenter = parentBox.getCenter().add(parentBox.getTopLeft());
		//
		// for ( i = 0; i < 4; i++) {
		// points[i].translate(_offset.x, _offset.y);
		// }
		// for ( i = 0; i < 4; i++) {
		// var p = this.getLinePolylineOffset(points[i], parentCenter, parentPoints, false);
		// if (p) {
		// for ( j = 0; j < 4; j++) {
		// points[j].translate(-Math.round(p.x), -Math.round(p.y));
		// }
		//
		// if (moveable & ItemAttributes.Moveable.HORIZONTAL) {
		// _offset.x -= Math.round(p.x);
		// }
		// if (moveable & ItemAttributes.Moveable.VERTICAL) {
		// _offset.y -= Math.round(p.y);
		// }
		// }
		// }
		// }

		// feedback.getFeedbackItem().setOriginTo(origin.add(_offset)); //.subtract(loc));
		// JSG.ptCache.release(_offset, origin);
	}

	_moveFeedback(feedback, point, offset, viewer) {
		const item = feedback.getOriginalItem();
		const origin = feedback.getFeedbackItem().getOrigin(JSG.ptCache.get());
		const _offset = JSG.ptCache
			.get()
			.setTo(point)
			.subtract(this._lastloc);
		const moveable = item
			.getItemAttributes()
			.getMoveable()
			.getValue();

		if ((moveable & ItemAttributes.Moveable.BOTH) !== ItemAttributes.Moveable.BOTH) {
			if (moveable & ItemAttributes.Moveable.VERTICAL) {
				_offset.x = 0;
			} else if (moveable & ItemAttributes.Moveable.HORIZONTAL) {
				_offset.y = 0;
			}
		}
		feedback.getFeedbackItem().setOriginTo(origin.add(_offset));

		JSG.ptCache.release(_offset, origin);
	}

	// TODO createFromSelection??? or createFromFeedbacks???
	addSelection(selection, viewer) {
		let feedback;

		selection.forEach((selitem) => {
			feedback = this.createFeedback(selitem, viewer);
			if (feedback) {
				this._feedbacks.push(feedback);
				this.addView(feedback.getFeedbackView());
				// TODO subfeedbacks:
				if (!JSG.touchDevice) {
					this._addSubFeedbacksOf(feedback);
				}
			}
		});

		// refresh bbox:
		this.refresh();
		this.getLocation(this._lastloc);
		// translate inner feedbacks:
		if (this._useInnerFeedbacks) {
			this.translateFeedbacks();
		}
	}

	createFeedback(controller, viewer) {
		return controller.createFeedback();
	}

	refresh() {
		let i;
		let n;
		const feedbacks = this._feedbacks;
		const bbox = JSG.boxCache.get();
		const tmpbox = JSG.boxCache.get();

		feedbacks[0].getFeedbackItem().getBoundingBox(bbox);

		for (i = 1, n = feedbacks.length; i < n; i += 1) {
			bbox.union(feedbacks[i].getFeedbackItem().getBoundingBox(tmpbox));
		}
		this._box.setTo(bbox);
		JSG.boxCache.release(bbox, tmpbox);
	}

	translateFeedbacks() {
		const loc = this.getLocation(JSG.ptCache.get());
		const feedbacks = this._feedbacks;

		feedbacks.forEach((feedback) => {
			this._translateFeedback(feedback, loc);
		});

		JSG.ptCache.release(loc);
	}

	_translateFeedback(feedback, loc) {
		const fbItem = feedback.getFeedbackItem();
		const fborigin = fbItem.getOrigin(JSG.ptCache.get());
		fborigin.setTo(fborigin.subtract(loc));
		fbItem.setOriginTo(fborigin);
		JSG.ptCache.release(fborigin);
	}

	_addSubFeedbacksOf(feedback) {
		const item = feedback.getOriginalItem();
		// sub feedbacks for edges attached to nodes...
		if (item instanceof Node) {
			// const fbNode = feedback.getFeedbackItem();
			// const ports = item.getPorts();
			// let i,
			// 	n,
			// 	fbPort;
			// for ( i = 0, n = ports.length; i < n; i++) {
			// fbPort = fbNode.getPortAt(i);
			// if(fbPort) {
			// console.log("have fbPort...");
			// }
			// }
			// var node = controller.getModel();
			// var ports = node.getPorts();
			// fbItem = feedback.getFeedbackItem();
			// graphController = controller.getGraphController();
			// for (i = 0; i < ports.length; i++) {
			// fbPort = fbItem.getPortAt(i);
			// if(fbPort) {
			// port = ports[i];
			// edges = port.getIncomingEdges();
			// edges.forEach(setTargetPort);
			// edges = port.getOutgoingEdges();
			// edges.forEach(setSourcePort);
			// }
			// }
		}
	}

	getFeedbacks() {
		return this._feedbacks;
	}

	addSubFeedback(feedback) {
		if (!Arrays.contains(this._subfeedbacks, feedback)) {
			this._subfeedbacks.push(feedback);
		}
	}

	setPoint(point) {
		this._point.setTo(point);
	}

	draw(graphics) {
		// var topleft = bbox.getTopLeft(JSG.ptCache.get());
		const cs = graphics.getCoordinateSystem();
		const bbox = JSG.boxCache.get().setTo(this._box);
		const topleft = this.getLocation(JSG.ptCache.get());
		// this.refresh();
		// this.setLocationTo(topleft);

		if (!this._useInnerFeedbacks) {
			this.drawSubViews(graphics);
		}

		graphics.save();
		graphics.translate(topleft.x, topleft.y);
		graphics.rotate(bbox.getAngle());

		if (this._useInnerFeedbacks) {
			this.drawSubViews(graphics);
		}

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

export default FeedbackView;
