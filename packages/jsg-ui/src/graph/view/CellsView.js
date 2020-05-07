/* eslint-disable no-bitwise */
/* global document window */

import {
	default as JSG,
	CellRange,
	WorksheetAttributes,
	Selection,
	Point,
	MathUtils,
	Numbers,
	TextFormatAttributes,
	TreeItemsNode,
	FormatAttributes
} from '@cedalo/jsg-core';

import { FuncTerm } from '@cedalo/parser';

import { NumberFormatter } from '@cedalo/number-format';

import CellEditor from './CellEditor';
import NodeView from './NodeView';
import ContentPaneView from './ContentPaneView';
import ContentNodeView from './ContentNodeView';

const defaultCellErrorValue = '#####';

/**
 * This view is for a {{#crossLink "CellsNode"}}{{/crossLink}} model. Although it
 * can be instantiated directly the recommended way to create thi s view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 *
 * @class CellsView
 * @extends NodeView
 * @param {CellsNode} item The corresponding CellsNode model.
 * @constructor
 */
export default class CellsView extends NodeView {
	drawBorder(graphics, format, rect) {
		this._wsView = this.getWorksheetView();
		this._wsItem = this.getWorksheetNode();
		this._columns = this.getColumns();
		if (!this._wsView || !this._wsItem) {
			return;
		}

		const graph = this._wsItem.getGraph();
		const viewRect = this._wsView.getViewPort().getVisibleViewRect();

		this._greyIfRows = this._wsItem
			.getWorksheetAttributes()
			.getGreyIfRows()
			.getValue();
		this._showFormulas = this._wsItem.isShowFormulas();
		this._editMode =
			graph.getMachineContainer() &&
			graph
				.getMachineContainer()
				.getMachineState()
				.getValue() === 1;

		if (this._wsItem.isGridVisible()) {
			this.drawGrid(graphics, rect, viewRect);
		}
		graphics.setTransparency(100);

		this.drawDataNew(graphics, rect, viewRect);

		const id = graph.getTopStreamSheetContainerId();

		if (id !== undefined && id !== this._wsItem.getId()) {
			this.drawSelections(graphics, rect);
		}
		this.drawCellEditRanges(graphics, rect);
		if (id !== undefined && id !== this._wsItem.getId()) {
			this.drawCopyMarker(graphics, rect);
		}
	}

	drawDataNew(graphics, rect, viewRect) {
		const columns = this.getColumns();
		const rows = this.getRows();
		const dataProvider = this._wsItem.getDataProvider();

		// get visible matrix
		const visibleColumnsInfo = this.getVisibleColumnSections(columns, rect, viewRect);
		const visibleRowsInfo = this.getVisibleRowsSections(rows, columns, rect, viewRect, visibleColumnsInfo);

		if (visibleColumnsInfo.length === 0 || visibleRowsInfo.length === 0) {
			return;
		}

		this.setFont(graphics);
		graphics.setFillColor('#000000');
		graphics.setTextBaseline('bottom');

		// draw cell content
		visibleRowsInfo.forEach((rowInfo) => {
			if (rowInfo.leftCellInfo) {
				const data = dataProvider.getRC(rowInfo.leftCellInfo.index, rowInfo.index);
				if (data !== undefined && data.getExpression() !== undefined) {
					this.drawValue(graphics, dataProvider, data, rowInfo.leftCellInfo, rowInfo, visibleColumnsInfo, undefined);
				}
			}
			visibleColumnsInfo.forEach((columnInfo) => {
				const data = dataProvider.getRC(columnInfo.index, rowInfo.index);
				const cellProperties = this.getCellProperties(data, columnInfo, rowInfo);
				this.drawCellFill(graphics, data,  columnInfo, rowInfo, visibleColumnsInfo, visibleRowsInfo, cellProperties);
				if (data !== undefined && data.getExpression() !== undefined) {
					this.drawValue(graphics, dataProvider, data, columnInfo, rowInfo, visibleColumnsInfo, cellProperties);
					this.drawSpecialFunction(graphics, data, columnInfo, rowInfo, visibleColumnsInfo, visibleRowsInfo);
				}
			});
			if (rowInfo.rightCellInfo) {
				const data = dataProvider.getRC(rowInfo.rightCellInfo.index, rowInfo.index);
				if (data !== undefined && data.getExpression() !== undefined) {
					this.drawValue(graphics, dataProvider, data, rowInfo.rightCellInfo, rowInfo, visibleColumnsInfo, undefined);
				}
			}
		});

		let last;

		const borders = {
			grid: []
		};

		// draw grid
		visibleColumnsInfo.forEach((columnInfo) => {
			last = viewRect.y;

			columnInfo.gridSkipBorders.forEach((info, index) => {
				if (this._wsItem.isGridVisible() && last !== info.y && info.y > last) {
					borders.grid.push({
						x1: columnInfo.x,
						y1: last,
						x2: columnInfo.x,
						y2: info.y
					});
				}
				last = info.y + info.height;
			});

			if (this._wsItem.isGridVisible()) {
				borders.grid.push({
					x1: columnInfo.x,
					y1: last,
					x2: columnInfo.x,
					y2: viewRect.y + viewRect.height
				});
			}
		});

		graphics.beginPath();
		graphics.setLineColor('#CCCCCC');
		borders.grid.forEach((line) => {
			graphics.moveTo(line.x1, line.y1);
			graphics.lineTo(line.x2, line.y2);
		});
		graphics.stroke();

		// draw borders
		visibleColumnsInfo.forEach((columnInfo) => {
			Object.entries(columnInfo.leftBorders).forEach(([color, value]) => {
				graphics.setLineColor(color);
				Object.entries(value).forEach(([y, border]) => {
					if (columnInfo.skipBorders[y] === undefined) {
						graphics.beginPath();
						graphics.setLineWidth(
							border.borderWidth === 1 || border.borderWidth === undefined
								? 1
								: graphics.getCoordinateSystem().deviceToLogX(border.borderWidth)
						);
						graphics.setLineStyle(border.style === undefined ? 1 : border.style);
						graphics.applyLineDash();
						graphics.moveTo(columnInfo.x, Number(y));
						graphics.lineTo(columnInfo.x, Number(y) + border.height);
						graphics.stroke();
						graphics.clearLineDash();
					}
				});
			});
		});

		visibleRowsInfo.forEach((rowInfo) => {
			Object.entries(rowInfo.topBorders).forEach(([color, value]) => {
				graphics.setLineColor(color);
				Object.entries(value).forEach(([x, border]) => {
					graphics.beginPath();
					graphics.setLineWidth(
						border.borderWidth === 1 || border.borderWidth === undefined
							? 1
							: graphics.getCoordinateSystem().deviceToLogX(border.borderWidth)
					);
					graphics.setLineStyle(border.style === undefined ? 1 : border.style);
					graphics.applyLineDash();
					graphics.moveTo(Number(x), rowInfo.y);
					graphics.lineTo(Number(x) + border.width, rowInfo.y);
					graphics.stroke();
					graphics.clearLineDash();
				});
			});
		});
	}

	drawRead(graphics, x, y, rect, clipRect, data, termFunc, column, row, grey) {
		let fillColor = '#AAAAAA';
		const value = String(data.getValue());

		termFunc.iterateParams((param, index) => {
			switch (index) {
				case 2:
					switch (param.value) {
						case 'String':
							fillColor = '#009408';
							break;
						case 'Number':
							fillColor = '#497B8D';
							break;
						case 'Bool':
							fillColor = '#B1C639';
							break;
						case 'Dictionary':
							fillColor = '#E17000';
							break;
						case 'Array':
							fillColor = '#2D5B89';
							break;
						default:
							break;
					}
					break;
				default:
					break;
			}
		}, this);

		const attributes = this._wsItem.getCellAttributesAtRC(column, row);
		const level = attributes.getLevel().getValue();

		rect.x += level * 150;
		rect.width -= level * 150;

		this.rectangle(graphics, rect, fillColor, grey ? 60 : undefined);

		graphics.setFillColor('#FFFFFF');
		graphics.setFontStyle(TextFormatAttributes.FontStyle.BOLD);
		graphics.setFont();

		if (clipRect) {
			graphics.save();
			graphics.setClip(clipRect);
		}
		graphics.fillText(value, x + level * 150, y);
		if (clipRect) {
			graphics.restore();
		}

		rect.x -= level * 150;
		rect.width += level * 150;

		graphics.setFontStyle(TextFormatAttributes.FontStyle.NORMAL);
		graphics.setFont();
	}

	drawPublish(graphics, x, y, rect, clipRect, data, termFunc, grey) {
		let fillColor;

		let value = String(data.getValue());

		if (value === 'true' || value[0] !== '#') {
			fillColor = '#1976d2';
			value = termFunc.getFuncId();
		} else {
			fillColor = '#FF0000';
		}

		this.rectangle(graphics, rect, fillColor, grey ? 60 : undefined);

		graphics.setFillColor('#FFFFFF');
		graphics.setFontStyle(TextFormatAttributes.FontStyle.BOLD);
		graphics.setFont();

		if (clipRect) {
			graphics.save();
			graphics.setClip(clipRect);
		}
		graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);
		graphics.fillText(value, rect.x + 75, y);
		if (clipRect) {
			graphics.restore();
		}

		graphics.setFontStyle(TextFormatAttributes.FontStyle.NORMAL);
		graphics.setFont();
	}

	drawSelect(graphics, x, y, rect, clipRect, data, termFunc) {
		const value = String(data.getValue());

		if (clipRect) {
			graphics.save();
			graphics.setClip(clipRect);
		}
		graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);
		graphics.fillText(value, rect.x + 100, y);
		if (clipRect) {
			graphics.restore();
		}

		graphics.setFillColor('#888888');

		const pts = [
			{ x: rect.x + rect.width - 400, y: rect.y + rect.height / 2 - 80 },
			{ x: rect.x + rect.width - 150, y: rect.y + rect.height / 2 - 80 },
			{ x: rect.x + rect.width - 275, y: rect.y + rect.height / 2 + 80 }
		];

		graphics.fillPolyline(pts, true);

		graphics.setFillColor('#000000');
	}

	drawBar(cellValue, graphics, rect, termFunc, borderMatrix, column, row, visibleColumn, visibleRow) {
		let direction = true;
		let fillColor = '#00FF00';
		let lineColor;
		const fillRect = rect.copy();
		let value = 0;

		if (Numbers.isNumber(cellValue)) {
			termFunc.iterateParams((param, index) => {
				switch (index) {
					case 0:
						value = cellValue;
						break;
					case 1:
						direction = param.value === undefined ? true : param.value;
						break;
					case 2:
						fillColor = param.value || '#00FF00';
						break;
					case 3:
					default:
						lineColor = param.value;
						break;
				}
			}, this);
		} else {
			const params = cellValue.split(';');
			params.forEach((param, index) => {
				switch (index) {
					case 0:
						value = Number(param);
						if (Number.isNaN(value)) {
							value = param.length > 0 && param !== 'false' ? 1 : 0;
						}
						break;
					case 1:
						direction = Number(param);
						break;
					case 2:
						fillColor = param === 'undefined' || param === '' ? '#00FF00' : param;
						break;
					case 3:
						lineColor = param === 'undefined' || param === '' ? undefined : param;
						break;
					default:
						break;
				}
			});
		}

		if (Numbers.isNumber(value)) {
			if (direction) {
				fillRect.y += fillRect.height - fillRect.height * value;
				fillRect.height *= value;
			} else {
				fillRect.width *= value;
			}
			if (String(fillColor).toUpperCase() !== 'NONE') {
				graphics.setFillColor(fillColor);
				graphics.fillRect(fillRect);
				const attributes = this._wsItem.getCellAttributesAtRC(column, row);
				let style = attributes.getTopBorderStyle().getValue();
				if (style !== FormatAttributes.LineStyle.NONE) {
					const cs = graphics.getCoordinateSystem();
					graphics.setLineColor(attributes.getTopBorderColor().getValue());
					graphics.setLineStyle(attributes.getTopBorderStyle().getValue());
					graphics.setLineWidth(cs.deviceToLogX(attributes.getTopBorderWidth().getValue()));
					graphics.drawLine(
						{ x: fillRect.x, y: fillRect.y },
						{ x: fillRect.x + fillRect.width, y: fillRect.y }
					);
				}
				style = attributes.getBottomBorderStyle().getValue();
				if (style !== FormatAttributes.LineStyle.NONE) {
					const cs = graphics.getCoordinateSystem();
					graphics.setLineColor(attributes.getBottomBorderColor().getValue());
					graphics.setLineStyle(attributes.getBottomBorderStyle().getValue());
					graphics.setLineWidth(cs.deviceToLogX(attributes.getBottomBorderWidth().getValue()));
					graphics.drawLine(
						{ x: fillRect.x, y: fillRect.y + fillRect.height },
						{ x: fillRect.x + fillRect.width, y: fillRect.y + fillRect.height }
					);
				}
			}
			if (lineColor !== undefined && String(lineColor).toUpperCase() !== 'NONE') {
				graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
				graphics.setLineColor(lineColor);
				graphics.drawRect(fillRect);
				const borderrow = borderMatrix[visibleRow];
				if (borderrow.length > visibleColumn) {
					borderrow[visibleColumn].draw = false;
					if (value === 1 && borderrow.length > visibleColumn + 1) {
						borderrow[visibleColumn + 1].draw = false;
					}
				}
			}
		}
	}

	drawFunction(
		graphics,
		x,
		y,
		rect,
		clipRect,
		data,
		expr,
		borderMatrix,
		column,
		row,
		visibleColumn,
		visibleRow,
		grey
	) {
		if (expr === undefined) {
			return false;
		}

		const termFunc = expr.getTerm();

		if (termFunc && termFunc instanceof FuncTerm) {
			if (data.displayFunctionName) {
				switch (termFunc.getFuncId()) {
					case 'BAR':
						// if there is a bar function in this cell, draw bar according to function parameters
						this.drawBar(
							data.getValue(),
							graphics,
							rect,
							termFunc,
							borderMatrix,
							column,
							row,
							visibleColumn,
							visibleRow
						);
						break;
					case 'READ':
					case 'WRITE':
						this.drawRead(graphics, x, y, rect, clipRect, data, termFunc, column, row, grey);
						break;
					case 'SELECT':
						this.drawSelect(graphics, x, y, rect, clipRect, data, termFunc);
						break;
					default:
						this.drawPublish(graphics, x, y, rect, clipRect, data, termFunc, grey);
				}
				return true;
			}
		}

		return false;
	}

	getFormattedValue(worksheetNode, expr, value, textFormat, showFormulas) {
		return worksheetNode.getFormattedValue(expr, value, textFormat, showFormulas);
	}

	drawKey(graphics, drawRect, column, row, visibleColumn, visibleRow) {
		const attributes = this._wsItem.getCellAttributesAtRC(column, row);
		if (attributes) {
			if (attributes.getKey().getValue()) {
				const dataProvider = this._wsItem.getDataProvider();
				if (
					!this._wsItem
						.getCellAttributesAtRC(column + 1, row)
						.getKey()
						.getValue()
				) {
					return false;
				}
				let data = dataProvider.getRC(column + 1, row);
				if (data === undefined) {
					return false;
				}
				let level = 0;
				let subLevel = 0;
				let fillColor;

				let subAttributes = this._wsItem.getCellAttributesAtRC(column, row + 1);
				if (subAttributes) {
					level = attributes.getLevel().getValue();
					subLevel = subAttributes.getLevel().getValue();
				}

				drawRect.x += level * 150 + 50;
				drawRect.y += 50;
				drawRect.width -= level * 150 + 100;
				drawRect.height -= 100;

				if (level < subLevel) {
					fillColor = '#2D5B89';

					for (let i = 1; i < 10; i += 1) {
						subAttributes = this._wsItem.getCellAttributesAtRC(column, row + i);
						if (subAttributes.getLevel().getValue() !== subLevel) {
							break;
						}
						data = dataProvider.getRC(column, row + i);
						if (data !== undefined) {
							const val = data.getValue();
							if (Number(val) !== i - 1) {
								fillColor = '#E17000';
								break;
							}
						} else {
							fillColor = '#E17000';
						}
					}
				} else {
					const value = data.getValue();
					const type = typeof value;
					// draw fill based on cell value type
					switch (type) {
						case 'string':
							fillColor = '#009408';
							break;
						case 'number':
							fillColor = '#497B8D';
							break;
						case 'boolean':
							fillColor = '#B1C639';
							break;
						default:
							fillColor = '#009408';
							break;
					}
				}

				graphics.setFillColor(fillColor);
				graphics.fillRect(drawRect);
				return true;
			}
		}
		return false;
	}

	drawBorders(graphics, cs, borderMatrix, drawRect, column, row, visibleColumn, visibleRow) {
		const attributes = this._wsItem.getCellAttributesAtRC(column, row);
		if (attributes) {
			const borderrow = borderMatrix[visibleRow];
			let style = attributes.getLeftBorderStyle().getValue();
			if (style !== FormatAttributes.LineStyle.NONE) {
				const leftBorder = borderrow[visibleColumn];
				leftBorder.draw = true;
				leftBorder.color = attributes.getLeftBorderColor().getValue();
				leftBorder.style = attributes.getLeftBorderStyle().getValue();
				leftBorder.borderwidth = attributes.getLeftBorderWidth().getValue();
			}
			style = attributes.getTopBorderStyle().getValue();
			if (style !== FormatAttributes.LineStyle.NONE) {
				graphics.setLineColor(attributes.getTopBorderColor().getValue());
				graphics.setLineStyle(attributes.getTopBorderStyle().getValue());
				const width = attributes.getTopBorderWidth().getValue();

				graphics.setLineWidth(width === 1 ? 1 : cs.deviceToLogX(width));
				graphics.beginPath();
				graphics.applyLineDash();
				graphics.moveTo(drawRect.x, drawRect.y);
				graphics.lineTo(drawRect.x + drawRect.width, drawRect.y);
				graphics.stroke();
				graphics.clearLineDash();
			}
			style = attributes.getRightBorderStyle().getValue();
			if (style !== FormatAttributes.LineStyle.NONE) {
				const rightBorder = borderrow[visibleColumn + 1];
				rightBorder.draw = true;
				rightBorder.color = attributes.getRightBorderColor().getValue();
				rightBorder.style = attributes.getRightBorderStyle().getValue();
				rightBorder.borderwidth = attributes.getRightBorderWidth().getValue();
			}
			style = attributes.getBottomBorderStyle().getValue();
			if (style !== FormatAttributes.LineStyle.NONE) {
				graphics.setLineColor(attributes.getBottomBorderColor().getValue());
				graphics.setLineStyle(attributes.getBottomBorderStyle().getValue());
				const width = attributes.getBottomBorderWidth().getValue();

				graphics.setLineWidth(width === 1 ? 1 : cs.deviceToLogX(width));
				graphics.beginPath();
				graphics.applyLineDash();
				graphics.moveTo(drawRect.x, drawRect.y + drawRect.height);
				graphics.lineTo(drawRect.x + drawRect.width, drawRect.y + drawRect.height);
				graphics.stroke();
				graphics.clearLineDash();
			}
		}
	}

	drawCell(graphics, borderMatrix, drawRect, i, j, visibleColumn, visibleRow, sheetInfo) {
		const dataProvider = this._wsItem.getDataProvider();
		const data = dataProvider.getRC(i, j);
		if (data === undefined) {
			return;
		}

		const expr = data.getExpression();
		if (expr === undefined) {
			return;
		}

		const value = data.getValue();

		// IF Column
		if (i === 1) {
			const state = value === 0 || value === '' || value === false || value === 'false';
			sheetInfo.greyRowText = sheetInfo.greyIfRows && (sheetInfo.editMode || state);
			if (sheetInfo.showFormulas === false && drawRect.width < 1100) {
				if (value !== undefined) {
					graphics.setFillColor(state ? '#FF0011' : '#00B050');
					graphics.setTransparency(17);
					graphics.fillRect(drawRect);
					graphics.setTransparency(100);
				}
				return;
			}
		}

		const row = dataProvider.getRow(j);
		const textFormat = this._wsItem.getTextFormatAtRC(i, j);
		const ALIGNMENT = TextFormatAttributes.TextAlignment;
		const VALIGNMENT = TextFormatAttributes.VerticalTextAlignment;

		let formattingResult = this.getFormattedValue(this._wsItem, expr, value, textFormat, sheetInfo.showFormulas);

		if (formattingResult.value === undefined || formattingResult.value === null) {
			return;
		}

		this.applyToGraphics(graphics, textFormat);
		graphics.setFont();

		let alignment = textFormat.getHorizontalAlignment().getValue();
		if (sheetInfo.showFormulas && expr.hasFormula()) {
			alignment = ALIGNMENT.LEFT;
		}

		if (alignment === undefined || alignment === ALIGNMENT.DEFAULT) {
			if (formattingResult.type && formattingResult.type === 'text') {
				alignment = ALIGNMENT.LEFT;
			} else if (Numbers.isNumber(formattingResult.value)) {
				alignment = ALIGNMENT.RIGHT;
			} else if (typeof formattingResult.value === 'boolean') {
				alignment = ALIGNMENT.CENTER;
			} else if (formattingResult.value[0] === '#') {
				alignment = ALIGNMENT.CENTER;
			} else {
				alignment = ALIGNMENT.LEFT;
			}
		}

		graphics.setTextAlignment(alignment);

		let clip = this._wsItem
			.getWorksheetAttributes()
			.getClipCells()
			.getValue();
		const clipRect = JSG.rectCache.get();

		clipRect.setTo(drawRect);

		if (Numbers.isNumber(formattingResult.value) || typeof formattingResult.value === 'boolean') {
			let width = graphics
				.getCoordinateSystem()
				.deviceToLogX(graphics.measureText(formattingResult.formattedValue).width, true);
			if (width > drawRect.width - 200) {
				if (
					formattingResult.type === 'general' &&
					!Number.isInteger(formattingResult.value) &&
					!(typeof formattingResult.value === 'boolean')
				) {
					// eslint-disable-next-line prefer-template
					const decPart = (formattingResult.value + '').split('.')[1];
					let decimals = decPart ? decPart.length - 1 : 0;

					while (decimals > 0 && width > drawRect.width - 200) {
						formattingResult.value = MathUtils.roundTo(formattingResult.value, decimals);
						formattingResult = NumberFormatter.formatNumber('General', formattingResult.value, 'general');
						width = graphics
							.getCoordinateSystem()
							.deviceToLogX(graphics.measureText(formattingResult.formattedValue).width, true);
						decimals -= 1;
					}
				}
				if (width > drawRect.width - 200) {
					formattingResult.formattedValue = new Array(Math.floor(drawRect.width / 150) + 1).join('#');
				}
				clip = true;
			}
		}

		const isDataEmpty = (lcell) =>
			lcell === undefined ||
			lcell.getValue() === undefined ||
			lcell.getValue() === null ||
			lcell.getValue().toString() === '';
		const cell = JSG.ptCache.get();

		// get available space
		if (clip === false) {
			let column;
			let dataNext;
			switch (alignment) {
				case ALIGNMENT.LEFT:
					column = i + 1;
					while (column < row.length) {
						cell.set(column, j);
						dataNext = dataProvider.get(cell);
						if (isDataEmpty(dataNext)) {
							clipRect.width += sheetInfo.columns.getSectionSize(column);
						} else {
							clip = true;
							break;
						}
						column += 1;
					}
					break;
				case ALIGNMENT.CENTER: {
					let rClip = false;
					column = i - 1;
					while (column >= 0) {
						cell.set(column, j);
						dataNext = dataProvider.get(cell);
						if (isDataEmpty(dataNext)) {
							clipRect.x -= sheetInfo.columns.getSectionSize(column);
							clipRect.width += sheetInfo.columns.getSectionSize(column);
						} else {
							clip = true;
							break;
						}
						column -= 1;
					}
					column = i + 1;
					while (column < row.length) {
						cell.set(column, j);
						dataNext = dataProvider.get(cell);
						if (isDataEmpty(dataNext)) {
							clipRect.width += sheetInfo.columns.getSectionSize(column);
						} else {
							clip = true;
							rClip = true;
							break;
						}
						column += 1;
					}
					if (rClip === false) {
						// in case it clips to the left, but not to the right and there are no cells
						clipRect.width = 60000;
					}
					break;
				}
				case ALIGNMENT.RIGHT:
					column = i - 1;
					while (column >= 0) {
						cell.set(column, j);
						dataNext = dataProvider.get(cell);
						if (isDataEmpty(dataNext)) {
							clipRect.x -= sheetInfo.columns.getSectionSize(column);
							clipRect.width += sheetInfo.columns.getSectionSize(column);
						} else {
							clip = true;
							break;
						}
						column -= 1;
					}
					break;
			}
		}

		// calc position of text
		let x;
		let y;

		switch (alignment) {
			case ALIGNMENT.LEFT:
				x = drawRect.x + 75;
				break;
			case ALIGNMENT.RIGHT:
				x = drawRect.x + drawRect.width - 100;
				break;
			case ALIGNMENT.CENTER:
			default:
				x = drawRect.x + drawRect.width / 2;
				break;
		}

		const valign = textFormat.getVerticalAlignment().getValue();
		switch (valign) {
			case VALIGNMENT.TOP:
				y = drawRect.y + 50;
				graphics.setTextBaseline('top');
				break;
			case VALIGNMENT.CENTER:
				y = drawRect.y + drawRect.height / 2;
				graphics.setTextBaseline('middle');
				break;
			case VALIGNMENT.BOTTOM:
			default:
				graphics.setTextBaseline('bottom');
				y = drawRect.y + drawRect.height - 50;
				break;
		}

		if (clip) {
			clipRect.x += 100;
			clipRect.width -= 100;
		}

		const draw =
			sheetInfo.showFormulas ||
			!this.drawFunction(
				graphics,
				x,
				y,
				drawRect,
				clipRect,
				data,
				expr,
				borderMatrix,
				i,
				j,
				visibleColumn,
				visibleRow,
				sheetInfo.greyRowText
			);
		if (draw) {
			const oldDraw = drawRect.copy();
			if (this.drawKey(graphics, drawRect, i, j, visibleColumn, visibleRow)) {
				x = drawRect.x + 75;
				graphics.setTextAlignment(ALIGNMENT.LEFT);
				graphics.setFillColor('#FFFFFF');
			} else if (formattingResult.color) {
				graphics.setFillColor(formattingResult.color);
			} else if (textFormat) {
				graphics.setFillColor(textFormat.getFontColor().getValue());
			} else {
				graphics.setFillColor(
					this.getItem()
						.getTextFormat()
						.getFontColor()
						.getValue()
				);
			}

			if (clip) {
				graphics.save();
				graphics.setClip(clipRect);
			}

			if (sheetInfo.greyRowText) {
				graphics.setTransparency(60);
			}

			const textWidth = graphics
				.getCoordinateSystem()
				.deviceToLogX(graphics.measureText(formattingResult.formattedValue).width, true);

			graphics.fillText(formattingResult.formattedValue, x, y);

			if (sheetInfo.greyRowText) {
				graphics.setTransparency(100);
			}

			drawRect.setTo(oldDraw);

			const borderRow = borderMatrix[visibleRow];
			if (borderRow) {
				switch (alignment) {
					case ALIGNMENT.LEFT:
						borderRow.forEach((border) => {
							if (
								border.x > x &&
								border.x < x + textWidth &&
								(clip === false || border.x < clipRect.x + clipRect.width)
							) {
								border.draw = false;
							}
						});
						break;
					case ALIGNMENT.CENTER:
						borderRow.forEach((border) => {
							if (
								border.x > x &&
								border.x < x + textWidth / 2 &&
								(clip === false || border.x < clipRect.x + clipRect.width)
							) {
								border.draw = false;
							}
							if (
								border.x < x &&
								border.x > x - textWidth / 2 &&
								(clip === false || border.x >= clipRect.x)
							) {
								border.draw = false;
							}
						});
						break;
					case ALIGNMENT.RIGHT:
						borderRow.forEach((border) => {
							if (
								border.x < x &&
								border.x > x - textWidth &&
								(clip === false || border.x >= clipRect.x)
							) {
								border.draw = false;
							}
						});
						break;
					default:
						break;
				}
			}

			if (clip) {
				graphics.restore();
			}
		}

		if (textFormat !== undefined) {
			textFormat.removeFromGraphics(graphics);
			graphics.setFont();
		}

		JSG.ptCache.release(cell);
		JSG.rectCache.release(clipRect);
	}

	drawData(graphics, rect, viewRect) {
		const item = this.getItem();
		const cellRect = JSG.rectCache.get();
		const borderMatrix = [];
		const sheetInfo = {
			cs: graphics.getCoordinateSystem(),
			dataProvider: this.getItem().getDataProvider(),
			columns: this.getColumns(),
			rows: this.getRows(),
			gridSetting: this._wsItem.isGridVisible(),
			editMode:
				item.getGraph().getMachineContainer() &&
				item
					.getGraph()
					.getMachineContainer()
					.getMachineState()
					.getValue() === 1,
			greyRowText: false,
			greyIfRows: this._wsItem
				.getWorksheetAttributes()
				.getGreyIfRows()
				.getValue(),
			showFormulas: this._wsItem.isShowFormulas()
		};

		if (!sheetInfo.columns || !sheetInfo.rows) {
			return;
		}

		// init border info first
		const initialColumnIndex = this.enumerateVisibleCells(
			sheetInfo.rows,
			sheetInfo.columns,
			rect,
			viewRect,
			(lcellRect, column, row, visibleColumn, visibleRow, first, final) => {
				if (borderMatrix[visibleRow] === undefined) {
					borderMatrix[visibleRow] = [];
				}
				borderMatrix[visibleRow][visibleColumn] = {
					draw: sheetInfo.gridSetting,
					color: '#CCCCCC',
					borderwidth: 1,
					style: FormatAttributes.FillStyle.SOLID,
					x: lcellRect.x,
					y: lcellRect.y,
					height: lcellRect.height,
					width: lcellRect.width
				};
				if (final) {
					borderMatrix[visibleRow][visibleColumn + 1] = {
						draw: sheetInfo.gridSetting,
						color: '#CCCCCC',
						borderwidth: 1,
						style: FormatAttributes.FillStyle.SOLID,
						x: lcellRect.x + lcellRect.width,
						y: lcellRect.y,
						height: lcellRect.height,
						width: lcellRect.width
					};
				}
			}
		);

		sheetInfo.rows.enumerateSections((rowSection, rowIndex) => {
			const row = sheetInfo.dataProvider.getRow(rowIndex);
			if (row === undefined) {
				return;
			}
			row._greyRow = undefined;
			const data = sheetInfo.dataProvider.getRC(1, rowIndex);
			if (data === undefined) {
				return;
			}

			const value = data.getValue();
			if (value === undefined) {
				return;
			}

			// IF Column
			const state = value === 0 || value === '' || value === false || value === 'false';
			row._greyRow = sheetInfo.greyIfRows && (sheetInfo.editMode || state);
		});

		// draw cell fills
		this.enumerateVisibleCells(
			sheetInfo.rows,
			sheetInfo.columns,
			rect,
			viewRect,
			(lcellRect, column, row, visibleColumn, visibleRow) => {
				// drawFill(lcellRect, column, row, visibleColumn, visibleRow);
				const format = this._wsItem.getFormatAtRC(column, row);

				if (format.getFillStyle().getValue() === FormatAttributes.FillStyle.SOLID) {
					const rowData = sheetInfo.dataProvider.getRow(row);
					const grey = rowData ? rowData._greyRow : false;

					this.rectangle(graphics, lcellRect, format.getFillColor().getValue(), grey ? 60 : undefined);

					const borderrow = borderMatrix[visibleRow];
					borderrow[visibleColumn].draw = false;
					borderrow[visibleColumn + 1].draw = false;
				} else {
					const attributes = this._wsItem.getCellAttributesAtRC(column, row);
					if (attributes.getKey().getValue()) {
						this.rectangle(graphics, lcellRect.copy().reduceBy(50), '#F2F2F2');
					}
				}
			}
		);

		// draw or collect cell borders
		this.enumerateVisibleCells(
			sheetInfo.rows,
			sheetInfo.columns,
			rect,
			viewRect,
			(lcellRect, column, row, visibleColumn, visibleRow) => {
				this.drawBorders(
					graphics,
					sheetInfo.cs,
					borderMatrix,
					lcellRect,
					column,
					row,
					visibleColumn,
					visibleRow
				);
			}
		);

		graphics.setLineColor('#000000');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);

		// draw cell content, here all cells in a row need to be painted
		cellRect.y = rect.y;
		this.setFont(graphics);
		let visibleRowIndex = 0;

		sheetInfo.rows.enumerateSections((rowSection, rowIndex) => {
			cellRect.height = sheetInfo.rows.getSectionSize(rowIndex);
			if (cellRect.height) {
				cellRect.x = rect.x;
				if (cellRect.y + cellRect.height >= viewRect.y) {
					let visibleColumnIndex = initialColumnIndex;
					sheetInfo.columns.enumerateSections((columnSection, columnIndex) => {
						cellRect.width = sheetInfo.columns.getSectionSize(columnIndex);
						if (cellRect.width && cellRect.height) {
							this.drawCell(
								graphics,
								borderMatrix,
								cellRect,
								columnIndex,
								rowIndex,
								visibleColumnIndex,
								visibleRowIndex,
								sheetInfo
							);
							visibleColumnIndex += 1;
						}
						cellRect.x += cellRect.width;
					});
					visibleRowIndex += 1;
				}

				cellRect.y += cellRect.height;
			}

			sheetInfo.greyRowText = false;

			return cellRect.y <= viewRect.y + viewRect.height;
		});

		graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);

		// now that all information is set, draw border

		const state = {
			color: undefined,
			style: undefined,
			width: undefined,
			draw: false,
			y: 0
		};

		JSG.rectCache.release(cellRect);

		if (!borderMatrix.length) {
			return;
		}

		borderMatrix[0].forEach((b, index) => {
			state.draw = false;
			graphics.beginPath();
			borderMatrix.forEach((row, index2) => {
				const border = row[index];
				if (
					border.draw !== state.draw ||
					border.color !== state.color ||
					border.style !== state.style ||
					border.borderwidth !== state.width ||
					borderMatrix.length - 1 === index2
				) {
					graphics.lineTo(border.x, border.y + (borderMatrix.length - 1 === index2 ? border.height : 0));
					graphics.stroke();
					graphics.clearLineDash();
					graphics.beginPath();
					state.draw = false;
				}
				if (border.draw && !state.draw) {
					graphics.setLineColor(border.color);
					graphics.setLineStyle(border.style);
					graphics.setLineWidth(border.borderwidth === 1 ? 1 : sheetInfo.cs.deviceToLogX(border.borderwidth));
					graphics.beginPath();
					graphics.applyLineDash();
					graphics.moveTo(border.x, border.y);
					state.draw = true;
					state.color = border.color;
					state.style = border.style;
					state.width = border.borderwidth;
				}
			});
		});
	}

	enumerateVisibleCells(rows, columns, rect, viewRect, callback) {
		const cellRect = JSG.rectCache.get();
		let firstVisibleColumnIndex;
		let lastVisibleColumnIndex;
		let initialColumnIndex = 0;
		let initialX = 0;
		let visibleColumnIndex = 0;
		let visibleRowIndex = 0;
		let first;

		cellRect.x = rect.x;

		columns.enumerateSections((columnSection, columnIndex) => {
			const cont = cellRect.x <= viewRect.x + viewRect.width && columnIndex !== columns.getSections() - 1;
			cellRect.width = columns.getSectionSize(columnIndex);
			if (cellRect.x + cellRect.width >= viewRect.x || cont === false) {
				if (cellRect.width && firstVisibleColumnIndex === undefined) {
					firstVisibleColumnIndex = columnIndex;
					initialColumnIndex = firstVisibleColumnIndex;
					initialX = cellRect.x;
				}
			}
			cellRect.x += cellRect.width;
			if (cont === false) {
				lastVisibleColumnIndex = columnIndex;
			}
			return cont;
		});

		if (lastVisibleColumnIndex === undefined || firstVisibleColumnIndex === undefined) {
			return initialColumnIndex;
		}

		cellRect.y = rect.y;

		rows.enumerateSections((rowSection, rowIndex) => {
			cellRect.height = rows.getSectionSize(rowIndex);
			if (cellRect.height) {
				first = true;
				if (cellRect.y + cellRect.height >= viewRect.y) {
					cellRect.x = initialX;
					visibleColumnIndex = initialColumnIndex;

					columns.enumerateSectionsStartEnd(
						firstVisibleColumnIndex,
						lastVisibleColumnIndex + 1,
						(columnSection, columnIndex) => {
							const cont =
								cellRect.x <= viewRect.x + viewRect.width && columnIndex !== columns.getSections() - 1;
							cellRect.width = columns.getSectionSize(columnIndex);
							if (cellRect.x + cellRect.width >= viewRect.x || cont === false) {
								if (cellRect.width && cellRect.height) {
									callback(
										cellRect,
										columnIndex,
										rowIndex,
										visibleColumnIndex,
										visibleRowIndex,
										first,
										cont === false
									);
									visibleColumnIndex += 1;
									first = false;
								}
							}
							cellRect.x += cellRect.width;
							return cont;
						}
					);
					visibleRowIndex += 1;
				}

				cellRect.y += cellRect.height;
			}

			return cellRect.y <= viewRect.y + viewRect.height;
		});

		JSG.rectCache.release(cellRect);

		return initialColumnIndex;
	}

	applyToGraphics(graphics, textFormat) {
		const TEXTFORMAT = TextFormatAttributes;

		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
		graphics.setFillColor(textFormat.getAttribute(TEXTFORMAT.FONTCOLOR).getValue());
		graphics.setLineColor(textFormat.getAttribute(TEXTFORMAT.FONTCOLOR).getValue());
		graphics.setFontName(textFormat.getAttribute(TEXTFORMAT.FONTNAME).getValue());
		graphics.setFontSize(textFormat.getAttribute(TEXTFORMAT.FONTSIZE).getValue());
		graphics.setFontStyle(textFormat.getAttribute(TEXTFORMAT.FONTSTYLE).getValue());
	}

	drawGrid(graphics, rect, viewRect) {
		const rows = this.getRows();
		if (!rows) {
			// for feedback
			return;
		}

		let i;
		let n;
		const startX = rect.x;
		const endX = rect.getRight();
		let startY = rect.y;
		let endY;

		graphics.beginPath();
		graphics.setLineColor('#CCCCCC');

		for (i = 0, n = rows.getSections(); i < n; i += 1) {
			startY += rows.getSectionSize(i);
			endY = startY;
			if (startY > viewRect.y) {
				graphics.moveTo(startX, startY);
				graphics.lineTo(endX, endY);
			}
			if (startY > viewRect.getBottom()) {
				break;
			}
		}

		graphics.stroke();
	}

	drawCopyMarker(graphics) {
		if (
			JSG.clipSheet === undefined ||
			JSG.clipSheet.range === undefined ||
			JSG.clipSheet.range.getSheet() !== this._wsItem
		) {
			return;
		}

		const ws = this._wsItem;
		const selrect = ws.getCellRect(JSG.clipSheet.range);

		graphics.setLineColor('#FFFFFF');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.drawRect(selrect);
		graphics.setLineColor('#000000');
		graphics.setLineStyle(FormatAttributes.LineStyle.DASH);
		graphics.drawRect(selrect);

		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
	}

	drawRange(graphics, selection) {
		let selrect;
		const ws = this._wsItem;
		const corner = JSG.rectCache.get();
		const size = 60;

		corner.width = size;
		corner.height = size;

		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setLineWidth(1);

		selection.getRanges().forEach((range) => {
			if (range.getSheet() === ws) {
				graphics.setFillColor(range._color);
				graphics.setLineColor(range._color);

				selrect = ws.getCellRect(range);

				graphics.setTransparency(10);

				graphics.beginPath();
				graphics.rectangle(selrect);
				graphics.fill();
				graphics.setTransparency(100);
				graphics.stroke(selrect);

				corner.x = selrect.x - size / 2;
				corner.y = selrect.y - size / 2;

				graphics.beginPath();
				graphics.rectangle(corner);

				corner.x = selrect.x + selrect.width - size / 2;

				graphics.rectangle(corner);

				corner.y = selrect.y + selrect.height - size / 2;

				graphics.rectangle(corner);

				corner.x = selrect.x - size / 2;
				graphics.rectangle(corner);
				graphics.fill();
			}
		});

		JSG.rectCache.release(corner);
	}

	drawCellEditRanges(graphics) {
		const cellEditor = CellEditor.getActiveCellEditor();
		if (!cellEditor) {
			return;
		}

		const selection = cellEditor.getEditRanges();
		if (selection) {
			this.drawRange(graphics, selection);
		}

		graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);
	}

	static stringToColour(str) {
		let hash = 0;
		for (let i = 0; i < str.length; i += 1) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		let colour = '#';
		for (let i = 0; i < 3; i += 1) {
			const value = (hash >> (i * 8)) & 0xff;
			colour += `00${value.toString(16)}`.substr(-2);
		}
		return colour;
	}

	drawSelection(graphics, ws, wsView, selection, color, user) {
		if (selection.validate() === false) {
			return;
		}
		const cell = selection.getActiveCell();

		graphics.setFillColor(color);
		graphics.setLineColor(color);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setLineWidth(50);

		let selrect;
		const rangeCnt = selection._ranges.length;
		const pix = graphics.getCoordinateSystem().deviceToLogYNoZoom(1);

		selection._ranges.forEach((range) => {
			selrect = ws.getCellRect(range);

			graphics.setTransparency(10);
			graphics.fillRect(selrect);
			if (rangeCnt === 1) {
				graphics.setTransparency(100);
				graphics.drawRect(selrect);
			}
			if (user) {
				graphics.fillText(user, selrect.getRight(), selrect.getBottom());
			}
		});

		if (rangeCnt !== 1) {
			graphics.setTransparency(100);
		}

		if (
			ws
				.getWorksheetAttributes()
				.getSelectionMode()
				.getValue() === WorksheetAttributes.SelectionModes.CELL
		) {
			const activeRange = new CellRange();

			activeRange.set(cell.x, cell.y);
			selrect = ws.getCellRect(activeRange);
			graphics.drawRect(selrect);
		}

		if (user === undefined && rangeCnt === 1) {
			const corner = JSG.rectCache.get();
			selrect = ws.getCellRect(selection._ranges[0]);
			corner.set(selrect.getRight() - pix * 3, selrect.getBottom() - pix * 3, pix * 4, pix * 4);
			graphics.setLineColor('#FFFFFF');
			graphics.setLineWidth(1);
			graphics.fillRect(corner);
			corner.width += pix;
			corner.height += pix;
			graphics.drawRect(corner);

			JSG.rectCache.release(corner);
		}
	}

	drawSelections(graphics) {
		const wsView = this._wsView;
		const ws = this._wsItem;
		const focus =
			this.getGraphView().getFocus() &&
			this.getGraphView()
				.getFocus()
				.getView() === wsView;
		const selections = ws.getSelectionList();

		if (selections !== undefined) {
			graphics.setTextBaseline('top');
			graphics.setTextAlignment(TextFormatAttributes.TextAlignment.RIGHT);
			graphics.setFontTo('7pt Verdana');

			selections.iterate((attr) => {
				const otherSelectionId = attr.getName().split(';');
				const mySelectionId = String(ws.getSelectionId()).split(';');
				let color = '#AAAAAA';
				let user;
				let selection;
				if (otherSelectionId[0] === mySelectionId[0]) {
					color = focus ? '#000000' : '#777777';
				} else {
					if (otherSelectionId.length > 2) {
						[, , user] = otherSelectionId;
						color = CellsView.stringToColour(user);
					}
					selection = Selection.fromStringMulti(attr.getValue(), ws);
				}
				if (selection) {
					this.drawSelection(graphics, ws, wsView, selection, color, user);
				}
			});
		}

		const selection = ws.getOwnSelection();
		if (selection) {
			this.drawSelection(graphics, ws, wsView, selection, focus ? '#000000' : '#777777', undefined);
		}

		this.setFont(graphics);
		graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);
	}

	rectangle(graphics, rect, fillColor, transparency) {
		graphics.setFillColor(fillColor);
		if (transparency) {
			graphics.setTransparency(transparency);
		}
		graphics.beginPath();
		graphics.rectangle(rect);
		graphics.fill();
		if (transparency) {
			graphics.setTransparency(100);
		}
	}

	rect(graphics, x, y, width, height, fillColor) {
		graphics.setFillColor(fillColor);
		graphics.beginPath();
		graphics.rect(x, y, width, height);
		graphics.fill();
	}

	setFont(graphics) {
		graphics.setFontName('Verdana');
		graphics.setFontStyle(TextFormatAttributes.FontStyle.NORMAL);
		graphics.setFontSize(9);
		graphics.setFillColor('#333333');
		graphics.setTextAlign(TextFormatAttributes.TextAlignment.LEFT);
		graphics.setTextBaseline('middle');
		graphics.setFont();
	}

	adaptHighlight(highlight) {
		let view = this;
		while (view) {
			if (view instanceof ContentNodeView) {
				const orgItem = highlight.getOriginalItem();
				const rect = orgItem
					.getParent()
					.getParent()
					.getTranslatedBoundingBox()
					.getBoundingRectangle();
				highlight.getFeedbackItem().setSize(rect.width, rect.height);
				highlight.getFeedbackItem().setOrigin(rect.x, rect.y);
				break;
			}
			view = view.getParent();
		}
	}

	getColumns() {
		return this._wsItem ? this._wsItem.getColumns() : undefined;
	}

	getRows() {
		return this._wsItem ? this._wsItem.getRows() : undefined;
	}

	getDragTarget() {
		return this.getWorksheetView();
	}

	getWorksheetView() {
		let parent = this.getParent();
		if (parent === undefined) {
			return undefined;
		}

		if (parent instanceof ContentPaneView) {
			parent = parent.getParent();
			if (parent) {
				return parent.getContentView();
			}
		} else {
			return parent;
		}

		return undefined;
	}

	getWorksheetNode() {
		return this.getItem()
			.getParent()
			.getParent();
	}

	getScrollOffset() {
		const ws = this.getWorksheetView();
		if (ws) {
			return ws.getScrollOffset();
		}

		return new Point(0, 0);
	}

	checkMaximumImageDimensions(image) {
		if (image.width * image.height < 500 * 500) {
			return true;
		}

		const view = this.getWorksheetView();
		view.notifyMessage({ id: 'SheetMessage.imageDrop' });

		return false;
	}

	getFormattedValueFromFunction(data, result) {
		const term = data.getExpression().getTerm();

		if (data.displayFunctionName && term && (term instanceof FuncTerm)) {
			switch (term.getFuncId()) {
				case 'SELECT':
					result.clip = true;
					result.forcedAlignment = 0;
					result.clipSpace = 600;
					break;
				case 'BAR':
					result.value = '';
					result.formattedValue = '';
					break;
				case 'READ':
				case 'WRITE':
					result.fillColor = '#AAAAAA';
					result.color = '#FFFFFF';
					result.bold = true;
					term.iterateParams((param, index) => {
						switch (index) {
							case 2:
								switch (param.value) {
									case 'String':
										result.fillColor = '#009408';
										break;
									case 'Number':
										result.fillColor = '#497B8D';
										break;
									case 'Bool':
										result.fillColor = '#B1C639';
										break;
									case 'Dictionary':
										result.fillColor = '#E17000';
										break;
									case 'Array':
										result.fillColor = '#2D5B89';
										break;
									default:
										break;
								}
								break;
							default:
								break;
						}
					}, this);
					break;
				default:
					result.value = String(data.getValue());
					if (result.value === 'true' || result.value[0] !== '#') {
						result.fillColor = '#1976d2';
						result.value = term.getFuncId();
						result.formattedValue = term.getFuncId();
					} else {
						result.fillColor = '#FF0000';
					}
					result.color = '#FFFFFF';
					result.bold = true;
			}
			// shouldn't we return true here?
			// return true;
		}
		return false;
	}

	getFormattedValueWC(graphics, data, textproperties, availableWidth) {
		let result = {
			value: data.getValue(),
			formattedValue: data.getValue(),
			type: 'general',
			clip: false
		};

		if (this._showFormulas) {
			const expr = data.getExpression();
			if (expr.hasFormula()) {
				expr.evaluate(this._wsItem);
				result.value = expr.toLocaleString(JSG.getParserLocaleSettings(), {
					item: this._wsItem,
					useName: true
				});
			} else if (result.value === undefined) {
				result.value = '#NV';
			}
			result.formattedValue = result.value;
			if (result.value[0] === '#') {
				result.alignment = 1;
			}
			return result;
		}

		if (this.getFormattedValueFromFunction(data, result)) {
			return result;
		}

		if (textproperties.fontcolor) {
			result.color = textproperties.fontcolor;
		}

		if (typeof result.value === 'boolean') {
			result.formattedValue = result.value.toString().toUpperCase();
			availableWidth = Math.max(availableWidth - 200, 0);
			const width = graphics
				.getCoordinateSystem()
				.deviceToLogX(graphics.measureText(result.formattedValue).width, true);
			if (width > availableWidth) {
				result.formattedValue = new Array(Math.floor(availableWidth / 150) + 1).join('#');
			}
			result.clip = true;
			result.alignment = 1;
			return result;
		}

		if (!Numbers.isNumber(result.value) || result.value === undefined) {
			return result;
		}

		const numberFormat = textproperties && textproperties.numberformat ? textproperties.numberformat : 'General';
		const localCulture = textproperties && textproperties.localculture ? textproperties.localculture : 'general';
		const type = localCulture.split(';');

		try {
			result = NumberFormatter.formatNumber(numberFormat, result.value, type[0]);
		} catch (e) {
			result.formattedValue = defaultCellErrorValue;
		}
		[result.type] = type;
		if (result.formattedValue === '' && (result.type === 'date' || result.type === 'time')) {
			result.formattedValue = `#INVALID_${result.type.toUpperCase()}`;
			result.value = result.formattedValue;
		}

		availableWidth = Math.max(availableWidth - 200, 0);
		let width = graphics
			.getCoordinateSystem()
			.deviceToLogX(graphics.measureText(result.formattedValue).width, true);
		if (width > availableWidth) {
			if (result.type === 'general' && !Number.isInteger(result.value)) {
				const decPart = String(result.value).split('.')[1];
				let decimals = decPart ? decPart.length - 1 : 0;

				while (decimals > 0 && width > availableWidth) {
					result.value = MathUtils.roundTo(result.value, decimals);
					result = NumberFormatter.formatNumber('General', result.value, 'general');
					width = graphics
						.getCoordinateSystem()
						.deviceToLogX(graphics.measureText(result.formattedValue).width, true);
					decimals -= 1;
				}
			}
			if (width > availableWidth) {
				result.formattedValue = new Array(Math.floor(availableWidth / 150) + 1).join('#');
			}
			result.clip = true;
		}

		if (Numbers.isNumber(result.value)) {
			result.alignment = 2;
		} else if (typeof result.value === 'string' && result.value[0] === '#') {
			result.alignment = 1;
		}

		return result;
	}

	applyFormatFromKey(dataProvider, data, columnInfo, rowInfo, formattedValue, cellProperties) {
		if (cellProperties && cellProperties.key) {
			const dataNext = dataProvider.getRC(columnInfo.index + 1, rowInfo.index);
			if (dataNext === undefined) {
				return;
			}
			const columnInfoTmp = {
				index: columnInfo.index + 1
			}
			let cellPropertiesTmp = this.getCellProperties(dataNext, columnInfoTmp, rowInfo);
			if (!cellPropertiesTmp || !cellPropertiesTmp.key) {
				return;
			}

			formattedValue.level = cellProperties.level || 0;
			formattedValue.alignment = 0;
			formattedValue.clip = true;
			formattedValue.color = '#FFFFFF';
			formattedValue.frame = true;

			const rowInfoTmp = {
				index: rowInfo.index + 1
			}
			let subLevel = 0;
			let dataSub = dataProvider.getRC(columnInfo.index, rowInfo.index + 1);
			if (dataSub) {
				cellPropertiesTmp = this.getCellProperties(dataNext, columnInfo, rowInfoTmp);
				subLevel = cellPropertiesTmp && cellPropertiesTmp.level ? cellPropertiesTmp.level : 0;
			}

			if (formattedValue.level < subLevel) {
				formattedValue.fillColor = '#2D5B89';

				for (let i = 1; i < 10; i += 1) {
					dataSub = dataProvider.getRC(columnInfo.index, rowInfo.index + i);
					if (dataSub !== undefined) {
						rowInfoTmp.index = rowInfo.index + i;
						cellPropertiesTmp = this.getCellProperties(dataNext, columnInfo, rowInfoTmp);
						const subLevelLoop = cellPropertiesTmp && cellPropertiesTmp.level ? cellPropertiesTmp.level : 0;
						const val = dataSub.getValue();
						if (subLevelLoop !== subLevel || Number(val) !== i - 1) {
							formattedValue.fillColor = '#E17000';
							break;
						}
					} else {
						formattedValue.fillColor = '#E17000';
					}
				}
			} else {
				const value = dataNext.getValue();
				const type = typeof value;
				// draw fill based on cell value type
				switch (type) {
					case 'string':
						formattedValue.fillColor = '#009408';
						break;
					case 'number':
						formattedValue.fillColor = '#497B8D';
						break;
					case 'boolean':
						formattedValue.fillColor = '#B1C639';
						break;
					default:
						formattedValue.fillColor = '#009408';
						break;
				}
			}
		}
	}

	resetFont(graphics) {
		graphics.setFontName('Verdana');
		graphics.setFontSize(9);
		graphics.setFontStyle(TextFormatAttributes.FontStyle.NORMAL);
		graphics.setFont();
	}

	getStyleProperties(cell, column, row) {
		let styleproperties;

		if (JSG.webComponent === true) {
			styleproperties = {};
			if (column.section.styleproperties) {
				styleproperties = Object.assign(styleproperties, column.section.styleproperties);
			}
			if (row.section.styleproperties) {
				styleproperties = Object.assign(styleproperties, row.section.styleproperties);
			}
			if (cell && cell.styleproperties) {
				styleproperties = Object.assign(styleproperties, cell.styleproperties);
			}
		} else {
			styleproperties = this._wsItem.getFormatPropertiesAtRC(column.index, row.index);
			const cellProperties = this._wsItem.getCellPropertiesAtRC(column.index, row.index);
			styleproperties.leftborderstyle = cellProperties.leftborderstyle;
			if (styleproperties.leftborderstyle) {
				styleproperties.leftbordercolor = cellProperties.leftbordercolor;
				styleproperties.leftborderwidth = cellProperties.leftborderwidth;
			}
			styleproperties.topborderstyle = cellProperties.topborderstyle;
			if (styleproperties.topborderstyle) {
				styleproperties.topbordercolor = cellProperties.topbordercolor;
				styleproperties.topborderwidth = cellProperties.topborderwidth;
			}
			styleproperties.rightborderstyle = cellProperties.rightborderstyle;
			if (styleproperties.rightborderstyle) {
				styleproperties.rightbordercolor = cellProperties.rightbordercolor;
				styleproperties.rightborderwidth = cellProperties.rightborderwidth;
			}
			styleproperties.bottomborderstyle = cellProperties.bottomborderstyle;
			if (styleproperties.bottomborderstyle) {
				styleproperties.bottombordercolor = cellProperties.bottombordercolor;
				styleproperties.bottomborderwidth = cellProperties.bottomborderwidth;
			}
		}

		return styleproperties;
	}

	getTextProperties(cell, column, row) {
		let textproperties;

		if (JSG.webComponent === true) {
			textproperties = {};
			if (column.section.textproperties) {
				textproperties = Object.assign(textproperties, column.section.textproperties);
			}
			if (row.section.textproperties) {
				textproperties = Object.assign(textproperties, row.section.textproperties);
			}
			if (cell && cell.textproperties) {
				textproperties = Object.assign(textproperties, cell.textproperties);
			}
		} else {
			textproperties = this._wsItem.getTextFormatPropertiesAtRC(column.index, row.index);
		}
		return textproperties;
	}

	getCellProperties(cell, column, row) {
		let attributes;

		if (JSG.webComponent === true) {
			attributes = {};
			if (column.section.attributes) {
				attributes = Object.assign(attributes, column.section.attributes);
			}
			if (row.section.attributes) {
				attributes = Object.assign(attributes, row.section.attributes);
			}
			if (cell && cell.attributes) {
				attributes = Object.assign(attributes, cell.attributes);
			}
		} else {
			attributes = this._wsItem.getCellPropertiesAtRC(column.index, row.index);
		}
		return attributes;
	}

	drawCellFill(graphics, data, columnInfo, rowInfo, visibleColumnsInfo, visibleRowsInfo, cellProperties) {
		const styleproperties = this.getStyleProperties(data, columnInfo, rowInfo);
		if (
			styleproperties === undefined ||
			styleproperties.fillcolor === undefined ||
			Number(styleproperties.fillstyle) !== 1
		) {
			if (cellProperties && cellProperties.key) {
				this.rect(
					graphics,
					columnInfo.x + 50,
					rowInfo.y + 50,
					columnInfo.width - 100,
					rowInfo.height - 100,
					'#F2F2F2'
				);
			}
		} else {
			if (rowInfo.grey) {
				graphics.setTransparency(60);
			}
			this.rect(graphics, columnInfo.x, rowInfo.y, columnInfo.width + 20, rowInfo.height, styleproperties.fillcolor);
			if (rowInfo.grey) {
				graphics.setTransparency(100);
			}
			columnInfo.gridSkipBorders.push({
				y: rowInfo.y,
				height: rowInfo.height
			});

			if (visibleColumnsInfo.length > columnInfo.myIndex + 1) {
				const borders = visibleColumnsInfo[columnInfo.myIndex + 1].gridSkipBorders;
				if (borders) {
					borders.push({
						y: rowInfo.y,
						height: rowInfo.height
					});
				}
			}
		}

		if (styleproperties !== undefined) {
			if (styleproperties.leftborderstyle) {
				const color = styleproperties.leftbordercolor || '#000000';
				if (columnInfo.leftBorders[color] === undefined) {
					columnInfo.leftBorders[color] = {};
				}
				columnInfo.leftBorders[color][rowInfo.y] = {
					height: rowInfo.height,
					style: styleproperties.leftborderstyle,
					borderWidth: styleproperties.leftborderwidth
				};
			}
			if (styleproperties.topborderstyle) {
				const color = styleproperties.topbordercolor || '#000000';
				if (rowInfo.topBorders[color] === undefined) {
					rowInfo.topBorders[color] = {};
				}
				rowInfo.topBorders[color][columnInfo.x] = {
					width: columnInfo.width,
					style: styleproperties.topborderstyle,
					borderWidth: styleproperties.topborderwidth
				};
			}
			if (styleproperties.rightborderstyle && visibleColumnsInfo.length > columnInfo.myIndex + 1) {
				const borders = visibleColumnsInfo[columnInfo.myIndex + 1].leftBorders;
				if (borders) {
					const color = styleproperties.rightbordercolor || '#000000';
					if (borders[color] === undefined) {
						borders[color] = {};
					}
					borders[color][rowInfo.y] = {
						height: rowInfo.height,
						style: styleproperties.rightborderstyle,
						borderWidth: styleproperties.rightborderwidth
					};
				}
			}
			if (styleproperties.bottomborderstyle && visibleRowsInfo.length > rowInfo.myIndex + 1) {
				const borders = visibleRowsInfo[rowInfo.myIndex + 1].topBorders;
				if (borders) {
					const color = styleproperties.bottombordercolor || '#000000';
					if (borders[color] === undefined) {
						borders[color] = {};
					}
					borders[color][columnInfo.x] = {
						width: columnInfo.width,
						style: styleproperties.bottomborderstyle,
						borderWidth: styleproperties.bottomborderwidth
					};
				}
			}
		}
	}

	drawSpecialFunction(graphics, data, columnInfo, rowInfo, visibleColumnsInfo, visibleRowsInfo) {
		const termFunc = data.getExpression().getTerm();
		if (termFunc && termFunc instanceof FuncTerm) {
			switch (termFunc.getFuncId()) {
			case 'SELECT': {
				// const value = String(data.getValue());

				// graphics.save();
				// // graphics.setClip(clipRect);
				// graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);
				// graphics.fillText(value, columnInfo.x + 100, rowInfo.y);
				// // graphics.restore();

				graphics.setFillColor('#888888');

				const pts = [
					{x: columnInfo.x + columnInfo.width - 400, y: rowInfo.y + rowInfo.height / 2 - 80},
					{x: columnInfo.x + columnInfo.width - 150, y: rowInfo.y + rowInfo.height / 2 - 80},
					{x: columnInfo.x + columnInfo.width - 275, y: rowInfo.y + rowInfo.height / 2 + 80}
				];

				graphics.fillPolyline(pts, true);
				graphics.setFillColor('#000000');
				break;
			}
			case 'BAR': {
				const cellValue = data.getValue();
				if (cellValue === undefined) {
					return;
				}
				const params = String(cellValue).split(';');
				let value = 0;
				let direction = false;
				let fillColor = '#00FF00';
				let lineColor;
				params.forEach((param, index) => {
					switch (index) {
					case 0:
						value = Number(param);
						if (Number.isNaN(value)) {
							value = param.length > 0 && param !== 'false' ? 1 : 0;
						}
						break;
					case 1:
						direction = Number(param);
						break;
					case 2:
						fillColor = param === 'undefined' || param === '' ? '#00FF00' : param;
						break;
					case 3:
						lineColor = param === 'undefined' || param === '' ? undefined : param;
						break;
					default:
						break;
					}
				});
				if (rowInfo.grey) {
					graphics.setTransparency(60);
				}
				if (direction) {
					this.rect(graphics, columnInfo.x, rowInfo.y + rowInfo.height - rowInfo.height * value, columnInfo.width + 20, rowInfo.height * value,
						fillColor);
				} else {
					this.rect(graphics, columnInfo.x, rowInfo.y, columnInfo.width * value + 20, rowInfo.height,
						fillColor);
				}
				if (rowInfo.grey) {
					graphics.setTransparency(100);
				}
				columnInfo.gridSkipBorders.push({
					y: rowInfo.y,
					height: rowInfo.height
				});

				if (visibleColumnsInfo.length > columnInfo.myIndex + 1) {
					const borders = visibleColumnsInfo[columnInfo.myIndex + 1].gridSkipBorders;
					if (borders) {
						borders.push({
							y: rowInfo.y,
							height: rowInfo.height
						});
					}
				}

				if (lineColor !== undefined) {
					const color = lineColor;
					if (columnInfo.leftBorders[color] === undefined) {
						columnInfo.leftBorders[color] = {};
					}
					columnInfo.leftBorders[color][rowInfo.y] = {
						height: rowInfo.height,
						style: 1,
						borderWidth: 1
					};
					if (rowInfo.topBorders[color] === undefined) {
						rowInfo.topBorders[color] = {};
					}
					rowInfo.topBorders[color][columnInfo.x] = {
						width: columnInfo.width,
						style: 1,
						borderWidth: 1
					};
					let borders = visibleColumnsInfo[columnInfo.myIndex + 1].leftBorders;
					if (borders) {
						if (borders[color] === undefined) {
							borders[color] = {};
						}
						borders[color][rowInfo.y] = {
							height: rowInfo.height,
							style: 1,
							borderWidth: 1
						};
					}
					borders = visibleRowsInfo[rowInfo.myIndex + 1].topBorders;
					if (borders) {
						if (borders[color] === undefined) {
							borders[color] = {};
						}
						borders[color][columnInfo.x] = {
							width: columnInfo.width,
							style: 1,
							borderWidth: 1
						};
					}
				}
				break;
			}
			default:
				break;
			}
		}
	}

	drawValue(graphics, dataProvider, data, columnInfo, rowInfo, visibleColumnsInfo, cellProperties) {
		graphics.setFillColor('#000000');

		const textproperties = this.getTextProperties(data, columnInfo, rowInfo);
		let font = false;
		if (textproperties) {
			if (textproperties.fontname) {
				graphics.setFontName(textproperties.fontname);
				font = true;
			}
			if (textproperties.fontsize) {
				graphics.setFontSize(textproperties.fontsize);
				font = true;
			}
			if (textproperties.fontstyle) {
				graphics.setFontStyle(textproperties.fontstyle);
				font = true;
			}
			if (textproperties.fontcolor) {
				graphics.setFillColor(textproperties.fontcolor);
			}
			if (font) {
				graphics.setFont();
			}
		}

		const formattedValue = this.getFormattedValueWC(graphics, data, textproperties, columnInfo.width);
		if (formattedValue.value === undefined || formattedValue.value === null) {
			if (font) {
				this.resetFont(graphics);
			}
			return;
		}

		if (columnInfo.index === 1) {
			const state =
				formattedValue.value === 0 ||
				formattedValue.value === '' ||
				formattedValue.value === false ||
				formattedValue.value === 'false';
			if (this._showFormulas === false && columnInfo.width < 1100) {
				graphics.setTransparency(17);
				this.rect(
					graphics,
					columnInfo.x,
					rowInfo.y,
					columnInfo.width,
					rowInfo.height,
					state ? '#FF0011' : '#00B050'
				);
				graphics.setTransparency(100);
				if (font) {
					this.resetFont(graphics);
				}
				return;
			}
		}

		if (cellProperties !== undefined) {
			this.applyFormatFromKey(dataProvider, data, columnInfo, rowInfo, formattedValue, cellProperties);
		}

		if (formattedValue.fillColor) {
			if (rowInfo.grey) {
				graphics.setTransparency(60);
			}
			if (formattedValue.frame) {
				this.rect(
					graphics,
					columnInfo.x + formattedValue.level * 150 + 50,
					rowInfo.y + 50,
					columnInfo.width - formattedValue.level * 150 - 100,
					rowInfo.height - 100,
					formattedValue.fillColor
				);
			} else {
				this.rect(
					graphics,
					columnInfo.x,
					rowInfo.y,
					columnInfo.width,
					rowInfo.height,
					formattedValue.fillColor
				);
			}
			if (rowInfo.grey) {
				graphics.setTransparency(100);
			}
			if (formattedValue.frame !== true && columnInfo.gridSkipBorders) {
				columnInfo.gridSkipBorders.push({
					y: rowInfo.y,
					height: rowInfo.height
				});
				if (visibleColumnsInfo.length > columnInfo.myIndex + 1) {
					const borders = visibleColumnsInfo[columnInfo.myIndex + 1].gridSkipBorders;
					if (borders) {
						borders.push({
							y: rowInfo.y,
							height: rowInfo.height
						});
					}
				}
			}
		}
		if (formattedValue.color) {
			graphics.setFillColor(formattedValue.color);
		}
		if (formattedValue.bold) {
			graphics.setFontStyle(TextFormatAttributes.FontStyle.BOLD);
			font = true;
			graphics.setFont();
		}
		if (rowInfo.grey) {
			graphics.setTransparency(60);
		}

		let x = 0;
		let clipX;
		let clipWidth;
		let alignment =
			textproperties === undefined || textproperties.halign === undefined ? 3 : Number(textproperties.halign);
		if (alignment === 3) {
			alignment = formattedValue.alignment === undefined ? 0 : formattedValue.alignment;
		}
		if (formattedValue.forcedAlignment) {
			alignment = formattedValue.forcedAlignment;
		}

		graphics.setTextAlignment(alignment);

		switch (alignment) {
			case 0:
				x = columnInfo.x + 75;
				if (formattedValue.level !== undefined) {
					x += formattedValue.level * 150 + 50;
					// y += formattedValue.level ? 50 : 0;
				}
				break;
			case 1:
				x = columnInfo.x + columnInfo.width / 2;
				break;
			case 2:
				x = columnInfo.x + columnInfo.width - 75;
				break;
		}

		if (formattedValue.clip) {
			clipX = columnInfo.x;
			clipWidth = columnInfo.width - (formattedValue.clipSpace ? formattedValue.clipSpace : 0);
		} else {
			let width = graphics
				.getCoordinateSystem()
				.deviceToLogX(graphics.measureText(formattedValue.formattedValue).width, true);
			if (width > columnInfo.width) {
				// clip, if text reaches into next cell
				const clipInfo = this.getCellSpace(
					dataProvider,
					columnInfo.index,
					rowInfo.index,
					{ x: columnInfo.x, width: columnInfo.width },
					alignment
				);
				if (clipInfo.clip) {
					clipX = clipInfo.x;
					clipWidth = clipInfo.width;
					width = Math.min(width, clipWidth);
				}
				// hide borders, which are covered by text TODO: non left aligned
				visibleColumnsInfo.forEach((info) => {
					switch (alignment) {
						case 0:
							if (
								info.x > x &&
								info.x < x + width &&
								(clipInfo.clip === false || info.x < clipInfo.x + clipInfo.width)
							) {
								info.skipBorders[rowInfo.y] = rowInfo.height;
								info.gridSkipBorders.push({
									y: rowInfo.y,
									height: rowInfo.height
								});
							}
							break;
						case 1:
							if (
								(info.x > x &&
									info.x < x + width / 2 &&
									(clipInfo.clip === false || info.x < clipInfo.x + clipInfo.width)) ||
								(info.x <= x && info.x > x - width / 2 && (clipInfo.clip === false || info.x > clipInfo.x))
							) {
								info.skipBorders[rowInfo.y] = rowInfo.height;
								info.gridSkipBorders.push({
									y: rowInfo.y,
									height: rowInfo.height
								});
							}
							break;
						case 2:
							if (info.x <= x && info.x > x - width && (clipInfo.clip === false || info.x > clipInfo.x)) {
								info.skipBorders[rowInfo.y] = rowInfo.height;
								info.gridSkipBorders.push({
									y: rowInfo.y,
									height: rowInfo.height
								});
							}
							break;
					}
				});
			}
		}
		if (clipWidth) {
			graphics.save();
			graphics.beginPath();
			graphics.rect(clipX + 75, rowInfo.y, clipWidth - 75, rowInfo.height);
			graphics.clip();
		}

		let y = 0;

		const valign =
			textproperties === undefined || textproperties.valign === undefined ? 2 : Number(textproperties.valign);
		switch (valign) {
			case 0:
				y = rowInfo.y + 50;
				graphics.setTextBaseline('top');
				break;
			case 1:
				y = rowInfo.y + rowInfo.height / 2;
				graphics.setTextBaseline('middle');
				break;
			case 2:
			default:
				graphics.setTextBaseline('bottom');
				y = rowInfo.y + rowInfo.height - 50;
				break;
		}

		graphics.fillText(formattedValue.formattedValue, x, y);

		if (clipWidth) {
			graphics.restore();
		}

		graphics.setFillColor('#000000');

		if (font) {
			this.resetFont(graphics);
		}
		if (rowInfo.grey) {
			graphics.setTransparency(100);
		}
	}

	getCellSpace(dataProvider, colIndex, rowIndex, clipRect, alignment) {
		const isDataEmpty = (lcell) =>
			lcell === undefined ||
			lcell.getValue() === undefined ||
			lcell.getValue() === null ||
			lcell.getValue().toString() === '';
		const columns = this._columns;
		let clip = false;
		let column;
		let size;
		let dataNext;
		const row = dataProvider.getRow(rowIndex);

		switch (alignment) {
			case 0:
				column = colIndex + 1;
				while (column < row.length) {
					size = columns.getSectionSize(column);
					if (size) {
						dataNext = dataProvider.getRC(column, rowIndex);
						if (isDataEmpty(dataNext)) {
							clipRect.width += size;
						} else {
							clip = true;
							break;
						}
					}
					column += 1;
				}
				break;
			case 1: {
				let rClip = false;
				column = colIndex - 1;
				while (column >= 0) {
					size = columns.getSectionSize(column);
					if (size) {
						dataNext = dataProvider.getRC(column, rowIndex);
						if (isDataEmpty(dataNext)) {
							clipRect.x -= size;
							clipRect.width += size;
						} else {
							clip = true;
							break;
						}
					}
					column -= 1;
				}
				column = colIndex + 1;
				while (column < row.length) {
					size = columns.getSectionSize(column);
					if (size) {
						dataNext = dataProvider.getRC(column, rowIndex);
						if (isDataEmpty(dataNext)) {
							clipRect.width += size;
						} else {
							clip = true;
							rClip = true;
							break;
						}
					}
					column += 1;
				}
				if (rClip === false) {
					// in case it clips to the left, but not to the right and there are no cells
					clipRect.width = 60000;
				}
				break;
			}
			case 2:
				column = colIndex - 1;
				while (column >= 0) {
					size = columns.getSectionSize(column);
					if (size) {
						dataNext = dataProvider.getRC(column, rowIndex);
						if (isDataEmpty(dataNext)) {
							clipRect.x -= size;
							clipRect.width += size;
						} else {
							clip = true;
							break;
						}
					}
					column -= 1;
				}
				break;
		}

		clipRect.clip = clip;

		return clipRect;
	}

	getVisibleColumnSections(columns, rect, viewRect) {
		let x = rect.x;
		let width;
		const info = [];

		columns.enumerateSections((section, index) => {
			if (x > viewRect.x + viewRect.width) {
				return false;
			}
			width = columns.getSectionSize(index);
			if (width && x + width >= viewRect.x) {
				const colInfo = {
					section,
					index,
					myIndex: info.length,
					x,
					width,
					gridSkipBorders: [],
					skipBorders: {},
					leftBorders: {}
				};
				info.push(colInfo);
			}
			x += width;
			return true;
		});

		return info;
	}

	getVisibleRowsSections(rows, columns, rect, viewRect, visibleColumnsInfo) {
		let y = rect.y;
		let height;
		const info = [];
		const dataProvider = this._wsItem.getDataProvider();
		const columnCnt = this._wsItem.getColumnCount();

		rows.enumerateSections((section, index) => {
			if (y > viewRect.y + viewRect.height) {
				return false;
			}
			height = rows.getSectionSize(index);
			if (height && y + height >= viewRect.y) {
				const rowInfo = {
					section,
					index,
					myIndex: info.length,
					y,
					height,
					topBorders: {}
				};

				// IF Column
				let data = dataProvider.getRC(1, index);
				if (data !== undefined) {
					const value = data.getValue();
					if (value !== undefined) {
						const state = value === 0 || value === '' || value === false || value === 'false';
						rowInfo.grey = this._greyIfRows && (this._editMode || state);
					}
				}

				// get the cell left and right to the visible area, which might impact the view for each row
				if (visibleColumnsInfo.length) {
					let pos = visibleColumnsInfo[0].index;
					while (pos > 0) {
						pos -= 1;
						data = dataProvider.getRC(pos, index);
						if (data !== undefined && data.getValue() !== undefined) {
							rowInfo.leftCellInfo = {
								section: columns.getSection(pos),
								index: pos,
								x: columns.getSectionPos(pos),
								width: columns.getSectionSize(pos)
							};
							break;
						}
					}
					pos = visibleColumnsInfo[visibleColumnsInfo.length - 1].index;
					const maxCol = Math.min(columnCnt, dataProvider.getRowSize(index));
					while (pos < maxCol) {
						pos += 1;
						data = dataProvider.getRC(pos, index);
						if (data !== undefined && data.getValue() !== undefined) {
							rowInfo.rightCellInfo = {
								section: columns.getSection(pos),
								index: pos,
								x: columns.getSectionPos(pos),
								width: columns.getSectionSize(pos)
							};
							break;
						}
					}
				}
				info.push(rowInfo);
			}
			y += height;
			return true;
		});

		return info;
	}
}
