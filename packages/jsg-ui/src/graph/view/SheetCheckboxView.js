import {
	default as JSG,
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
		const icon = JSG.imagePool.get(checked ? JSG.imagePool.SVG_CHECKED : JSG.imagePool.SVG_UNCHECKED);
		const size = 500;

		graphics.drawImage(icon, 100, (rect.height - size) / 2, size, size);
	}

	handleEvent(viewer, event, sheet, name) {
		const item = this.getItem();

		const setValue = (val) => {
			// item.setAttributeAtPath('value', val);
			const path = AttributeUtils.createPath(ItemAttributes.NAME, 'value');
			viewer.getInteractionHandler().execute(new SetAttributeAtPathCommand(item, 'value', val));
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
			const cell = sheet.getDataProvider().createRC(range.getX1(), range.getY1());
			if (cell) {
				range.shiftToSheet();
				value = cell.getValue();
				const cellData = [];
				if (value === 0 || value === '0' || value === false || value === undefined) {
					cellData.push({
						reference: range.toString(),
						value: true
					});
					viewer.getInteractionHandler().execute(new SetCellsCommand(sheet, cellData, false));
				} else if (value === 1 || value === '1' || value === true) {
					cellData.push({
						reference: range.toString(),
						value: false
					});
					viewer.getInteractionHandler().execute(new SetCellsCommand(sheet, cellData, false));
				}
				return false;
			}
		}

		return true;
	}
}
