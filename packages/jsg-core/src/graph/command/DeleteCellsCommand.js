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
const Command = require('./Command');
const { toCellRange } = require('./utils');

const toKeyValueObject = (attributes) => {
	const map = attributes ? {} : undefined;
	if (map) {
		attributes.iterate((attr) => {
			map[attr.getName()] = attr.getValue();
			// map[attr.getName().toLowerCase()] = attr.getValue();
		});
	}
	return map;
};
const filterCellAttributes = (obj) =>
	!obj
		? undefined
		: {
				key: obj.key,
				level: obj.level,
				protected: obj.protected,
				visible: obj.visible
		  };
const mergeCellFormat = (cellformat, obj) => {
	if (obj) {
		cellformat = cellformat || {};
		// add border formats...
		cellformat.leftbordercolor = obj.leftbordercolor;
		cellformat.leftborderstyle = obj.leftborderstyle;
		cellformat.leftborderwidth = obj.leftborderwidth;
		cellformat.topbordercolor = obj.topbordercolor;
		cellformat.topborderstyle = obj.topborderstyle;
		cellformat.topborderwidth = obj.topborderwidth;
		cellformat.rightbordercolor = obj.rightbordercolor;
		cellformat.rightborderstyle = obj.rightborderstyle;
		cellformat.rightborderwidth = obj.rightborderwidth;
		cellformat.bottombordercolor = obj.bottombordercolor;
		cellformat.bottomborderstyle = obj.bottomborderstyle;
		cellformat.bottomborderwidth = obj.bottomborderwidth;
	}
	return cellformat;
};

const getHeaderProperties = (attributes, format, txtFormat) => {
	format = toKeyValueObject(format);
	txtFormat = toKeyValueObject(txtFormat);
	attributes = toKeyValueObject(attributes);
	return format || attributes || txtFormat
		? { attributes, formats: { styles: format, text: txtFormat } }
		: undefined;
};
const getCellProperties = (attributes, format, txtFormat) => {
	format = toKeyValueObject(format);
	txtFormat = toKeyValueObject(txtFormat);
	attributes = toKeyValueObject(attributes);
	return format || attributes || txtFormat
		? {
				attributes: filterCellAttributes(attributes),
				formats: { styles: mergeCellFormat(format), text: txtFormat }
		  }
		: undefined;
};

/**
 * Command to delete a cell range
 *
 * @class DeleteC ellsCommand
 * @param {CellRange} range CellRange object.
 */
module.exports = class DeleteCellsCommand extends Command {
	static createFromObject(data = {}, { graph }) {
		const cellrange = toCellRange(data.range, graph);
		return cellrange
			? new DeleteCellsCommand(cellrange, data.type).initWithObject(data)
			: undefined;
	}
	constructor(range, type) {
		super();

		this._type = type;
		this._range = range.copy();
		this._oldJson = this._range.getSheet().saveForUndo();

		// store some info for machine-server only
		this._cellDescriptors = this._getCellDescriptors();
		this._headerProperties = this._getHeaderProperties();
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldJson = data.oldJson;
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.range = this._range.toObject();
		data.type = this._type;
		data.oldJson = this._oldJson;

		// add some info for machine-server only
		const container = this._range.getSheet().getParent();
		data.streamsheetId = container
			.getStreamSheetContainerAttributes()
			.getSheetId()
			.getValue();
		data.msrvrinfo = {
			type: this._type,
			range: this._range.toString(),
			cells: this._cellDescriptors,
			headerProperties: this._headerProperties
		};

		return data;
	}
	_getHeaderProperties() {
		const descriptors = [];
		const range = this._range;
		const isRows = this._type === 'rows';
		const isCols = this._type === 'columns';
		const header = isRows
			? this._range.getSheet().getRows()
			: this._range.getSheet().getColumns();
		const indexOffset = isRows ? 1 : 0;
		const enumerateHeader = isRows
			? range.enumerateRows.bind(range)
			: this._range.enumerateColumns.bind(range);
		if (isRows || isCols) {
			enumerateHeader((index) => {
				const props = getHeaderProperties(
					header.getSectionAttributes(index),
					header.getSectionFormat(index),
					header.getSectionTextFormat(index)
				);
				if (props) {
					props.index = index + indexOffset;
					descriptors.push(props);
				}
			});
		}
		return descriptors;
	}
	_getCellDescriptors() {
		const descriptors = [];
		const cellref = this._range.copy();
		const dataProvider = this._range.getSheet().getDataProvider();
		this._range.enumerateCells(false, (pos) => {
			const cell = dataProvider.getRC(pos.x, pos.y);
			if (cell) {
				const expr = cell.getExpression();
				cellref.set(pos.x, pos.y);
				cellref.shiftToSheet();
				descriptors.push({
					reference: cellref.toString(),
					formula: expr ? expr.getFormula() : undefined,
					value: cell.getValue(),
					type: typeof cell.getValue(),
					properties: getCellProperties(
						cell.getAttributes(),
						cell.getFormat(),
						cell.getTextFormat()
					)
				});
			}
		});
		return descriptors;
	}

	undo() {
		if (this._oldJson) {
			const sheet = this._range.getSheet();
			if (sheet) {
				sheet.readFromUndo(this._oldJson);
			}
		}

		this._range
			.getSheet()
			.getGraph()
			.markDirty();
	}

	redo() {
		switch (this._type) {
			case 'rows':
				this._range.deleteRows();
				break;
			case 'columns':
				this._range.deleteColumns();
				break;
			case 'cellshorizontal':
				this._range.deleteCellsHorizontal();
				break;
			case 'cellsvertical':
				this._range.deleteCellsVertical();
				break;
			default:
				break;
		}

		this._range
			.getSheet()
			.getGraph()
			.markDirty();
	}

	execute() {
		this.redo();
	}
};
