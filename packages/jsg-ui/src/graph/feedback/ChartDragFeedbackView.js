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
	constructor(chartView, point, sourceView, viewer) {
		super();

		this.chartView = chartView;
		this.point = point;
		this.viewer = viewer;
		this.sourceView = sourceView;
	}

	drawButton(graphics, text, size, row, column, columns, buttons, mousePoint) {
		const width = 5000;
		const rect = new Rectangle(size.x / 2 - columns * width / 2 + column * width, size.y / 2 - (buttons / 2 - row) * 800, width, 800);
		const active = rect.containsPoint(mousePoint);

		graphics.setLineColor(JSG.theme.listborder);
		if (active) {
			graphics.setFillColor(JSG.theme.fill);
		} else {
			graphics.setFillColor(JSG.theme.filllight);
		}

		graphics.beginPath();
		graphics.rect(rect.x + 100, rect.y + 100, rect.width - 200, rect.height - 200);
		graphics.stroke();
		graphics.fill();

		if (active) {
			graphics.setFillColor(JSG.theme.text);
		} else {
			graphics.setFillColor(JSG.theme.textdisabled);
		}

		graphics.fillText(text, size.x / 2 - columns * width / 2  + column * width + width / 2, size.y / 2 - ((buttons / 2 - row) - 0.5) * rect.height);

		return active;
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
		const time = item.isTimeBasedChart();
		const canbeTime = item.series.length === 1 && (
			item.chart.type === 'line' ||
			item.chart.type === 'column');
		const columns = 1;
		let row = 0;
		let buttons;
		const selectedItem = this.sourceView.getSelectedItem();
		const treeItems = this.sourceView.getItem().getSubTreeForItem(selectedItem);
		treeItems.unshift(selectedItem);

		graphics.translate(point.x, point.y);
		graphics.rotate(angle);

		graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.CENTER);
		graphics.setTextBaseline('middle');
		graphics.setFontSize(7);
		graphics.setFontName('Verdana');
		graphics.setFont();

		if (time) {
			buttons = treeItems.length === 1 ? item.series.length + 2 : 2;
		} else {
			buttons = canbeTime ? item.series.length + 2 : item.series.length + 1;
			this.drawButton(graphics, 'Add Series', size, row, 0, columns, buttons, mousePoint);
		}
		buttons = Math.min(10, buttons);

		this.action = 'none';
		this.actionSeriesIndex = -1;

		if (time) {
			if (treeItems.length === 1) {
				item.series.forEach((serie, index) => {
					if (row < 9) {
						if (this.drawButton(graphics, `Replace Series: ${this.getLabel(item, serie)}`, size, row, 0,
							columns, buttons, mousePoint)) {
							this.action = 'replaceAggregation';
							this.actionSeriesIndex = index;
						}
						row += 1;
					}
				});
			}
			if (this.drawButton(graphics, `Replace all aggregating Series`, size, row, 0, columns, buttons, mousePoint)) {
				this.action = 'replaceAggregation';
			}
			row += 1;
			if (this.drawButton(graphics, `Add aggregating Series`, size, row, 0, columns, buttons, mousePoint)) {
				this.action = 'addAggregation';
			}
		} else {
			if (this.drawButton(graphics, 'Add Series', size, row, 0, columns, buttons, mousePoint)) {
				this.action = 'addSeries';
			}
			row += 1;
			item.series.forEach((serie, index) => {
				if (row < 8) {
					if (this.drawButton(graphics, `Add to Series: ${this.getLabel(item, serie)}`, size, row, 0, columns,
						buttons, mousePoint)) {
						this.action = 'addCategory';
						this.actionSeriesIndex = index;
					}
					row += 1;
				}
			});
			if (canbeTime) {
				if (this.drawButton(graphics, 'Replace all by aggregating Series', size, row, 0, columns, buttons, mousePoint)) {
					this.action = 'replaceAggregation';
					this.actionSeriesIndex = -1;
				}
			}
		}

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
}
