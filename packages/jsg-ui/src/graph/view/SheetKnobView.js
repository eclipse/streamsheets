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
	SetCellsCommand,
	SetAttributeAtPathCommand,
	CellRange,
	Numbers,
	Rectangle,
	MathUtils,
	GraphUtils,
	ExecuteFunctionCommand
} from '@cedalo/jsg-core';
import NodeView from './NodeView';

export default class SheetKnobView extends NodeView {
	drawBorder(graphics, format, rect) {}

	drawFill(graphics, format, rect) {
		const item = this.getItem();
		const title = item.getAttributeValueAtPath('title');
		const tmpRect = rect.copy();
		let value = item.getValue();
		let titleHeight = 0;

		if (!Numbers.isNumber(value)) {
			value = 0;
		}

		const textFormat = item.getTextFormat();

		textFormat.applyToGraphics(graphics);
		graphics.setFont();
		graphics.setTextBaseline('bottom');

		if (title && title.length) {
			const text = `${item.getAttributeValueAtPath('title')}`;
			graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.CENTER);
			graphics.fillText(text, rect.width / 2, rect.height);
			titleHeight = graphics.getCoordinateSystem().deviceToLogY(graphics.measureText(text).width);
			textFormat.removeFromGraphics(graphics);
		}

		let min = Number(item.getAttributeValueAtPath('min'));
		let max = Number(item.getAttributeValueAtPath('max'));
		let step = Number(item.getAttributeValueAtPath('step'));
		const startAngle = item.getAttributeValueAtPath('start');
		const endAngle = item.getAttributeValueAtPath('end');
		const marker = item.getAttributeValueAtPath('marker');
		if (Number.isNaN(min)) {
			min = 0;
		}
		if (Number.isNaN(max)) {
			max = 100;
		}
		if (Number.isNaN(step)) {
			min = 10;
		}
		if (max <= min) {
			max = min + 100;
		}
		if (step <= 0) {
			step = 1;
		}
		const range = max - min;

		value = Math.max(value, min);
		value = Math.min(value, max);

		this.setScaleFont(item, graphics);

		let width = Math.max(
			100,
			graphics.getCoordinateSystem().deviceToLogX(graphics.measureText(String(max)).width, true)
		);
		width = Math.max(
			width,
			graphics.getCoordinateSystem().deviceToLogX(graphics.measureText(String(min)).width, true)
		);

		const ranges = [];
		const formatRange = item.getAttributeValueAtPath('formatrange');
		if (formatRange) {
			const sheet = item.getSheet();
			if (sheet && typeof formatRange === 'string') {
				const frange = CellRange.parse(formatRange, sheet);
				if (frange && frange.getWidth() > 2) {
					frange.shiftFromSheet();
					for (let i = frange.getY1(); i <= frange.getY2(); i += 1) {
						const def = {};
						let cell = sheet.getDataProvider().getRC(frange.getX1(), i);
						if (cell && cell.getValue() !== undefined) {
							def.start = Number(cell.getValue());
						}
						cell = sheet.getDataProvider().getRC(frange.getX1() + 1, i);
						if (cell && cell.getValue() !== undefined) {
							def.end = Number(cell.getValue());
						}
						cell = sheet.getDataProvider().getRC(frange.getX1() + 2, i);
						if (cell && cell.getValue()) {
							def.color = String(cell.getValue());
						}
						if (frange.getWidth() > 3) {
							cell = sheet.getDataProvider().getRC(frange.getX1() + 3, i);
							if (cell && cell.getValue()) {
								def.label = String(cell.getValue());
								width = Math.max(
									width,
									graphics
										.getCoordinateSystem()
										.deviceToLogX(graphics.measureText(String(def.label)).width, true)
								);
							} else {
								def.label = ' ';
							}
						}
						ranges.push(def);
					}
				}
			}
		}

		const height = graphics.getCoordinateSystem().deviceToLogX(graphics.measureText('M').width, true);
		const size = Math.min(rect.width - width * 2 - 1200, rect.height - titleHeight - 800 - height * 2);
		tmpRect.x += rect.width / 2 - size / 2;
		tmpRect.y += rect.height / 2 - size / 2 - 100;
		tmpRect.height = size;
		tmpRect.width = size;

		if (format.applyFillToGraphics(graphics, tmpRect)) {
			graphics.fillEllipse(tmpRect);
		}

		let x1;
		let x2;
		let y1;
		let y2;
		let angle = ((value - min) / range) * (endAngle - startAngle) + startAngle + Math.PI_2;

		if (ranges.length && ranges[0].color) {
			const colorRect = new Rectangle();
			colorRect.y = tmpRect.y;
			colorRect.height = tmpRect.height;
			ranges.forEach((rang, index) => {
				if (ranges[index].color) {
					x1 = tmpRect.x + tmpRect.width / 2;
					y1 = tmpRect.y + tmpRect.height / 2;
					const angle1 =
						((ranges[index].start - min) / range) * (endAngle - startAngle) + startAngle + Math.PI_2;
					const angle2 =
						((ranges[index].end - min) / range) * (endAngle - startAngle) + startAngle + Math.PI_2;
					graphics.setLineColor(ranges[index].color);
					graphics.setLineWidth(200);
					graphics.beginPath();
					graphics.arc(x1, y1, size / 2 + 300, angle1, angle2, false);
					graphics.stroke();
				}
			});
		}

		if (format.applyLineToGraphics(graphics)) {
			graphics.drawEllipse(tmpRect);
			format.removeLineFromGraphics(graphics);
		}

		const markerSize = size / 10;

		graphics.setLineColor('#444444');
		graphics.setFillColor('#EEEEEE');

		switch (marker) {
			case 'arrowinner':
				graphics.beginPath();
				x1 = tmpRect.x + tmpRect.width / 2 + Math.cos(angle) * (size / 2);
				y1 = tmpRect.y + tmpRect.height / 2 + Math.sin(angle) * (size / 2);
				graphics.moveTo(x1, y1);
				x1 = tmpRect.x + tmpRect.width / 2 + Math.cos(angle - 0.08) * (size / 2 - markerSize);
				y1 = tmpRect.y + tmpRect.height / 2 + Math.sin(angle - 0.08) * (size / 2 - markerSize);
				graphics.lineTo(x1, y1);
				x1 = tmpRect.x + tmpRect.width / 2 + Math.cos(angle + 0.08) * (size / 2 - markerSize);
				y1 = tmpRect.y + tmpRect.height / 2 + Math.sin(angle + 0.08) * (size / 2 - markerSize);
				graphics.lineTo(x1, y1);
				graphics.closePath();
				graphics.fill();
				graphics.stroke();
				break;
			case 'none':
				break;
			case 'circlesmall':
				graphics.beginPath();
				x1 = tmpRect.x + tmpRect.width / 2 + Math.cos(angle) * (size / 2 - markerSize);
				y1 = tmpRect.y + tmpRect.height / 2 + Math.sin(angle) * (size / 2 - markerSize);
				graphics.circle(x1, y1, markerSize / 2);
				graphics.fill();
				graphics.stroke();
				break;
			case 'line':
			default:
				graphics.beginPath();
				x1 = tmpRect.x + tmpRect.width / 2 + Math.cos(angle) * (size / 2 - markerSize);
				y1 = tmpRect.y + tmpRect.height / 2 + Math.sin(angle) * (size / 2 - markerSize);
				x2 = x1 + Math.cos(angle) * markerSize;
				y2 = y1 + Math.sin(angle) * markerSize;
				graphics.moveTo(x1, y1);
				graphics.lineTo(x2, y2);
				graphics.stroke();
				break;
		}

		step = Math.max(step, this.calculateStepSize(range, (size * 2) / width));

		graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.CENTER);
		graphics.setTextBaseline('middle');
		graphics.beginPath();

		graphics.setFillColor(textFormat.getFontColor().getValue());
		graphics.setLineColor('#333333');

		if (ranges.length && ranges[0].label) {
			ranges.forEach((rang) => {
				angle =
					((rang.start + (rang.end - rang.start) / 2 - min) / range) * (endAngle - startAngle) +
					startAngle +
					Math.PI_2;
				x2 = tmpRect.x + tmpRect.width / 2 + Math.cos(angle) * (size / 2 + 400);
				y2 = tmpRect.y + tmpRect.height / 2 + Math.sin(angle) * (size / 2 + 400);
				width = Math.max(
					100,
					graphics.getCoordinateSystem().deviceToLogX(graphics.measureText(String(rang.label)).width, true)
				);
				x2 += Math.cos(angle) * (width / 2 + 300);
				y2 += Math.sin(angle) * (height / 2 + 300);
				graphics.fillText(String(rang.label), x2, y2);
			});
		} else {
			for (let i = min; i <= max; i += step) {
				angle = ((i - min) / range) * (endAngle - startAngle) + startAngle + Math.PI_2;
				x1 = tmpRect.x + tmpRect.width / 2 + Math.cos(angle) * (size / 2 + 200);
				y1 = tmpRect.y + tmpRect.height / 2 + Math.sin(angle) * (size / 2 + 200);
				x2 = tmpRect.x + tmpRect.width / 2 + Math.cos(angle) * (size / 2 + 400);
				y2 = tmpRect.y + tmpRect.height / 2 + Math.sin(angle) * (size / 2 + 400);
				graphics.moveTo(x1, y1);
				graphics.lineTo(x2, y2);
				x2 += Math.cos(angle) * (width / 2 + 100);
				y2 += Math.sin(angle) * (width / 2 + 100);
				graphics.fillText(String(MathUtils.roundTo(i, 10)), x2, y2);
			}
		}

		graphics.stroke();
	}

	setScaleFont(item, graphics) {
		const fontJSON = item.getAttributeValueAtPath('scalefont');

		if (fontJSON === undefined || fontJSON === '') {
			return;
		}

		let def = {
			fontname: 'Verdana',
			fontsize: 8,
			fontcolor: '#000000',
			fontstyle: 'normal',
			alignment: 0
		};

		try {
			def = JSON.parse(fontJSON);
			// eslint-disable-next-line no-empty
		} catch (e) {}

		if (def.fontcolor) {
			graphics.setFillColor(def.fontcolor);
		}
		if (def.fontname) {
			graphics.setFontName(def.fontname);
		}
		if (def.fontsize) {
			graphics.setFontSize(def.fontsize);
		}
		if (def.fontstyle) {
			graphics.setFontStyle(def.fontstyle);
		}
		if (def.alignment) {
			graphics.setHorizontalAlignment(def.alignment);
		}

		graphics.setFont();
	}

	calculateStepSize(range, targetSteps) {
		// calculate an initial guess at step size
		const tempStep = range / targetSteps;

		// get the magnitude of the step size
		const mag = Math.floor(Math.log10(tempStep));
		const magPow = 10 ** mag;

		// calculate most significant digit of the new step size
		let magMsd = tempStep / magPow + 0.5;

		// promote the MSD to either 1, 2, or 5
		if (magMsd > 5.0) magMsd = 10.0;
		else if (magMsd > 2.0) magMsd = 5.0;
		else if (magMsd > 1.0) magMsd = 2.0;

		return magMsd * magPow;
	}

	valueFromLocation(event, viewer) {
		const point = event.location.copy();
		const item = this.getItem();
		const start = item.getAttributeValueAtPath('start');
		const end = item.getAttributeValueAtPath('end');
		const min = item.getAttributeValueAtPath('min');
		const max = item.getAttributeValueAtPath('max');

		viewer.translateFromParent(point);

		GraphUtils.traverseDown(viewer.getGraphView(), this, (v) => {
			v.translateFromParent(point);
			return true;
		});

		const size = this.getItem().getSizeAsPoint();
		let angle = Math.atan2(point.y - size.y / 2, point.x - size.x / 2) - Math.PI_2;
		while (angle < 0) {
			angle += Math.PI * 2;
		}
		const value = (angle - start) / (end - start) * (max - min) + min;

		return Math.min(max, Math.max(min, value));
	}

	onValueChange(viewer) {
		const item = this.getItem();
		const events = item._sheetEvents;
		if (events && events instanceof Array) {
			events.forEach((sheetEvent) => {
				if (sheetEvent.event === 'ONVALUECHANGE') {
					const sheet = item.getSheet();
					if (sheet) {
						const cmd = new ExecuteFunctionCommand(sheet, sheetEvent.func);
						viewer.getInteractionHandler().execute(cmd);
					}
				}
			});
		}
	}

	handleEvent(viewer, event, sheet, name) {
		const item = this.getItem();

		const setValue = (val) => {
			viewer.getInteractionHandler().execute(new SetAttributeAtPathCommand(item, 'value', val));
			item._targetValue = val;
		};

		if (name !== 'ONMOUSEDRAG' && name !== 'ONMOUSEUP') {
			return false;
		}

		let value = item.getAttributeValueAtPath('value');
		if (value === undefined) {
			setValue(0);
		}
		let step = item.getAttributeValueAtPath('step');
		if (!Numbers.isNumber(step)) {
			step = 1;
		}

		let sliderValue = this.valueFromLocation(event, viewer);
		sliderValue += (sliderValue >= 0 ? step / 2 : -step / 2);
		sliderValue -= sliderValue % step;

		if (value === sliderValue) {
			return false;
		}

		if (sheet && typeof value === 'string') {
			const range = CellRange.parse(value, sheet);
			if (range) {
				range.shiftFromSheet();
				const cell = range.getSheet().getDataProvider().createRC(range.getX1(), range.getY1());
				if (cell) {
					value = cell.getValue();
					if (value === sliderValue) {
						return false;
					}
					cell.setValue(sliderValue);
					cell.setTargetValue(sliderValue);
					range.shiftToSheet();
					const cellData = [];
					cellData.push({
						reference: range.toString(),
						value: sliderValue
					});
					viewer.getInteractionHandler().execute(new SetCellsCommand(range.getSheet(), cellData, false));
					this.onValueChange(viewer);
					return false;
				}
			}
		}

		setValue(sliderValue);
		this.onValueChange(viewer);

		return true;
	}
}
