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
	SetAttributeAtPathCommand,
	CellRange,
	SheetCommandFactory
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
		const size = 400;

		graphics.setLineWidth(50);
		graphics.setLineStyle(1);
		graphics.drawRectangle(150, (rect.height - size) / 2, size, size);
		if (checked) {
			graphics.beginPath();
			graphics.moveTo(260, rect.height / 2 + 30);
			graphics.lineTo(170 + size / 2, rect.y + rect.height - (rect.height - size) / 2 - 90);
			graphics.lineTo(70 + size, (rect.height - size) / 2 + 100);
			graphics.stroke();
		}

//		const icon = JSG.imagePool.get(checked ? ImagePool.SVG_CHECKED : ImagePool.SVG_UNCHECKED);

		// graphics.drawImage(icon, 100, (rect.height - size) / 2, size, size);
	}

	handleEvent(viewer, event, sheet, name) {
		const item = this.getItem();

		const setValue = (val) => {
			viewer.getInteractionHandler().execute(new SetAttributeAtPathCommand(item, 'value', val));
		};

		if (name !== 'ONCLICK') {
			return false;
		}

		const attr = item.getAttributeAtPath('value');
		const expr = attr.getExpression();
		if (sheet && expr._cellref) {
			const range = CellRange.parse(expr._cellref, sheet);
			if (range) {
				range.shiftFromSheet();
				const cell = range.getSheet().getDataProvider().createRC(range.getX1(), range.getY1());
				if (cell) {
					const value = cell.getValue();
					let newValue;
					if (value === 0 || value === '0' || value === false || value === undefined) {
						newValue = true;
					} else if (value === 1 || value === '1' || value === true) {
						newValue = false;
					}
					if (newValue !== undefined) {
						range.shiftToSheet();
						const cellData = [{
							reference: range.toString(),
							value: newValue
						}];
						expr.setTermValue(newValue);
						cell.setValue(newValue);
						cell.setTargetValue(newValue);

						// viewer.getInteractionHandler().execute(new SetCellsCommand(range.getSheet(), cellData, false));
						const cmd = SheetCommandFactory.create(
							'command.SetCellsCommand',
							range.getSheet(),
							cellData,
							false
						);
						viewer.getInteractionHandler().execute(cmd);
					}
					return false;
				}
			}
		} else {
			const value = attr.getValue();
			if (value === undefined || value === 0 || value === '0' || value === false) {
				setValue(true);
				return true;
			}
			if (value === 1 || value === '1' || value === true) {
				setValue(false);
				return true;
			}
		}

		return true;
	}
}
