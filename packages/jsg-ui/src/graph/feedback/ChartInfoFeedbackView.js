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
import { Point, GraphUtils, FormatAttributes, TextFormatAttributes } from '@cedalo/jsg-core';

import View from '../../ui/View';
import SelectionStyle from '../view/selection/SelectionStyle';

export default class ChartInfoFeedbackView extends View {
	constructor(chartView, selection, point, value) {
		super();

		this.chartView = chartView;
		this.point = point;
		this.selection = selection;
		this.value = value;
	}

	draw(graphics) {
		const point = new Point(0, 0);
		let angle = 0;

		GraphUtils.traverseUp(this.chartView, this._graphView, (v) => {
			v.translateToParent(point);
			if (v.getItem) {
				angle += v.getItem().getAngle().getValue();
			}
			return true;
		});

		graphics.translate(point.x, point.y);
		graphics.rotate(angle);

		this.draw2(graphics);

		graphics.rotate(-angle);
		graphics.translate(-point.x, -point.y);
	};

	draw2(graphics) {
		const item = this.chartView.getItem();
		const top = new Point(item.plot.position.left, item.plot.position.top);
		const bottom = new Point(item.plot.position.left, item.plot.position.bottom);
		const left = new Point(item.plot.position.left, item.plot.position.top);
		const right = new Point(item.plot.position.right, item.plot.position.top);

		graphics.setFillColor(SelectionStyle.MARKER_FILL_COLOR);
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
		graphics.setLineColor(SelectionStyle.MARKER_BORDER_COLOR);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);

		const plotRect = item.plot.position;
		let x;
		let y;

		if (!item.isCircular()) {
			graphics.beginPath();
			if (item.xAxes[0].align === 'bottom' || item.xAxes[0].align === 'top') {
				x = top.x + item.scaleToAxis(item.xAxes[0], this.value.x, undefined, false) * plotRect.width;
				y = top.y;

				if (x - top.x > plotRect.width || x - top.x < 0) {
					return;
				}
				graphics.moveTo(x, top.y);
				graphics.lineTo(x, bottom.y);

				if (this.endPoint) {
					graphics.rect(this.point.x, top.y, this.endPoint.x - this.point.x, bottom.y - top.y);
				}
			} else {
				x = top.x;
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
			const getLabel = (value, xValue, circular) => {
				const { serie } = value;
				const ref = item.getDataSourceInfo(serie.formula);

				let label = '';
				let axis;
				if (circular) {
					if (xValue) {
						label = `${ref.yName}`;
					} else {
						axis = value.axes.x;
						label = item.getLabel(ref, axis, Math.floor(value.x));
						label = `${label}: ${item.formatNumber(value.y, 'General')}`;
					}
				} else {
					if (xValue) {
						axis = value.axes.x;
						if (axis.type === 'category' && ref) {
							label = item.getLabel(ref, axis, Math.floor(value.x));
						} else if (axis.type !== 'category' && ref && ref.time && ref.time.xvalue) {
							label = ref.xName;
							axis = value.axes.x;
							label += `: ${item.formatNumber(value.x,
								axis.format && axis.format.numberFormat ? axis.format : axis.scale.format)}`;
						} else {
							axis = value.axes.x;
							label = item.formatNumber(value.x,
								axis.format && axis.format.numberFormat ? axis.format : axis.scale.format);
						}
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
			const circular = item.isCircular();
			let pieInfo;

			if (circular) {
				const value = {};
				if (this.selection.dataPoints[0].index >= item.series.length) {
					return;
				}
				const serie = item.series[this.selection.dataPoints[0].index];
				const ref = item.getDataSourceInfo(serie.formula);

				pieInfo = item.getPieInfo(ref, serie, plotRect, this.selection.dataPoints[0].index);
				let currentAngle = pieInfo.startAngle;
				let index = 0;
				let pieAngle = 0;
				while (item.getValue(ref, index, value) && index <= this.selection.dataPoints[0].pointIndex) {
					pieAngle = Math.abs(value.y) / pieInfo.sum * (pieInfo.endAngle - pieInfo.startAngle);
					currentAngle += pieAngle;
					index += 1;
				}
				switch (serie.type) {
				case 'pie': {
					const points = item.getEllipseSegmentPoints(pieInfo.xc, pieInfo.yc, 0, 0,
						pieInfo.xRadius, pieInfo.yRadius, 0, currentAngle - pieAngle, currentAngle, 2);
					if (points.length) {
						x = top.x - item.plot.position.left + points[1].x;
						y = top.y - item.plot.position.top + points[1].y;
					}
					break;
				}
				case 'doughnut': {
					const points = item.getEllipseSegmentPoints(pieInfo.xc, pieInfo.yc, pieInfo.xInnerRadius, pieInfo.yInnerRadius,
						pieInfo.xOuterRadius, pieInfo.yOuterRadius, 0, currentAngle - pieAngle, currentAngle, 2);
					if (points.length) {
						x = top.x - item.plot.position.left + points[1].x;
						y = top.y - item.plot.position.top + points[1].y;
					}
					break;
				}
				}

				if (item.getValue(ref, this.selection.dataPoints[0].pointIndex, value)) {
					value.seriesIndex = this.selection.dataPoints[0].index;
					value.index = this.selection.dataPoints[0].pointIndex;
					value.serie = serie;
					value.axes = item.getAxes(serie);
					values.push(value);
				}
			} else {
				item.yAxes.forEach((axis) => {
					if (axis.categories) {
						axis.categories.forEach((data) => {
							if (data.values && data.values[0] && data.values[0].x === this.selection.dataPoints[0].x) {
								data.values.forEach((value) => {
									if (value.x !== undefined && value.y !== undefined) {
										if (item.chart.relative && value.barSize !== undefined) {
											value.y = value.barSize;
										}
										values.push(value);
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

			width = graphics.measureText(getLabel(values[0], true, circular)).width;
			values.forEach((value) => {
				width = Math.max(width, graphics.measureText(getLabel(value, false, circular)).width);
			});

			width = graphics.getCoordinateSystem().deviceToLogX(width, true);

			if (circular) {
				if (x < top.x + pieInfo.xc - plotRect.left) {
					x -= width + margin * 2;
				}
				if (y < top.y + pieInfo.yc - plotRect.top) {
					y -= (values.length + 1) * height + margin * 2;
				}
			}

			graphics.beginPath();
			graphics.setFillColor('#FFFFFF');
			graphics.setLineColor('#AAAAAA');
			graphics.rect(x, y, width + margin * 2,
				margin * 2 + (values.length + 1) * height);
			graphics.fill();
			graphics.stroke();

			graphics.setFillColor('#000000');

			const text = getLabel(values[0], true, circular);
			graphics.fillText(text, x + margin, y + margin);

			values.forEach((value, index) => {
				const label = getLabel(value, false, circular);
				if (circular) {
					graphics.setFillColor(
						item.getTemplate().series.getFillForIndex(value.index));
				} else {
					graphics.setFillColor(
						value.serie.format.lineColor || item.getTemplate().series.getLineForIndex(value.seriesIndex));
				}
				graphics.fillText(label, x + margin, y + height * (index + 1) + margin * 2);
			});
		}
	}
}
