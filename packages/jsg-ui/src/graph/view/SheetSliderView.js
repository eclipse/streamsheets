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
	SheetCommandFactory,
	SetAttributeAtPathCommand,
	CellRange,
	Numbers,
	Rectangle,
	MathUtils,
	GraphUtils,
	ExecuteFunctionCommand
} from '@cedalo/jsg-core';
import NodeView from './NodeView';

export default class SheetSliderView extends NodeView {
	drawBorder(graphics, format, rect) {}

	drawFill(graphics, format, rect) {
		// super.drawFill(graphics, format, rect);

		const item = this.getItem();
		const title = item.getAttributeValueAtPath('title');
		const tmpRect = rect.copy();
		let value = item.getValue();

		if (!Numbers.isNumber(value)) {
			value = 0;
		}

		tmpRect.x += 150;
		tmpRect.y += rect.height / 2 - 100;
		tmpRect.height = 200;
		tmpRect.width -= 300;

		const textFormat = item.getTextFormat();

		textFormat.applyToGraphics(graphics);
		graphics.setFont();
		graphics.setTextBaseline('top');

		if (title && title.length) {
			graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.LEFT);
			graphics.fillText(`${item.getAttributeValueAtPath('title')}`, rect.x + 100, rect.y + 100);
			textFormat.removeFromGraphics(graphics);
		}

		let min = Number(item.getAttributeValueAtPath('min'));
		let max = Number(item.getAttributeValueAtPath('max'));
		let step = Number(item.getAttributeValueAtPath('step'));
		const marker = item.getAttributeValueAtPath('marker');
		const style = item.getAttributeValueAtPath('style');
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

		const ranges = [];
		const formatRange = item.getAttributeValueAtPath('formatrange');
		if (formatRange) {
			const sheet = item.getSheet();
			if (sheet && typeof formatRange === 'string') {
				const frange = CellRange.parse(formatRange, sheet);
				if (frange) {
					frange.shiftFromSheet();
					for (let i = frange.getY1(); i <= frange.getY2(); i += 1) {
						const def = {};
						let cell = frange._worksheet.getDataProvider().getRC(frange.getX1(), i);
						if (cell && cell.getValue() !== undefined) {
							def.start = Number(cell.getValue());
						}
						if (frange.getWidth() > 1) {
							cell = frange._worksheet.getDataProvider().getRC(frange.getX1() + 1, i);
							if (cell && cell.getValue()) {
								def.label = String(cell.getValue());
							}
						}
						if (frange.getWidth() > 2) {
							cell = frange._worksheet.getDataProvider().getRC(frange.getX1() + 2, i);
							if (cell && cell.getValue()) {
								def.color = String(cell.getValue());
							}
						}
						ranges.push(def);
					}
				}
			}
		}

		let pos = ((value - min) / range) * tmpRect.width;

		graphics.setFillColor(JSG.theme.fill);
		graphics.fillRect(tmpRect);

		if (ranges.length && ranges[0].color) {
			const colorRect = new Rectangle();
			colorRect.y = tmpRect.y;
			colorRect.height = tmpRect.height;
			ranges.forEach((rang, index) => {
				if (index && ranges[index - 1].color) {
					colorRect.x = tmpRect.x + ((ranges[index - 1].start - min) / range) * tmpRect.width;
					colorRect.width = ((ranges[index].start - ranges[index - 1].start) / range) * tmpRect.width;
					graphics.setFillColor(ranges[index - 1].color);
					graphics.fillRect(colorRect);
				}
			});
			graphics.setFillColor('#FFFFFF');
		} else if (format.applyFillToGraphics(graphics, rect)) {
			tmpRect.width = pos;
			graphics.fillRect(tmpRect);
		}

		tmpRect.width = rect.width - 300;

		if (format.applyLineToGraphics(graphics)) {
			graphics.drawRect(tmpRect);
			format.removeLineFromGraphics(graphics);
		}

		let scaleOffset = 500;

		switch (marker) {
			case 'square':
				graphics.beginPath();
				graphics.rect(tmpRect.x + pos - 250, tmpRect.y - 150, 500, 500);
				graphics.fill();
				graphics.stroke();
				break;
			case 'rect':
				graphics.beginPath();
				graphics.rect(tmpRect.x + pos - 125, tmpRect.y - 150, 250, 500);
				graphics.fill();
				graphics.stroke();
				break;
			case 'arrowtop':
				graphics.beginPath();
				graphics.moveTo(tmpRect.x + pos - 125, tmpRect.y - 250);
				graphics.lineTo(tmpRect.x + pos + 125, tmpRect.y - 250);
				graphics.lineTo(tmpRect.x + pos, tmpRect.y);
				graphics.closePath();
				graphics.fill();
				graphics.stroke();
				scaleOffset = 400;
				break;
			case 'arrowbottom':
				graphics.beginPath();
				graphics.moveTo(tmpRect.x + pos, tmpRect.y + 200);
				graphics.lineTo(tmpRect.x + pos + 125, tmpRect.y + 450);
				graphics.lineTo(tmpRect.x + pos - 125, tmpRect.y + 450);
				graphics.closePath();
				graphics.fill();
				graphics.stroke();
				scaleOffset = 600;
				break;
			case 'none':
				break;
			case 'circlesmall':
				graphics.beginPath();
				graphics.circle(tmpRect.x + pos, tmpRect.y + 100, 100);
				graphics.fill();
				graphics.stroke();
				scaleOffset = 400;
				break;
			default:
				graphics.beginPath();
				graphics.circle(tmpRect.x + pos, tmpRect.y + 100, 250);
				graphics.fill();
				graphics.stroke();
				break;
		}

		const width = Math.max(
			100,
			graphics.getCoordinateSystem().deviceToLogX(graphics.measureText(String(max)).width, true)
		);

		step = Math.max(step, this.calculateStepSize(range, tmpRect.width / width));

		graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.CENTER);
		graphics.beginPath();

		graphics.setFillColor(textFormat.getFontColor().getValue());
		graphics.setLineColor('#333333');

		this.setScaleFont(item, graphics);

		if (ranges.length && ranges[0].label) {
			ranges.forEach((rang) => {
				pos = ((rang.start - min) / range) * tmpRect.width;
				graphics.moveTo(tmpRect.x + pos, tmpRect.y + scaleOffset);
				graphics.lineTo(tmpRect.x + pos, tmpRect.y + scaleOffset + 100);
				graphics.fillText(String(rang.label), tmpRect.x + pos, tmpRect.y + scaleOffset + 200);
			});
		} else {
			for (let i = min; i <= max; i += step) {
				pos = ((i - min) / range) * tmpRect.width;
				graphics.moveTo(tmpRect.x + pos, tmpRect.y + scaleOffset);
				graphics.lineTo(tmpRect.x + pos, tmpRect.y + scaleOffset + 100);
				graphics.fillText(String(MathUtils.roundTo(i, 10)), tmpRect.x + pos, tmpRect.y + scaleOffset + 200);
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

	valueFromLocation(event, viewer, name) {
		const point = event.location.copy();
		const item = this.getItem();
		const min = item.getAttributeValueAtPath('min');
		const max = item.getAttributeValueAtPath('max');

		viewer.translateFromParent(point);

		GraphUtils.traverseDown(viewer.getGraphView(), this, (v) => {
			v.translateFromParent(point);
			return true;
		});

		const size = item.getSizeAsPoint();
		if (name !== 'ONMOUSEDRAG' && name !== 'ONMOUSEUP' &&
			(point.x < 150 || point.x > size.x - 150 || point.y < size.y / 2 - 500 || point.y > size.y / 2 + 500)) {
			return false;
		}

		point.x -= 150;
		const width = size.x - 300;

		return Math.min(max, Math.max(min, (point.x / width) * (max - min) + min));
	}

	onValueChange(viewer) {
		const item = this.getItem();
		const event = String(item.getEvents().getOnValueChange().getValue());
		if (event && event.length) {
			const sheet = item.getSheet();
			if (sheet) {
				const cmd = new ExecuteFunctionCommand(sheet, event);
				viewer.getInteractionHandler().execute(cmd);
			}
		}
	}

	handleEvent(viewer, event, sheet, name) {
		const item = this.getItem();

		const setValue = (val) => {
			viewer.getInteractionHandler().execute(new SetAttributeAtPathCommand(item, 'value', val));
		};

		if (name === 'ONMOUSEDRAG' && !this.dragging) {
			return false;
		}

		if (name !== 'ONMOUSEDRAG' && name !== 'ONMOUSEDOWN' && name !== 'ONMOUSEUP') {
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

		let sliderValue = this.valueFromLocation(event, viewer, name);
		if (name === 'ONMOUSEDOWN' && sliderValue !== false) {
			this.dragging = true;
		}
		if (this.dragging === false) {
			return false;
		}
		sliderValue += (sliderValue >= 0 ? step / 2 : -step / 2);
		sliderValue -= (sliderValue % step);

		if (name === 'ONMOUSEUP') {
			this.dragging = false;
		}

		if (value === sliderValue) {
			return false;
		}

		const attr = item.getAttributeAtPath('value');
		const expr = attr.getExpression();
		if (sheet && expr && expr.hasFormula()) {
			if (expr._cellref) {
				const range = CellRange.parse(expr._cellref, sheet);
				if (range) {
					range.shiftFromSheet();
					const cell = range.getSheet().getDataProvider().createRC(range.getX1(), range.getY1());
					if (cell) {
						value = cell.getValue();
						if (value === sliderValue) {
							return false;
						}
						expr.setTermValue(sliderValue);
						cell.setValue(sliderValue);
						cell.setTargetValue(sliderValue);
						range.shiftToSheet();
						const cellData = [];
						cellData.push({
							reference: range.toString(), value: sliderValue
						});
						const cmd = SheetCommandFactory.create('command.SetCellsCommand', range.getSheet(), cellData,
							false);
						viewer.getInteractionHandler().execute(cmd);
						this.onValueChange(viewer);
						return false;
					}
				}
			}
		} else {
			setValue(sliderValue);
		}

		this.onValueChange(viewer);

		return true;
	}
}
