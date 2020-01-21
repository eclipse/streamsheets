// export default function SheetChartStateViewFactory(JSG, ...args) {
// 	class SheetChartStateView extends JSG.NodeView {
// 		drawFill(graphics, format, rect) {
// 			const {x, y} = rect.getCenter();
// 			super.drawFill(graphics, format, rect);
// 			graphics.setFillColor('#444444');
// 			graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.CENTER);
// 			graphics.setTextBaseline('center');
// 			graphics.fillText('This is a feature of the professional version!', x, y);
// 		}
// 	}
// 	return new SheetChartStateView(...args);
// }
/* eslint-disable import/prefer-default-export */

import { CellRange } from '@cedalo/jsg-core';
import { NumberFormatter } from '@cedalo/number-format';

export default function SheetChartStateViewFactory(JSG, ...args) {
	class SheetChartStateView extends JSG.NodeView {
		drawBorder(/* graphics, format, rect */) {}

		drawFill(graphics, format, rect) {
			const item = this.getItem();
			const title = item.getAttributeValueAtPath('title');
			const tmpRect = rect.copy();
			const textFormat = item.getTextFormat();

			textFormat.applyToGraphics(graphics);
			graphics.setFont();
			graphics.setTextBaseline('top');

			tmpRect.x += 150;
			tmpRect.y += 150;
			tmpRect.width -= 300;
			tmpRect.height -= 300;

			if (title && title.length) {
				const text = `${item.getAttributeValueAtPath('title')}`;
				graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.LEFT);
				graphics.fillText(text, tmpRect.x, tmpRect.y);
				const m = graphics.getCoordinateSystem().deviceToLogY(graphics.measureText('M').width) + 100;
				tmpRect.y += m;
				tmpRect.height -= m;
				textFormat.removeFromGraphics(graphics);
			}

			this.setScaleFont(item, graphics);

			tmpRect.height -= graphics.getCoordinateSystem().deviceToLogY(graphics.measureText('M').width) + 100;

			if (format.applyFillToGraphics(graphics, tmpRect)) {
				graphics.fillRect(tmpRect);
			}

			const sheet = item.getSheet();
			if (sheet) {
				const dataInfo = this.getDataInfo(item);
				const legendInfo = this.getLegendInfo(item);
				const data = sheet.getDataProvider();

				const min = item.getAttributeValueAtPath('min');
				if (min !== undefined && min !== '') {
					const result = sheet.textToExpression(String(min));
					if (result.expression) {
						dataInfo.minDate = data.excelDateToJSDate(Number(result.expression.getValue())).getTime();
					}
				}
				const max = item.getAttributeValueAtPath('max');
				if (max !== undefined && max !== '') {
					const result = sheet.textToExpression(String(max));
					if (result.expression) {
						dataInfo.maxDate = data.excelDateToJSDate(Number(result.expression.getValue())).getTime();
					}
				// } else {
					// dataInfo.maxDate = new Date().getTime();
				}

				if (dataInfo.maxDate <= dataInfo.minDate) {
					dataInfo.maxDate = dataInfo.minDate + 1;
				}

				const stepType = item.getAttributeValueAtPath('stepType');
				const step = item.getAttributeValueAtPath('step');
				let x1;
				let x2;
				let y;
				const dateRange = dataInfo.maxDate - dataInfo.minDate;
				const findLegendColorByName = (name) => {
					const legend = legendInfo.filter((entry) => entry.name === name);
					return legend.length ? legend[0].color : '#AAAAAA';
				};

				const right = tmpRect.getRight();

				dataInfo.bars.some((bar) => {
					x1 = Math.min(right, tmpRect.x + ((bar.start - dataInfo.minDate) / dateRange) * tmpRect.width);
					x2 = Math.min(right, tmpRect.x + ((bar.end - dataInfo.minDate) / dateRange) * tmpRect.width);
					x1 = Math.max(tmpRect.x, x1);
					x2 = Math.max(tmpRect.x, x2);
					const color = findLegendColorByName(bar.legend);
					graphics.beginPath();
					graphics.setFillColor(color);
					graphics.rect(x1, tmpRect.y, x2 - x1, tmpRect.height);
					graphics.fill();
					return !(x1 < right);
				});

				graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.CENTER);
				this.setScaleFont(item, graphics);

				graphics.beginPath();

				let stepValue;
				let now = dataInfo.minDate;

				switch (stepType) {
				case 'second':
					stepValue = 1000;
					break;
				case 'hour':
					stepValue = 3600000;
					break;
				case 'minute':
				default:
					stepValue = 60000;
					break;
				}

				now = now - stepValue + (stepValue - (now % stepValue));

				if (step > 0.01) {
					stepValue *= step;
				}

				let formattingResult;
				let scaleText;
				let dateValue;
				const steps = (dataInfo.maxDate - dataInfo.minDate) / stepValue;

				dateValue = data.JSDateToExcelDate(new Date(dataInfo.maxDate));
				try {
					formattingResult = NumberFormatter.formatNumber(
						dataInfo.numberFormat,
						dateValue,
						dataInfo.localCulture[0]
					);
				} catch (e) {
					// Ignore error
				}
				scaleText = formattingResult.formattedValue ? formattingResult.formattedValue : String(dateValue);
				const scaleTextWidth =
					graphics.getCoordinateSystem().deviceToLogY(graphics.measureText(scaleText).width) + 100;
				const stepsToPaint = tmpRect.width / scaleTextWidth;
				if (steps > stepsToPaint) {
					stepValue *= Math.ceil(steps / stepsToPaint);
				}

				while (now < dataInfo.maxDate) {
					x1 = tmpRect.x + ((now - dataInfo.minDate) / dateRange) * tmpRect.width;
					y = tmpRect.getBottom();

					dateValue = data.JSDateToExcelDate(new Date(now));
					try {
						formattingResult = NumberFormatter.formatNumber(
							dataInfo.numberFormat,
							dateValue,
							dataInfo.localCulture[0]
						);
					} catch (e) {
						// Ignore error
					}
					scaleText = formattingResult.formattedValue ? formattingResult.formattedValue : String(dateValue);

					graphics.fillText(scaleText, x1, tmpRect.getBottom() + 200);
					graphics.moveTo(x1, y);
					graphics.lineTo(x1, y + 150);
					now += stepValue;
				}

				graphics.stroke();
			}

			if (format.applyLineToGraphics(graphics)) {
				graphics.drawRect(tmpRect);
				format.removeLineFromGraphics(graphics);
			}
		}

		getDataInfo(item) {
			const dataInfo = {
				minDate: Number.MAX_VALUE,
				maxDate: -Number.MAX_VALUE,
				numberFormat: 'hh:mm:ss',
				localCulture: 'en',
				bars: []
			};
			const range = item.getAttributeValueAtPath('range');
			const sheet = item.getSheet();
			if (!sheet || !range) {
				return dataInfo;
			}
			const data = sheet.getDataProvider();
			if (typeof range === 'string') {
				const dataRange = CellRange.parse(range, sheet);
				if (dataRange && dataRange.getWidth() > 2) {
					dataRange.shiftFromSheet();
					for (let i = dataRange.getY1(); i <= dataRange.getY2(); i += 1) {
						const bar = {
							start: 0,
							end: 0,
							legend: ''
						};
						let cell = data.getRC(dataRange.getX1(), i);
						if (cell && cell.getValue() !== undefined) {
							if (i === dataRange.getY1()) {
								const tf = sheet.getTextFormatAtRC(dataRange.getX1(), i);
								dataInfo.numberFormat = tf.getNumberFormat().getValue();
								dataInfo.localCulture = tf
									.getLocalCulture()
									.getValue()
									.split(';');
							}
							bar.start = data.excelDateToJSDate(Number(cell.getValue())).getTime();
							dataInfo.minDate = Math.min(bar.start, dataInfo.minDate);
							dataInfo.maxDate = Math.max(bar.start, dataInfo.maxDate);
						}
						cell = data.getRC(dataRange.getX1() + 1, i);
						if (cell && cell.getValue() !== undefined) {
							bar.end = data.excelDateToJSDate(Number(cell.getValue())).getTime();
							dataInfo.minDate = Math.min(bar.end, dataInfo.minDate);
							dataInfo.maxDate = Math.max(bar.end, dataInfo.maxDate);
						}
						cell = data.getRC(dataRange.getX1() + 2, i);
						if (cell && cell.getValue()) {
							bar.legend = String(cell.getValue());
						}
						dataInfo.bars.push(bar);
					}
				}
			}

			return dataInfo;
		}

		getLegendInfo(item) {
			const legendInfo = [];
			const range = item.getAttributeValueAtPath('legend');
			const sheet = item.getSheet();

			if (!sheet || !range) {
				return legendInfo;
			}

			const data = sheet.getDataProvider();
			if (typeof range === 'string') {
				const dataRange = CellRange.parse(range, sheet);
				if (dataRange && dataRange.getWidth() > 1) {
					dataRange.shiftFromSheet();
					for (let i = dataRange.getY1(); i <= dataRange.getY2(); i += 1) {
						const entry = {
							name: '',
							color: '#AAAAAA'
						};
						let cell = data.getRC(dataRange.getX1(), i);
						if (cell && cell.getValue() !== undefined) {
							entry.name = String(cell.getValue());
						}
						cell = data.getRC(dataRange.getX1() + 1, i);
						if (cell && cell.getValue() !== undefined) {
							entry.color = String(cell.getValue());
						}
						legendInfo.push(entry);
					}
				}
			}

			return legendInfo;
		}

		setScaleFont(item, graphics) {
			const fontJSON = item.getAttributeValueAtPath('scalefont');

			let def = {
				fontname: 'Verdana',
				fontsize: 8,
				fontcolor: '#000000',
				fontstyle: 'normal',
				alignment: 0
			};

			try {
				def = JSON.parse(fontJSON);
				// eslint-disable-next-line no-empty
			} catch (e) {}

			if (def.fontcolor) {
				graphics.setFillColor(def.fontcolor);
			}
			if (def.fontname) {
				graphics.setFontName(def.fontname);
			}
			if (def.fontsize) {
				graphics.setFontSize(def.fontsize);
			}
			if (def.fontstyle) {
				graphics.setFontStyle(def.fontstyle);
			}
			if (def.alignment) {
				graphics.setHorizontalAlignment(def.alignment);
			}

			graphics.setFont();
		}
	}
	return new SheetChartStateView(...args);
}
