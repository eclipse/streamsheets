import { default as JSG, TextFormatAttributes, FormatAttributes } from '@cedalo/jsg-core';

import NodeView from './NodeView';

const opposedLine = (start, end) => {
	const lengthX = end.x - start.x;
	const lengthY = end.y - start.y;
	return {
		length: Math.sqrt((lengthX ** 2) + (lengthY ** 2)),
		angle: Math.atan2(lengthY, lengthX)
	}
};

const controlPoint = (current, previous, next, reverse) => {
	// When 'current' is the first or last point of the array
	// 'previous' or 'next' don't exist.
	// Replace with 'current'
	const p = previous || current;
	const n = next || current;
	// The smoothing ratio
	const smoothing = 0.2;
	// Properties of the opposed-line
	const o = opposedLine(p, n);
	// If is end-control-point, add PI to the angle to go backward
	const angle = o.angle + (reverse ? Math.PI : 0);
	const length = o.length * smoothing;
	// The control point position is relative to the current point
	const x = current.x + Math.cos(angle) * length;
	const y = current.y + Math.sin(angle) * length;
	return { x, y };
};

export default class SheetPlotView extends NodeView {
	onSelectionChange(selected) {
		if (!selected) {
			this.chartSelection = undefined;
			this.getGraphView().clearLayer('chartselection');
		}
	}

	drawBorder(graphics, format, rect) {
		super.drawBorder(graphics, format, rect);
	}

	drawRect(graphics, rect, item, format, id) {
		const lineColor = format.lineColor || item.getTemplate()[id].format.lineColor;
		const fillColor = format.fillColor || item.getTemplate()[id].format.fillColor;

		graphics.beginPath();
		graphics.setLineWidth(1);
		graphics.setLineColor(lineColor);
		graphics.setFillColor(fillColor);
		graphics.rect(rect.left, rect.top, rect.width, rect.height);
		if (lineColor !== 'none') {
			graphics.stroke();
		}
		if (fillColor !== 'none') {
			graphics.fill();
		}
	}

	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);

		const item = this.getItem();

		if (item._isFeedback) {
			return;
		}

		const { series } = item;
		const plotRect = item.plot.position;
		const legendData = item.getLegend();

		this.drawRect(graphics, plotRect, item, item.plot.format, 'plot');
		this.drawAxes(graphics, plotRect, item, true);

		let lastPoints;
		series.forEach((serie, index) => {
			lastPoints = this.drawPlot(graphics, item, plotRect, serie, index, lastPoints, legendData);
		});

		this.drawAxes(graphics, plotRect, item, false);
		this.drawLegend(graphics, plotRect, item, legendData);
		this.drawTitle(graphics, item, item.title, 'title', 0);

		graphics.setTextBaseline('middle');
		graphics.setFillColor('#444444');
		graphics.setTextAlignment(1);
		graphics.setFontName('Verdana');
		graphics.setFontSize('8');
		graphics.setFontStyle(0);
		graphics.setFont();

		item.actions.forEach((action) => {
			graphics.fillText(
				action.title,
				action.position.left + action.position.width / 2,
				action.position.top + action.position.height / 2
			);
		});
	}

	drawLegend(graphics, plotRect, item, legendData) {
		const margin = 200;
		const { legend } = item;
		const cs = graphics.getCoordinateSystem();

		if (!legend.visible) {
			return;
		}

		this.drawRect(graphics, legend.position, item, legend.format, 'legend');
		item.setFont(graphics, legend.format, 'legend', 'middle', TextFormatAttributes.TextAlignment.LEFT);
		const textSize = item.measureText(graphics, graphics.getCoordinateSystem(), legend.format, 'legend', 'X');
		let x = legend.position.left + margin;
		let y = legend.position.top + margin;
		let textPos = margin * 4;
		let type = 'bar';

		legendData.forEach((entry, index) => {
			graphics.beginPath();
			if (entry.series) {
				graphics.setLineColor(entry.series.format.lineColor || item.getTemplate().series.line[index]);
				graphics.setLineWidth(entry.series.format.lineWidth || item.getTemplate().series.linewidth);
				graphics.setFillColor(entry.series.format.fillColor || item.getTemplate().series.fill[index]);
				type = entry.series.type;
			} else {
				graphics.setLineWidth(1);
				graphics.setLineColor(entry.color);
				graphics.setFillColor(entry.color);
			}

			switch (type) {
				case 'line':
				case 'profile':
				case 'scatter':
					graphics.moveTo(x, y + textSize.height / 2);
					graphics.lineTo(x + margin * 3, y + textSize.height / 2);
					this.drawMarker(graphics, entry.series, {
						x: x + margin * 1.5,
						y: y + textSize.height / 2
					}, 3);
					graphics.fill();
					graphics.stroke();
					break;
				case 'area':
				case 'column':
				case 'state':
				case 'bar':
					graphics.rect(x, y + textSize.height / 10, margin * 3, (textSize.height * 2) / 3);
					graphics.fill();
					graphics.stroke();
					break;
			case 'bubble':
				textPos = margin * 2;
				graphics.circle(x + margin / 2, y + textSize.height / 2, (textSize.height * 2) / 5);
				graphics.fill();
				graphics.stroke();
				break;
			}

			const fontColor =
				legend.format.fontColor || item.getTemplate().legend.format.fontColor || item.getTemplate().font.color;

			graphics.setFillColor(fontColor);
			graphics.fillText(entry.name, x + textPos, y + textSize.height / 2);

			if (legend.align === 'right' || legend.align === 'left') {
				y += textSize.height * 1.3;
			} else {
				const size = item.measureText(JSG.graphics, cs, legend.format, 'legend', String(entry.name));
				x += size.width + margin * 2 + textPos;
			}
		});

		graphics.setLineWidth(-1);
	}

	drawAxes(graphics, plotRect, item, grid) {
		item.xAxes.forEach((axis) => {
			if (axis.visible) {
				this.drawTitle(graphics, item, axis.title, 'axisTitle', axis.isVertical() ? Math.PI_2 : 0);
				this.drawAxis(graphics, plotRect, item, axis, grid);
			}
		});

		item.yAxes.forEach((axis) => {
			if (axis.visible) {
				this.drawTitle(graphics, item, axis.title, 'axisTitle', axis.isVertical() ? Math.PI_2 : 0);
				this.drawAxis(graphics, plotRect, item, axis, grid);
			}
		});
	}

	drawAxis(graphics, plotRect, item, axis, grid) {
		if (!axis.position || !axis.scale || (grid && !axis.gridVisible)) {
			return;
		}

		// draw axis line
		if (!grid) {
			graphics.beginPath();
			graphics.setLineColor(axis.format.lineColor || item.getTemplate().axis.format.lineColor);
			switch (axis.align) {
				case 'left':
					graphics.moveTo(axis.position.right, axis.position.top);
					graphics.lineTo(axis.position.right, axis.position.bottom);
					item.setFont(graphics, axis.format, 'axis', 'middle', TextFormatAttributes.TextAlignment.RIGHT);
					break;
				case 'right':
					graphics.moveTo(axis.position.left, axis.position.top);
					graphics.lineTo(axis.position.left, axis.position.bottom);
					item.setFont(graphics, axis.format, 'axis', 'middle', TextFormatAttributes.TextAlignment.LEFT);
					break;
				case 'top':
					graphics.moveTo(axis.position.left, axis.position.bottom);
					graphics.lineTo(axis.position.right, axis.position.bottom);
					item.setFont(graphics, axis.format, 'axis', 'bottom', TextFormatAttributes.TextAlignment.CENTER);
					break;
				case 'bottom':
					graphics.moveTo(axis.position.left, axis.position.top);
					graphics.lineTo(axis.position.right, axis.position.top);
					item.setFont(graphics, axis.format, 'axis', 'top', TextFormatAttributes.TextAlignment.CENTER);
					break;
			}
			graphics.stroke();
		}

		if (grid) {
			graphics.beginPath();
			graphics.setLineColor(axis.formatGrid.lineColor || item.getTemplate().axis.formatGrid.lineColor);
		}

		let current = item.getAxisStart(axis);
		const final = item.getAxisEnd(axis);

		let refLabel;
		if (axis.type === 'category') {
			item.series.forEach((series) => {
				if (series.xAxis === axis.name) {
					refLabel = item.getDataSourceInfo(series.formula);
				}
			});
		}

		const cs = graphics.getCoordinateSystem();
		let last;
		let width = 0;
		let pos;
		let plot;
		let text;

		while (current.value <= final) {
			if (axis.type === 'category' && (grid ? current.value > axis.scale.max : current.value >= axis.scale.max)) {
				break;
			}

			pos = item.scaleToAxis(axis, current.value, undefined, grid);

			if (!grid) {
				if (axis.type === 'category' && refLabel) {
					text = item.getLabel(refLabel, axis, Math.floor(current.value));
				} else {
					text = item.formatNumber(
						current.value,
						axis.format && axis.format.numberFormat ? axis.format : axis.scale.format
					);
				}
			}

			width = cs.deviceToLogX(graphics.measureText(text).width);

			switch (axis.align) {
				case 'left':
					plot = plotRect.bottom - pos * plotRect.height;
					if (grid) {
						graphics.moveTo(plotRect.left, plot);
						graphics.lineTo(plotRect.right, plot);
					} else {
						graphics.fillText(`${text}`, axis.position.right - 200, plot);
					}
					break;
				case 'right':
					plot = plotRect.bottom - pos * plotRect.height;
					if (grid) {
						graphics.moveTo(plotRect.left, plot);
						graphics.lineTo(plotRect.right, plot);
					} else {
						graphics.fillText(`${text}`, axis.position.left + 200, plot);
					}
					break;
				case 'top':
					plot = plotRect.left + pos * plotRect.width;
					if (grid) {
						graphics.moveTo(plot, plotRect.top);
						graphics.lineTo(plot, plotRect.bottom);
					} else {
						graphics.fillText(`${text}`, plot, axis.position.bottom - 200);
					}
					break;
				case 'bottom':
					plot = plotRect.left + pos * plotRect.width;
					if (grid) {
						graphics.moveTo(plot, plotRect.top);
						graphics.lineTo(plot, plotRect.bottom);
					} else if (axis.invert) {
						if (last === undefined || plot + width / 2 + 100 < last) {
							graphics.fillText(`${text}`, plot, axis.position.top + 200);
						}
						last = plot - width / 2;
					} else if (last === undefined || plot - width / 2 + 100 > last) {
						graphics.fillText(`${text}`, plot, axis.position.top + 200);
						last = plot + width / 2;
					}
					break;
			}

			current = item.incrementScale(axis, current);
		}
		if (grid) {
			graphics.stroke();
		}
	}

	setLineStyle(graphics, lineStyle) {
		if (lineStyle === 'none') {
			graphics.setLineColor('rgba(1,1,1,0)');
		}
	}

	scaleBubble(axis, plotRect, serie, value) {
		const radiusMax = Math.min(plotRect.width, plotRect.height) / 12; // * (double)Group.GetBubbleScale() / 100.0;

		if (value > 0 && axis.cMaxData > 0) {
			// if( Group.GetSizeRepresents() == ctSizeIsWidth ) {
			// 	iRadius = (int)(dOuterCircle / dMax * dSize);
			// } else {
			const maxArea = radiusMax * radiusMax * Math.PI;
			const objectArea = value / axis.cMaxData * maxArea;
			return Math.sqrt(objectArea / Math.PI);
			// }
		}
		return 0;
	}

	getPlotPoint(item, axes, ref, info, defPt, index, offset, pt) {
		if (item.getValue(ref, index + offset, pt)) {
			info.index = index + offset;
			pt.x = pt.x === undefined ? defPt.x : pt.x;
			pt.y = pt.y === undefined ? defPt.y : pt.y;
			pt.x = item.scaleToAxis(axes.x, pt.x, undefined, false);
			pt.y = item.scaleToAxis(axes.y, pt.y, info, false);
		} else {
			pt.x = defPt.x;
			pt.y = defPt.y;
			pt.x = item.scaleToAxis(axes.x, pt.x, undefined, false);
			pt.y = item.scaleToAxis(axes.y, pt.y, info, false);
		}
		return pt;
	}

	drawPlot(graphics, item, plotRect, serie, seriesIndex, lastPoints, legendData) {
		let index = 0;
		let barInfo;
		const value = {};
		const ref = item.getDataSourceInfo(serie.formula);
		const axes = item.getAxes(serie);

		if (!ref || !axes) {
			return undefined;
		}

		if (!item.isZoomed(serie)) {
			graphics.setTextBaseline('top');
			graphics.setFillColor('#CCCCCC');
			graphics.setTextAlignment(0);
			graphics.setFontName('Verdana');
			graphics.setFontSize('8');
			graphics.setFontStyle(0);
			graphics.setFont();
			graphics.fillText('Retrieving Data...', 100, 100);
		}

		graphics.save();
		graphics.beginPath();
		graphics.rect(plotRect.left, plotRect.top, plotRect.width, plotRect.height);
		graphics.clip();

		graphics.beginPath();
		graphics.setLineColor(serie.format.lineColor || item.getTemplate().series.line[seriesIndex]);
		graphics.setLineWidth(serie.format.lineWidth || item.getTemplate().series.linewidth);
		this.setLineStyle(graphics, serie.format.lineStyle);
		graphics.setFillColor(serie.format.fillColor || item.getTemplate().series.fill[seriesIndex]);

		const barWidth = item.getBarWidth(axes, serie, plotRect);
		const points = [];
		let newLine = true;
		let xFirst;
		let xLast;
		const pt = {x: 0, y: 0};
		const ptPrev = {x: 0, y: 0};
		const ptNext = {x: 0, y: 0};
		const ptLast = {x: 0, y: 0};
		const toPlot = (point) => {
			if (serie.type === 'bar' || serie.type === 'profile') {
				const x = point.x;
				if (point.x !== undefined) {
					point.x = plotRect.left + point.y * plotRect.width;
				}
				if (point.y !== undefined) {
					point.y = plotRect.bottom - x * plotRect.height;
				}
			} else {
				if (point.x !== undefined) {
					point.x = plotRect.left + point.x * plotRect.width;
				}
				if (point.y !== undefined) {
					point.y = plotRect.bottom - point.y * plotRect.height;
				}
			}
			return point;
		};
		const info = {
			serie,
			seriesIndex,
			categories: axes.y.categories
		};

		while (item.getValue(ref, index, value)) {
			info.index = index;
			if (item.chart.dataMode === 'datainterrupt' || (value.x !== undefined && value.y !== undefined)) {
				pt.x = item.scaleToAxis(axes.x, value.x, undefined, false);
				pt.y = item.scaleToAxis(axes.y, value.y, info, false);
				toPlot(pt);
				switch (serie.type) {
					case 'profile':
						if (
							item.chart.dataMode === 'datainterrupt' &&
							(value.x === undefined || value.y === undefined)
						) {
							newLine = true;
						} else if (newLine) {
							graphics.moveTo(pt.x, pt.y);
							newLine = false;
							xFirst = pt.x;
							xLast = pt.x;
						} else {
							if (serie.smooth) {
								this.getPlotPoint(item, axes, ref, info, value, index, -1, ptLast);
								toPlot(ptLast);

								const midX = (ptLast.x + pt.x) / 2;
								const midY = (ptLast.y + pt.y) / 2;
								const cpY1 = (midY + ptLast.y) / 2;
								const cpY2 = (midY + pt.y) / 2;
								graphics.quadraticCurveTo(ptLast.x, cpY1, midX, midY);
								graphics.quadraticCurveTo(pt.x, cpY2, pt.x, pt.y);
							} else {
								graphics.lineTo(pt.x, pt.y);
							}
							xLast = pt.x;
						}
						break;
					case 'bubble':
						if (value.x !== undefined && value.y !== undefined && value.c !== undefined) {
							const radius = this.scaleBubble(axes.y, plotRect, serie, value.c);
							graphics.moveTo(pt.x + radius, pt.y);
							graphics.circle(pt.x, pt.y, radius);
						}
						break;
					case 'scatter':
						if (
							item.chart.dataMode === 'datainterrupt' &&
							(value.x === undefined || value.y === undefined)
						) {
							newLine = true;
						} else if (newLine) {
							graphics.moveTo(pt.x, pt.y);
							newLine = false;
							xFirst = pt.x;
							xLast = pt.x;
						} else {
							if (serie.smooth) {
								this.getPlotPoint(item, axes, ref, info, value, index, 1, ptNext);
								this.getPlotPoint(item, axes, ref, info, value, index, -1, ptLast);
								this.getPlotPoint(item, axes, ref, info, value, index, -2, ptPrev);
								toPlot(ptPrev);
								toPlot(ptLast);
								toPlot(ptNext);

								const cp1 = controlPoint(ptLast, ptPrev, pt);
								const cp2 = controlPoint(pt, ptLast, ptNext, true);

								graphics.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pt.x, pt.y);
							} else {
								graphics.lineTo(pt.x, pt.y);
							}

							xLast = pt.x;
						}
						break;
					case 'area':
					case 'line':
						if (
							item.chart.dataMode === 'datainterrupt' &&
							(value.x === undefined || value.y === undefined)
						) {
							newLine = true;
						} else if (newLine) {
							graphics.moveTo(pt.x, pt.y);
							newLine = false;
							xFirst = pt.x;
							xLast = pt.x;
						} else {
							if (serie.smooth) {
								this.getPlotPoint(item, axes, ref, info, value, index, -1, ptLast);
								toPlot(ptLast);

								const midX = (ptLast.x + pt.x) / 2;
								const midY = (ptLast.y + pt.y) / 2;
								const cpX1 = (midX + ptLast.x) / 2;
								const cpX2 = (midX + pt.x) / 2;
								graphics.quadraticCurveTo(cpX1, ptLast.y, midX, midY);
								graphics.quadraticCurveTo(cpX2, pt.y ,pt.x, pt.y);
							} else {
								graphics.lineTo(pt.x, pt.y);
							}

							xLast = pt.x;
						}
						if (serie.type === 'area') {
							if (newLine) {
								pt.y = item.scaleToAxis(axes.y, 0, undefined, false);
								graphics.lineTo(
									xLast,
									plotRect.bottom - pt.y * plotRect.height
								);
								graphics.lineTo(
									plotRect.left + xFirst * plotRect.width,
									plotRect.bottom - pt.y * plotRect.height
								);
								graphics.closePath();
								graphics.fill();
								graphics.stroke();
								graphics.beginPath();
							}
							if (item.chart.stacked) {
								points.push({
									x: pt.x,
									y: pt.y
								});
							}
						}
						break;
					case 'column':
						if (value.x !== undefined && value.y !== undefined) {
							barInfo = item.getBarInfo(axes, serie, seriesIndex, index, value.y, barWidth);
							graphics.rect(
								pt.x + barInfo.offset,
								pt.y,
								barWidth - barInfo.margin,
								-barInfo.height * plotRect.height
							);
						}
						break;
					case 'state':
						if (value.x !== undefined && value.y !== undefined && value.c !== undefined) {
							graphics.beginPath();
							barInfo = item.getBarInfo(axes, serie, seriesIndex, index, value.y, barWidth);
							value.c = this.translateFromLegend(value.c, legendData);
							const [fill, line] = String(value.c).split(';');
							if (fill && fill.length) {
								graphics.setFillColor(fill);
							}
							if (line && line.length) {
								graphics.setLineColor(line);
							}
							if (item.chart.period && index) {
								this.getPlotPoint(item, axes, ref, info, value, index, -1, ptLast);
								toPlot(ptLast);
								graphics.rect(
									pt.x,
									pt.y,
									Math.abs(ptLast.x - pt.x) + 20,
									-barInfo.height * plotRect.height + 20
								);

							} else {
								graphics.rect(
									pt.x + barInfo.offset,
									pt.y,
									barWidth + 10,
									-barInfo.height * plotRect.height
								);
							}
							if (fill && fill.length) {
								graphics.fill();
							}
							if (line && line.length) {
								graphics.stroke();
							}
						}
						break;
					case 'bar':
						if (value.x !== undefined && value.y !== undefined) {
							barInfo = item.getBarInfo(axes, serie, seriesIndex, index, value.y, barWidth);
							graphics.rect(
								pt.x,
								pt.y + barInfo.offset,
								barInfo.height * plotRect.width,
								barWidth - barInfo.margin
							);
						}
						break;
				}
			}
			index += 1;
		}

		if (serie.type === 'area') {
			if (seriesIndex && item.chart.stacked && lastPoints) {
				let point;
				for (let i = lastPoints.length - 1; i >= 0; i -= 1) {
					point = lastPoints[i];
					if (serie.smooth && i < lastPoints.length - 1) {
						const pLast = lastPoints[i + 1];
						const midX = (pLast.x + point.x) / 2;
						const midY = (pLast.y + point.y) / 2;
						const cpX1 = (midX + pLast.x) / 2;
						const cpX2 = (midX + point.x) / 2;
						graphics.quadraticCurveTo(cpX1, pLast.y, midX, midY);
						graphics.quadraticCurveTo(cpX2, point.y ,point.x, point.y);
					} else {
						graphics.lineTo(point.x, point.y);
					}
				}
			} else {
				pt.y = item.scaleToAxis(axes.y, 0, undefined, false);
				graphics.lineTo(xLast, plotRect.bottom - pt.y * plotRect.height);
				graphics.lineTo(xFirst, plotRect.bottom - pt.y * plotRect.height);
			}
			graphics.closePath();
		}

		if (serie.type === 'column' || serie.type === 'bar' || serie.type === 'area' || serie.type === 'bubble') {
			graphics.fill();
		}
		if (serie.type !== 'state') {
			graphics.stroke();
		}
		graphics.setLineWidth(1);

		graphics.restore();

		if (serie.marker.style !== 'none') {
			index = 0;
			graphics.beginPath();
			graphics.setLineColor(serie.marker.lineColor || item.getTemplate().series.line[seriesIndex]);
			graphics.setFillColor(serie.marker.fillColor || item.getTemplate().series.fill[seriesIndex]);
			while (item.getValue(ref, index, value)) {
				info.index = index;
				if (item.chart.dataMode === 'datainterrupt' || (value.x !== undefined && value.y !== undefined)) {
					pt.x = item.scaleToAxis(axes.x, value.x, undefined, false);
					pt.y = item.scaleToAxis(axes.y, value.y, info, false);
					switch (serie.type) {
					case 'profile':
					case 'line':
					case 'scatter':
						toPlot(pt);
						if (plotRect.containsPoint(pt)) {
							this.drawMarker(graphics, serie, {
								x: pt.x,
								y: pt.y
							});
						}
						break;
					}
				}
				index += 1;
			}
			graphics.fill();
			graphics.stroke();
		}


		return points;
	}

	drawTitle(graphics, item, title, id, angle) {
		if (!title.visible) {
			return;
		}

		const text = String(item.getExpressionValue(title.formula));

		this.drawRect(graphics, title.position, item, title.format, id);
		item.setFont(graphics, title.format, id, 'middle', TextFormatAttributes.TextAlignment.CENTER);

		if (angle) {
			graphics.translate(
				title.position.left + title.position.width / 2,
				title.position.top + title.position.height / 2 + 50
			);
			graphics.rotate(-angle);

			graphics.fillText(text, 0, 0);

			graphics.rotate(angle);
			graphics.translate(
				-(title.position.left + title.position.width / 2),
				-(title.position.top + title.position.height / 2 + 50)
			);
		} else {
			graphics.fillText(
				text,
				title.position.left + title.position.width / 2,
				title.position.top + title.position.height / 2 + 50
			);
		}
	}

	drawMarker(graphics, serie, pos, defaultSize) {
		const size = (defaultSize || serie.marker.size) * 60;
		let fill = false;

		switch (serie.marker.style) {
		case 'circle':
			graphics.moveTo(pos.x, pos.y);
			graphics.circle(pos.x, pos.y, size / 2);
			fill = true;
			break;
		case 'cross':
			graphics.moveTo(pos.x - size / 2, pos.y);
			graphics.lineTo(pos.x + size / 2, pos.y);
			graphics.moveTo(pos.x, pos.y - size / 2);
			graphics.lineTo(pos.x, pos.y + size / 2);
			break;
		case 'crossRot':
			graphics.moveTo(pos.x - size / 2, pos.y - size / 2);
			graphics.lineTo(pos.x + size / 2, pos.y + size / 2);
			graphics.moveTo(pos.x + size / 2, pos.y - size / 2);
			graphics.lineTo(pos.x - size / 2, pos.y + size / 2);
			break;
		case 'dash':
			graphics.rect(pos.x - size / 2, pos.y - size / 6, size, size / 3);
			fill = true;
			break;
		case 'line':
			graphics.moveTo(pos.x - size / 2, pos.y);
			graphics.lineTo(pos.x + size / 2, pos.y);
			break;
		case 'rect':
			graphics.rect(pos.x - size / 2, pos.y - size / 2, size, size);
			fill = true;
			break;
		case 'rectRot':
			graphics.moveTo(pos.x, pos.y - size / 2);
			graphics.lineTo(pos.x + size / 2, pos.y);
			graphics.lineTo(pos.x, pos.y + size / 2);
			graphics.lineTo(pos.x - size / 2, pos.y);
			graphics.closePath();
			fill = true;
			break;
		case 'star':
			graphics.moveTo(pos.x - size / 2, pos.y);
			graphics.lineTo(pos.x + size / 2, pos.y);
			graphics.moveTo(pos.x, pos.y - size / 2);
			graphics.lineTo(pos.x, pos.y + size / 2);
			graphics.moveTo(pos.x - size / 2, pos.y - size / 2);
			graphics.lineTo(pos.x + size / 2, pos.y + size / 2);
			graphics.moveTo(pos.x + size / 2, pos.y - size / 2);
			graphics.lineTo(pos.x - size / 2, pos.y + size / 2);
			break;
		case 'triangle':
			graphics.moveTo(pos.x, pos.y - size / 2);
			graphics.lineTo(pos.x + size / 2, pos.y + size / 2);
			graphics.lineTo(pos.x - size / 2, pos.y + size / 2);
			graphics.closePath();
			fill = true;
			break;
		}

	}

	translateFromLegend(color, legendData) {
		if (!legendData.length || !legendData[0].color) {
			return color;
		}

		for (let i = 0;  i< legendData.length; i += 1) {
			const entry = legendData[i];
			if (color === entry.name) {
				return entry.color;
			}
		}
		return color;
	}

	getSelectedFormat() {
		const f = new FormatAttributes();

		if (this.chartSelection) {
			const data = this.getItem().getDataFromSelection(this.chartSelection);
			const template = this.getItem().getTemplate();
			if (data) {
				switch (this.chartSelection.element) {
					case 'plot':
						f.setLineColor(data.format.lineColor || template.plot.format.lineColor);
						f.setFillColor(data.format.fillColor || template.plot.format.fillColor);
						break;
					case 'series':
						f.setFillColor(data.format.fillColor || template.series.fill[this.chartSelection.index]);
						f.setLineColor(data.format.lineColor || template.series.line[this.chartSelection.index]);
						break;
					case 'title':
					case 'legend':
						f.setFillColor(data.format.fillColor || template[this.chartSelection.element].format.fillColor);
						f.setLineColor(data.format.lineColor || template[this.chartSelection.element].format.lineColor);
						break;
					case 'xAxis':
					case 'yAxis':
						f.setLineColor(data.format.lineColor || template.axis.format.lineColor);
						f.setFillColor(data.format.fillColor || template.axis.format.fillColor);
						break;
					case 'xAxisGrid':
					case 'yAxisGrid':
						f.setLineColor(data.formatGrid.lineColor || template.axis.formatGrid.lineColor);
						break;
					case 'xAxisTitle':
					case 'yAxisTitle':
						f.setLineColor(data.format.lineColor || template.axisTitle.format.lineColor);
						f.setFillColor(data.format.fillColor || template.axisTitle.format.fillColor);
						break;
					default:
						break;
				}
			}
		}

		return f;
	}

	getSelectedTextFormat() {
		const tf = new TextFormatAttributes();

		if (this.chartSelection) {
			const data = this.getItem().getDataFromSelection(this.chartSelection);
			const template = this.getItem().getTemplate();
			if (data) {
				switch (this.chartSelection.element) {
					case 'series':
					case 'title':
					case 'legend':
						tf.setFontName(
							data.format.fontName ||
								template[this.chartSelection.element].format.fontName ||
								template.font.name
						);
						tf.setFontSize(
							data.format.fontSize ||
								template[this.chartSelection.element].format.fontSize ||
								template.font.size
						);
						if (data.format.fontStyle !== undefined) {
							tf.setFontStyle(data.format.fontStyle);
						} else if (template[this.chartSelection.element].format.fontStyle !== undefined) {
							tf.setFontStyle(template[this.chartSelection.element].format.fontStyle);
						} else {
							tf.setFontStyle(template.font.style);
						}
						break;
					case 'xAxis':
					case 'yAxis':
						tf.setFontName(data.format.fontName || template.axis.format.fontName || template.font.name);
						tf.setFontSize(data.format.fontSize || template.axis.format.fontSize || template.font.size);
						if (data.format.fontStyle !== undefined) {
							tf.setFontStyle(data.format.fontStyle);
						} else if (template.axis.format.fontStyle !== undefined) {
							tf.setFontStyle(template.axis.format.fontStyle);
						} else {
							tf.setFontStyle(template.font.style);
						}
						break;
					case 'xAxisTitle':
					case 'yAxisTitle':
						tf.setFontName(
							data.format.fontName || template.axisTitle.format.fontName || template.font.name
						);
						tf.setFontSize(
							data.format.fontSize || template.axisTitle.format.fontSize || template.font.size
						);
						if (data.format.fontStyle !== undefined) {
							tf.setFontStyle(data.format.fontStyle);
						} else if (template.axisTitle.format.fontStyle !== undefined) {
							tf.setFontStyle(template.axisTitle.format.fontStyle);
						} else {
							tf.setFontStyle(template.font.style);
						}
						break;
					default:
						break;
				}
			}
		}

		return tf;
	}

	hasSelectedFormula() {
		if (this.chartSelection) {
			switch (this.chartSelection.element) {
				case 'series':
				case 'title':
				case 'legend':
				case 'xAxis':
				case 'xAxisTitle':
				case 'yAxis':
				case 'yAxisTitle':
					return true;
				default:
					return false;
			}
		}

		return false;
	}

	getSelectedFormula(sheet) {
		let expr;

		if (this.chartSelection) {
			switch (this.chartSelection.element) {
				case 'series':
				case 'xAxis':
				case 'yAxis':
				case 'title':
				case 'legend':
				case 'xAxisTitle':
				case 'yAxisTitle': {
					const data = this.getItem().getDataFromSelection(this.chartSelection);
					if (!data) {
						return super.getSelectedFormula(sheet);
					}
					expr = data.formula;
					break;
				}
				default:
					break;
			}
		}

		if (expr) {
			if (expr.getTerm()) {
				const formula = `=${expr.getTerm().toLocaleString(JSG.getParserLocaleSettings(), {
					item: sheet,
					useName: true
				})}`;
				return formula;
			}
			return expr.getValue();
		}

		return super.getSelectedFormula(sheet);
	}

	applyAttributes(map, viewer) {
		const update = (key) => {
			const cmd = this.getItem().prepareCommand(key);
			const data = this.getItem().getDataFromSelection(this.chartSelection);
			if (!data) {
				return;
			}
			let format;
			switch (this.chartSelection.element) {
				case 'xAxisGrid':
				case 'yAxisGrid':
					format = data.formatGrid;
					break;
				default:
					format = data.format;
					break;
			}
			let value = map.get('linecolor');
			if (value) {
				format.lineColor = map.get('linecolor');
			}
			value = map.get('fillcolor');
			if (value) {
				format.fillColor = map.get('fillcolor');
			}
			value = map.get('fontcolor');
			if (value) {
				format.fontColor = map.get('fontcolor');
			}
			value = map.get('fontname');
			if (value) {
				format.fontName = map.get('fontname');
			}
			value = map.get('fontsize');
			if (value) {
				format.fontSize = Number(map.get('fontsize'));
			}
			value = map.get('fontstyle');
			if (value !== undefined) {
				format.fontStyle = Number(map.get('fontstyle'));
			}
			value = map.get('numberformat');
			if (value === 'General') {
				format.numberFormat = undefined;
				format.localCulture = undefined;
			} else {
				if (value !== undefined) {
					format.numberFormat = map.get('numberformat');
				}
				value = map.get('localculture');
				if (value !== undefined) {
					format.localCulture = map.get('localculture');
				}
			}
			this.getItem().finishCommand(cmd, key);
			viewer.getInteractionHandler().execute(cmd);
		};

		if (this.chartSelection) {
			switch (this.chartSelection.element) {
				case 'series':
					update('series');
					return true;
				case 'xAxis':
				case 'yAxis':
				case 'xAxisTitle':
				case 'yAxisTitle':
				case 'xAxisGrid':
				case 'yAxisGrid':
					update('axes');
					return true;
				case 'title':
					update('title');
					return true;
				case 'legend':
					update('legend');
					return true;
				case 'plot':
					update('plot');
					return true;
				default:
					break;
			}
		}
		return false;
	}
}
