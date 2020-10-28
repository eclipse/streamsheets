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
	Numbers,
	Point,
	MathUtils,
	GraphUtils,
	Rectangle,
	TextFormatAttributes,
	ChartRect,
	FormatAttributes
} from '@cedalo/jsg-core';

import View from '../../ui/View';
import SelectionStyle from '../view/selection/SelectionStyle';

/**
 * This class is used to visualize feedback during cell drag operations.
 *
 * @class CellFeedbackView
 * @extends View
 * @constructor
 */
export default class ChartSelectionFeedbackView extends View {
	constructor(chartView) {
		super();

		this.chartView = chartView;
	}

	draw(graphics) {
		const point = new Point(0, 0);
		const rect = new Rectangle();
		const drawMarkers = (left, top, right, bottom) => {
			rect.set(left - 50, top - 50, 100, 100);
			graphics.drawMarker(rect, false);
			rect.set(right - 50, top - 50, 100, 100);
			graphics.drawMarker(rect, false);
			rect.set(left - 50, bottom - 50, 100, 100);
			graphics.drawMarker(rect, false);
			rect.set(right - 50, bottom - 50, 100, 100);
			graphics.drawMarker(rect, false);
		};
		const drawMarkerRect = (sel) => {
			drawMarkers(sel.left, sel.top, sel.right, sel.bottom);
		};

		let angle = 0; // this.chartView.getItem().getAngle().getValue();
		GraphUtils.traverseUp(this.chartView, this._graphView, (v) => {
			v.translateToParent(point);
			if (v.getItem) {
				angle += v
					.getItem()
					.getAngle()
					.getValue();
			}
			return true;
		});

		const selection = this.chartView.chartSelection;
		const item = this.chartView.getItem();
		const data = item.getDataFromSelection(selection);
		const plotRect = item.plot.position;
		if (!data) {
			return;
		}

		graphics.save();
		graphics.translate(point.x, point.y);
		graphics.rotate(angle);
		// graphics.beginPath();
		// graphics.rect(plotRect.left, plotRect.top, plotRect.width, plotRect.height);
		// graphics.clip();

		graphics.setFillColor(SelectionStyle.MARKER_FILL_COLOR);
		graphics.setLineColor(SelectionStyle.MARKER_BORDER_COLOR);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);

		switch (selection.element) {
			case 'downbars':
			case 'upbars':
			case 'hilolines':
				{
					let index = 0;
					const value = {};
					const serie = item.getFirstSerieOfType('line');
					if (!serie) {
						return;
					}
					const indices = item.getFirstLastSerieIndicesOfType('line');
					if (indices.first === undefined || indices.last === undefined) {
						return;
					}

					const axes = item.getAxes(serie);
					const ref = item.getDataSourceInfo(serie.formula);
					if (!ref || !axes) {
						return;
					}

					const ptLow = { x: 0, y: 0 };
					const ptHigh = { x: 0, y: 0 };
					const info = {
						serie,
						seriesIndex: 0,
						categories: axes.y.categories
					};
					let tmp;
					let x;
					const barWidth = item.getUpDownBarWidth(axes, plotRect);

					while (item.getValue(ref, index, value)) {
						info.index = index;
						if (value.x !== undefined && value.y !== undefined) {
							x = item.scaleToAxis(axes.x, value.x, undefined, false);
							ptLow.y = undefined;
							ptHigh.y = undefined;
							ptLow.x = x;
							ptHigh.x = ptLow.x;

							switch (selection.element) {
								case 'downbars':
								case 'upbars':
									if (axes.y.categories[index].values[indices.first] !== undefined) {
										tmp = axes.y.categories[info.index].values[indices.first].y;
										if (Numbers.isNumber(tmp)) {
											ptLow.y = tmp;
										}
									}
									if (axes.y.categories[index].values[indices.last] !== undefined) {
										tmp = axes.y.categories[info.index].values[indices.last].y;
										if (Numbers.isNumber(tmp)) {
											ptHigh.y = tmp;
										}
									}
									if (ptLow.y !== undefined && ptHigh.y !== undefined) {
										ptLow.y = item.scaleToAxis(axes.y, ptLow.y, info, false);
										ptHigh.y = item.scaleToAxis(axes.y, ptHigh.y, info, false);
										item.toPlot(serie, plotRect, ptLow);
										item.toPlot(serie, plotRect, ptHigh);
										if (
											(ptLow.y > ptHigh.y && selection.element === 'upbars') ||
											(ptLow.y < ptHigh.y && selection.element === 'downbars')
										) {
											rect.set(ptLow.x - barWidth / 2 - 50, ptLow.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
											rect.set(ptLow.x + barWidth / 2 - 50, ptLow.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
											rect.set(ptHigh.x - barWidth / 2 - 50, ptHigh.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
											rect.set(ptHigh.x + barWidth / 2 - 50, ptHigh.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
										}
									}
									break;
								case 'hilolines': {
									for (let i = 0; i < item.series.length; i += 1) {
										if (
											item.series[i].type === 'line' &&
											axes.y.categories[index].values[i] !== undefined
										) {
											tmp = axes.y.categories[info.index].values[i].y;
											if (Numbers.isNumber(tmp)) {
												ptLow.y = ptLow.y === undefined ? tmp : Math.min(ptLow.y, tmp);
												ptHigh.y = ptHigh.y === undefined ? tmp : Math.max(ptHigh.y, tmp);
											}
										}
									}
									if (ptLow.y !== undefined && ptHigh.y !== undefined) {
										ptLow.y = item.scaleToAxis(axes.y, ptLow.y, info, false);
										ptHigh.y = item.scaleToAxis(axes.y, ptHigh.y, info, false);
										item.toPlot(serie, plotRect, ptLow);
										item.toPlot(serie, plotRect, ptHigh);
										rect.set(ptLow.x - 50, ptLow.y - 50, 100, 100);
										graphics.drawMarker(rect, false);
										rect.set(ptHigh.x - 50, ptHigh.y - 50, 100, 100);
										graphics.drawMarker(rect, false);
									}
									break;
								}
							}
						}
						index += 1;
					}
				}
				break;
			case 'xAxisGrid':
			case 'yAxisGrid':
				{
					const axis = selection.data;
					if (!axis.position || !axis.scale || !axis.gridVisible) {
						break;
					}

					let pos;
					const ref = item.getDataSourceInfoAxis(axis);
					let current = item.getAxisStart(ref, axis);
					const final = item.getAxisEnd(axis);

					while (current.value <= final) {
						if (axis.type === 'category' && current.value > axis.scale.max) {
							break;
						}
						pos = item.scaleToAxis(axis, current.value, undefined, true);

						switch (axis.align) {
							case 'left':
							case 'right':
								pos = plotRect.bottom - pos * plotRect.height;
								rect.set(plotRect.left, pos - 100, plotRect.right, pos + 100);
								rect.set(plotRect.left - 50, pos - 50, 100, 100);
								graphics.drawMarker(rect, false);
								rect.set(plotRect.right - 50, pos - 50, 100, 100);
								graphics.drawMarker(rect, false);
								break;
							case 'top':
							case 'bottom':
								pos = plotRect.left + pos * plotRect.width;
								rect.set(pos - 50, plotRect.top - 50, 100, 100);
								graphics.drawMarker(rect, false);
								rect.set(pos - 50, plotRect.bottom - 50, 100, 100);
								graphics.drawMarker(rect, false);
								break;
						}

						current = item.incrementScale(ref, axis, current);
					}
				}
				break;
			case 'serieslabel':
				{
					const ref = item.getDataSourceInfo(data.formula);
					if (ref) {
						const axes = item.getAxes(data);
						let index = 0;
						let valueSum = 0;
						const value = {};
						const points = [];
						const prevPoints = [];
						const pt = { x: 0, y: 0 };
						const serie = data;
						const info = {
							serie,
							seriesIndex: selection.index,
							categories: axes.y.categories
						};
						const barWidth = item.getBarWidth(axes, data, plotRect);
						const pieInfo = item.isCircular()
							? item.getPieInfo(ref, serie, plotRect, selection.index)
							: undefined;
						const gaugeInfo = item.isGauge() ? item.getGaugeInfo(plotRect) : undefined;
						const legendData = item.getLegend();
						const params = {
							graphics,
							serie,
							info,
							ref,
							axes,
							plotRect,
							barWidth,
							seriesIndex: selection.index,
							points,
							lastPoints: prevPoints,
							pieInfo,
							gaugeInfo,
							currentAngle: pieInfo ? pieInfo.startAngle : 0,
							valueSum: 0,
						};
						const labelAngle =
							serie.dataLabel.format.fontRotation === undefined
								? 0
								: MathUtils.toRadians(-serie.dataLabel.format.fontRotation);

						item.setFont(
							graphics,
							serie.dataLabel.format,
							'serieslabel',
							'middle',
							TextFormatAttributes.TextAlignment.CENTER
						);
						graphics.setFillColor(SelectionStyle.MARKER_FILL_COLOR);

						if (serie.type === 'boxplot') {
							if (item.hasDataPointLabel(serie, index)) {
								// collect values for each category
								const values = item.getBoxPlotValues(ref, axes);
								const drawMarkersAtValue = (val, x, lbarWidth) => {
									const ptl = {x, y: item.scaleToAxis(axes.y, val.y, info, false)};
									item.toPlot(serie, plotRect, ptl);
									if (ptl.x >= plotRect.left && ptl.x <= plotRect.right) {
										const text = item.getDataLabel(val, axes.x, ref, serie, legendData);
										params.boxBarWidth = lbarWidth;
										const drawRect = item.getLabelRect(ptl, val, text, index, params);
										if (drawRect) {
											let markerPt = new Point(drawRect.left, drawRect.top);
											markerPt = labelAngle
												? MathUtils.getRotatedPoint(markerPt, drawRect.center, -labelAngle)
												: markerPt;
											rect.set(markerPt.x - 50, markerPt.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
											markerPt.set(drawRect.left, drawRect.bottom);
											markerPt = labelAngle
												? MathUtils.getRotatedPoint(markerPt, drawRect.center, -labelAngle)
												: markerPt;
											rect.set(markerPt.x - 50, markerPt.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
											markerPt.set(drawRect.right, drawRect.top);
											markerPt = labelAngle
												? MathUtils.getRotatedPoint(markerPt, drawRect.center, -labelAngle)
												: markerPt;
											rect.set(markerPt.x - 50, markerPt.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
											markerPt.set(drawRect.right, drawRect.bottom);
											markerPt = labelAngle
												? MathUtils.getRotatedPoint(markerPt, drawRect.center, -labelAngle)
												: markerPt;
											rect.set(markerPt.x - 50, markerPt.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
										}
									}
								};

								Object.entries(values).forEach(([key, valueSet]) => {
									const {median, q1, q3, minIndex, maxIndex, average} = item.getBoxPlotFigures(valueSet);
									const x = item.scaleToAxis(axes.x, valueSet[0].x, undefined, false);
									const tmpVal = {x : valueSet[0].x, xLabel: valueSet[0].xLabel, y: q1, formatY: valueSet[0].formatY};

									drawMarkersAtValue(tmpVal, x, barWidth);
									tmpVal.y = median;
									drawMarkersAtValue(tmpVal, x, barWidth);
									tmpVal.y = q3;
									drawMarkersAtValue(tmpVal, x, barWidth);
									if (valueSet.length > 3) {
										// draw at whiskers
										drawMarkersAtValue(valueSet[minIndex], x, barWidth / 3);
										drawMarkersAtValue(valueSet[maxIndex], x, barWidth / 3);
									}
									if (serie.average) {
										tmpVal.y = average;
										drawMarkersAtValue(tmpVal, x, barWidth);
									}
									if (valueSet.length > 3) {
										valueSet.forEach((val, valIndex) => {
											if (valIndex !== maxIndex && valIndex !== minIndex) {
												if ((valIndex > minIndex && valIndex < maxIndex && serie.innerPoints) ||
													(valIndex < minIndex || valIndex > maxIndex && serie.outerPoints)) {
													drawMarkersAtValue(val, x, 250);
												}
											}
										});
									}
								});
							}
						} else {
							while (item.getValue(ref, index, value)) {
								info.index = index;
								if (value.x !== undefined && value.y !== undefined) {
									const y = value.y;
									pt.x = item.scaleToAxis(axes.x, value.x, undefined, false);
									if (serie.type === 'waterfall') {
										if (serie.autoSum && index) {
											const lastVal = {x: 0, y: 0};
											item.getValue(ref, index - 1, lastVal);
											value.y = value.y - (lastVal.y === undefined ? 0 : lastVal.y);
										}
										if (serie.points[index] && serie.points[index].pointSum) {
											valueSum = value.y;
										} else {
											valueSum += value.y;
										}
										pt.y = item.scaleToAxis(axes.y, valueSum, info, false);
									} else {
										pt.y = item.scaleToAxis(axes.y, value.y, info, false);
									}
									item.toPlot(serie, plotRect, pt);
									if (
										pt.x + 1 >= plotRect.left &&
										pt.x - 1 <= plotRect.right &&
										pt.y + 1 >= plotRect.top &&
										pt.y - 1 <= plotRect.bottom
									) {
										const text = item.getDataLabel(value, axes.x, ref, serie, legendData);
										value.y = y;
										const drawRect = item.getLabelRect(pt, value, text, index, params);
										if (item.hasDataPointLabel(serie, index) && drawRect) {
											let markerPt = new Point(drawRect.left, drawRect.top);
											markerPt = labelAngle
												? MathUtils.getRotatedPoint(markerPt, drawRect.center, -labelAngle)
												: markerPt;
											rect.set(markerPt.x - 50, markerPt.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
											markerPt.set(drawRect.left, drawRect.bottom);
											markerPt = labelAngle
												? MathUtils.getRotatedPoint(markerPt, drawRect.center, -labelAngle)
												: markerPt;
											rect.set(markerPt.x - 50, markerPt.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
											markerPt.set(drawRect.right, drawRect.top);
											markerPt = labelAngle
												? MathUtils.getRotatedPoint(markerPt, drawRect.center, -labelAngle)
												: markerPt;
											rect.set(markerPt.x - 50, markerPt.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
											markerPt.set(drawRect.right, drawRect.bottom);
											markerPt = labelAngle
												? MathUtils.getRotatedPoint(markerPt, drawRect.center, -labelAngle)
												: markerPt;
											rect.set(markerPt.x - 50, markerPt.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
										}
									}
								}
								index += 1;
							}
						}
					}
				}
				break;
			case 'point':
			case 'series': {
				const ref = item.getDataSourceInfo(data.formula);
				if (ref) {
					const axes = item.getAxes(data);
					let index = 0;
					let x;
					let y;
					let last;
					let valueSum = 0;
					const value = {};
					const serie = data;
					let barInfo;
					const info = {
						serie,
						seriesIndex: selection.index,
						categories: axes.y.categories
					};

					if (serie.type === 'boxplot') {
						const barWidth = item.getBarWidth(axes, serie, plotRect);
						// collect values for each category
						const values = item.getBoxPlotValues(ref, axes);

						Object.entries(values).forEach(([key, valueSet]) => {
							const {median, q1, q3, minIndex, maxIndex } = item.getBoxPlotFigures(valueSet);
							barInfo = item.getBarInfo(axes, serie, selection.index, valueSet[0].x, q3 - q1, barWidth);

							x = item.scaleToAxis(axes.x, valueSet[0].x, undefined, false);
							x = plotRect.left + x * plotRect.width;
							// const x = pt.x;
							y = item.scaleToAxis(axes.y, q3, info, false);
							y = plotRect.bottom - y * plotRect.height;

							drawMarkers(x + barInfo.offset,
								y,
								x + barInfo.offset + barWidth - barInfo.margin,
								y - barInfo.height * plotRect.height);

							if (valueSet.length > 3) {
								y = item.scaleToAxis(axes.y, valueSet[minIndex].y, info, false);
								y = plotRect.bottom - y * plotRect.height;
								let y2 = item.scaleToAxis(axes.y, valueSet[maxIndex].y, info, false);
								y2 = plotRect.bottom - y2 * plotRect.height;

								drawMarkers(x + barInfo.offset + (barWidth - barInfo.margin) / 3,
									y,
									x + barInfo.offset + (barWidth - barInfo.margin) * 2 / 3,
									y2
								);
							}
						});
					} else {
						const pieInfo = item.isCircular()
							? item.getPieInfo(ref, serie, plotRect, selection.index)
							: undefined;
						let currentAngle = pieInfo ? pieInfo.startAngle : 0;

						while (item.getValue(ref, index, value)) {
							info.index = index;
							switch (serie.type) {
								case 'doughnut': {
									const pieAngle =
										(Math.abs(value.y) / pieInfo.sum) * (pieInfo.endAngle - pieInfo.startAngle);
									if (selection.element === 'series' || index === selection.pointIndex) {
										const points = item.getEllipseSegmentPoints(
											pieInfo.xc,
											pieInfo.yc,
											pieInfo.xInnerRadius,
											pieInfo.yInnerRadius,
											pieInfo.xOuterRadius,
											pieInfo.yOuterRadius,
											0,
											currentAngle,
											currentAngle + pieAngle,
											2
										);
										points.forEach((pt) => {
											rect.set(pt.x - 50, pt.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
										});
									}
									currentAngle += pieAngle;
									break;
								}
								case 'pie': {
									const pieAngle =
										(Math.abs(value.y) / pieInfo.sum) * (pieInfo.endAngle - pieInfo.startAngle);
									if (selection.element === 'series' || index === selection.pointIndex) {
										const points = item.getEllipseSegmentPoints(
											pieInfo.xc,
											pieInfo.yc,
											0,
											0,
											pieInfo.xRadius,
											pieInfo.yRadius,
											0,
											currentAngle,
											currentAngle + pieAngle,
											2
										);
										points.forEach((pt) => {
											rect.set(pt.x - 50, pt.y - 50, 100, 100);
											graphics.drawMarker(rect, false);
										});
									}
									currentAngle += pieAngle;
									break;
								}
								case 'bar':
								case 'profile':
								case 'funnelbar':
									if (selection.element === 'series' || index === selection.pointIndex) {
										x =
											plotRect.bottom -
											item.scaleToAxis(axes.x, value.x, undefined, false) * plotRect.height;
										y = plotRect.left + item.scaleToAxis(axes.y, value.y, info, false) * plotRect.width;
										if (
											y + 1 >= plotRect.left &&
											y - 1 <= plotRect.right &&
											x + 1 >= plotRect.top &&
											x - 1 <= plotRect.bottom
										) {
											const barWidth = item.getBarWidth(axes, data, plotRect);
											switch (serie.type) {
												case 'bar':
													barInfo = item.getBarInfo(
														axes,
														serie,
														selection.index,
														index,
														value.y,
														barWidth
													);

													drawMarkers(y,
														x + barInfo.offset,
														y + barInfo.height * plotRect.width,
														x + barInfo.offset + (barWidth - barInfo.margin) * 2 / 3
													);

													break;
												case 'funnelbar': {
													barInfo = item.getBarInfo(
														axes,
														serie,
														selection.index,
														index,
														value.y,
														barWidth
													);
													const height = Math.abs(barInfo.height * plotRect.width);
													rect.set(
														plotRect.centerX - height / 2 - 50,
														x + barInfo.offset - 50,
														100,
														100
													);
													graphics.drawMarker(rect, false);
													rect.set(
														plotRect.centerX + height / 2 - 50,
														x + barInfo.offset - 50,
														100,
														100
													);
													graphics.drawMarker(rect, false);
													if (index === axes.x.scale.max - 1 || !item.chart.seriesLines.visible) {
														rect.set(
															plotRect.centerX - height / 2 - 50,
															x + barInfo.offset + barWidth - barInfo.margin + 50,
															100,
															100
														);
														graphics.drawMarker(rect, false);
														rect.set(
															plotRect.centerX + height / 2 - 50,
															x + barInfo.offset + barWidth - barInfo.margin + 50,
															100,
															100
														);
														graphics.drawMarker(rect, false);
													}
													break;
												}
												default:
													rect.set(y - 50, x - 50, 100, 100);
													graphics.drawMarker(rect, false);
													break;
											}
										}
									}
									break;
								default:
									if (serie.autoSum && index) {
										const lastVal = {x: 0, y: 0};
										item.getValue(ref, index - 1, lastVal);
										value.y = value.y - (lastVal.y === undefined ? 0 : lastVal.y);
									}
									if (serie.points[index] && serie.points[index].pointSum) {
										valueSum = value.y;
									} else {
										valueSum += value.y;
									}
									if (selection.element === 'series' || index === selection.pointIndex) {
										x =
											plotRect.left +
											item.scaleToAxis(axes.x, value.x, undefined, false) * plotRect.width;
										if (serie.type === 'waterfall') {
											y = item.scaleToAxis(axes.y, valueSum, info, false);
										} else {
											y = item.scaleToAxis(axes.y, value.y, info, false);
										}
										y = plotRect.bottom - y * plotRect.height;
										if (
											x + 1 >= plotRect.left &&
											x - 1 <= plotRect.right &&
											y + 1 >= plotRect.top &&
											y - 1 <= plotRect.bottom
										) {
											const barWidth = item.getBarWidth(axes, data, plotRect);
											switch (serie.type) {
												case 'column':
												case 'waterfall':
													barInfo = item.getBarInfo(
														axes,
														serie,
														selection.index,
														index,
														value.y,
														barWidth
													);

													drawMarkers(
														x + barInfo.offset,
														y,
														x + barInfo.offset + barWidth - barInfo.margin,
														y - barInfo.height * plotRect.height
													);
													break;
												case 'funnelcolumn': {
													barInfo = item.getBarInfo(
														axes,
														serie,
														selection.index,
														index,
														value.y,
														barWidth
													);
													const height = Math.abs(barInfo.height * plotRect.height);
													rect.set(
														x + barInfo.offset - 50,
														plotRect.centerY - height / 2 - 50,
														100,
														100
													);
													graphics.drawMarker(rect, false);
													rect.set(
														x + barInfo.offset - 50,
														plotRect.centerY + height / 2 - 50,
														100,
														100
													);
													graphics.drawMarker(rect, false);
													if (index === axes.x.scale.max - 1 || !item.chart.seriesLines.visible) {
														rect.set(
															x + barInfo.offset + barWidth - barInfo.margin + 50,
															plotRect.centerY - height / 2 - 50,
															100,
															100
														);
														graphics.drawMarker(rect, false);
														rect.set(
															x + barInfo.offset + barWidth - barInfo.margin + 50,
															plotRect.centerY + height / 2 - 50,
															100,
															100
														);
														graphics.drawMarker(rect, false);
													}
													break;
												}
												case 'state':
													barInfo = item.getBarInfo(
														axes,
														serie,
														selection.index,
														index,
														value.y,
														barWidth
													);
													if (item.chart.period) {
														const ptNext = {x: 0, y: 0};
														item.getPlotPoint(axes, ref, info, value, index, 1, ptNext);

														drawMarkers(
															x + barInfo.offset,
															y,
															plotRect.left + ptNext.x * plotRect.width + barInfo.offset,
															y - barInfo.height * plotRect.height
														);
													} else {
														drawMarkers(
															x + barInfo.offset,
															y,
															x + barInfo.offset + barWidth - barInfo.margin,
															y - barInfo.height * plotRect.height
														);
													}
													break;
												case 'area':
													barInfo = item.getBarInfo(
														axes,
														serie,
														selection.index,
														index,
														value.y,
														barWidth
													);
													if (item.chart.step) {
														if (index < axes.x.scale.max && item.getValue(ref, index + 1, value)) {
															const xNext =
																plotRect.left +
																item.scaleToAxis(axes.x, value.x, undefined, false) *
																plotRect.width;
															rect.set(xNext - 50, y - 50, 100, 100);
															graphics.drawMarker(rect, false);
															rect.set(
																xNext - 50,
																y - barInfo.height * plotRect.height - 50,
																100,
																100
															);
															graphics.drawMarker(rect, false);
														}
													}
													if (!item.chart.step || index < axes.x.scale.max) {
														rect.set(x - 50, y - 50, 100, 100);
														graphics.drawMarker(rect, false);
														rect.set(x - 50, y - barInfo.height * plotRect.height - 50, 100, 100);
														graphics.drawMarker(rect, false);
													}
													break;
												default:
													rect.set(x - 50, y - 50, 100, 100);
													graphics.drawMarker(rect, false);
													break;
											}
										}
									}
									break;
							}
							index += 1;
						}
					}
				}
				break;
			}
			case 'title':
			case 'xAxis':
			case 'xAxisTitle':
			case 'yAxis':
			case 'yAxisTitle':
			case 'plot':
			case 'legend':
				drawMarkerRect(data.position);
				break;
			default:
				break;
		}

		graphics.rotate(-angle);
		graphics.translate(-point.x, -point.y);
		graphics.restore();
	}
}
