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
	ImagePool,
	ItemAttributes,
	AttributeUtils,
	SetCellsCommand,
	SetAttributeAtPathCommand,
	CellRange
} from '@cedalo/jsg-core';
import NodeView from './NodeView';

export default class SheetCheckboxView extends NodeView {
	drawFill(graphics, format, rect) {
		// super.drawFill(graphics, format, rect);

		const item = this.getItem();
		const textFormat = item.getTextFormat();

		textFormat.applyToGraphics(graphics);
		graphics.setFont();
		graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.LEFT);
		graphics.setTextBaseline('middle');

		graphics.fillText(item.getAttributeValueAtPath('title'), rect.x + 800, rect.y + rect.height / 2 + 20);
		textFormat.removeFromGraphics(graphics);

		const checked = item.getValue();
		const icon = JSG.imagePool.get(checked ? ImagePool.SVG_CHECKED : ImagePool.SVG_UNCHECKED);
		const size = 500;

		graphics.drawImage(icon, 100, (rect.height - size) / 2, size, size);
	}

	handleEvent(viewer, event, sheet, name) {
		const item = this.getItem();

		const setValue = (val) => {
			viewer.getInteractionHandler().execute(new SetAttributeAtPathCommand(item, 'value', val));
			item._targetValue = val;
		};

		if (name !== 'ONCLICK') {
			return false;
		}

		let value = item.getAttributeValueAtPath('value');
		if (value === undefined) {
			setValue(true);
			return true;
		}

		if (value === 0 || value === '0' || value === false) {
			setValue(true);
			return true;
		}
		if (value === 1 || value === '1' || value === true) {
			setValue(false);
			return true;
		}

		const range = CellRange.parse(value, sheet);
		if (range) {
			range.shiftFromSheet();
			const cell = range.getSheet().getDataProvider().createRC(range.getX1(), range.getY1());
			if (cell) {
				range.shiftToSheet();
				value = cell.getValue();
				const cellData = [];
				if (value === 0 || value === '0' || value === false || value === undefined) {
					cellData.push({
						reference: range.toString(),
						value: true
					});
					cell.setValue(true);
					cell.setTargetValue(true);
					viewer.getInteractionHandler().execute(new SetCellsCommand(range.getSheet(), cellData, false));
				} else if (value === 1 || value === '1' || value === true) {
					cellData.push({
						reference: range.toString(),
						value: false
					});
					cell.setValue(false);
					cell.setTargetValue(false);
					viewer.getInteractionHandler().execute(new SetCellsCommand(range.getSheet(), cellData, false));
				}
				return false;
			}
		}

		return true;
	}
}
