/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
/* global document window */

import { default as JSG, MathUtils, Numbers } from '@cedalo/jsg-core';
// import WorksheetView from './WorksheetView';

const getTableElement = () => {
	let scrollTop = 0;
	const table = document.getElementById('dataviewtable');
	return {
		storeScrollTop() {
			scrollTop = table ? table.scrollTop : 0;
		},
		restoreScrollTop() {
			if (scrollTop && table) table.scrollTop = scrollTop;
		}
	};
};

class CellInfoView {
	static of(type, viewer, worksheetView) {
		// eslint-disable-next-line no-use-before-define
		return type === 16 ? new ErrorInfoView(viewer, worksheetView) : new DataInfoView(viewer, worksheetView);
	}
	// private
	constructor(viewer, worksheetView) {
		this.viewer = viewer;
		this.wsView = worksheetView;
		this.removeView = this.removeView.bind(this);
	}

	addCloseListener() {
		document.getElementById('closeFunc').addEventListener('mousedown', this.removeView, false);
	}

	removeView() {
		const dataView = this.wsView.getFromGraph();
		if (dataView) {
			this.viewer.getCanvas().parentNode.removeChild(dataView.div);
			this.wsView.deRegisterAtGraph();
		}
	}
	registerView(div, cell, cellRange) {
		this.wsView.registerAtGraph(this.viewer, cell, cellRange, div);
	}

	getBounds(cellRange) {
		const cs = this.viewer.getCoordinateSystem();
		const cellRect = this.wsView.getRangeRect(cellRange);
		const pos = this.wsView.getDevCellPosition(this.viewer, { x: cellRange._x1, y: cellRange._y1 });
		return {
			x: pos.x,
			y: pos.y,
			height: cellRange.getHeight() > 1 ? cs.logToDeviceY(cellRect.height, false) : undefined,
			width: cellRange.getWidth() > 1 ? cs.logToDeviceY(cellRect.width, false) : undefined,
			minWidth: cs.logToDeviceY(cellRect.width, false),
			minHeight: cs.logToDeviceY(cellRect.height, false),
			maxHeight: cellRange.getHeight() > 1 ? cs.logToDeviceY(cellRect.height, false) : 320
		};
	}
	createDiv(innerHTML) {
		const div = document.createElement('div');
		div.style.backgroundColor = JSG.theme.fill;
		div.style.borderColor = JSG.theme.border;
		div.style.borderWidth = '1px';
		div.style.borderStyle = 'solid';
		div.style.position = 'absolute';
		div.style.fontSize = '8pt';
		div.innerHTML = innerHTML;
		return div;
	}

	setDivBounds(div, bounds) {
		div.style.left = `${bounds.x}px`;
		div.style.top = `${bounds.y}px`;
		div.style.minWidth = `${bounds.minWidth - 1}px`;
		div.style.minHeight = `${bounds.minHeight}px`;
		if (bounds.width) div.style.width = `${bounds.width - 1}px`;
		if (bounds.height) div.style.height = `${bounds.height}px`;
	}

	appendDiv(div) {
		this.viewer.getCanvas().parentNode.appendChild(div);
		this.addCloseListener();
		div.focus();
	}

	showInfo(cell, cellRange) {
		const bounds = this.getBounds(cellRange);
		const content = this.createContentHTML(cell, bounds);
		const divView = this.createDiv(content);
		const tableEl = getTableElement();
		tableEl.storeScrollTop();
		// remove previous view
		this.removeView();
		this.setDivBounds(divView, bounds);
		this.appendDiv(divView);
		tableEl.restoreScrollTop();
		this.registerView(divView, cell, cellRange);
	}
}

class DataInfoView extends CellInfoView {
	createContentHTML(cell, bounds) {
		const values = cell.values;
		const fields = values ? Object.entries(values) : [];
		const rowCount =
			fields.length && fields[0].length !== undefined && fields[0][1].length !== undefined
				? fields[0][1].length
				: 0;

		let html = `<p style="color: ${
			JSG.theme.text
		}; height: 20px; padding-left: 5px; margin-bottom: 0px; margin-top: 5px; font-size: 10pt">Result (${rowCount}):</p>`;
		html += `<div id="closeFunc" style="width:15px;height:15px;position: absolute; top: 3px; right: 0px; font-size: 10pt; font-weight: bold; color: #777777;cursor: pointer">x</div>`;
		html += `<div id="dataviewtable" style="overflow-y: auto; max-height: ${bounds.maxHeight - 25}px">`;
		html += `<table style="padding: 5px; color: ${JSG.theme.text}; width: ${
			bounds.width ? '100%' : 'inherit'
		}"><thead><tr>`;

		fields.forEach(([key, entry]) => {
			html += `<th style="padding: 5px;" >${key}</th>`;
		});
		html += '</tr></thead>';

		html += '<tbody>';

		if (rowCount) {
			fields[0][1].forEach((value, index) => {
				html += '<tr>';
				fields.forEach(([key, entry]) => {
					let val = entry[index];
					if (key === 'time') {
						const date = MathUtils.excelDateToJSDate(val);
						val = `${date.toLocaleTimeString()} ${date.getMilliseconds()}`;
					}
					html += `<td style="padding: 5px;text-align: ${Numbers.isNumber(val) ? 'right' : 'left'}">${
						val === null || val === undefined ? '' : val
					}</td>`;
				});
				html += '</tr>';
			});
		}

		html += '</tbody>';
		html += '</table></div>';
		return html;
	}
}

class ErrorInfoView extends CellInfoView {
	createContentHTML(cell, bounds) {
		const fields = cell.error ? Object.entries(cell.error) : [];
		let html = `<p style="color: ${
			JSG.theme.text
		}; height: 20px; padding-left: 5px; margin-bottom: 0px; margin-top: 5px; font-size: 10pt">Error</p>`;
		html += `<div id="closeFunc" style="width:15px;height:15px;position: absolute; top: 3px; right: 0px; font-size: 10pt; font-weight: bold; color: #777777;cursor: pointer">x</div>`;
		html += `<div id="dataviewtable" style="overflow-y: auto; max-height: ${bounds.maxHeight - 25}px">`;
		html += `<table style="padding: 5px; color: ${JSG.theme.text}; width: ${
			bounds.width ? '100%' : 'inherit'
		}"><thead><tr>`;

		// header:
		fields.forEach(([key, entry]) => {
			html += `<th style="padding: 5px;" ></th>`;
		});
		html += '</tr></thead>';
		html += '<tbody>';

		// body
		fields.forEach(([key, val]) => {
			html += '<tr>';
			html += `<td style="padding: 5px;font-weight: bold;text-align: left}">${
				key === null || key === undefined ? '' : key
			}:</td>`;
			html += `<td style="padding: 5px;text-align: left}">${val === null || val === undefined ? '' : val}</td>`;
			html += '</tr>';
		});

		html += '</tbody>';
		html += '</table></div>';
		return html;
	}
}

export default CellInfoView;
