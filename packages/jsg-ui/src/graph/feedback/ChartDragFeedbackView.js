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
	Point,
	Rectangle,
	GraphUtils,
	FormatAttributes,
	TextFormatAttributes,
	Selection,
	CellRange, default as JSG
} from '@cedalo/jsg-core';

import View from '../../ui/View';
import SelectionStyle from '../view/selection/SelectionStyle';
import {createView} from "@cedalo/jsg-extensions/ui";

export default class ChartDragFeedbackView extends View {
	constructor(chartView, point, viewer) {
		super();

		this.chartView = chartView;
		this.point = point;
		this.viewer = viewer;
	}

	drawButton(graphics, text, size, index, columns, buttons, mousePoint) {
		const rect = new Rectangle(size.x / 2 - columns * 3000 / 2, size.y / 2 - (buttons / 2 - index) * 800, 3000, 800);

		graphics.setLineColor(JSG.theme.listborder);
		if (rect.containsPoint(mousePoint)) {
			graphics.setFillColor(JSG.theme.fill);
		} else {
			graphics.setFillColor(JSG.theme.filllight);
		}

		graphics.beginPath();
		graphics.rect(rect.x + 100, rect.y + 100, rect.width - 200, rect.height - 200);
		graphics.stroke();
		graphics.fill();

		if (rect.containsPoint(mousePoint)) {
			graphics.setFillColor(JSG.theme.text);
		} else {
			graphics.setFillColor(JSG.theme.textdisabled);
		}

		graphics.fillText(text, size.x / 2 - columns * 3000 / 2 + 1500, size.y / 2 - ((buttons / 2 - index) - 0.5) * rect.height);
	}

	draw(graphics) {
		const point = new Point(0, 0);
		const mousePoint = this.point.copy();
		let angle = 0;

		GraphUtils.traverseUp(this.chartView, this.viewer.getGraphView(), (v) => {
			v.translateToParent(point);
			v.translateFromParent(mousePoint);
			if (v.getItem) {
				angle += v
					.getItem()
					.getAngle()
					.getValue();
			}
			return true;
		});

		const item = this.chartView.getItem();
		const size = item.getSizeAsPoint();
		const columns = item.chart.type === 'line' ? 2 : 1;
		const buttons = Math.min(10, 1 + item.series.length);

		graphics.translate(point.x, point.y);
		graphics.rotate(angle);

		graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.CENTER);
		graphics.setTextBaseline('middle');
		graphics.setFontSize(7);
		graphics.setFontName('Verdana');
		graphics.setFont();

		// add as new series
		this.drawButton(graphics, 'Create new series', size, 0, columns, buttons, mousePoint);

		// add as category to series
		item.series.forEach((serie, index) => {
			this.drawButton(graphics, `Add to series: ${this.getLabel(item, serie)}`, size, index + 1, columns, buttons, mousePoint);

		});

		// replace or add aggregating series

		// if parent element

		// add all as series
		// add all multiple aggregating series


		// this.draw2(graphics);

		graphics.rotate(-angle);
		graphics.translate(-point.x, -point.y);
	}

	getLabel(item, serie) {
		const ref = item.getDataSourceInfo(serie);
		if (ref && ref.yName !== undefined) {
			return ref.yName;
		}

		return String(item.series.indexOf(serie) + 1);
	}


	draw2(graphics) {
		const item = this.chartView.getItem();
		const top = new Point(item.plot.position.left, item.plot.position.top);
		const bottom = new Point(item.plot.position.left, item.plot.position.bottom);
		const left = new Point(item.plot.position.left, item.plot.position.top);
		const right = new Point(item.plot.position.right, item.plot.position.top);
		const circular = item.isCircular();
		const map = item.isMap();

		graphics.setFillColor(SelectionStyle.MARKER_FILL_COLOR);
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
		graphics.setLineColor(SelectionStyle.MARKER_BORDER_COLOR);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);

		const plotRect = item.plot.position;
		let mapInfo;
		let x;
		let y;

		if (!circular) {
			graphics.beginPath();
			if (item.xAxes[0].align === 'bottom' || item.xAxes[0].align === 'top') {
				x = top.x + item.scaleToAxis(item.xAxes[0], this.value.x, undefined, false) * plotRect.width;
				y = this.point.y;

				if (x - top.x > plotRect.width || x - top.x < 0) {
					return;
				}
				graphics.moveTo(x, top.y);
				graphics.lineTo(x, bottom.y);

				if (this.endPoint) {
					graphics.rect(this.point.x, top.y, this.endPoint.x - this.point.x, bottom.y - top.y);
				}
			} else {
				x = this.point.x;
				y = bottom.y - item.scaleToAxis(item.xAxes[0], this.value.x, undefined, false) * plotRect.height;

				if (y - top.y > plotRect.height || y - top.y < 0) {
					return;
				}
				graphics.moveTo(left.x, y);
				graphics.lineTo(right.x, y);

				if (this.endPoint) {
					graphics.moveTo(left.x, this.endPoint.y);
					graphics.lineTo(right.x, this.endPoint.y);
					graphics.rect(left.x, this.point.y, right.x - left.x, this.endPoint.y - this.point.y);
				}
			}
			if (item.xAxes[0].allowZoom) {
				graphics.stroke();
				graphics.setTransparency(30);
				graphics.fill();
				graphics.setTransparency(100);
			}
		}

		if (item.chart.tooltips && this.selection.dataPoints && this.selection.dataPoints.length) {
			let width = 0;
			const space = 400;
			const margin = 100;
			const height = 400;
			const getLabel = (value, xValue) => {
				const { serie } = value;
				const ref = item.getDataSourceInfo(serie);

				let label = '';
				let axis;
				if (circular) {
					if (xValue) {
						label = ref.yName ? `${ref.yName}` : '';
					} else {
						axis = value.axes.x;
						label = item.getLabel(ref, axis, Math.floor(value.x));
						label = `${label}: ${item.formatNumber(value.y, 'General')}`;
					}
				} else if (serie.map && map && xValue) {
					if (value.x >= 0 && value.x < serie.map.mapData.features.length) {
						const feature = serie.map.mapData.features[value.x];
						label = feature.properties[serie.map.label] || '';
					}
				} else {
					if (xValue) {
						axis = value.axes.x;
						if (axis.type === 'category' && ref) {
							label = item.getLabel(ref, axis, Math.floor(value.x));
						} else if (axis.type !== 'category' && ref && ref.time && ref.time.xvalue) {
							label = ref.xName;
							axis = value.axes.x;
							label += `: ${item.formatNumber(
								value.x,
								axis.format && axis.format.numberFormat ? axis.format : axis.scale.format
							)}`;
						} else {
							axis = value.axes.x;
							label = item.formatNumber(
								value.x,
								axis.format && axis.format.numberFormat ? axis.format : axis.scale.format
							);
						}
					} else if (serie.tooltip === 'text') {
						label = value.pureY;
					} else {
						label = item.formatNumber(value.y, 'General');
					}
					if (ref && ref.yName !== undefined && !xValue) {
						label = `${ref.yName}: ${label}`;
					} else {
						label = String(label);
					}
				}
				return label;
			};

			graphics.setTextBaseline('top');
			graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);
			graphics.setFontName('Verdana');
			graphics.setFontSize(9);
			graphics.setFont();

			const values = [];
			let pieInfo;

			if (circular) {
				const value = {};
				if (this.selection.dataPoints[0].index >= item.series.length) {
					return;
				}
				const serie = item.series[this.selection.dataPoints[0].index];
				const ref = item.getDataSourceInfo(serie);

				pieInfo = item.getPieInfo(ref, serie, plotRect, this.selection.dataPoints[0].index);
				let currentAngle = pieInfo.startAngle;
				let index = 0;
				let pieAngle = 0;
				while (item.getValue(ref, index, value) && index <= this.selection.dataPoints[0].pointIndex) {
					pieAngle = (Math.abs(value.y) / pieInfo.sum) * (pieInfo.endAngle - pieInfo.startAngle);
					currentAngle += pieAngle;
					index += 1;
				}

				const points = item.getEllipseSegmentPoints(
					pieInfo.xc,
					pieInfo.yc,
					serie.type === 'pie' ? 0 : pieInfo.xInnerRadius,
					serie.type === 'pie' ? 0 : pieInfo.yInnerRadius,
					serie.type === 'pie' ? pieInfo.xRadius : pieInfo.xOuterRadius,
					serie.type === 'pie' ? pieInfo.xRadius : pieInfo.yOuterRadius,
					pieInfo.xRadius,
					pieInfo.yRadius,
					0,
					currentAngle - pieAngle,
					currentAngle,
					2
				);
				if (points.length) {
					x = top.x - item.plot.position.left + points[1].x;
					y = top.y - item.plot.position.top + points[1].y;
				}

				if (item.getValue(ref, this.selection.dataPoints[0].pointIndex, value)) {
					value.seriesIndex = this.selection.dataPoints[0].index;
					value.index = this.selection.dataPoints[0].pointIndex;
					value.serie = serie;
					value.axes = item.getAxes(serie);
					values.push(value);
				}
			} else if (map) {
				const serie = item.series[this.selection.dataPoints[0].index];
				const value = {};
				if (!serie.map) {
					return;
				}
				const features = serie.map.mapData.features;
				const ref = item.getDataSourceInfo(serie);
				mapInfo = item.getMapInfo(plotRect, serie, ref);
				if (!mapInfo) {
					return;
				}

				const feature = features[this.selection.dataPoints[0].pointIndex];
				const {geometry} = feature;
				const index = item.findMapIndex(feature.properties, serie, mapInfo.labels);
				value.seriesIndex = this.selection.dataPoints[0].index;
				value.index = this.selection.dataPoints[0].pointIndex;
				value.serie = serie;
				value.axes = item.getAxes(serie);
				value.x = this.selection.dataPoints[0].x;
				value.y = this.selection.dataPoints[0].y;
				if (mapInfo.dispChart) {
					if (index !== -1) {
						const sheet = ref.y.range._worksheet;
						const selection = new Selection(sheet);
						selection.setAt(0, new CellRange(sheet, 0, 0));
						const view = createView(mapInfo.chartNode);
						view.getItem().title.formula = new StringExpression(getLabel(value, true, false));
						view.getItem().title.visible = true;
						this.chartView.drawMapChart(graphics, view, item, serie, feature, sheet, selection, ref, index, mapInfo, true);
					}
					return;
				}
				values.push(value);
				const pt = item.getFeatureCenter(features[value.index], mapInfo);

				x = pt.x;
				y = pt.y;
			} else {
				item.yAxes.forEach((axis) => {
					if (axis.categories) {
						axis.categories.forEach((data) => {
							// if (data.values && data.values[0] && data.values[0].x === this.selection.dataPoints[0].x) {
							if (data.values) {
								data.values.forEach((value) => {
									if (value.x === this.selection.dataPoints[0].x) {
										if (
											value.x !== undefined &&
											((value.y !== undefined && value.serie.tooltip === 'value') ||
												(value.pureY !== undefined && value.serie.tooltip === 'text')) &&
											value.serie.tooltip !== 'hide'
										) {
											if (item.chart.relative && value.barSize !== undefined) {
												value.y = value.barSize;
											}
											values[value.seriesIndex] = value;
										}
									}
								});
							}
						});
					}
				});
				x += space;
				y += space;
			}

			if (!values.length) {
				return;
			}

			let xValue;
			let cnt = 0;

			values.forEach((value) => {
				if (!xValue) {
					xValue = getLabel(value, true, circular);
					width = Math.max(width, graphics.measureText(xValue).width);
				}
				if (value) {
					width = Math.max(width, graphics.measureText(getLabel(value, false, circular)).width);
					cnt += 1;
				}
			});

			width = graphics.getCoordinateSystem().deviceToLogX(width, true);

			if (circular) {
				if (x < top.x + pieInfo.xc - plotRect.left) {
					x -= width + margin * 2;
				}
				if (y < top.y + pieInfo.yc - plotRect.top) {
					y -= (values.length + 1) * height + margin * 2;
				}
			} else if (y + margin * 2 + (cnt + 1) * height > plotRect.bottom) {
				y = this.point.y - (space + margin * 2 + (cnt + 1) * height);
			}

			graphics.beginPath();
			graphics.setFillColor('#FFFFFF');
			graphics.setLineColor('#AAAAAA');
			graphics.rect(x, y, width + margin * 2, margin * 2 + (cnt + 1) * height);
			graphics.fill();
			graphics.stroke();

			graphics.setFillColor('#000000');

			if (xValue) {
				graphics.fillText(xValue, x + margin, y + margin);
			}

			cnt = 0;

			for (let i = values.length - 1; i >= 0; i -= 1) {
				const value = values[i];
				if (value) {
					const label = getLabel(value, false, circular);
					if (circular) {
						graphics.setFillColor(item.getTemplate().series.getFillForIndex(value.index));
					} else {
						graphics.setFillColor(
							value.serie.format.lineColor || item.getTemplate().series.getLineForIndex(value.seriesIndex)
						);
					}
					if (label && label !== '') {
						graphics.fillText(label, x + margin, y + height * (cnt + 1) + margin * 2);
						cnt += 1;
					}
				}
			}
		}
	}
}
