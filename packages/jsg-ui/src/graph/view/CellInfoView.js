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

import { default as JSG, GraphItem, GraphUtils, MathUtils, Numbers, Point } from '@cedalo/jsg-core';
// import WorksheetView from './WorksheetView';
import WorksheetHitCode from './WorksheetHitCode';

const localizeError = (error) => {
	const Localizer = JSG.appLocalizer;
	return Localizer && Localizer.localizeError ? Localizer.localizeError(error) : error;
};

const getTableElement = () => {
	let scrollTop = 0;
	return {
		storeScrollTop() {
			const table = document.getElementById('dataviewtable');
			scrollTop = table ? table.scrollTop : 0;
		},
		restoreScrollTop() {
			// might have been replaced
			const table = document.getElementById('dataviewtable');
			if (scrollTop && table) table.scrollTop = Math.floor(scrollTop);
		}
	};
};

class CellInfoView {
	static of(type, viewer, worksheetView, options) {
		return type === WorksheetHitCode.ERRORVIEW
			// eslint-disable-next-line no-use-before-define
			? new ErrorInfoView(viewer, worksheetView, options)
			// eslint-disable-next-line no-use-before-define
			: new DataInfoView(viewer, worksheetView, options);
	}
	// private
	constructor(viewer, worksheetView, options) {
		this.viewer = viewer;
		this.wsView = worksheetView;
		this.options = options;
		this.removeInfoView = this.removeInfoView.bind(this);
	}

	addCloseListener() {
		document.getElementById('closeFunc').addEventListener('mousedown', this.removeInfoView, false);
	}

	registerView(div, cell, target) {
		this.wsView.registerAtGraph({ type: this.type, viewer: this.viewer, cell, options: this.options, target, div });
	}

	getBounds(target) {
		const cs = this.viewer.getCoordinateSystem();

		if (target instanceof GraphItem) {
			const canvas = this.viewer.getCanvas();
			const box = target.getBoundingBox();
			const center = new Point(
				box.getLeft(),
				box.getBottom(),
			);

			GraphUtils.traverseUp(target.getParent(), this.viewer.getRootView(), (v) => {
				v.translateToParent(center);
				return true;
			});

			return {
				x: cs.logToDeviceX(center.x, false) + canvas.offsetLeft,
				y: cs.logToDeviceY(center.y, false) + canvas.offsetTop,
				height: undefined,
				width: undefined,
				itemWidth: cs.logToDeviceY(box.getWidth(), false),
				minWidth: 50,
				minHeight: 50,
				maxHeight: 320,
				maxWidth: 1000
			};
		}

		const cellRect = this.wsView.getRangeRect(target);
		const pos = this.wsView.getDevCellPosition(this.viewer, { x: target._x1, y: target._y1 });
		return {
			x: pos.x,
			y: pos.y,
			height: target.getHeight() > 1 ? cs.logToDeviceY(cellRect.height, false) : undefined,
			width: target.getWidth() > 1 ? cs.logToDeviceY(cellRect.width, false) : undefined,
			minWidth: cs.logToDeviceY(cellRect.width, false),
			minHeight: cs.logToDeviceY(cellRect.height, false),
			maxHeight: target.getHeight() > 1 ? cs.logToDeviceY(cellRect.height, false) : 320,
			maxWidth: 1000
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

		let  x = 0;
		const align = this.options && this.options.align ? this.options.align : 'left';

		switch (align) {
		case 'right':
			bounds.x += bounds.itemWidth - div.clientWidth;
			break;
		case 'center':
			bounds.x += bounds.itemWidth / 2 - div.clientWidth / 2;
			break;
		case 'left':
		default:
			break;
		}

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

	createInfoHTML(info, bounds) {
		throw new Error('Must be implemented by subclass');
	};
	getInfo(cell) {
		throw new Error('Must be implemented by subclass');
	};

	addInfoView(cell, target) {
		const info = this.getInfo(cell);
		if (info) {
			const bounds = this.getBounds(target);
			const content = this.createInfoHTML(info, bounds);
			const divView = this.createDiv(content);
			this.appendDiv(divView);
			this.setDivBounds(divView, bounds, target instanceof GraphItem ? this.options.align : 'left');
			const rightBorderOverlap = (divView.offsetLeft + divView.offsetWidth) - (divView.parentNode.offsetLeft + divView.parentNode.offsetWidth);
			if (rightBorderOverlap > 0) {
				divView.style.left = `${divView.offsetLeft - rightBorderOverlap}px`;
			}
			this.registerView(divView, cell, target);
		}
	}
	removeInfoView() {
		const infoView = this.wsView.getFromGraph();
		if (infoView) {
			this.viewer.getCanvas().parentNode.removeChild(infoView.div);
			this.wsView.deRegisterAtGraph();
		}
	}
	showInfo(cell, cellRange) {
		// remove previous view before adding new one
		const tableEl = getTableElement();
		tableEl.storeScrollTop();
		this.removeInfoView();
		this.addInfoView(cell, cellRange);
		tableEl.restoreScrollTop();
	}
}

class DataInfoView extends CellInfoView {
	get type() {
		return WorksheetHitCode.DATAVIEW;
	}

	getInfo(cell) {
		return cell.values;
	};

	createInfoHTML(values, bounds) {
		const fields = values ? Object.entries(values) : [];
		const rowCount =
			fields.length && fields[0].length !== undefined && fields[0][1].length !== undefined
				? fields[0][1].length
				: 0;

		let html = `<p style="color: ${
			JSG.theme.text
		}; height: 20px; padding-left: 5px; margin-bottom: 0px; margin-top: 5px; font-size: 10pt">${JSG.getLocalizedString('Result')} (${rowCount}):</p>`;
		html += `<div id="closeFunc" style="width:15px;height:15px;position: absolute; top: 3px; right: 0px; font-size: 10pt; font-weight: bold; color: #777777;cursor: pointer">x</div>`;
		html += `<div id="dataviewtable" style="overflow-y: auto; max-width: ${bounds.maxWidth}px; max-height: ${bounds.maxHeight - 25}px">`;
		html += `<table style="padding: 5px; color: ${JSG.theme.text}; width: ${
			bounds.width ? '100%' : 'inherit'
		}"><thead><tr>`;

		fields.forEach(([key, entry]) => {
			html += `<th style="padding: 5px;" >${key}</th>`;
		});
		html += '</tr></thead>';

		html += '<tbody>';

		if (rowCount) {
			let index;
			for (index = 0; index < fields[0][1].length; index += 1) {
			// fields[0][1].forEach((value, index) => {
			// 	const value = fields[0][1][i];
				html += '<tr>';
				// eslint-disable-next-line no-loop-func
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
				if (this.options && this.options.limit && index === this.options.limit) {
					break;
				}
			}
			if (index < fields[0][1].length) {
				html += `<tr><td>${JSG.getLocalizedString('MaxDataViewRows')}</td></tr>`;

			}
		}

		html += '</tbody>';
		html += '</table></div>';
		return html;
	}
}

class ErrorInfoView extends CellInfoView {
	get type() {
		return WorksheetHitCode.ERRORVIEW;
	}

	getInfo(cell) {
		return cell.errorInfo;
	};

	createInfoHTML(error, bounds) {
		const locError = localizeError(error);
		const fields = Object.entries(locError);

		// title:
		let html = `<p style="color: ${
			JSG.theme.text
		}; height: 20px; padding-left: 5px; margin-bottom: 0px; margin-top: 5px; font-size: 10pt">${locError.type}</p>`;
		html += `<div id="closeFunc" style="width:15px;height:15px;position: absolute; top: 3px; right: 0px; font-size: 10pt; font-weight: bold; color: #777777;cursor: pointer">x</div>`;

		// table:
		html += `<div id="dataviewtable" style="overflow-y: auto; max-height: ${bounds.maxHeight - 25}px">`;
		html += `<table style="padding: 5px; color: ${JSG.theme.text}; width: ${bounds.width ? '100%' : 'inherit'}">`;

		// table header:
		html += '<thead><tr>';
		html += '<th style="padding: 5px;" ></th><th style="padding: 5px;" ></th>';
		html += '</tr></thead>';

		// table body
		html += '<tbody>';
		fields.forEach(([key, val]) => {
			if (key !== 'type') {
				html += '<tr>';
				html += `<td style="padding: 5px;font-weight: bold;text-align: left}">${
					key === null || key === undefined ? '' : key
				}:</td>`;
				html += `<td style="padding: 5px;text-align: left}">${
					val === null || val === undefined ? '' : val
				}</td>`;
				html += '</tr>';
			}
		});
		html += '</tbody>';
		html += '</table></div>';
		return html;
	}
}

export default CellInfoView;
