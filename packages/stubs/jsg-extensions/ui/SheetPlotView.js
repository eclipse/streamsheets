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

const opposedLine = (start, end) => {
	const lengthX = end.x - start.x;
	const lengthY = end.y - start.y;
	return {
		length: Math.sqrt(lengthX ** 2 + lengthY ** 2),
		angle: Math.atan2(lengthY, lengthX)
	};
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

export default function SheetPlotViewFactory(JSG, ...args) {
	const { ChartRect, TextFormatAttributes, FormatAttributes, MathUtils, GraphUtils, Rectangle, Numbers } = JSG;

	JSG.GRAPH_SHOW_CONTEXT_MENU_NOTIFICATION = 'graph_show_context_menu_notification';
	JSG.GRAPH_DOUBLE_CLICK_NOTIFICATION = 'graph_double_click_notification';

	class SheetPlotView extends JSG.NodeView {
		isNewChart() {
			return true;
		}

		onSelectionChange(selected) {
			if (!selected) {
				this.chartSelection = undefined;
				this.getGraphView().clearLayer('chartselection');
			}
		}

		drawBorder(graphics, format, rect) {
			super.drawBorder(graphics, format, rect);
		}

		setFormat(graphics, item, format, id) {
			const lineColor = format.lineColor ? format.lineColor : item.getTemplate()[id].format.lineColor;
			const fillColor = format.fillColor ? format.fillColor : item.getTemplate()[id].format.fillColor;
			const lineStyle =
				format.lineStyle === undefined ? item.getTemplate()[id].format.lineStyle : format.lineStyle;
			const lineWidth =
				format.lineWidth === undefined ? item.getTemplate()[id].format.lineWidth : format.lineWidth;
			const fillStyle =
				format.fillStyle === undefined ? item.getTemplate()[id].format.fillStyle : format.fillStyle;

			const line = this.setLineStyle(graphics, lineStyle);
			if (line) {
				graphics.setLineWidth(lineWidth);
				graphics.setLineColor(lineColor);
			}
			if (fillStyle !== 0) {
				graphics.setFillColor(fillColor);
			}

			return {
				line,
				fill: fillStyle !== 0
			};
		}

		drawRect(graphics, rect, item, format, id) {
			const fi = this.setFormat(graphics, item, format, id);

			if (fi.fill) {
				if (format.transparency !== undefined) {
					graphics.setTransparency(format.transparency);
				}
				graphics.fillRectangle(rect.left, rect.top, rect.width, rect.height);
				if (format.transparency !== undefined) {
					graphics.setTransparency(100);
				}
			}
			if (fi.line) {
				graphics.drawRectangle(rect.left, rect.top, rect.width, rect.height);
			}
			return fi.line || fi.fill;
		}

		drawFill(graphics, format, rect) {
			super.drawFill(graphics, format, rect);

			const item = this.getItem();

			if (item._isFeedback) {
				return;
			}

			// graphics.save();
			// graphics.beginPath();
			// graphics.rect(rect.x, rect.y, rect.width, rect.height);
			// graphics.clip();

			const { series } = item;
			const plotRect = item.plot.position;
			const legendData = item.getLegend();

			if (plotRect.height > 0 && plotRect.width > 0) {
				let drawAxes = false;

				series.forEach((serie) => {
					switch (serie.type) {
						case 'pie':
						case 'doughnut':
							break;
						default:
							drawAxes = true;
							break;
					}
				});

				this.drawRect(graphics, plotRect, item, item.plot.format, 'plot');

				if (drawAxes) {
					this.drawValueRanges(graphics, plotRect, item, false);
					this.drawAxes(graphics, plotRect, item, true);
					this.drawValueRanges(graphics, plotRect, item, true);
				}

				let lastPoints;

				series.forEach((serie, index) => {
					if (serie.visible) {
						switch (serie.type) {
							case 'pie':
							case 'doughnut':
								this.drawCircular(graphics, item, plotRect, serie, index);
								break;
							default:
								lastPoints = this.drawCartesian(
									graphics,
									item,
									plotRect,
									serie,
									index,
									lastPoints,
									legendData
								);
								drawAxes = true;
								break;
						}
					}
				});

				lastPoints = undefined;

				series.forEach((serie, index) => {
					if (serie.visible && serie.dataLabel.visible) {
						lastPoints = this.drawLabels(graphics, item, plotRect, serie, index, lastPoints, legendData);
					}
				});

				if (drawAxes) {
					this.drawAxes(graphics, plotRect, item, false);
				}
			}

			if (item.chart.hiLoLines.visible) {
				this.drawHiLoLines(graphics, item, plotRect);
			}
			if (item.chart.upBars.visible) {
				this.drawUpDownBars(graphics, item, plotRect);
			}
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
				switch (action.title) {
					case 'sysicon':
						graphics.beginPath();
						graphics.setFillColor('#999999');
						graphics.circle(action.position.left + action.position.width / 2,
							action.position.top + 225, 50);
						graphics.circle(action.position.left + action.position.width / 2,
							action.position.top + 400, 50);
						graphics.circle(action.position.left + action.position.width / 2,
							action.position.top + 575, 50);
						graphics.fill();
						break;
					default:
						graphics.fillText(
							action.title,
							action.position.left + action.position.width / 2,
							action.position.top + action.position.height / 2
						);
						break;
				}
			});

			// graphics.restore();
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
			let fill = true;
			let line = true;
			const template = item.getTemplate();

			legendData.forEach((entry, index) => {
				graphics.beginPath();
				if (entry.series) {
					graphics.setLineWidth(entry.series.format.lineWidth || template.series.linewidth);
					line = this.setLineStyle(
						graphics,
						entry.series.format.lineStyle === undefined
							? template.series.linestyle
							: entry.series.format.lineStyle
					);
					fill =
						(entry.series.format.fillStyle === undefined
							? template.series.fillstyle
							: entry.series.format.fillStyle) > 0;
					graphics.setLineColor(entry.series.format.lineColor || template.series.getLineForIndex(index));
					graphics.setFillColor(entry.series.format.fillColor || template.series.getFillForIndex(index));
					type = entry.series.type;
				} else {
					graphics.setLineWidth(template.series.linewidth);
					line = this.setLineStyle(graphics, template.series.linestyle);
					fill = template.series.fillstyle > 0;
					const parts = String(entry.color).split(';');
					if (parts.length > 1) {
						graphics.setLineColor(parts[1]);
					}
					if (parts.length > 0) {
						graphics.setFillColor(parts[0]);
					}
				}

				switch (type) {
					case 'line':
					case 'profile':
					case 'scatter':
						graphics.moveTo(x, y + textSize.height / 2);
						graphics.lineTo(x + margin * 3, y + textSize.height / 2);
						if (fill) {
							this.fill(graphics, entry.series.format);
						}
						if (line) {
							graphics.stroke();
						}
						graphics.beginPath();
						graphics.setLineColor(
							entry.series.marker.lineColor || item.getTemplate().series.getLineForIndex(index)
						);
						graphics.setFillColor(
							entry.series.marker.fillColor || item.getTemplate().series.getFillForIndex(index)
						);
						if (entry.series.marker.style !== undefined) {
							graphics.clearLineDash();
							graphics.setLineWidth(-1);
							this.drawMarker(
								graphics,
								entry.series,
								{
									x: x + margin * 1.5,
									y: y + textSize.height / 2
								},
								3
							);
							graphics.fill();
							graphics.stroke();
						}
						break;
					case 'area':
					case 'column':
					// eslint-disable-next-line no-fallthrough
					case 'funnelbar':
					case 'funnelcolumn':
					case 'bar':
					case 'pie':
					case 'doughnut':
						if (item.isCircular()) {
							if (entry.series.format.lineColor === undefined) {
								graphics.setLineColor('#FFFFFF');
							} else {
								graphics.setLineColor(entry.series.format.lineColor);
							}
						}

						graphics.rect(x, y + textSize.height / 10, margin * 3, (textSize.height * 9) / 10);
						if (fill) {
							if (entry.series) {
								this.fill(graphics, entry.series.format);
							} else {
								graphics.fill();
							}
						}
						if (line) {
							graphics.stroke();
						}
						break;
					case 'bubble':
						textPos = margin * 2;
						graphics.circle(x + margin / 2, y + textSize.height / 2, (textSize.height * 2) / 5);
						if (fill) {
							this.fill(graphics, entry.series.format);
						}
						if (line) {
							graphics.stroke();
						}
						break;
					default:
						break;
				}

				const fontColor = legend.format.fontColor || template.legend.format.fontColor || template.font.color;

				graphics.setFillColor(fontColor);
				graphics.fillText(entry.name, x + textPos, y + (textSize.height * 1.1) / 2);

				if (
					legend.align === 'right' ||
					legend.align === 'middleright' ||
					legend.align === 'left' ||
					legend.align === 'middleleft'
				) {
					y += textSize.height * 1.3;
				} else {
					const size = item.measureText(graphics, cs, legend.format, 'legend', String(entry.name));
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

			let fi;
			let xLabelOffset = 0;
			let yLabelOffset = 0;
			const labelAngle =
				axis.format.fontRotation === undefined ? 0 : JSG.MathUtils.toRadians(-axis.format.fontRotation);

			graphics.beginPath();
			if (grid) {
				fi = this.setFormat(graphics, item, axis.formatGrid, 'axisgrid');
			} else {
				let hAlign = TextFormatAttributes.TextAlignment.CENTER;
				let vAlign = 'middle';
				let textSize;
				// draw axis line
				fi = this.setFormat(graphics, item, axis.format, 'axis');
				switch (axis.align) {
					case 'left':
						graphics.moveTo(axis.position.right, axis.position.top);
						graphics.lineTo(axis.position.right, axis.position.bottom);

						if (labelAngle > 0) {
							vAlign = 'bottom';
						} else if (labelAngle < 0) {
							vAlign = 'top';
						}
						item.setFont(
							graphics,
							axis.format,
							'axis',
							vAlign,
							Math.abs(labelAngle) === Math.PI_2
								? TextFormatAttributes.TextAlignment.CENTER
								: TextFormatAttributes.TextAlignment.RIGHT
						);
						textSize = item.measureText(graphics, graphics.getCoordinateSystem(), axis.format, 'axis', 'X');
						if (labelAngle > 0) {
							yLabelOffset = (Math.cos(labelAngle) * textSize.height) / 2;
						} else if (labelAngle < 0) {
							yLabelOffset = (-Math.cos(labelAngle) * textSize.height) / 2;
						}
						break;
					case 'right':
						graphics.moveTo(axis.position.left, axis.position.top);
						graphics.lineTo(axis.position.left, axis.position.bottom);

						if (labelAngle > 0) {
							vAlign = 'top';
						} else if (labelAngle < 0) {
							vAlign = 'bottom';
						}
						item.setFont(
							graphics,
							axis.format,
							'axis',
							vAlign,
							Math.abs(labelAngle) === Math.PI_2
								? TextFormatAttributes.TextAlignment.CENTER
								: TextFormatAttributes.TextAlignment.LEFT
						);
						textSize = item.measureText(graphics, graphics.getCoordinateSystem(), axis.format, 'axis', 'X');
						if (labelAngle > 0) {
							yLabelOffset = (-Math.cos(labelAngle) * textSize.height) / 2;
						} else if (labelAngle < 0) {
							yLabelOffset = (Math.cos(labelAngle) * textSize.height) / 2;
						}
						break;
					case 'top':
						graphics.moveTo(axis.position.left, axis.position.bottom);
						graphics.lineTo(axis.position.right, axis.position.bottom);
						if (labelAngle > 0) {
							hAlign = TextFormatAttributes.TextAlignment.LEFT;
						} else if (labelAngle < 0) {
							hAlign = TextFormatAttributes.TextAlignment.RIGHT;
						}
						item.setFont(graphics, axis.format, 'axis', 'bottom', hAlign);
						textSize = item.measureText(graphics, graphics.getCoordinateSystem(), axis.format, 'axis', 'X');
						xLabelOffset = (-Math.sin(labelAngle) * textSize.height) / 2;
						break;
					case 'bottom':
						graphics.moveTo(axis.position.left, axis.position.top);
						graphics.lineTo(axis.position.right, axis.position.top);
						if (labelAngle > 0) {
							hAlign = TextFormatAttributes.TextAlignment.RIGHT;
						} else if (labelAngle < 0) {
							hAlign = TextFormatAttributes.TextAlignment.LEFT;
						}
						item.setFont(graphics, axis.format, 'axis', 'top', hAlign);
						textSize = item.measureText(graphics, graphics.getCoordinateSystem(), axis.format, 'axis', 'X');
						xLabelOffset = (Math.sin(labelAngle) * textSize.height) / 2;
						break;
					default:
						break;
				}
				if (fi.line) {
					graphics.stroke();
				}
			}

			const refLabel = item.getDataSourceInfoAxis(axis);
			let current = item.getAxisStart(refLabel, axis);
			const final = item.getAxisEnd(axis);
			const cs = graphics.getCoordinateSystem();
			let last;
			let width = 0;
			let pos;
			let plot;
			let text;

			while (current.value <= final) {
				if (
					axis.type === 'category' &&
					(grid || !axis.betweenTicks ? current.value > axis.scale.max : current.value >= axis.scale.max)
				) {
					break;
				}

				pos = item.scaleToAxis(axis, current.value, undefined, grid);

				if (!grid) {
					if (axis.type === 'category' && refLabel) {
						text = item.getLabel(refLabel, axis, Math.floor(current.value));
					} else if (axis.format && axis.format.numberFormat) {
						text = item.formatNumber(current.value, axis.format);
					} else {
						text = item.formatNumber(current.value,
							axis.scale.format ? axis.scale.format : {numberFormat: axis.format.linkedNumberFormat, localCulture: axis.format.linkedLocalCulture});
					}
				}

				width = 0;
				switch (axis.align) {
					case 'left':
					case 'right':
						if (Math.abs(Math.abs(labelAngle) - Math.PI_2) < Math.PI / 20) {
							width = Math.abs(cs.deviceToLogX(graphics.measureText(text).width) * Math.sin(labelAngle));
						}
						break;
					case 'top':
					case 'bottom':
						if (Math.abs(labelAngle) < Math.PI / 20) {
							width = cs.deviceToLogX(graphics.measureText(text).width) * Math.cos(labelAngle);
						}
						break;
					default:
						break;
				}

				switch (axis.align) {
					case 'left':
						plot = plotRect.bottom - pos * plotRect.height;
						if (grid) {
							graphics.moveTo(plotRect.left, plot);
							graphics.lineTo(plotRect.right, plot);
						} else if (axis.invert) {
							if (last === undefined || plot - width / 2 + 100 > last) {
								this.drawRotatedText(
									graphics,
									`${text}`,
									axis.position.right - 200,
									plot,
									labelAngle,
									xLabelOffset,
									yLabelOffset
								);
							}
							last = plot + width / 2;
						} else if (last === undefined || plot + width / 2 + 100 < last) {
							this.drawRotatedText(
								graphics,
								`${text}`,
								axis.position.right - 200,
								plot,
								labelAngle,
								xLabelOffset,
								yLabelOffset
							);
							last = plot - width / 2;
						}
						break;
					case 'right':
						plot = plotRect.bottom - pos * plotRect.height;
						if (grid) {
							graphics.moveTo(plotRect.left, plot);
							graphics.lineTo(plotRect.right, plot);
						} else if (axis.invert) {
							if (last === undefined || plot - width / 2 + 100 > last) {
								this.drawRotatedText(
									graphics,
									`${text}`,
									axis.position.left + 200,
									plot,
									labelAngle,
									xLabelOffset,
									yLabelOffset
								);
							}
							last = plot + width / 2;
						} else if (last === undefined || plot + width / 2 + 100 < last) {
							this.drawRotatedText(
								graphics,
								`${text}`,
								axis.position.left + 200,
								plot,
								labelAngle,
								xLabelOffset,
								yLabelOffset
							);
							last = plot - width / 2;
						}
						break;
					case 'top':
						plot = plotRect.left + pos * plotRect.width;
						if (grid) {
							graphics.moveTo(plot, plotRect.top);
							graphics.lineTo(plot, plotRect.bottom);
						} else if (axis.invert) {
							if (last === undefined || plot + width / 2 + 100 < last) {
								this.drawRotatedText(
									graphics,
									`${text}`,
									plot,
									axis.position.bottom - 200,
									labelAngle,
									xLabelOffset,
									yLabelOffset
								);
							}
							last = plot - width / 2;
						} else if (last === undefined || plot - width / 2 + 100 > last) {
							this.drawRotatedText(
								graphics,
								`${text}`,
								plot,
								axis.position.bottom - 200,
								labelAngle,
								xLabelOffset,
								yLabelOffset
							);
							last = plot + width / 2;
						}
						break;
					case 'bottom':
						plot = plotRect.left + pos * plotRect.width;
						if (grid) {
							graphics.moveTo(plot, plotRect.top);
							graphics.lineTo(plot, plotRect.bottom);
						} else if (axis.invert) {
							if (last === undefined || plot + width / 2 + 100 < last) {
								this.drawRotatedText(
									graphics,
									`${text}`,
									plot,
									axis.position.top + 200,
									labelAngle,
									xLabelOffset,
									yLabelOffset
								);
							}
							last = plot - width / 2;
						} else if (last === undefined || plot - width / 2 + 100 > last) {
							this.drawRotatedText(
								graphics,
								`${text}`,
								plot,
								axis.position.top + 200,
								labelAngle,
								xLabelOffset,
								yLabelOffset
							);
							last = plot + width / 2;
						}
						break;
					default:
						break;
				}

				current = item.incrementScale(refLabel, axis, current);
			}
			if (grid && fi.line) {
				graphics.stroke();
			}
		}

		drawValueRanges(graphics, plotRect, item, lines) {
			graphics.save();
			graphics.beginPath();
			graphics.rect(plotRect.left - 10, plotRect.top - 10, plotRect.width + 20, plotRect.height + 20);
			graphics.clip();

			item.xAxes.forEach((axis) => {
				if (axis.visible) {
					this.drawValueRange(graphics, plotRect, item, axis, lines);
				}
			});

			item.yAxes.forEach((axis) => {
				if (axis.visible) {
					this.drawValueRange(graphics, plotRect, item, axis, lines);
				}
			});

			graphics.restore();
		}

		drawValueRange(graphics, plotRect, item, axis, lines) {
			item.setFont(
				graphics,
				axis.format,
				'axis',
				'bottom',
				TextFormatAttributes.TextAlignment.LEFT
			);

			axis.valueRanges.forEach((range) => {
				let startBegin = item.scaleToAxis(axis, range.from, undefined, true);
				let startEnd = item.scaleToAxis(axis, range.from + range.width, undefined, true);
				let endBegin = item.scaleToAxis(axis, range.to, undefined, true);
				let endEnd = item.scaleToAxis(axis, range.to + range.width, undefined, true);
				switch (axis.align) {
					case 'left':
					case 'right':
						startBegin = plotRect.bottom - startBegin * plotRect.height;
						startEnd = plotRect.bottom - startEnd * plotRect.height;
						endBegin = plotRect.bottom - endBegin * plotRect.height;
						endEnd = plotRect.bottom - endEnd * plotRect.height;
						if (range.label && lines) {
							graphics.setFillColor('#AAAAAA');
							graphics.fillText(range.label, plotRect.left + 100, startBegin - 100);
						}
						graphics.beginPath();
						if (range.width === 0 && lines) {
							graphics.setLineColor(range.format.fillColor);
							graphics.moveTo(plotRect.left, startBegin);
							graphics.lineTo(plotRect.right, endBegin);
							graphics.stroke();
						} else if (range.width >= 1 && !lines) {
							graphics.setFillColor(range.format.fillColor);
							graphics.setTransparency(range.format.transparency);
							graphics.moveTo(plotRect.left, startBegin);
							graphics.lineTo(plotRect.right, endBegin);
							graphics.lineTo(plotRect.right, endEnd);
							graphics.lineTo(plotRect.left, startEnd);
							graphics.fill();
							graphics.setTransparency(100);
						}
						break;
					case 'top':
					case 'bottom':
						startBegin = plotRect.left + startBegin * plotRect.width;
						startEnd = plotRect.left + startEnd * plotRect.width;
						endBegin = plotRect.left + endBegin * plotRect.width;
						endEnd = plotRect.left + endEnd * plotRect.width;
						graphics.beginPath();
						if (range.width === 0 && lines) {
							graphics.setLineColor(range.format.fillColor);
							graphics.moveTo(startBegin, plotRect.bottom);
							graphics.lineTo(endBegin, plotRect.top);
							graphics.stroke();
						} else if (range.width >= 1 && !lines) {
							graphics.setFillColor(range.format.fillColor);
							graphics.setTransparency(range.format.transparency);
							graphics.moveTo(startBegin, plotRect.bottom);
							graphics.lineTo(endBegin, plotRect.top);
							graphics.lineTo(endEnd, plotRect.top);
							graphics.lineTo(startEnd, plotRect.bottom);
							graphics.fill();
							graphics.setTransparency(100);
						}
						break;
					default:
						break;
				}
			});

		}

		drawRotatedText(graphics, text, x, y, angle, xOffset, yOffset) {
			if (angle) {
				graphics.translate(x - xOffset, y + yOffset);
				graphics.rotate(-angle);
				graphics.fillText(text, 0, 0);
				graphics.rotate(angle);
				graphics.translate(-x + xOffset, -y - yOffset);
			} else {
				graphics.fillText(text, x, y);
			}
		}

		setLineStyle(graphics, lineStyle) {
			if (lineStyle === undefined) {
				lineStyle = 1;
			}

			if (lineStyle === 'none') {
				lineStyle = 0;
			}
			graphics.setLineStyle(lineStyle);
			if (lineStyle > 1) {
				graphics.applyLineDash();
			} else {
				graphics.clearLineDash();
			}

			return lineStyle > 0;
		}

		fill(graphics, format) {
			if (format.transparency !== undefined) {
				graphics.setTransparency(format.transparency);
			}
			graphics.fill();
			if (format.transparency !== undefined) {
				graphics.setTransparency(100);
			}
		}

		drawCircular(graphics, item, plotRect, serie, seriesIndex) {
			const ref = item.getDataSourceInfo(serie.formula);
			const value = {};
			const pieInfo = item.getPieInfo(ref, serie, plotRect, seriesIndex);
			const fillRect = new Rectangle();

			graphics.setLineJoin('round');

			if (serie.type === 'pie' && item.series.length > 1 && ref.yName) {
				item.setFont(
					graphics,
					item.legend.format,
					'legend',
					'middle',
					TextFormatAttributes.TextAlignment.CENTER
				);
				graphics.fillText(ref.yName, pieInfo.rect.left + pieInfo.rect.width / 2, pieInfo.rect.top - 500);
			}

			graphics.setLineColor(serie.format.lineColor || item.getTemplate().series.getLineForIndex(seriesIndex));
			graphics.setLineWidth(serie.format.lineWidth || item.getTemplate().series.linewidth);
			const line = this.setLineStyle(graphics, serie.format.lineStyle);
			graphics.setFillColor(serie.format.fillColor || item.getTemplate().series.getFillForIndex(seriesIndex));
			const fill =
				(serie.format.fillStyle === undefined ? item.getTemplate().series.fillstyle : serie.format.fillStyle) >
				0;
			let index = 0;

			if (item.chart.rotation < Math.PI / 2) {
				graphics.beginPath();
				graphics.moveTo(pieInfo.xc, pieInfo.yc);
				graphics.lineTo(pieInfo.xc, pieInfo.yc + pieInfo.height);
				graphics.lineTo(pieInfo.xc + pieInfo.xRadius * Math.cos(pieInfo.startAngle),
					pieInfo.yc + pieInfo.height + pieInfo.yRadius * Math.sin(pieInfo.startAngle));
				graphics.lineTo(pieInfo.xc + pieInfo.xRadius * Math.cos(pieInfo.startAngle),
					pieInfo.yc + pieInfo.yRadius * Math.sin(pieInfo.startAngle));
				if (serie.format.lineColor === undefined) {
					graphics.setLineColor('#FFFFFF');
				} else {
					graphics.setLineColor(serie.format.lineColor);
				}
				graphics.setFillColor(
					serie.format.fillColor || item.getTemplate().series.getFillForIndex(0)
				);
				this.fill(graphics, serie.format);
				graphics.stroke();
				graphics.beginPath();
				graphics.moveTo(pieInfo.xc, pieInfo.yc);
				graphics.lineTo(pieInfo.xc, pieInfo.yc + pieInfo.height);
				graphics.lineTo(pieInfo.xc + pieInfo.xRadius * Math.cos(pieInfo.endAngle),
					pieInfo.yc + pieInfo.height + pieInfo.yRadius * Math.sin(pieInfo.endAngle));
				graphics.lineTo(pieInfo.xc + pieInfo.xRadius * Math.cos(pieInfo.endAngle),
					pieInfo.yc + pieInfo.yRadius * Math.sin(pieInfo.endAngle));
				while (item.getValue(ref, index, value)) {
					index += 1;
				}
				graphics.setFillColor(
					serie.format.fillColor || item.getTemplate().series.getFillForIndex(index - 1)
				);
				this.fill(graphics, serie.format);
				graphics.stroke();
			}

			for (let i = 0; i < 2; i += 1) {
				let currentAngle = pieInfo.startAngle;
				index = 0;
				while (item.getValue(ref, index, value)) {
					if (value.x !== undefined && value.y !== undefined) {
						if (serie.format.lineColor === undefined) {
							graphics.setLineColor('#FFFFFF');
						} else {
							graphics.setLineColor(serie.format.lineColor);
						}

						graphics.setFillColor(
							serie.format.fillColor || item.getTemplate().series.getFillForIndex(item.chart.varyByCategories ? index : seriesIndex)
						);

						const angle = (Math.abs(value.y) / pieInfo.sum) * (pieInfo.endAngle - pieInfo.startAngle);
						switch (serie.type) {
							case 'doughnut': {
								graphics.beginPath();
								graphics.ellipse(
									pieInfo.xc,
									pieInfo.yc,
									pieInfo.xOuterRadius,
									pieInfo.yOuterRadius,
									0,
									currentAngle,
									currentAngle + angle,
									false
								);
								graphics.ellipse(
									pieInfo.xc,
									pieInfo.yc,
									pieInfo.xInnerRadius,
									pieInfo.yInnerRadius,
									0,
									currentAngle + angle,
									currentAngle,
									true
								);
								if (i) {
									if (line) {
										graphics.stroke();
									}
								} else if (fill) {
									this.fill(graphics, serie.format);
								}
								break;
							}
							case 'pie':
								graphics.beginPath();
								graphics.ellipse(
									pieInfo.xc,
									pieInfo.yc,
									pieInfo.xRadius,
									pieInfo.yRadius,
									0,
									currentAngle,
									currentAngle + angle,
									false
								);
								graphics.lineTo(pieInfo.xc, pieInfo.yc);
								graphics.closePath()

								if (i) {
									if (line) {
										graphics.stroke();
									}
								} else if (fill) {
									this.fill(graphics, serie.format);
								}

								// 3d front
								if (item.chart.rotation < Math.PI / 2) {
									if (
										(currentAngle >= 0 && currentAngle <= Math.PI) ||
										(currentAngle + angle >= 0 && currentAngle + angle <= Math.PI) ||
										angle >= Math.PI
									) {
										graphics.beginPath();
										graphics.ellipse(
											pieInfo.xc,
											pieInfo.yc,
											pieInfo.xRadius,
											pieInfo.yRadius,
											0,
											Math.max(0, currentAngle),
											Math.min(Math.PI, currentAngle + angle),
											false
										);
										const x1 =
											pieInfo.xc +
											pieInfo.xRadius * Math.cos(Math.min(Math.PI, currentAngle + angle));
										let y =
											pieInfo.yc +
											pieInfo.height +
											pieInfo.yRadius * Math.sin(Math.min(Math.PI, currentAngle + angle));
										graphics.lineTo(x1, y);

										graphics.ellipse(
											pieInfo.xc,
											pieInfo.yc + pieInfo.height,
											pieInfo.xRadius,
											pieInfo.yRadius,
											0,
											Math.min(Math.PI, currentAngle + angle),
											Math.max(0, currentAngle),
											true
										);
										const x2 = pieInfo.xc + pieInfo.xRadius * Math.cos(Math.max(0, currentAngle));
										y = pieInfo.yc + pieInfo.yRadius * Math.sin(Math.max(0, currentAngle));
										graphics.lineTo(x2, y);

										if (i) {
											if (line) {
												graphics.stroke();
											}
										} else {
											fillRect.set(pieInfo.rect.left, y, pieInfo.rect.width, y);
											graphics.setGradientLinear(
												fillRect,
												serie.format.fillColor ||
												item.getTemplate().series.getFillForIndex(index),
												'#333333',
												0,
												0
											);
											if (fill) {
												this.fill(graphics, serie.format);
											}
										}
									}
								}
								break;
							default:
								break;
						}
						currentAngle += angle;
					}
					index += 1;
				}
			}

			graphics.setLineJoin('miter');
		}

		drawCartesian(graphics, item, plotRect, serie, seriesIndex, lastPoints, legendData) {
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
			graphics.rect(plotRect.left - 10, plotRect.top - 10, plotRect.width + 20, plotRect.height + 20);
			graphics.clip();

			graphics.beginPath();

			graphics.setLineColor(serie.format.lineColor || item.getTemplate().series.getLineForIndex(seriesIndex));
			graphics.setLineWidth(serie.format.lineWidth || item.getTemplate().series.linewidth);
			let line = this.setLineStyle(graphics, serie.format.lineStyle);
			graphics.setFillColor(serie.format.fillColor || item.getTemplate().series.getFillForIndex(seriesIndex));
			const fill =
				(serie.format.fillStyle === undefined ? item.getTemplate().series.fillstyle : serie.format.fillStyle) >
				0;

			const barWidth = item.getBarWidth(axes, serie, plotRect);
			const points = [];
			let newLine = true;
			let xFirst;
			let xLast;
			let noLast = false;
			const pt = { x: 0, y: 0 };
			const ptPrev = { x: 0, y: 0 };
			const ptNext = { x: 0, y: 0 };
			const ptLast = { x: 0, y: 0 };
			const info = {
				serie,
				seriesIndex,
				index: 0,
				categories: axes.y.categories
			};
			const isLineType = item.isLineType(serie);
			const varyByCategories = item.chart.varyByCategories && !isLineType;
			const thresholds = item.hasLegendRange() ? item.getLegend() :  undefined;
			const varyByTreshold = (serie.type === 'column' || serie.type === 'bar' || serie.type === 'area') && thresholds && thresholds.length;
			const heatInfo = serie.type === 'heatmap' ?  this.prepareHeatmap(graphics, thresholds, plotRect) : undefined;
			let gradient;

			if (varyByTreshold) {
				let max;
				thresholds.forEach((threshold) => {
					if (Numbers.isNumber(threshold.name) && String(threshold.color).length) {
						max = max === undefined ? threshold.name : Math.max(max, threshold.name);
					}
				});
				if (max !== undefined) {
					const cs = graphics.getCoordinateSystem();
					pt.y = item.scaleToAxis(axes.y, axes.y.minData, info, false);
					item.toPlot(serie, plotRect, pt);
					ptPrev.y = item.scaleToAxis(axes.y, axes.y.maxData, info, false);
					item.toPlot(serie, plotRect, ptPrev);
					if (item.isHorizontalChart()) {
						gradient = graphics.createLinearGradient(pt.x, 0, ptPrev.x, 0);
					} else {
						gradient = graphics.createLinearGradient(0, pt.y, 0, ptPrev.y);
					}
					thresholds.forEach((threshold, inx) => {
						if (Numbers.isNumber(threshold.name) && String(threshold.color).length) {
							let val = Math.max(0, Math.min(1, (threshold.name - axes.y.minData) / (axes.y.maxData - axes.y.minData)));
							try {
								gradient.addColorStop(val, String(threshold.color));
								if (inx === thresholds.length - 1) {
									gradient.addColorStop(1, String(threshold.color));
								}
							} catch (e) {
								val = Numbers.isNumber(val) ? val : 1;
								gradient.addColorStop(val, '#CCCCCC');
							}
						}
					});
				}
			}

			while (item.getValue(ref, index, value)) {
				info.index = index;
				if (item.chart.dataMode === 'datainterrupt' || (value.x !== undefined && value.y !== undefined)) {
					if (varyByCategories) {
						graphics.setLineColor(
							serie.format.lineColor || item.getTemplate().series.getLineForIndex(index)
						);
						graphics.setFillColor(
							serie.format.fillColor || item.getTemplate().series.getFillForIndex(index)
						);
					}
					if (varyByTreshold && value.y !== undefined) {
						let fillColor;
						line = false;
						switch (item.chart.varyByThreshold) {
							case 'colorchange':
								thresholds.some((threshold, inx) => {
									if (Numbers.isNumber(value.y) && (value.y <= threshold.name || inx === thresholds.length - 1)) {
										fillColor = threshold.color;
										return true;
									}
									return false;
								});
								if (fillColor === undefined) {
									graphics.setFillColor(serie.format.fillColor || item.getTemplate().series.getFillForIndex(seriesIndex));
									graphics.setLineColor(serie.format.lineColor || item.getTemplate().series.getLineForIndex(seriesIndex));
								} else {
									graphics.setFillColor(fillColor);
									graphics.setLineColor(fillColor);
								}
								break;
							case 'gradient':
								if (gradient) {
									graphics._context2D.fillStyle = gradient;
								}
								break;
							default:
								break;
						}
					}
					pt.x = item.scaleToAxis(axes.x, value.x, undefined, false);
					pt.y = item.scaleToAxis(axes.y, value.y, info, false);
					item.toPlot(serie, plotRect, pt);
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
									item.getPlotPoint(axes, ref, info, value, index, -1, ptLast);
									item.toPlot(serie, plotRect, ptLast);

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
						case 'heatmap':
							if (value.x !== undefined && value.y !== undefined && value.c !== undefined) {
								heatInfo.context.globalAlpha = Math.min(Math.max(value.c / axes.y.cMaxData, 0.05), 1);
								heatInfo.context.drawImage(heatInfo.circle,
									heatInfo.cs.logToDeviceX(pt.x - plotRect.left) - heatInfo.r,
									heatInfo.cs.logToDeviceX(pt.y - plotRect.top) - heatInfo.r);
							}
							break;
						case 'bubble':
							if (value.x !== undefined && value.y !== undefined && value.c !== undefined) {
								const radius = item.scaleBubble(axes.y, plotRect, serie, value.c);
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
									item.getPlotPoint(axes, ref, info, value, index, 1, ptNext);
									item.getPlotPoint(axes, ref, info, value, index, -1, ptLast);
									item.getPlotPoint(axes, ref, info, value, index, -2, ptPrev);
									item.toPlot(serie, plotRect, ptPrev);
									item.toPlot(serie, plotRect, ptLast);
									item.toPlot(serie, plotRect, ptNext);

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
								noLast = true;
								xFirst = pt.x;
								xLast = pt.x;
							} else {
								if (serie.smooth && !item.chart.step) {
									item.getPlotPoint(axes, ref, info, value, index, -1, ptLast);
									item.toPlot(serie, plotRect, ptLast);

									const midX = (ptLast.x + pt.x) / 2;
									const midY = (ptLast.y + pt.y) / 2;
									const cpX1 = (midX + ptLast.x) / 2;
									const cpX2 = (midX + pt.x) / 2;
									graphics.quadraticCurveTo(cpX1, ptLast.y, midX, midY);
									graphics.quadraticCurveTo(cpX2, pt.y, pt.x, pt.y);
								} else if (item.chart.step) {
									item.getPlotPoint(axes, ref, info, value, index, -1, ptLast);
									item.toPlot(serie, plotRect, ptLast);
									graphics.lineTo(pt.x, ptLast.y);
									graphics.lineTo(pt.x, pt.y);
								} else {
									graphics.lineTo(pt.x, pt.y);
								}

								xLast = pt.x;
							}
							if (serie.type === 'area') {
								if (newLine) {
									pt.y = item.scaleToAxis(axes.y, 0, undefined, false);
									pt.y = plotRect.bottom - pt.y * plotRect.height;
									graphics.lineTo(xLast, pt.y);
									graphics.lineTo(xFirst, pt.y);
									graphics.closePath();
									if (fill) {
										this.fill(graphics, serie.format);
									}
									if (line) {
										graphics.stroke();
									}
									graphics.beginPath();
								}
								if (item.chart.stacked) {
									if (item.chart.step && !noLast) {
										points.push({
											x: pt.x,
											y: ptLast.y
										});
									}
									noLast = false;
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
								if (barInfo.height) {
									graphics.rect(
										pt.x + barInfo.offset,
										pt.y,
										barWidth - barInfo.margin,
										-barInfo.height * plotRect.height
									);
								}
							}
							break;
						case 'bar':
							if (value.x !== undefined && value.y !== undefined) {
								barInfo = item.getBarInfo(axes, serie, seriesIndex, index, value.y, barWidth);
								if (barInfo.height) {
									graphics.rect(
										pt.x,
										pt.y + barInfo.offset,
										barInfo.height * plotRect.width,
										barWidth - barInfo.margin
									);
								}
							}
							break;
						default:
							graphics.setTextBaseline('center');
							graphics.setFillColor('#CCCCCC');
							graphics.setTextAlignment(1);
							graphics.setFontName('Verdana');
							graphics.setFontSize('8');
							graphics.setFontStyle(0);
							graphics.setFont();
							graphics.fillText('Chart Type not available', plotRect.center.x, plotRect.center.y);
							break;
					}
				}
				index += 1;
				if (varyByCategories || (varyByTreshold && serie.type !== 'area')) {
					if (fill) {
						this.fill(graphics, serie.format);
					}
					if (line && serie.type !== 'state') {
						graphics.stroke();
					}
					graphics.beginPath();
				}
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
							graphics.quadraticCurveTo(cpX2, point.y, point.x, point.y);
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

			if (!varyByCategories) {
				if (
					fill &&
					(serie.type === 'column' || serie.type === 'bar' || serie.type === 'funnelbar' ||
						serie.type === 'funnelcolumn' || serie.type === 'area' || serie.type === 'bubble')
				) {
					this.fill(graphics, serie.format);
				}
				if (line && serie.type !== 'state') {
					graphics.stroke();
				}
			}

			if (serie.type === 'heatmap') {
				const colored = heatInfo.context.getImageData(0, 0, heatInfo.canvasPlot.width, heatInfo.canvasPlot.height);
				const pixels = colored.data;
				for (let i = 0, len = pixels.length, j; i < len; i += 4) {
					j = pixels[i + 3] * 4; // get gradient color from opacity value

					if (j) {
						pixels[i] = heatInfo.gradient[j];
						pixels[i + 1] = heatInfo.gradient[j + 1];
						pixels[i + 2] = heatInfo.gradient[j + 2];
					}
				}
				heatInfo.context.globalAlpha = 1;
				heatInfo.context.putImageData(colored, 0, 0);
				graphics.drawImage(heatInfo.canvasPlot, plotRect.left, plotRect.top);
			}

			graphics.setLineWidth(-1);
			graphics.restore();

			if (serie.marker.style !== 'none') {
				index = 0;
				graphics.beginPath();
				graphics.setLineColor(serie.marker.lineColor || item.getTemplate().series.getLineForIndex(seriesIndex));
				graphics.setFillColor(serie.marker.fillColor || item.getTemplate().series.getFillForIndex(seriesIndex));
				while (item.getValue(ref, index, value)) {
					info.index = index;
					if (item.chart.dataMode === 'datainterrupt' || (value.x !== undefined && value.y !== undefined)) {
						pt.x = item.scaleToAxis(axes.x, value.x, undefined, false);
						pt.y = item.scaleToAxis(axes.y, value.y, info, false);
						switch (serie.type) {
							case 'profile':
							case 'line':
							case 'scatter':
								item.toPlot(serie, plotRect, pt);
								if (plotRect.containsPoint(pt)) {
									this.drawMarker(graphics, serie, {
										x: pt.x,
										y: pt.y
									});
								}
								break;
							default:
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

		drawLabels(graphics, item, plotRect, serie, seriesIndex, lastPoints, legendData) {
			let index = 0;
			const value = {};
			const ref = item.getDataSourceInfo(serie.formula);
			const axes = item.getAxes(serie);

			if (!ref || !axes) {
				return undefined;
			}

			const barWidth = item.getBarWidth(axes, serie, plotRect);
			const points = [];
			const pt = { x: 0, y: 0 };
			const info = {
				serie,
				seriesIndex,
				categories: axes.y.categories
			};
			const pieInfo = item.isCircular() ? item.getPieInfo(ref, serie, plotRect, seriesIndex) : undefined;
			const labelAngle =
				serie.dataLabel.format.fontRotation === undefined
					? 0
					: JSG.MathUtils.toRadians(-serie.dataLabel.format.fontRotation);

			item.setFont(
				graphics,
				serie.dataLabel.format,
				'serieslabel',
				'middle',
				TextFormatAttributes.TextAlignment.CENTER
			);
			const params = {
				graphics,
				serie,
				info,
				ref,
				axes,
				plotRect,
				barWidth,
				seriesIndex,
				points,
				lastPoints,
				pieInfo,
				currentAngle: pieInfo ? pieInfo.startAngle : 0
			};
			const name =
				serie.dataLabel.format.fontName ||
				item.getTemplate().serieslabel.format.fontName ||
				item.getTemplate().font.name;
			const size =
				serie.dataLabel.format.fontSize ||
				item.getTemplate().serieslabel.format.fontSize ||
				item.getTemplate().font.size;
			const lineHeight = GraphUtils.getFontMetricsEx(name, size).lineheight + 50;
			const horizontalChart = item.isHorizontalChart();

			while (item.getValue(ref, index, value)) {
				info.index = index;
				if (value.x !== undefined && value.y !== undefined) {
					pt.x = item.scaleToAxis(axes.x, value.x, undefined, false);
					pt.y = item.scaleToAxis(axes.y, value.y, info, false);
					item.toPlot(serie, plotRect, pt);

					if (horizontalChart || (pt.x >= plotRect.left && pt.x <= plotRect.right)) {
						const text = item.getDataLabel(value, axes.x, ref, serie, legendData);
						const labelRect = item.getLabelRect(pt, value, text, index, params);
						if (labelRect) {
							const center = labelRect.center;
							if (labelAngle !== 0) {
								graphics.translate(center.x, center.y);
								labelRect.translate(-center.x, -center.y);
								graphics.rotate(-labelAngle);
							}

							if (this.drawRect(graphics, labelRect, item, serie.dataLabel.format, 'serieslabel')) {
								item.setFont(
									graphics,
									serie.dataLabel.format,
									'serieslabel',
									'middle',
									TextFormatAttributes.TextAlignment.CENTER
								);
							}
							if (labelAngle !== 0) {
								graphics.rotate(labelAngle);
								labelRect.translate(center.x, center.y);
								graphics.translate(-center.x, -center.y);
							}

							if (text instanceof Array) {
								let y = labelRect.top + 75 + lineHeight / 2;
								text.forEach((part, pi) => {
									y = center.y - ((text.length - 1) * lineHeight) / 2 + pi * lineHeight;
									const p = MathUtils.getRotatedPoint({ x: center.x, y }, center, -labelAngle);
									this.drawRotatedText(graphics, part, p.x, p.y, labelAngle, 0, 0);
								});
							} else {
								this.drawRotatedText(graphics, `${text}`, center.x, center.y, labelAngle, 0, 0);
							}
						}
					}
				}
				index += 1;
			}

			return params.points;
		}

		drawHiLoLines(graphics, item, plotRect) {
			let index = 0;
			const value = {};

			const serie = item.getFirstSerieOfType('line');
			if (!serie) {
				return;
			}

			const ref = item.getDataSourceInfo(serie.formula);
			const axes = item.getAxes(serie);

			if (!ref || !axes) {
				return;
			}

			graphics.beginPath();

			const fi = this.setFormat(graphics, item, item.chart.hiLoLines.format, 'hilolines');
			if (fi.line === false) {
				return;
			}

			const ptLow = {x: 0, y: 0};
			const ptHigh = {x: 0, y: 0};
			const info = {
				serie,
				seriesIndex: 0,
				categories: axes.y.categories
			};
			let tmp;

			while (item.getValue(ref, index, value)) {
				info.index = index;
				if (value.x !== undefined && value.y !== undefined) {
					ptLow.x = item.scaleToAxis(axes.x, value.x, undefined, false);
					ptHigh.x = ptLow.x;
					ptLow.y = undefined;
					ptHigh.y = undefined;
					for (let i = 0; i < item.series.length; i += 1) {
						if (item.series[i].type === 'line' && axes.y.categories[index].values[i] !== undefined) {
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
						if (plotRect.containsPoint(ptLow)) {
							graphics.moveTo(ptLow.x, ptLow.y);
							graphics.lineTo(ptHigh.x, ptHigh.y);
						}
					}
				}
				index += 1;
			}
			graphics.stroke();
		}

		drawUpDownBars(graphics, item, plotRect) {
			let index = 0;
			const value = {};
			const indices = item.getFirstLastSerieIndicesOfType('line');
			if (indices.first === undefined || indices.last === undefined) {
				return;
			}
			const serie = item.series[indices.first];

			const ref = item.getDataSourceInfo(serie.formula);
			const axes = item.getAxes(serie);
			if (!ref || !axes) {
				return;
			}

			const ptLow = {x: 0, y: 0};
			const ptHigh = {x: 0, y: 0};
			const rect = new ChartRect();
			const info = {
				serie,
				seriesIndex: 0,
				categories: axes.y.categories
			};
			let tmp;
			const barWidth = item.getUpDownBarWidth(axes, plotRect);

			while (item.getValue(ref, index, value)) {
				info.index = index;
				if (value.x !== undefined && value.y !== undefined) {
					ptLow.x = item.scaleToAxis(axes.x, value.x, undefined, false);
					ptHigh.x = ptLow.x;
					ptLow.y = undefined;
					ptHigh.y = undefined;
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
						if (plotRect.containsPoint(ptLow)) {
							rect.set(ptHigh.x - barWidth / 2, ptHigh.y, ptHigh.x + barWidth / 2, ptLow.y)
							if (ptLow.y > ptHigh.y) {
								this.drawRect(graphics, rect, item, item.chart.upBars.format, 'upbars');
							} else {
								this.drawRect(graphics, rect, item, item.chart.downBars.format, 'downbars');
							}
						}
					}
				}
				index += 1;
			}
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

			switch (serie.marker.style) {
				case 'circle':
					graphics.moveTo(pos.x, pos.y);
					graphics.circle(pos.x, pos.y, size / 2);
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
					break;
				case 'dashright':
					graphics.rect(pos.x, pos.y - size / 6, size, size / 3);
					break;
				case 'line':
					graphics.moveTo(pos.x - size / 2, pos.y);
					graphics.lineTo(pos.x + size / 2, pos.y);
					break;
				case 'rect':
					graphics.rect(pos.x - size / 2, pos.y - size / 2, size, size);
					break;
				case 'rectRot':
					graphics.moveTo(pos.x, pos.y - size / 2);
					graphics.lineTo(pos.x + size / 2, pos.y);
					graphics.lineTo(pos.x, pos.y + size / 2);
					graphics.lineTo(pos.x - size / 2, pos.y);
					graphics.closePath();
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
					break;
				default:
					break;
			}
		}

		prepareHeatmap(graphics, thresholds, plotRect) {
			const blur = 15;
			const r = 25;
			const item = this.getItem();

			const circle = document.createElement('canvas');
			let ctx = circle.getContext('2d');
			const r2 = r + blur;

			circle.width = r2 * 2;
			circle.height = r2 * 2;

			ctx.shadowOffsetX = r2 * 2;
			ctx.shadowOffsetY = r2 * 2;
			ctx.shadowBlur = blur;
			ctx.shadowColor = 'black';

			ctx.beginPath();
			ctx.arc(-r2, -r2, r, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();

			// create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
			const canvas = document.createElement('canvas');
			ctx = canvas.getContext('2d');
			const gradient = ctx.createLinearGradient(0, 0, 0, 256);

			canvas.width = 1;
			canvas.height = 256;

			if (thresholds && thresholds.length) {
				thresholds.forEach((threshold) => {
					if (Numbers.isNumber(threshold.name) && String(threshold.color).length) {
						try {
							gradient.addColorStop(threshold.name, String(threshold.color));
						} catch (e) {
							gradient.addColorStop(threshold.name, '#CCCCCC');
						}
					}
				});
			} else {
				gradient.addColorStop(0.4, 'blue');
				gradient.addColorStop(0.6, 'cyan');
				gradient.addColorStop(0.7, 'lime');
				gradient.addColorStop(0.8, 'yellow');
				gradient.addColorStop(1, 'red');
			}

			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, 1, 256);

			const image = ctx.getImageData(0, 0, 1, 256).data;

			const canvasPlot = document.createElement('canvas');
			const context = canvasPlot.getContext('2d');
			const cs = graphics.getCoordinateSystem();
			canvasPlot.width = cs.logToDeviceX(plotRect.width);
			canvasPlot.height = cs.logToDeviceX(plotRect.height);

			context.clearRect(0, 0, this._width, this._height);
			return {
				circle,
				canvasPlot,
				context,
				cs: graphics.getCoordinateSystem(),
				gradient: image,
				r: r2
			};
		}

		getSelectedFormat() {
			const f = new FormatAttributes();

			if (this.chartSelection) {
				const data = this.getItem().getDataFromSelection(this.chartSelection);
				const template = this.getItem().getTemplate();
				if (data) {
					switch (this.chartSelection.element) {
						case 'serieslabel':
							f.setFillColor(
								data.dataLabel.format.fillColor ||
								template[this.chartSelection.element].format.fillColor
							);
							f.setFillStyle(
								data.dataLabel.format.fillStyle === undefined
									? template[this.chartSelection.element].format.fillStyle
									: data.dataLabel.format.fillStyle
							);
							f.setTransparency(
								data.dataLabel.format.transparency === undefined
									? 100
									: data.dataLabel.format.transparency
							);
							f.setLineColor(
								data.dataLabel.format.lineColor ||
								template[this.chartSelection.element].format.lineColor
							);
							f.setLineStyle(
								data.dataLabel.format.lineStyle === undefined
									? template[this.chartSelection.element].format.lineStyle
									: data.dataLabel.format.lineStyle
							);
							f.setLineWidth(
								data.dataLabel.format.lineWidth === undefined
									? template[this.chartSelection.element].format.lineWidth
									: data.dataLabel.format.lineWidth
							);
							break;
						case 'hilolines':
						case 'upbars':
						case 'downbars':
						case 'plot':
						case 'title':
						case 'legend':
							f.setFillColor(
								data.format.fillColor || template[this.chartSelection.element].format.fillColor
							);
							f.setFillStyle(
								data.format.fillStyle === undefined
									? template[this.chartSelection.element].format.fillStyle
									: data.format.fillStyle
							);
							f.setTransparency(data.format.transparency === undefined ? 100 : data.format.transparency);
							f.setLineColor(
								data.format.lineColor || template[this.chartSelection.element].format.lineColor
							);
							f.setLineStyle(
								data.format.lineStyle === undefined
									? template[this.chartSelection.element].format.lineStyle
									: data.format.lineStyle
							);
							f.setLineWidth(
								data.format.lineWidth === undefined
									? template[this.chartSelection.element].format.lineWidth
									: data.format.lineWidth
							);
							break;
						case 'series':
							f.setFillColor(
								data.format.fillColor || template.series.getFillForIndex(this.chartSelection.index)
							);
							f.setFillStyle(
								data.format.fillStyle === undefined ? template.series.fillstyle : data.format.fillStyle
							);
							f.setTransparency(data.format.transparency === undefined ? 100 : data.format.transparency);
							f.setLineColor(
								data.format.lineColor || template.series.getLineForIndex(this.chartSelection.index)
							);
							f.setLineStyle(
								data.format.lineStyle === undefined ? template.series.linestyle : data.format.lineStyle
							);
							f.setLineWidth(
								data.format.lineWidth === undefined ? template.series.linewidth : data.format.lineWidth
							);
							break;
						case 'xAxis':
						case 'yAxis':
							f.setFillColor(data.format.fillColor || template.axis.format.fillColor);
							f.setFillStyle(
								data.format.fillStyle === undefined
									? template.axis.format.fillStyle
									: data.format.fillStyle
							);
							f.setTransparency(data.format.transparency === undefined ? 100 : data.format.transparency);
							f.setLineColor(data.format.lineColor || template.axis.format.lineColor);
							f.setLineStyle(
								data.format.lineStyle === undefined
									? template.axis.format.lineStyle
									: data.format.lineStyle
							);
							f.setLineWidth(
								data.format.lineWidth === undefined
									? template.axis.format.lineWidth
									: data.format.lineWidth
							);
							break;
						case 'xAxisGrid':
						case 'yAxisGrid':
							f.setFillColor(data.formatGrid.fillColor || template.axisgrid.format.fillColor);
							f.setFillStyle(
								data.formatGrid.fillStyle === undefined
									? template.axisgrid.format.fillStyle
									: data.formatGrid.fillStyle
							);
							f.setTransparency(
								data.formatGrid.transparency === undefined ? 100 : data.formatGrid.transparency
							);
							f.setLineColor(data.formatGrid.lineColor || template.axisgrid.format.lineColor);
							f.setLineStyle(
								data.formatGrid.lineStyle === undefined
									? template.axisgrid.format.lineStyle
									: data.formatGrid.lineStyle
							);
							f.setLineWidth(
								data.formatGrid.lineWidth === undefined
									? template.axisgrid.format.lineWidth
									: data.formatGrid.lineWidth
							);
							break;
						case 'xAxisTitle':
						case 'yAxisTitle':
							f.setFillColor(data.format.fillColor || template.axisTitle.format.fillColor);
							f.setFillStyle(
								data.format.fillStyle === undefined
									? template.axisTitle.fillStyle
									: data.format.fillStyle
							);
							f.setTransparency(data.format.transparency === undefined ? 100 : data.format.transparency);
							f.setLineColor(data.format.lineColor || template.axisTitle.format.lineColor);
							f.setLineStyle(
								data.format.lineStyle === undefined
									? template.axisTitle.lineStyle
									: data.format.lineStyle
							);
							f.setLineWidth(
								data.format.lineWidth === undefined
									? template.axisTitle.lineWidth
									: data.format.lineWidth
							);
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
						case 'serieslabel':
							tf.setFontName(
								data.dataLabel.format.fontName ||
								template[this.chartSelection.element].format.fontName ||
								template.font.name
							);
							tf.setFontSize(
								data.dataLabel.format.fontSize ||
								template[this.chartSelection.element].format.fontSize ||
								template.font.size
							);
							if (data.dataLabel.format.fontStyle !== undefined) {
								tf.setFontStyle(data.dataLabel.format.fontStyle);
							} else if (template[this.chartSelection.element].format.fontStyle !== undefined) {
								tf.setFontStyle(template[this.chartSelection.element].format.fontStyle);
							} else {
								tf.setFontStyle(template.font.style);
							}
							break;
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
					case 'plot':
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
					case 'plot':
						expr = this.getItem().chart.formula;
						break;
					default:
						break;
				}
			}

			if (expr) {
				if (expr.getTerm()) {
					return `=${expr.getTerm().toLocaleString(JSG.getParserLocaleSettings(), {
						item: sheet,
						useName: true
					})}`;
				}
				return String(expr.getValue());
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
					case 'serieslabel':
						format = data.dataLabel.format;
						break;
					default:
						format = data.format;
						break;
				}
				let value = map.get('linecolor');
				if (value) {
					if (value === 'auto' && format.line) {
						format.line.color = undefined;
					} else {
						format.lineColor = value;
					}
				}
				value = map.get('linestyle');
				if (value !== undefined) {
					format.lineStyle = value;
				}
				value = map.get('linewidth');
				if (value) {
					format.lineWidth = value;
				}
				value = map.get('fillcolor');
				if (value) {
					if (value === 'auto' && format.fill) {
						format.fill.color = undefined;
					} else {
						format.fillColor = value;
					}
				}
				value = map.get('fillstyle');
				if (value !== undefined) {
					format.fillStyle = value;
				}
				value = map.get('transparency');
				if (value !== undefined) {
					format.transparency = value;
				}
				value = map.get('fontcolor');
				if (value) {
					format.fontColor = value;
				}
				value = map.get('fontname');
				if (value) {
					format.fontName = value;
				}
				value = map.get('fontsize');
				if (value) {
					format.fontSize = Number(value);
				}
				value = map.get('fontstyle');
				if (value !== undefined) {
					format.fontStyle = Number(value);
				}
				value = map.get('numberformat');
				if (value === 'General') {
					format.numberFormat = undefined;
					format.localCulture = undefined;
				} else {
					if (value !== undefined) {
						format.linkNumberFormat = false;
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
					case 'serieslabel':
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
					case 'hilolines':
					case 'upbars':
					case 'downbars':
						update('chart');
						return true;
					default:
						break;
				}
			}
			return false;
		}

		getSheetView() {
			let sheet = this;

			while (sheet && sheet.getItem && !sheet.getItem().getCellDescriptors) {
				sheet = sheet.getParent();
			}

			return sheet;
		}
	}

	return new SheetPlotView(...args);
}
