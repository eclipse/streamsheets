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
import { default as JSG, CellRange, SetAttributeAtPathCommand, SetCellsCommand } from '@cedalo/jsg-core';
import NodeView from './NodeView';

export default class SheetButtonView extends NodeView {
	hex2(c) {
		c = Math.round(c);
		if (c < 0) c = 0;
		if (c > 255) c = 255;

		let s = c.toString(16);
		if (s.length < 2) s = `0${s}`;

		return s;
	}

	color(r, g, b) {
		return `#${this.hex2(r)}${this.hex2(g)}${this.hex2(b)}`;
	}

	shade(col, light) {
		let r = parseInt(col.substr(1, 2), 16);
		let g = parseInt(col.substr(3, 2), 16);
		let b = parseInt(col.substr(5, 2), 16);

		r = light < 0 ? (1 + light) * r : (1 - light) * r + light * 255;
		g = light < 0 ? (1 + light) * g : (1 - light) * g + light * 255;
		b = light < 0 ? (1 + light) * b : (1 - light) * b + light * 255;

		return this.color(r, g, b);
	}
	drawFill(graphics, format, rect) {
		const color = format.getFillColor().getValue();
		const item = this.getItem();

		const clicked = item.getValue();
		graphics.setLineCorner(150);
		if (clicked) {
			graphics.setFillColor(this.shade(color, -0.2));
		} else {
			graphics.setFillColor(item._isFeedback || item.hover ? this.shade(color, -0.1) : color);
		}
		graphics.setFillStyle(1);
		graphics.fillRect(rect);
		graphics.setLineCorner(0);

		const textFormat = item.getTextFormat();

		textFormat.applyToGraphics(graphics);
		graphics.setFont();
		graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.CENTER);
		graphics.setTextBaseline('middle');
		graphics.fillText(item.getAttributeValueAtPath('title'), rect.getCenter().x, rect.y + rect.height / 2 + 20);
		textFormat.removeFromGraphics(graphics);
	}

	handleEvent(viewer, event, sheet, name) {
		const item = this.getItem();

		const setValue = (val) => {
			const cmd = new SetAttributeAtPathCommand(item, 'value', val);
			cmd._keepFeedback = true;
			item._targetValue = val;
			viewer.getInteractionHandler().execute(cmd);
		};

		if (name !== 'ONMOUSEDOWN' && name !== 'ONMOUSEUP') {
			return false;
		}

		let value = item.getAttributeValueAtPath('value');
		if (value === undefined) {
			setValue(false);
			return true;
		}

		const range = CellRange.parse(String(value), sheet);
		if (range) {
			range.shiftFromSheet();
			const cell = range.getSheet().getDataProvider().createRC(range.getX1(), range.getY1());
			if (cell) {
				range.shiftToSheet();
				const cellData = [];
				switch (name) {
					case 'ONMOUSEDOWN':
						cellData.push({
							reference: range.toString(),
							value: true
						});
						value = true;
						break;
					case 'ONMOUSEUP':
						cellData.push({
							reference: range.toString(),
							value: false
						});
						value = false;
						break;
				}
				if (cellData.length) {
					cell.setValue(value);
					cell.setTargetValue(value);
					const cmd = new SetCellsCommand(range.getSheet(), cellData, false);
					cmd._keepFeedback = true;
					viewer.getInteractionHandler().execute(cmd);
				}
			}
		} else {
			setValue(name === 'ONMOUSEDOWN');
		}

		return true;
	}
}
