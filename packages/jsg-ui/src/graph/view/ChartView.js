/* globals document */

import Chart from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
	default as JSG,
	Notification,
	NotificationCenter,
	Arrays,
	Numbers,
	TextFormatAttributes,
	CellRange,
	MathUtils, FormatAttributes
} from '@cedalo/jsg-core';

import { NumberFormatter } from '@cedalo/number-format';

import NodeView from './NodeView';
import MouseEvent from '../../ui/events/MouseEvent';

JSG.GRAPH_SHOW_CONTEXT_MENU_NOTIFICATION = 'graph_show_context_menu_notification';
JSG.GRAPH_DOUBLE_CLICK_NOTIFICATION = 'graph_double_click_notification';

let chartCanvas;
let chartDiv;

const colors = {
	backgroundColor: [
		'rgb(54, 162, 235)',
		'rgb(255, 99, 132)',
		'rgb(255, 206, 86)',
		'rgb(75, 192, 192)',
		'rgb(153, 102, 255)',
		'rgb(255, 159, 64)',
		'rgb(98,51,58)',
		'rgb(0,177,91)',
		'rgb(88,207,255)',
		'rgb(255,139,116)',
		'rgb(131,240,255)',
		'rgb(224,108,255)'
	],
	borderColor: [
		'rgb(54, 162, 235)',
		'rgb(255,99,132)',
		'rgb(255, 206, 86)',
		'rgb(75, 192, 192)',
		'rgb(153, 102, 255)',
		'rgb(255, 159, 64)',
		'rgb(98,51,58)',
		'rgb(0,177,91)',
		'rgb(88,207,255)',
		'rgb(255,139,116)',
		'rgb(131,240,255)',
		'rgb(224,108,255)'
	]
};

export default class ChartView extends NodeView {
	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);

		if (this.getItem()._isFeedback || this.getItem().getId() === undefined) {
			return;
		}

		this.drawChart(graphics, rect);
	}

	getSheet() {
		const range = this.getItem().getDataRange();

		return range ? range.getSheet() : undefined;
	}

	getVertical(range) {
		const item = this.getItem();
		if (item.data.direction === 'auto') {
			item.data.direction = range.getHeight() > range.getWidth() ? 'columns' : 'rows';
		}

		return item.data.direction === 'columns';
	}

	excelDateToJSDate(serial) {
		const utcDays = Math.floor(serial - 25569);
		const utcValue = utcDays * 86400;
		const dateInfo = new Date(utcValue * 1000);
		const fractionalDay = serial - Math.floor(serial) + 0.0000001;
		let totalSeconds = Math.floor(86400 * fractionalDay);
		const seconds = totalSeconds % 60;

		totalSeconds -= seconds;

		const hours = Math.floor(totalSeconds / (60 * 60));
		const minutes = Math.floor(totalSeconds / 60) % 60;
		const ms = (86400 * fractionalDay - hours * 3600 - minutes * 60 - seconds) * 1000;

		return new Date(dateInfo.getFullYear(), dateInfo.getMonth(), dateInfo.getDate(), hours, minutes, seconds, ms);
	}

	hasCategoryLabels(data, range, chartType) {
		const item = this.getItem();
		let categoryLabels = false;

		switch (item.data.hasCategoryLabels) {
			case 'auto': {
				let cell;
				let val;
				const vertical = this.getVertical(range);
				const start = vertical ? range._y1 + 1 : range._x1 + 1;
				const end = vertical ? range._y2 : range._x2;

				for (let i = start; i <= end; i += 1) {
					cell = vertical
						? range
								.getSheet()
								.getDataProvider()
								.getRC(range._x1, i)
						: range
								.getSheet()
								.getDataProvider()
								.getRC(i, range._y1);
					if (cell) {
						val = cell.getValue();
						if (typeof val === 'string' && val.length) {
							categoryLabels = true;
						} else if (
							chartType !== 'scatter' &&
							chartType !== 'scatterLine' &&
							chartType !== 'bubble' &&
							Numbers.isNumber(val)
						) {
							const tf = vertical
								? data.getSheet().getTextFormatAtRC(range._x1, i)
								: data.getSheet().getTextFormatAtRC(i, range._y1);
							const local = tf
								.getLocalCulture()
								.getValue()
								.toString();
							if (local) {
								const type = local.split(';');
								if (type.length && (type[0] === 'date' || type[0] === 'time')) {
									categoryLabels = true;
								}
							}
						}
					}
				}
				item.data.hasCategoryLabels = categoryLabels ? 'first' : 'none';
				break;
			}
			case 'first':
				categoryLabels = true;
				break;
			case 'none':
			default:
				categoryLabels = false;
				break;
		}

		return categoryLabels;
	}

	hasSeriesLabels(data, range, categoryLabels) {
		const item = this.getItem();
		let seriesLabels;

		switch (item.data.hasSeriesLabels) {
			case 'auto': {
				let cell;
				let val;
				const vertical = this.getVertical(range);
				const start = vertical ? range._x1 + (categoryLabels ? 1 : 0) : range._y1 + (categoryLabels ? 1 : 0);
				const end = vertical ? range._x2 : range._y2;

				for (let i = start; i <= end; i += 1) {
					cell = vertical
						? range
								.getSheet()
								.getDataProvider()
								.getRC(i, range._y1, i)
						: range
								.getSheet()
								.getDataProvider()
								.getRC(range._x1, i);
					if (cell) {
						val = cell.getValue();
						if (typeof val === 'string' && val.length) {
							seriesLabels = true;
						}
					}
				}
				item.data.hasSeriesLabels = seriesLabels ? 'first' : 'none';
				break;
			}
			case 'first':
				seriesLabels = true;
				break;
			case 'none':
			default:
				seriesLabels = false;
				break;
		}

		return seriesLabels;
	}

	getSeries(data, range, seriesLabels, categoryLabels, values, chartType) {
		const item = this.getItem();
		const chartSheet = item.getSheetContainer();
		const vertical = this.getVertical(range);
		let startI = vertical ? range._x1 : range._y1;
		let endI = vertical ? range._x2 : range._y2;
		const startJ = vertical ? range._y1 : range._x1;
		const endJ = vertical ? range._y2 : range._x2;
		let step = 1;
		let row;
		let column;
		let seriesCounter = 0;
		const tmpRange = new CellRange(range.getSheet(), 0, 0, 0, 0);

		if (categoryLabels) {
			startI += 1;
		}

		if (values) {
			if (item.data.series === undefined) {
				item.data.series = [];
			}
			values.forEach((value, index) => {
				if (item.data.series[index] === undefined) {
					item.data.series[index] = {};
				}
			});
			item.data.series.length = values.length;
			if (seriesLabels) {
				endI = Math.max(startI, endI);
				for (let i = startI; i <= endI; i += 1) {
					column = vertical ? i : startJ;
					row = vertical ? startJ : i;
					tmpRange.set(column, row, column, row);
					tmpRange.shiftToSheet();
					item.data.series[i - startI].seriesLabelRange = `=${tmpRange.toString({
						item: chartSheet,
						useName: true
					})}`;
				}
			}
		} else {
			if (item.data.coherent === false && item.data.series !== undefined) {
				// item.data.series = [];
				return item.data.series;
			}

			switch (chartType) {
				case 'bubble':
					step = 2;
					startI += 1;
					break;
				case 'scatter':
				case 'scatterLine':
					startI += 1;
					break;
				default:
					break;
			}
			endI = Math.max(startI, endI);

			if (item.data.series === undefined) {
				item.data.series = [];
			}

			for (let i = startI; i <= endI; i += step) {
				let currentSeries = item.data.series[seriesCounter];
				if (currentSeries === undefined) {
					currentSeries = {};
					item.data.series[seriesCounter] = currentSeries;
				}
				if (categoryLabels) {
					if (vertical) {
						tmpRange.set(range._x1, range._y1 + (seriesLabels ? 1 : 0), range._x1, range._y2);
					} else {
						tmpRange.set(range._x1 + (seriesLabels ? 1 : 0), range._y1, range._x2, range._y1);
					}
					tmpRange.shiftToSheet();
					currentSeries.categoryLabels = `=${tmpRange.toString({ item: chartSheet, useName: true })}`;
				} else {
					currentSeries.categoryLabels = '';
				}
				column = vertical ? i : startJ;
				row = vertical ? startJ : i;
				if (seriesLabels) {
					tmpRange.set(column, row, column, row);
					tmpRange.shiftToSheet();
					currentSeries.seriesLabelRange = `=${tmpRange.toString({ item: chartSheet, useName: true })}`;
				}

				switch (chartType) {
					case 'scatter':
					case 'scatterLine':
						if (vertical) {
							tmpRange.set(startI - 1, range._y1 + (seriesLabels ? 1 : 0), startI - 1, range._y2);
						} else {
							tmpRange.set(range._x1 + (seriesLabels ? 1 : 0), startI - 1, range._x2, startI - 1);
						}
						tmpRange.shiftToSheet();
						currentSeries.dataX = `=${tmpRange.toString({ item: chartSheet, useName: true })}`;
						break;
					case 'bubble':
						if (vertical) {
							tmpRange.set(startI - 1, range._y1 + (seriesLabels ? 1 : 0), startI - 1, range._y2);
						} else {
							tmpRange.set(range._x1 + (seriesLabels ? 1 : 0), startI - 1, range._x2, startI - 1);
						}
						tmpRange.shiftToSheet();
						currentSeries.dataX = `=${tmpRange.toString({ item: chartSheet, useName: true })}`;
						if (vertical) {
							tmpRange.set(column + 1, row + (seriesLabels ? 1 : 0), column + 1, row + endJ - startJ);
						} else {
							tmpRange.set(column + (seriesLabels ? 1 : 0), row + 1, column + endJ - startJ, row + 1);
						}
						tmpRange.shiftToSheet();
						currentSeries.dataRadius = `=${tmpRange.toString({ item: chartSheet, useName: true })}`;
						if (vertical) {
							tmpRange.set(column + 1, row + (seriesLabels ? 1 : 0), column + 1, row + endJ - startJ);
						} else {
							tmpRange.set(column + (seriesLabels ? 1 : 0), row + 1, column + endJ - startJ, row + 1);
						}
						break;
					default:
						break;
				}

				if (vertical) {
					tmpRange.set(column, row + (seriesLabels ? 1 : 0), column, row + endJ - startJ);
				} else {
					tmpRange.set(column + (seriesLabels ? 1 : 0), row, column + endJ - startJ, row);
				}

				tmpRange.shiftToSheet();
				currentSeries.data = `=${tmpRange.toString({ item: chartSheet, useName: true })}`;

				seriesCounter += 1;
			}
			item.data.series.length = seriesCounter;
		}

		return item.data.series;
	}

	getFormatSeries(data, range) {
		const item = this.getItem();
		const vertical = this.getVertical(range);
		const startI = vertical ? range._x1 : range._y1;
		const endI = vertical ? range._x2 : range._y2;
		const startJ = vertical ? range._y1 : range._x1;
		const endJ = vertical ? range._y2 : range._x2;
		let row;
		let column;
		const tmpRange = new CellRange(range.getSheet(), 0, 0, 0, 0);

		if (item.data.formatSeries === undefined) {
			item.data.formatSeries = [];
		}
		let seriesCounter = 0;
		const chartSheet = item.getSheetContainer();

		for (let i = startI; i <= endI; i += 1) {
			let currentSeries = item.data.formatSeries[seriesCounter];
			if (currentSeries === undefined) {
				currentSeries = {};
				item.data.formatSeries[seriesCounter] = currentSeries;
			}
			column = vertical ? i : startJ;
			row = vertical ? startJ : i;

			if (vertical) {
				tmpRange.set(column, row, column, row + endJ - startJ);
			} else {
				tmpRange.set(column, row, column + endJ - startJ, row);
			}

			tmpRange.shiftToSheet();
			currentSeries.data = `=${tmpRange.toString({ item: chartSheet, useName: true })}`;

			seriesCounter += 1;
		}

		item.data.formatSeries.length = seriesCounter;

		return item.data.formatSeries;
	}

	getCategoryLabels(data, series, allValues, categories, chartType) {
		const categoryLabelData = [];
		if (allValues === undefined && (series === undefined || series.length < 1)) {
			return categoryLabelData;
		}

		if (allValues && allValues.length) {
			const values = allValues[0].getValues();
			if (values) {
				values.forEach((value) => {
					categoryLabelData.push(ChartView.formatNumber(value.key, 'h:mm:ss', `time;en`));
				});
			}
		} else {
			let categoryRange;

			for (let i = 0; i < categories; i += 1) {
				categoryLabelData.push(undefined);
			}

			if (this.getItem().data.coherent) {
				const [catSeries] = series;
				categoryRange = catSeries.categoryLabels;
				this.getItem().setCategoryDataRangeString(categoryRange);
			}

			const range = this.getItem().getCategoryDataRange();
			if (range === undefined) {
				return categoryLabelData;
			}

			range.shiftFromSheet();

			let cell;
			let val;
			const vertical = this.getVertical(range);
			const start = vertical ? range._y1 : range._x1;
			const end = vertical ? range._y2 : range._x2;

			for (let i = start; i <= end; i += 1) {
				val = '';
				cell = vertical
					? range
							.getSheet()
							.getDataProvider()
							.getRC(range._x1, i)
					: range
							.getSheet()
							.getDataProvider()
							.getRC(i, range._y1);

				if (cell) {
					val = cell.getValue();
					if (Numbers.isNumber(val)) {
						const tf = vertical
							? data.getSheet().getTextFormatAtRC(range._x1, i)
							: data.getSheet().getTextFormatAtRC(i, range._y1);
						const localCulture = tf
							.getLocalCulture()
							.getValue()
							.toString();
						const numberFormat = tf.getNumberFormat().getValue();
						categoryLabelData[i - start] = ChartView.formatNumber(val, numberFormat, localCulture);
					} else {
						categoryLabelData[i - start] = val;
					}
				} else {
					categoryLabelData[i - start] = undefined;
				}
			}
		}

		return categoryLabelData;
	}

	isLineChart(chartType) {
		return (
			chartType === 'radar' ||
			chartType === 'scatter' ||
			chartType === 'line' ||
			chartType === 'scatterLine'
		);
	}

	getDashPattern(style, lineWidth) {
		const dot = lineWidth;
		const dash = lineWidth * 5;
		const space = lineWidth * 3;
		const dotspace = lineWidth * 2;
		let pattern = [dash, space];

		switch (style) {
		case 0:
			pattern = [0, 10];
			break;
		case 1:
			pattern = [];
			break;
		case 2:
			pattern = [dot, dotspace];
			break;
		case 3:
			pattern = [dash, space];
			break;
		case 4:
			pattern = [dash, space, dot, space];
			break;
		}

		return pattern;
	}

	getRange(rangeString, sheet) {
		if (rangeString && rangeString !== '' && rangeString[0] === '=') {
			const range = CellRange.parse(rangeString.substring(1).toUpperCase(), sheet);
			return range;
		}
		return undefined;
	}

	getDataSets(graphics, data, series, formatSeries, allValues, chartType) {
		let cell;
		let val;
		const datasets = [];
		let step;

		switch (chartType) {
			case 'scatter':
			case 'scatterLine':
				step = 2;
				break;
			case 'bubble':
				step = 3;
				break;
			default:
				step = 1;
				break;
		}

		this._numberFormat = undefined;
		this._localCulture = undefined;
		this._numberFormatX = undefined;
		this._localCultureX = undefined;
		this._showDataLabels = false;

		series.forEach((currentSeries, index) => {
			const set = {};
			set.data = [];
			set.backgroundColor = currentSeries.fillColor ? currentSeries.fillColor : undefined;
			set.borderColor = currentSeries.lineColor ? currentSeries.lineColor : undefined;
			set.borderWidth = currentSeries.lineWidth === undefined ? 1 : currentSeries.lineWidth;
			if (currentSeries.lineStyle instanceof Array) {
				set.borderDash = currentSeries.lineStyle;
			} else {
				switch (currentSeries.lineStyle) {
				case 0:
				case 2:
				case 3:
				case 4:
					set.borderDash = this.getDashPattern(currentSeries.lineStyle, set.borderWidth);
					break;
				}
			}

			if (currentSeries.showLine === undefined) {
				if (chartType === 'scatterLine') {
					set.showLine = true;
				} else if (chartType === 'scatter') {
					set.showLine = false;
				}
			} else {
				set.showLine = currentSeries.showLine;
			}

			if (this.isLineChart(chartType)) {
				set.pointBorderWidth = currentSeries.lineWidth;
				set.pointBorderColor = currentSeries.markerLineColor;
				set.pointBackgroundColor = currentSeries.markerFillColor;
				if (chartType === 'scatter' && currentSeries.lineMarker === undefined) {
					set.pointStyle = 'circle';
					set.pointRadius = currentSeries.lineMarkerSize === undefined ? 4 : currentSeries.lineMarkerSize;
				} else if (currentSeries.lineMarker === undefined || currentSeries.lineMarker === 'none') {
					set.pointStyle = 'line';
					set.pointRadius = 0;
				} else {
					set.pointStyle = currentSeries.lineMarker;
					set.pointRadius = currentSeries.lineMarkerSize === undefined ? 4 : currentSeries.lineMarkerSize;
				}
			}

			if (currentSeries.showDataLabels) {
				this._showDataLabels = true;
			}

			set.datalabels = {
				color: '#444444',
				anchor: 'end',
				align: 'end',
				clamp: true,
				display: (context) => {
					if (
						currentSeries.pointInfo &&
						currentSeries.pointInfo[context.dataIndex] &&
						currentSeries.pointInfo[context.dataIndex].showDataLabels !== undefined
					) {
						return currentSeries.pointInfo[context.dataIndex].showDataLabels;
					}
					return currentSeries.showDataLabels === undefined ? false : currentSeries.showDataLabels;
				},
				font: {
					size: 13
				}
			};

			if (currentSeries.xAxisID) {
				if (this.getItem().getAxisByName(currentSeries.xAxisID)) {
					set.xAxisID = currentSeries.xAxisID;
				} else {
					currentSeries.xAxisID = undefined;
				}
			}
			if (currentSeries.yAxisID) {
				if (this.getItem().getAxisByName(currentSeries.yAxisID)) {
					set.yAxisID = currentSeries.yAxisID;
				} else {
					currentSeries.yAxisID = undefined;
				}
			}
			let range = this.getRange(currentSeries.seriesLabelRange, data.getSheet());
			if (range === undefined) {
				set.label = currentSeries.seriesLabelRange;
			} else {
				range.shiftFromSheet();
				cell = range
					.getSheet()
					.getDataProvider()
					.getRC(range._x1, range._y1);
				val = cell ? cell.getValue() : undefined;
				set.label = val;
			}
			if (set.label === undefined || set.label === '') {
				set.label = `Series ${index + 1}`;
			}
			currentSeries.seriesLabel = set.label;
			if (allValues && allValues.length > index) {
				const values = allValues[index].getValues();
				if (values) {
					values.forEach((lvalue) => {
						switch (chartType) {
						case 'bubble':
						case 'scatter':
						case 'scatterLine': {
							const value = { x: 0, y: 0 };
							value.x = lvalue.key || 0;
							value.y = lvalue.value || 0;
							value.r = chartType === 'bubble' ? 1 : undefined;
							set.data.push(value);
							set._localCultureX = `time;en`;
							set._numberFormatX = 'h:mm:ss';
							this._localCultureX = `time;en`;
							this._numberFormatX = 'h:mm:ss';
							break;
						}
						case 'bar':
							set.data.push(lvalue.value);
							set._localCultureX = `time;en`;
							set._numberFormatX = 'h:mm:ss';
							this._localCulture = `time;en`;
							this._numberFormat = 'h:mm:ss';
							break;
						default:
							set.data.push(lvalue.value);
							set._localCultureX = `time;en`;
							set._numberFormatX = 'h:mm:ss';
							this._localCultureX = `time;en`;
							this._numberFormatX = 'h:mm:ss';
							break;
						}
					});
				}

				const tf = allValues[0].getTextFormat();
				if (tf) {
					this._localCulture = tf
						.getLocalCulture()
						.getValue()
						.toString();
					this._numberFormat = tf.getNumberFormat().getValue();
				}
			} else if (currentSeries.data) {
				let formatRange;
				if (formatSeries && formatSeries[index] && formatSeries[index].data) {
					formatRange = this.getRange(formatSeries[index].data, data.getSheet());
					if (formatRange) {
						formatRange.shiftFromSheet();
					}
					set.backgroundColor = [];
				}
				range = this.getRange(currentSeries.data, data.getSheet());
				let rangeX;
				let rangeRadius;
				if (currentSeries.dataX) {
					rangeX = this.getRange(currentSeries.dataX, data.getSheet());
				}
				if (currentSeries.dataRadius) {
					rangeRadius = this.getRange(currentSeries.dataRadius, data.getSheet());
				}
				if (range !== undefined) {
					range.shiftFromSheet();
					if (rangeX) {
						rangeX.shiftFromSheet();
					}
					if (rangeRadius) {
						rangeRadius.shiftFromSheet();
					}

					const vertical = this.getVertical(range);
					const startJ = vertical ? range._y1 : range._x1;
					const endJ = vertical ? range._y2 : range._x2;

					for (let j = startJ; j <= endJ; j += 1) {
						switch (chartType) {
							case 'scatter':
							case 'scatterLine': {
								const value = { x: 0, y: 0 };
								if (rangeX) {
									cell = vertical
										? range
												.getSheet()
												.getDataProvider()
												.getRC(rangeX._x1, j)
										: range
												.getSheet()
												.getDataProvider()
												.getRC(j, rangeX._y1);
									value.x = cell ? cell.getValue() : undefined;
								}
								cell = vertical
									? range
											.getSheet()
											.getDataProvider()
											.getRC(range._x1, j)
									: range
											.getSheet()
											.getDataProvider()
											.getRC(j, range._y1);
								value.y = cell ? cell.getValue() : undefined;
								set.data.push(value);
								break;
							}
							case 'bubble': {
								const value = { x: 0, y: 0, r: 0 };
								if (rangeX) {
									cell = vertical
										? range
												.getSheet()
												.getDataProvider()
												.getRC(rangeX._x1, j)
										: range
												.getSheet()
												.getDataProvider()
												.getRC(j, rangeX._y1);
									value.x = cell ? cell.getValue() : undefined;
								}
								cell = vertical
									? range
											.getSheet()
											.getDataProvider()
											.getRC(range._x1, j)
									: range
											.getSheet()
											.getDataProvider()
											.getRC(j, range._y1);
								value.y = cell ? cell.getValue() : undefined;
								if (rangeRadius) {
									cell = vertical
										? range
												.getSheet()
												.getDataProvider()
												.getRC(rangeRadius._x1, j)
										: range
												.getSheet()
												.getDataProvider()
												.getRC(j, rangeRadius._y1);
									value.r = cell ? cell.getValue() : undefined;
									value.r = value.r || 0;
								}
								set.data.push(value);
								break;
							}
							default:
								cell = vertical
									? range
											.getSheet()
											.getDataProvider()
											.getRC(range._x1, j)
									: range
											.getSheet()
											.getDataProvider()
											.getRC(j, range._y1);
								set.data.push(cell ? cell.getValue() : undefined);
								break;
						}

						if (formatRange) {
							const colorIndex = j - startJ;
							cell = vertical
								? range
										.getSheet()
										.getDataProvider()
										.getRC(formatRange._x1, formatRange._y1 + colorIndex)
								: range
										.getSheet()
										.getDataProvider()
										.getRC(formatRange._x1 + colorIndex, formatRange._y1);
							if (cell) {
								const color = cell.getValue();
								if (color) {
									set.backgroundColor.push(String(color));
								}
							}
							if (set.backgroundColor[colorIndex] === undefined) {
								set.backgroundColor.push(
									currentSeries.fillColor
										? currentSeries.fillColor
										: colors.backgroundColor[index % 11]
								);
							}
						}

						if (this._numberFormat === undefined) {
							const tf = vertical
								? data.getSheet().getTextFormatAtRC(range._x1, j)
								: data.getSheet().getTextFormatAtRC(j, range._y1);
							this._localCulture = tf
								.getLocalCulture()
								.getValue()
								.toString();
							this._numberFormat = tf.getNumberFormat().getValue();
						}
						if (this._numberFormatX === undefined && rangeX) {
							const tf = vertical
								? data.getSheet().getTextFormatAtRC(rangeX._x1, j)
								: data.getSheet().getTextFormatAtRC(j, rangeX._y1);
							this._localCultureX = tf
								.getLocalCulture()
								.getValue()
								.toString();
							this._numberFormatX = tf.getNumberFormat().getValue();
						}
						set._localCulture = this._localCulture;
						set._localCultureX = this._localCultureX;
						set._numberFormat = this._numberFormat;
						set._numberFormatX = this._numberFormatX;
					}
				}
			}
			datasets.push(set);
		});

		return datasets;
	}

	isObject(item) {
		return item && typeof item === 'object' && !Array.isArray(item);
	}

	mergeDeep(...objects) {
		const isObject = (obj) => obj && typeof obj === 'object';

		return objects.reduce((prev, obj) => {
			Object.keys(obj).forEach((key) => {
				const pVal = prev[key];
				const oVal = obj[key];

				if (Array.isArray(pVal) && Array.isArray(oVal)) {
					prev[key] = [...pVal, ...oVal].filter((element, index, array) => array.indexOf(element) === index);
				} else if (isObject(pVal) && isObject(oVal)) {
					prev[key] = this.mergeDeep(pVal, oVal);
				} else {
					prev[key] = oVal;
				}
			});

			return prev;
		}, {});
	}

	setFontSizeDeep(object, graphics) {
		Object.keys(object).forEach((key) => {
			// if update[key] exist, and it's not a string or array,
			// we go in one level deeper
			if (object.hasOwnProperty(key) && typeof object[key] === 'object') {
				this.setFontSizeDeep(object[key], graphics);
			} else if (key === 'fontSize') {
				object.fontSize =
					(Number(object.fontSize) / 72) * JSG.dpi.x * graphics.getCoordinateSystem().getDeviceRatio();
			}
		});
	}

	isTimeAggregateCell(cell) {
		if (!cell) {
			return false;
		}
		const expr = cell.getExpression();
		if (expr === undefined) {
			return false;
		}
		const formula = expr.getFormula();
		if (!formula) {
			return false;
		}

		return formula.indexOf('TIMEAGGREGATE') !== -1;
	}

	checkForTimeAggregates(data, item, range) {
		let allValues = [];

		if (range.getWidth() === 1 || range.getHeight() === 1) {
			range.enumerateCells(true, (pos) => {
				if (allValues !== undefined) {
					const cell = data.get(pos);
					if (this.isTimeAggregateCell(cell)) {
						allValues.push(cell);
					} else {
						allValues = undefined;
					}
				}
			});
			if (allValues) {
				item.data.hasSeriesLabels = 'none';
				item.data.hasCategoryLabels = 'auto';
				item.data.direction = 'auto';
				return allValues;
			}
		}

		allValues = [];

		if (range.getWidth() === 2) {
			for (let i = range.getY1(); i <= range.getY2(); i += 1) {
				if (allValues !== undefined) {
					const cell = range
						.getSheet()
						.getDataProvider()
						.getRC(range.getX1() + 1, i);
					if (this.isTimeAggregateCell(cell)) {
						allValues.push(cell);
					} else {
						allValues = undefined;
					}
				}
			}
			if (allValues) {
				item.data.hasSeriesLabels = 'first';
				item.data.hasCategoryLabels = 'auto';
				item.data.direction = 'rows';
				return allValues;
			}
		}

		allValues = [];

		if (range.getHeight() === 2) {
			for (let i = range.getX1(); i <= range.getX2(); i += 1) {
				if (allValues !== undefined) {
					const cell = range
						.getSheet()
						.getDataProvider()
						.getRC(i, range.getY1() + 1);
					if (this.isTimeAggregateCell(cell)) {
						allValues.push(cell);
					} else {
						allValues = undefined;
					}
				}
			}
			if (allValues) {
				item.data.hasSeriesLabels = 'first';
				item.data.hasCategoryLabels = 'auto';
				item.data.direction = 'columns';
				return allValues;
			}
		}

		return undefined;
	}

	drawChart(graphics, rect) {
		const drawError = (text) => {
			graphics.setFillColor('#000000');
			graphics.setTextBaseline('middle');
			graphics.setTextAlignment(TextFormatAttributes.TextAlignment.CENTER);
			graphics.fillText(text, rect.getCenterX(), rect.getCenterY());
			chartDiv.style.display = 'none';
		};

		const getValue = (sheet, text) => {
			if (text === undefined || text === '') {
				return '';
			}

			if (text[0] === '=') {
				const range = CellRange.parse(text.substring(1).toUpperCase(), sheet);
				if (range) {
					range.shiftFromSheet();
					const cell = range
						.getSheet()
						.getDataProvider()
						.getRC(range._x1, range._y1);
					if (cell) {
						return cell.getValue();
					}
					return '';
				}
			}

			return text;
		};

		if (chartCanvas === undefined) {
			chartCanvas = document.createElement('canvas');
			chartDiv = document.createElement('div');
			chartDiv.appendChild(chartCanvas);
			chartDiv.style.visible = 'hidden';
			chartDiv.style.position = 'absolute';
			chartDiv.style.top = '0px';
			chartDiv.style.left = '0px';
			document.body.appendChild(chartDiv);
		}

		chartDiv.style.width = `${graphics.getCoordinateSystem().logToDeviceXNoZoom(rect.width, false)}px`;
		chartDiv.style.height = `${graphics.getCoordinateSystem().logToDeviceYNoZoom(Math.abs(rect.height), false)}px`;
		chartCanvas.width = graphics.getCoordinateSystem().logToDeviceXNoZoom(rect.width, true);
		chartCanvas.height = graphics.getCoordinateSystem().logToDeviceYNoZoom(Math.abs(rect.height), true);

		Chart.defaults.global.defaultFontColor = '#000000';
		Chart.defaults.global.defaultFontSize = 12 * graphics.getCoordinateSystem().getDeviceRatio();
		Chart.defaults.global.defaultFontFamily = 'Verdana';
		Chart.defaults.global.defaultColor = '#000000';

		const item = this.getItem();
		const dataRange = item.getDataRange();
		const formatDataRange = item.getFormatDataRange();

		if (dataRange === undefined) {
			drawError('Invalid Range');
			return;
		}

		const data = dataRange.getSheet().getDataProvider();
		const range = dataRange.copy();

		range.shiftFromSheet();

		// check for TIMEAGGREGATE(S)
		const allValues = this.checkForTimeAggregates(data, item, range);
		item._timeAggregate = allValues !== undefined;

		const chartType = item.getChartType();
		let categoryLabels;

		if (allValues === undefined) {
			categoryLabels = this.hasCategoryLabels(data, range, chartType);
		} else {
			categoryLabels = chartType !== 'scatter' && chartType !== 'scatterLine' && chartType !== 'bubble';
		}
		const seriesLabels = this.hasSeriesLabels(data, range, categoryLabels);
		const series = this.getSeries(data, range, seriesLabels, categoryLabels, allValues, chartType);

		if (series === undefined) {
			drawError('Invalid Range');
			return;
		}

		let formatSeries;
		if (formatDataRange) {
			const formatRange = formatDataRange.copy();
			formatRange.shiftFromSheet();
			formatSeries = this.getFormatSeries(data, formatRange);
		}

		chartDiv.style.display = 'inline';
		chartDiv.style.width = `${graphics.getCoordinateSystem().logToDeviceXNoZoom(rect.width)}px`;
		chartDiv.style.height = `${graphics.getCoordinateSystem().logToDeviceYNoZoom(Math.abs(rect.height))}px`;
		chartCanvas.width = graphics.getCoordinateSystem().logToDeviceXNoZoom(rect.width);
		chartCanvas.height = graphics.getCoordinateSystem().logToDeviceYNoZoom(Math.abs(rect.height));

		try {
			let cats = 0;
			const datasets = this.getDataSets(graphics, data, series, formatSeries, allValues, chartType);
			datasets.forEach((set) => {
				cats = Math.max(set.data.length, cats);
			});
			const categoryLabelData = this.getCategoryLabels(data, series, allValues, cats, chartType);

			datasets.forEach((set, index) => {
				let value;
				for (let i = set.data.length - 1; i >= 0; i -= 1) {
					value = set.data[i];
					switch (item.data.hideEmpty) {
						case false:
						case 'none':
							categoryLabelData[i] = categoryLabelData[i] || '';
							if (value instanceof Object) {
								set.data[i].x = value.x || 0;
								set.data[i].y = value.y || 0;
							} else {
								set.data[i] = value || 0;
							}
							break;
						case true:
						case 'empty':
							if (
								(value === undefined && categoryLabelData[i] === undefined) ||
								(value instanceof Object &&
									value.x === undefined &&
									value.y === undefined &&
									categoryLabelData[i] === undefined)
							) {
								Arrays.removeAt(set.data, i);
							} else {
								categoryLabelData[i] = categoryLabelData[i] || '';
								if (value instanceof Object) {
									set.data[i].x = value.x || 0;
									set.data[i].y = value.y || 0;
								} else {
									set.data[i] = value || 0;
								}
							}
							break;
						case 'zero':
							if (
								(!value && !categoryLabelData[i]) ||
								(value instanceof Object && !value.x && !value.y && !categoryLabelData[i])
							) {
								Arrays.removeAt(set.data, i);
							} else {
								categoryLabelData[i] = categoryLabelData[i] || '';
								if (value instanceof Object) {
									set.data[i].x = value.x || 0;
									set.data[i].y = value.y || 0;
								} else {
									set.data[i] = value || 0;
								}
							}
							break;
					}
				}
			});

			for (let i = categoryLabelData.length - 1; i >= 0; i -= 1) {
				if (categoryLabelData[i] === undefined) {
					Arrays.removeAt(categoryLabelData, i);
				}
			}

			item.data.categoryLabelData = categoryLabelData;

			const chartDef = {
				type: chartType,
				plugins: [ChartDataLabels],
				data: {
					labels: categoryLabelData,
					datasets
				},
				options: {
					devicePixelRatio: 1,
					responsive: false,
					legend: {
						position: 'right',
						labels: {
							boxWidth: graphics.getCoordinateSystem().logToDeviceXNoZoom(250),
							usePointStyle: false
						}
					},
					layout: {
						padding: {
							left: graphics.getCoordinateSystem().logToDeviceXNoZoom(250),
							right: graphics.getCoordinateSystem().logToDeviceXNoZoom(250),
							top: graphics.getCoordinateSystem().logToDeviceXNoZoom(this._showDataLabels ? 750 : 400),
							bottom: graphics.getCoordinateSystem().logToDeviceXNoZoom(250)
						}
					},
					plugins: {
						datalabels: {
							formatter: this.dataLabelFormatter
						}
					}
				}
			};

			switch (chartType) {
				case 'area':
					chartDef.type = 'line';
					break;
				case 'bar':
				case 'stackedbar':
					chartDef.type = 'horizontalBar';
					break;
				case 'scatter':
				case 'bubble':
					chartDef.data.labels = undefined;
					break;
				case 'scatterLine':
					chartDef.data.labels = undefined;
					chartDef.type = 'scatter';
					chartDef.options.legend.labels.usePointStyle = true;
					break;
				case 'pie':
				case 'doughnut':
					chartDef.options.circumference = item.data.angle;
					chartDef.options.rotation = item.data.angle;
					break;
				case 'column':
				case 'stackedcolumn':
					chartDef.type = 'bar';
					break;
				case 'line':
					chartDef.options.legend.labels.usePointStyle = true;
					break;
			}

			datasets.forEach((set, index) => {
				if (chartType === 'pie' || chartType === 'doughnut') {
					if (set.backgroundColor === undefined) {
						set.backgroundColor = [];
						set.data.forEach((dataValue, dataIndex) => {
							set.backgroundColor.push(colors.backgroundColor[dataIndex % 11]);
						});
					}
					if (set.borderColor === undefined) {
						set.borderColor = [];
						set.data.forEach((dataValue, dataIndex) => {
							set.borderColor.push(colors.borderColor[dataIndex % 11]);
						});
					}
				} else {
					if (set.backgroundColor === undefined) {
						set.backgroundColor = colors.backgroundColor[index % 11];
					}
					if (set.borderColor === undefined) {
						set.borderColor = colors.borderColor[index % 11];
					}
				}
				switch (chartType) {
					case 'scatter':
					case 'scatterLine':
						set.lineTension = item.data.smooth ? undefined : 0;
						set.fill = false;
						break;
					case 'bubble':
						set.pointStyle = 'circle';
						break;
					case 'radar':
						set.fill = item.data.fill;
						set.lineTension = item.data.smooth ? 0.3 : 0;
						break;
					case 'line':
					case 'area':
						set.fill = chartType === 'area' || item.data.fill;
						set.steppedLine = item.data.step;
						set.lineTension = item.data.smooth ? undefined : 0;
						if (set.pointStyle === undefined || set.pointStyle === 'none') {
							set.pointStyle = 'line';
							set.pointRadius = 0;
						}
						break;
					default:
						break;
				}
			});

			datasets.forEach((set, index) => {
				const serie = series[index];
				if (serie.pointInfo !== undefined && serie.pointInfo.length) {
					let fillColor = false;
					let lineColor = false;
					let lineWidth = false;
					let lineMarker = false;
					let lineStyle = false;
					let lineMarkerColor = false;
					let fillMarkerColor = false;
					let lineMarkerSize = false;
					const lineChart = this.isLineChart(chartType);
					set.data.forEach((dataValue, dataIndex) => {
						if (!lineChart &&
							serie.pointInfo[dataIndex] &&
							serie.pointInfo[dataIndex].fillColor !== undefined) {
							fillColor = true;
						}
						if (!lineChart &&
							serie.pointInfo[dataIndex] &&
							serie.pointInfo[dataIndex].lineColor !== undefined
						) {
							lineColor = true;
						}
						if (!lineChart &&
							serie.pointInfo[dataIndex] &&
							serie.pointInfo[dataIndex].lineStyle !== undefined
						) {
							lineStyle = true;
						}
						if (lineChart &&
							serie.pointInfo[dataIndex] &&
							serie.pointInfo[dataIndex].lineMarker !== undefined
						) {
							lineMarker = true;
						}
						if (!lineChart &&
							serie.pointInfo[dataIndex] &&
							serie.pointInfo[dataIndex].lineWidth !== undefined
						) {
							lineWidth = true;
						}
						if (lineChart &&
							serie.pointInfo[dataIndex] &&
							serie.pointInfo[dataIndex].markerLineColor !== undefined
						) {
							lineMarkerColor = true;
						}
						if (lineChart &&
							serie.pointInfo[dataIndex] &&
							serie.pointInfo[dataIndex].markerFillColor !== undefined
						) {
							fillMarkerColor = true;
						}
						if (lineChart &&
							serie.pointInfo[dataIndex] &&
							serie.pointInfo[dataIndex].lineMarkerSize !== undefined
						) {
							lineMarkerSize = true;
						}
					});

					if (fillColor) {
						if (!(set.backgroundColor instanceof Array)) {
							const color = set.backgroundColor;
							set.backgroundColor = [];
							set.data.forEach(() => {
								set.backgroundColor.push(color);
							});
						}
						set.data.forEach((dataValue, dataIndex) => {
							if (serie.pointInfo[dataIndex] && serie.pointInfo[dataIndex].fillColor) {
								set.backgroundColor[dataIndex] = serie.pointInfo[dataIndex].fillColor;
							}
						});
					}
					if (lineColor) {
						if (!(set.borderColor instanceof Array)) {
							const color = set.borderColor;
							set.borderColor = [];
							set.data.forEach(() => {
								set.borderColor.push(color);
							});
						}
						set.data.forEach((dataValue, dataIndex) => {
							if (serie.pointInfo[dataIndex] && serie.pointInfo[dataIndex].lineColor) {
								set.borderColor[dataIndex] = serie.pointInfo[dataIndex].lineColor;
							}
						});
					}
					if (lineWidth) {
						if (!(set.borderWidth instanceof Array)) {
							const color = set.borderWidth;
							set.borderWidth = [];
							set.data.forEach(() => {
								set.borderWidth.push(color);
							});
						}
						set.data.forEach((dataValue, dataIndex) => {
							if (serie.pointInfo[dataIndex] && serie.pointInfo[dataIndex].lineWidth !== undefined) {
								set.borderWidth[dataIndex] = serie.pointInfo[dataIndex].lineWidth;
							}
						});
					}
					if (lineStyle) {
						let dash;
						if (!(set.borderDash instanceof Array)) {
							dash = this.getDashPattern(serie.lineStyle, serie.lineWidth);
							set.borderDash = [];
							set.data.forEach(() => {
								set.borderDash.push(dash);
							});
						}
						set.data.forEach((dataValue, dataIndex) => {
							if (serie.pointInfo[dataIndex] && serie.pointInfo[dataIndex].lineStyle !== undefined) {
								dash = this.getDashPattern(serie.pointInfo[dataIndex].lineStyle, serie.lineWidth);
								set.borderDash[dataIndex] = dash;
							}
						});
					}
					if (fillMarkerColor) {
						if (!(set.pointBackgroundColor instanceof Array)) {
							const color = set.pointBackgroundColor;
							set.pointBackgroundColor = [];
							set.data.forEach(() => {
								set.pointBackgroundColor.push(color);
							});
						}
						set.data.forEach((dataValue, dataIndex) => {
							if (serie.pointInfo[dataIndex] && serie.pointInfo[dataIndex].markerFillColor) {
								set.pointBackgroundColor[dataIndex] = serie.pointInfo[dataIndex].markerFillColor;
							}
						});
					}
					if (lineMarkerColor) {
						if (!(set.pointBorderColor instanceof Array)) {
							const color = set.pointBorderColor;
							set.pointBorderColor = [];
							set.data.forEach(() => {
								set.pointBorderColor.push(color);
							});
						}
						set.data.forEach((dataValue, dataIndex) => {
							if (serie.pointInfo[dataIndex] && serie.pointInfo[dataIndex].markerLineColor) {
								set.pointBorderColor[dataIndex] = serie.pointInfo[dataIndex].markerLineColor;
							}
						});
					}
					if (lineMarker) {
						if (!(set.pointStyle instanceof Array)) {
							const color = set.pointStyle;
							const radius = set.pointRadius;
							set.pointStyle = [];
							set.pointRadius = [];
							set.data.forEach(() => {
								set.pointStyle.push(color);
								set.pointRadius.push(radius);
							});
						}
						set.data.forEach((dataValue, dataIndex) => {
							if (serie.pointInfo[dataIndex] && serie.pointInfo[dataIndex].lineMarker !== undefined) {
								set.pointStyle[dataIndex] = serie.pointInfo[dataIndex].lineMarker;
								set.pointRadius[dataIndex] = set.pointStyle[dataIndex] === 'none' ? 0 : 4;
							}
						});
					}
					if (lineMarkerSize) {
						if (!(set.pointRadius instanceof Array)) {
							const radius = set.pointRadius;
							set.pointRadius = [];
							set.data.forEach(() => {
								set.pointRadius.push(radius);
							});
						}
						set.data.forEach((dataValue, dataIndex) => {
							if (serie.pointInfo[dataIndex] &&
								serie.pointInfo[dataIndex].lineMarkerSize !== undefined) {
								set.pointRadius[dataIndex] = serie.pointInfo[dataIndex].lineMarkerSize;
							}
						});
					}
				}
			});

			chartDef.data.datasets = datasets;

			const assignFont = (target, source) => {
				target.fontFamily = source.fontName;
				target.fontSize =
					(Number(source.fontSize) / 72) * JSG.dpi.x * graphics.getCoordinateSystem().getDeviceRatio();
				target.fontColor = source.color;
				if (source.bold && source.italic) {
					target.fontStyle = 'bold italic';
				} else if (source.bold) {
					target.fontStyle = 'bold';
				} else if (source.italic) {
					target.fontStyle = 'italic';
				} else {
					target.fontStyle = 'normal';
				}
			};

			if (item.title.title !== '') {
				chartDef.options.title = {};
				chartDef.options.title.display = true;
				chartDef.options.title.text = getValue(range.getSheet(), item.title.title);
				chartDef.options.layout.padding.top = graphics.getCoordinateSystem().logToDeviceXNoZoom(50);
				if (item.title.font) {
					assignFont(chartDef.options.title, item.title.font);
				}
			}

			if (item.legend) {
				chartDef.options.legend.display = item.legend.position !== 'none';
				chartDef.options.legend.position = item.legend.position;
				if (item.legend.font) {
					assignFont(chartDef.options.legend.labels, item.legend.font);
				}
			}

			switch (chartType) {
				case 'pie':
				case 'doughnut':
					chartDef.options.legend.display = categoryLabels;
					break;
				case 'radar':
				case 'polarArea':
					chartDef.options.legend.display = seriesLabels;

					chartDef.options.scale = JSON.parse(JSON.stringify(item.scales.yAxes[0]));
					chartDef.options.scale.position = 'chartArea';
					chartDef.options.scale.ticks.beginAtZero = true;
					delete chartDef.options.scale.type;
					delete chartDef.options.scale.id;
					break;
				default:
					chartDef.options.legend.display = seriesLabels;
					chartDef.options.scales = {};
					item.scales.xAxes[0].stacked = item.data.stacked;
					item.scales.yAxes[0].stacked = item.data.stacked;

					chartDef.options.scales = JSON.parse(JSON.stringify(item.scales));

					this.setFontSizeDeep(chartDef.options.scales, graphics);
					break;
			}

			// todo for all axes and value
			if (chartDef.options.scales && chartDef.options.scales.xAxes) {
				chartDef.options.scales.xAxes.forEach((axis) => {
					if (axis.scaleLabel && axis.scaleLabel.labelString) {
						axis.scaleLabel.labelString = getValue(range.getSheet(), axis.scaleLabel.labelString);
					}
					axis._min = undefined;
					axis._max = undefined;
					datasets.forEach((set, index) => {
						if (set.xAxisID === undefined || axis.id === set.xAxisID) {
							set.data.forEach((value, vindex) => {
								const xValue = value.y === undefined ? value : value.x;
								if (axis._min === undefined) {
									axis._min = xValue;
									axis._max = xValue;
								} else {
									axis._min = Math.min(axis._min, xValue);
									axis._max = Math.max(axis._max, xValue);
								}
								if (allValues && (chartType === 'scatter' || chartType === 'scatterLine')) {
									if (value.x) {
										set.data[vindex].x = this.excelDateToJSDate(value.x);
									} else {
										set.data[vindex] = this.excelDateToJSDate(value);
									}
								}
							});
						}
					});
					if (axis._min && axis._max) {
						axis.ticks.beginAtZero = axis._max - axis._min > axis._max * 0.15;
					}
					if (allValues && (chartType === 'scatter' || chartType === 'scatterLine')) {
						axis.type = 'time';
						axis.bounds = 'data';
						axis.ticks.autoSkip = true;
						axis.time = {
							unit: 'second',
							displayFormats: {
								millisecond: 'H:mm:ss.SSS',
								second: 'H:mm:ss',
								minute: 'H:mm'
							}
						};
					}
					// axis.time.min = axis._min;
					// axis.time.max = axis._max;
					axis.ticks.callback = this.tickLabelFormatter;
					axis.ticks._numberFormat = this._numberFormatX;
					axis.ticks._localCulture = this._localCultureX;
				});
				chartDef.options.scales.yAxes.forEach((axis) => {
					if (axis.scaleLabel && axis.scaleLabel.labelString) {
						axis.scaleLabel.labelString = getValue(range.getSheet(), axis.scaleLabel.labelString);
					}
					axis._min = undefined;
					axis._max = undefined;
					datasets.forEach((set, index) => {
						if (set.yAxisID === undefined || axis.id === set.yAxisID) {
							set.data.forEach((value, vindex) => {
								const yValue = value.y === undefined ? value : value.y;
								if (axis._min === undefined) {
									axis._min = yValue;
									axis._max = yValue;
								} else {
									axis._min = Math.min(axis._min, yValue);
									axis._max = Math.max(axis._max, yValue);
								}
							});
						}
					});
					if (axis._min && axis._max) {
						axis.ticks.beginAtZero = axis._max - axis._min > axis._max * 0.15;
					}
					axis.ticks.callback = this.tickLabelFormatter;
					axis.ticks._numberFormat = this._numberFormat;
					axis.ticks._localCulture = this._localCulture;
				});
			}

			const myChart = new Chart(chartCanvas, chartDef);

			myChart.resize();
			myChart.render({
				duration: 0,
				lazy: false,
				easing: 'easeOutBounce'
			});

			graphics.drawImage(chartCanvas, rect.x, rect.y, rect.width, rect.height);

			if (myChart.scales.scale) {
				item.scales.yAxes[0].type = 'linear';
			} else {
				Object.entries(myChart.scales).forEach(([key, value]) => {
					if (value.options) {
						const axis = item.getAxisByName(key);
						if (axis) {
							axis.type = value.options.type ? value.options.type : 'linear';
							axis.position = value.options.position;
						}
					}
				});
			}

			myChart.destroy();
		} catch (e) {
			drawError('Error in Chart definition');
		}
		chartDiv.style.display = 'none';
	}

	static formatNumber(value, numberFormat, localCulture) {
		// somehow the scale value sometimes do not show correct values
		value = MathUtils.roundTo(value, 12);
		if (numberFormat && numberFormat !== 'General' && localCulture) {
			let formattingResult = {
				value,
				formattedValue: value,
				color: undefined,
				type: 'general'
			};
			const type = localCulture.split(';');
			try {
				formattingResult = NumberFormatter.formatNumber(numberFormat, formattingResult.value, type[0]);
			} catch (e) {
				formattingResult.formattedValue = '#####';
			}

			return formattingResult.formattedValue;
		}
		return String(value);
	}

	tickLabelFormatter(value, index, values) {
		// no this for time axis!!
		if (
			this &&
			Numbers.isNumber(value) &&
			this.options &&
			/* this.options.type !== 'category' && */ this.options.ticks
		) {
			return ChartView.formatNumber(value, this.options.ticks._numberFormat, this.options.ticks._localCulture);
		}
		return value;
	}

	dataLabelFormatter(value, context) {
		// no this for time axis!!
		const { dataset } = context;

		if (Numbers.isNumber(value)) {
			return ChartView.formatNumber(value, dataset._numberFormat, dataset._localCulture);
		} else if (Numbers.isNumber(value.x)) {
			let result = ChartView.formatNumber(value.x, dataset._numberFormatX, dataset._localCultureX);
			if (Numbers.isNumber(value.y)) {
				result += `, ${ChartView.formatNumber(value.y, dataset._numberFormat, dataset._localCulture)}`;
			}
			if (Numbers.isNumber(value.r)) {
				result += `, ${ChartView.formatNumber(value.r, dataset._numberFormat, dataset._localCulture)}`;
			}
			return result;
		} else if (value.x instanceof Date) {
			if (Numbers.isNumber(value.y)) {
				return `${ChartView.formatNumber(value.y, dataset._numberFormat, dataset._localCulture)}`;
			}
			return '';
		}

		return value;
	}

	doHandleEventAt(location, event) {
		if (
			this.getItem()
				.getItemAttributes()
				.getSelected().getValue()
		) {
			if (event.type === MouseEvent.MouseEventType.DBLCLK) {
				NotificationCenter.getInstance().send(
					new Notification(JSG.GRAPH_DOUBLE_CLICK_NOTIFICATION, {
						event
					})
				);
				return true;
			}
		}
		return false;
	}
}
