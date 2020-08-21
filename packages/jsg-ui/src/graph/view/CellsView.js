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
/* eslint-disable no-bitwise */
/* global document window */

import {
	default as JSG,
	CellRange,
	WorksheetAttributes,
	SheetReference,
	Selection,
	Point,
	MathUtils,
	Numbers,
	TextFormatAttributes,
	SheetPlotNode,
	ChartRect,
	FormatAttributes
} from '@cedalo/jsg-core';

import { FuncTerm } from '@cedalo/parser';

import { NumberFormatter } from '@cedalo/number-format';

import CellEditor from './CellEditor';
import NodeView from './NodeView';
import { createView } from '@cedalo/jsg-extensions/ui';
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
		this._rows = this.getRows();
		if (!this._wsView || !this._wsItem) {
			return;
		}

		const graph = this._wsItem.getGraph();
		const viewRect = this._wsView.getViewPort().getVisibleViewRect();

		this._greyIfRows = this._wsItem
			.getWorksheetAttributes()
			.getGreyIfRows()
			.getValue();
		this._wsItem._showFormulas = this._wsItem.isShowFormulas();
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

		this.drawData(graphics, rect, viewRect);

		const id = graph.getTopStreamSheetContainerId();

		if (id !== undefined && id !== this._wsItem.getId()) {
			this.drawSelections(graphics, rect);
		}
		this.drawCellEditRanges(graphics, rect);
		if (id !== undefined && id !== this._wsItem.getId()) {
			this.drawCopyMarker(graphics, rect);
		}
	}

	drawData(graphics, rect, viewRect) {
		const dataProvider = this._wsItem.getDataProvider();

		// get visible matrix
		const visibleColumnsInfo = this.getVisibleColumnSections(rect, viewRect);
		const visibleRowsInfo = this.getVisibleRowsSections(rect, viewRect, visibleColumnsInfo);

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
					this.drawValue(graphics, dataProvider, data, rowInfo.leftCellInfo, rowInfo, visibleColumnsInfo);
				}
			}
			visibleColumnsInfo.forEach((columnInfo) => {
				const data = dataProvider.getRC(columnInfo.index, rowInfo.index);
				const cellProperties = this.getCellProperties(data, columnInfo, rowInfo);
				const styleProperties = this.getStyleProperties(data, columnInfo, rowInfo, cellProperties);
				this.drawCellFill(graphics, data,  columnInfo, rowInfo, visibleColumnsInfo, visibleRowsInfo, styleProperties, cellProperties);
				if (data !== undefined && data.getExpression() !== undefined) {
					this.drawValue(graphics, dataProvider, data, columnInfo, rowInfo, visibleColumnsInfo, styleProperties, cellProperties);
					this.drawSpecialFunction(graphics, data, columnInfo, rowInfo, visibleColumnsInfo, visibleRowsInfo);
				}
			});
			if (rowInfo.rightCellInfo) {
				const data = dataProvider.getRC(rowInfo.rightCellInfo.index, rowInfo.index);
				if (data !== undefined && data.getExpression() !== undefined) {
					this.drawValue(graphics, dataProvider, data, rowInfo.rightCellInfo, rowInfo, visibleColumnsInfo);
				}
			}
		});

		let last;

		const borders = {
			grid: []
		};

		const sheetHeight = Math.min(this._rows.getSectionPos(this._wsItem.getRowCount()), viewRect.y + viewRect.height);
		// draw grid
		if (this._wsItem.isGridVisible()) {
			visibleColumnsInfo.forEach((columnInfo) => {
				last = viewRect.y;

				columnInfo.gridSkipBorders.forEach((info, index) => {
					if (last !== info.y && info.y > last) {
						borders.grid.push({
							x1: columnInfo.x,
							y1: last,
							x2: columnInfo.x,
							y2: info.y
						});
					}
					last = info.y + info.height;
				});

				borders.grid.push({
					x1: columnInfo.x,
					y1: last,
					x2: columnInfo.x,
					y2: sheetHeight
				});
			});
		}

		graphics.beginPath();
		graphics.setLineColor(JSG.theme.grid);
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

	getFormattedValueFromFunction(graphics, data, result, availableWidth) {
		const term = data.getExpression().getTerm();

		if (data.displayFunctionName && term && (term instanceof FuncTerm)) {
			switch (term.getFuncId()) {
				case 'SELECT':
					result.clip = true;
					result.forcedAlignment = 0;
					result.clipSpace = 600;

					if (typeof result.value === 'string') {
						let width = graphics
							.getCoordinateSystem()
							.deviceToLogX(graphics.measureText(result.value).width, true);
						const eWidth = graphics
							.getCoordinateSystem()
							.deviceToLogX(graphics.measureText('...').width, true);
						if (width + 150 > availableWidth - result.clipSpace && result.formattedValue.length) {
							while (width + eWidth + 150 > availableWidth - result.clipSpace && result.formattedValue.length) {
								result.formattedValue = result.formattedValue.slice(0, result.formattedValue.length - 1)
								width = graphics
									.getCoordinateSystem()
									.deviceToLogX(graphics.measureText(result.formattedValue).width, true);
							}
							result.formattedValue += '...';
						}
					}
					break;
				case 'BAR':
				case 'CELLCHART':
					result.value = '';
					result.formattedValue = '';
					break;
				case 'READ':
				case 'WRITE':
					result.fillColor = '#AAAAAA';
					result.color = '#FFFFFF';
					result.bold = true;
					result.rounded = term.getFuncId() === 'READ' ? 'left' : 'right';
					if (term.params && term.params.length > 2 && term.params[2].value) {
						switch (term.params[2].value) {
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
					}
					break;
				default:
					result.value = String(data.getValue());
					result.rounded = 'full';
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

	replaceLocalField(graphics, data, result) {
		if (!(typeof result.value === 'string')) {
			return;
		}

		if (result.value === '#[LocalDate]') {
			result.value = MathUtils.JSDateToExcelDate(new Date());
		}
	}

	getFormattedValue(graphics, data, textproperties, styleProperties, availableWidth) {
		const result = {
			value: data.getValue(),
			formattedValue: data.getValue(),
			type: 'general',
			clip: false
		};

		if (this._wsItem._showFormulas) {
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

		this.replaceLocalField(graphics, data, result);

		if (this.getFormattedValueFromFunction(graphics, data, result, availableWidth)) {
			return result;
		}

		if (textproperties.fontcolor) {
			result.color = textproperties.fontcolor;
		}
		if (styleProperties && styleProperties.fillstyle === 1 && styleProperties.fillcolor) {
			result.fillColor = styleProperties.fillcolor;
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
			if (typeof result.value === 'string' && result.value[0] === '#') {
				result.alignment = 1;
			}
			return result;
		}

		const numberFormat = textproperties && textproperties.numberformat ? textproperties.numberformat : 'General';
		const localCulture = textproperties && textproperties.localculture ? textproperties.localculture : 'general';
		const type = localCulture.split(';');

		try {
			const newResult = NumberFormatter.formatNumber(numberFormat, result.value, type[0]);
			result.formattedValue = newResult.formattedValue;
			result.value = newResult.value;
			if (newResult.color !== null) {
				result.color = newResult.color;
			}
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
					const newResult = NumberFormatter.formatNumber('General', MathUtils.roundTo(result.value, decimals), 'general');
					result.formattedValue = newResult.formattedValue;
					result.value = newResult.value;
					if (newResult.color !== null) {
						result.color = newResult.color;
					}

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
				cellPropertiesTmp = this.getCellProperties(dataSub, columnInfo, rowInfoTmp);
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
				if (value === '{ JSON Object }') {
					formattedValue.fillColor = '#E17000';
				} else {
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
	}

	resetFont(graphics) {
		graphics.setFontName('Verdana');
		graphics.setFontSize(9);
		graphics.setFontStyle(TextFormatAttributes.FontStyle.NORMAL);
		graphics.setFont();
	}

	getStyleProperties(cell, column, row, cellProperties) {
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
			styleproperties = this._wsItem.getFormatPropertiesAtRC(cell, column.index, row.index);
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
			textproperties = this._wsItem.getTextFormatPropertiesAtRC(cell, column.index, row.index);
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
			attributes = this._wsItem.getCellPropertiesAtRC(cell, column.index, row.index);
		}
		return attributes;
	}

	drawCellFill(graphics, data, columnInfo, rowInfo, visibleColumnsInfo, visibleRowsInfo, styleproperties, cellProperties) {
		if (
			styleproperties === undefined ||
			styleproperties.fillcolor === undefined ||
			Number(styleproperties.fillstyle) !== 1
		) {
			if (cellProperties && cellProperties.key) {
				graphics.setFillColor(JSG.theme.filllight);
				graphics.fillRoundedRectangle(
					columnInfo.x + 50,
					rowInfo.y + 50,
					columnInfo.width - 100,
					rowInfo.height - 100,
					0, 100, 0, 100
				);
				// this.rect(
				// 	graphics,
				// 	columnInfo.x + 50,
				// 	rowInfo.y + 50,
				// 	columnInfo.width - 100,
				// 	rowInfo.height - 100,
				// 	'#F2F2F2'
				// );
			}
		} else {
			if (rowInfo.grey) {
				graphics.setTransparency(60);
			}
			this.rect(graphics, columnInfo.x, rowInfo.y, columnInfo.width + 20, rowInfo.height + 20, styleproperties.fillcolor);
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
			case 'CELLCHART': {
				if (termFunc.params && termFunc.params.length > 0 && termFunc.params[0].value) {
					const node = new SheetPlotNode();
					node._parent = this.getItem();
					const yValues = node.getParamInfo(termFunc, 0);
					if (yValues) {
						const view = createView(node);
						node.evaluate();
						const range = yValues.range.copy();
						const selection = new Selection(this.getItem());
						selection.add(range);
						// range.shiftFromSheet();
						const type = (termFunc.params.length > 1 && termFunc.params[1].value) || 'line';
						node.setSize(columnInfo.width, rowInfo.height);
						node.createSeriesFromSelection(undefined, this.getItem(), selection, type);
						node.layout();
						if (node.series.length) {
							const serie = node.series[0];
							if (termFunc.params.length > 2 && termFunc.params[2].value) {
								serie.format.lineColor = termFunc.params[2].value;
							}
							if (termFunc.params.length > 3 && termFunc.params[3].value) {
								serie.format.fillColor = termFunc.params[3].value;
							}
							if (termFunc.params.length > 4 && termFunc.params[4].value) {
								serie.marker.style = termFunc.params[4].value;
								serie.marker.size = 2;
							}
							if (termFunc.params.length > 5 && termFunc.params[5].value !== undefined) {
								node.yAxes[0].scale.min = termFunc.params[5].value;
							}
							if (termFunc.params.length > 6 && termFunc.params[6].value && node.yAxes[0].scale) {
								node.yAxes[0].scale.max = termFunc.params[6].value;
							}
							const rect = new ChartRect(columnInfo.x, rowInfo.y, columnInfo.x + columnInfo.width,
								rowInfo.y + rowInfo.height);
							switch (serie.type) {
							case 'pie':
							case 'doughnut':
								view.drawCircular(graphics, node, rect, serie, 0);
								break;
							default:
								view.drawCartesian(graphics, node, rect, serie, 0);
								break;
							}
						}
					}
				}
				break;
			}
			case 'SELECT': {
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
					if (visibleColumnsInfo.length > columnInfo.myIndex + 1) {
						const borders = visibleColumnsInfo[columnInfo.myIndex + 1].leftBorders;
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
					}
					if (visibleRowsInfo.length > rowInfo.myIndex + 1) {
						const borders = visibleRowsInfo[rowInfo.myIndex + 1].topBorders;
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
				}
				break;
			}
			default:
				break;
			}
		}
	}

	drawValue(graphics, dataProvider, data, columnInfo, rowInfo, visibleColumnsInfo, styleProperties, cellProperties) {
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
			if (font) {
				graphics.setFont();
			}
		}

		const formattedValue = this.getFormattedValue(graphics, data, textproperties, styleProperties, columnInfo.width);
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
			if (this._wsItem._showFormulas === false && columnInfo.width < 1100) {
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
				// this.rect(
				// 	graphics,
				// 	columnInfo.x + formattedValue.level * 150 + 50,
				// 	rowInfo.y + 50,
				// 	columnInfo.width - formattedValue.level * 150 - 100,
				// 	rowInfo.height - 100,
				// 	formattedValue.fillColor
				// );
				graphics.setFillColor(formattedValue.fillColor);
				graphics.fillRoundedRectangle(
					columnInfo.x + formattedValue.level * 150 + 50,
					rowInfo.y + 50,
					columnInfo.width - formattedValue.level * 150 - 100,
					rowInfo.height - 100,
					100, 0, 100, 0
				);
			} else if (formattedValue.rounded) {
				const left = formattedValue.rounded === 'full' || formattedValue.rounded === 'left';
				const right = formattedValue.rounded === 'full' || formattedValue.rounded === 'right';
				graphics.setFillColor(formattedValue.fillColor);
				graphics.fillRoundedRectangle(
					columnInfo.x,
					rowInfo.y,
					columnInfo.width,
					rowInfo.height,
					left ? 125 : 0, right ? 125 : 0, left ? 125 : 0, right ? 125: 0
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
		} else if  (textproperties.fontcolor) {
			graphics.setFillColor(textproperties.fontcolor);
		} else {
			graphics.setFillColor(JSG.theme.text);
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

	getVisibleColumnSections(rect, viewRect) {
		let x = rect.x;
		let width;
		const info = [];

		this._columns.enumerateSections((section, index) => {
			if (x > viewRect.x + viewRect.width) {
				return false;
			}
			width = this._columns.getSectionSize(index);
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

	getVisibleRowsSections(rect, viewRect, visibleColumnsInfo) {
		let y = rect.y;
		let height;
		const info = [];
		const dataProvider = this._wsItem.getDataProvider();
		const columnCnt = this._wsItem.getColumnCount();

		this._rows.enumerateSections((section, index) => {
			if (y > viewRect.y + viewRect.height) {
				return false;
			}
			height = this._rows.getSectionSize(index);
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
								section: this._columns.getSection(pos),
								index: pos,
								x: this._columns.getSectionPos(pos),
								width: this._columns.getSectionSize(pos)
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
								section: this._columns.getSection(pos),
								index: pos,
								x: this._columns.getSectionPos(pos),
								width: this._columns.getSectionSize(pos)
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
		graphics.setLineColor(JSG.theme.grid);

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
					color = focus ? JSG.theme.text : '#777777';
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
			this.drawSelection(graphics, ws, wsView, selection, focus ? JSG.theme.text : '#777777', undefined);
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
}
