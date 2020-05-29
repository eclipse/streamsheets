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
import { default as JSG, FormatAttributes, TextFormatAttributes, BoundingBox, Point, Numbers } from '@cedalo/jsg-core';
import View from '../../ui/View';
import NodeSelectionHandler from "./selection/NodeSelectionHandler";
import SelectionStyle from "./selection/SelectionStyle";

/**
 * This class is used to visualize feedback during edit operations.
 *
 * @class SelectionFeedbackView
 * @extends View
 * @constructor
 */
class SelectionFeedbackView extends View {
	constructor(index) {
		super();

		this._box = new BoundingBox(0, 0);
		this._point = new Point(0, 0);
		this._activeMarker = index;
		this.feedbackInfoVisible = true;
	}

	setBoundingBox(box) {
		this._box.setTo(box);
	}

	getBoundingBox(reusebox) {
		const box = reusebox || new BoundingBox();
		box.setTo(this._box);
		return box;
	}

	setLocationTo(point) {
		// this._box.setTo(box);
		this._box.setTopLeftTo(point);
	}

	setPoint(point) {
		this._point.setTo(point);
	}

	draw(graphics) {
		const bbox = JSG.boxCache.get().setTo(this._box);
		const topleft = bbox.getTopLeft(JSG.ptCache.get());
		const cs = graphics.getCoordinateSystem();

		graphics.save();
		graphics.translate(topleft.x, topleft.y);
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
					(points[1].y + points[0].y) / 2 - cs.metricToLogXNoZoom(SelectionStyle.ROTATE_MARKER_DISTANCE)
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
			graphics.setFontName('Verdana');
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
}

export default SelectionFeedbackView;
