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
/* global window document */

import {CellRange, default as JSG, Point, Selection, SheetReference, Strings} from '@cedalo/jsg-core';

const { Locale } = require('@cedalo/parser');

const RANGE_COLORS = [
	'#1718d1',
	'#a61d4c',
	'#8cc474',
	'#f75c02',
	'#2fb4d2',
	'#803995',
	'#00b15b',
	'#795548',
	'#fabb69',
	'#168d9a'
];

let cellEditor;
let functionInfo;

export default class CellEditor {
	constructor(div, viewer, sheet) {
		this.active = false;
		this.oldContent = undefined;
		this.oldContentPos = undefined;
		this.startCell = undefined;
		this.rangeIndex = undefined;
		this.rangeResize = undefined;
		this.allowNoEqual = false;
		this.alwaysReplace = false;
		this.editRanges = undefined;
		this.formulaSheet = sheet;
		this.viewer = viewer;
		this.div = div;
		this.funcDiv = undefined;
		this.funcIndex = 0;
	}

	static activateCellEditor(div, viewer, sheet) {
		cellEditor = new CellEditor(div, viewer, sheet);
		return cellEditor;
	}

	static deActivateCellEditor() {
		if (cellEditor) {
			cellEditor.removeFunctionHelp();
			cellEditor.deActivateReferenceMode();
			cellEditor.removeEditRanges();
			cellEditor.alwaysReplace = false;
			cellEditor.allowNoEqual = false;
			cellEditor.div = undefined;
			cellEditor.editBar = false;
			cellEditor.focusNode = undefined;
			cellEditor.focusOffset = undefined;
			cellEditor = undefined;
		}
	}

	static getActiveCellEditor() {
		return cellEditor;
	}

	activateEditRanges() {
		this.editRanges = new Selection();
		return this.editRanges;
	}

	hasEditRanges() {
		return this.editRanges !== undefined;
	}

	getEditRangeCount() {
		if (!this.editRanges) {
			return 0;
		}

		return this.editRanges.getSize();
	}

	getEditRanges() {
		return this.editRanges;
	}

	removeEditRanges() {
		this.editRanges = undefined;
	}

	removeFunctionHelp() {
		if (this.funcDiv) {
			this.div.parentNode.removeChild(this.funcDiv);
			this.funcDiv = undefined;
		}
	}

	getActiveRangeIndex() {
		return this.editRanges ? this.editRanges.getActiveRange() : undefined;
	}

	setActiveRangeIndex(index) {
		const ranges = this.getEditRanges();
		if (ranges) {
			const range = ranges.getAt(index);
			if (range) {
				ranges.setActiveCell(new Point(range.getX1(), range.getY1()));
				ranges.setActiveRange(index);
			}
		}
	}

	setActiveRange(view) {
		let ranges;

		if (this.hasEditRanges()) {
			ranges = this.getEditRanges();
		} else {
			ranges = this.activateEditRanges();
		}

		if (ranges.getActiveRange() === undefined && view) {
			let active = view.getOwnSelection().getActiveCell();
			if (active === undefined) {
				active = new Point(0, 0);
			}
			ranges.add(new CellRange(this, active.x, active.y), RANGE_COLORS[ranges.getSize() % RANGE_COLORS.length]);
			ranges.setActiveCell(active.copy());
			ranges.setActiveRange(ranges.getSize() - 1);
		}

		return ranges;
	}

	isReferenceMode() {
		return this.active;
	}

	toggleReferenceMode() {
		if (this.active) {
			this.deActivateReferenceMode();
		} else {
			this.activateReferenceMode();
		}
	}

	activateReferenceMode() {
		this.active = true;
	}

	deActivateReferenceMode() {
		if (this.editRanges) {
			this.editRanges.setActiveRange();
		}
		this.oldContent = undefined;
		this.active = false;
		this.startCell = undefined;
		this.rangeIndex = undefined;
		this.rangeResize = undefined;
	}

	parseTextToTerm(text, ignoreExpections = true) {
		try {
			JSG.FormulaParser.context.separators = JSG.getParserLocaleSettings().separators;
			const term = JSG.FormulaParser.runIgnoringErrors(
				() => JSG.FormulaParser.parse(text.replace(/^=/, ''), this.viewer.getGraph(), this.formulaSheet),
				ignoreExpections
			);
			JSG.FormulaParser.context.separators = Locale.EN.separators;
			return term;
		} catch (e) {
			return undefined;
		}
	}

	parseFormulaInfo(text, offset, ignoreExpections = true) {
		try {
			JSG.FormulaParser.context.separators = JSG.getParserLocaleSettings().separators;
			const info = JSG.FormulaParser.runIgnoringErrors(
				() =>
					JSG.FormulaParser.parseFormulaInfo(
						text.replace(/^=/, ''),
						offset - 1,
						this.viewer.getGraph(),
						this.formulaSheet
					),
				ignoreExpections
			);
			JSG.FormulaParser.context.separators = Locale.EN.separators;
			return info;
		} catch (e) {
			return undefined;
		}
	}

	getPotentialFunctionsUnderCursor() {
		if (this.div === undefined) {
			return undefined;
		}
		const text = this.div.textContent.toUpperCase();
		const pos = this.saveSelection();

		this.funcInfo = undefined;
		this.replaceInfo = undefined;

		if (!pos) {
			return undefined;
		}
		let cursorPosition = pos.start;

		if (!text.length || text[0] !== '=' || cursorPosition === 0) {
			return undefined;
		}

		// DL-2461: cursor position can be behind last character:
		if (cursorPosition > text.length) cursorPosition = text.length;

		const funcInfos = this.getFunctionInfos();
		const info = this.parseFormulaInfo(text, cursorPosition);
		if (!info || !funcInfos) {
			return undefined;
		}

		if (info.identifier) {
			const fnName = info.identifier;
			if (fnName.length) {
				const functions = funcInfos.filter((entry) => entry[0].startsWith(fnName));
				if (functions.length) {
					this.replaceInfo = { start: info.start, length: fnName.length };
					return functions;
				}
			}
		}
		if (info.function) {
			this.funcInfo = { paramIndex: info.paramIndex };
			return funcInfos.filter((entry) => entry[0] === info.function);
		}
		return undefined;
	}

	getFunctionInfos() {
		return functionInfo ? Object.entries(functionInfo.getStrings()) : undefined;
	}

	generateFunctionListHTML(candidates) {
		return candidates
			.map((info, index) => {
				let html;
				if (index === this.funcIndex) {
					html = `<div id="func${index}" style="padding: 3px;background-color: #DDDDDD">`;
					html += `<p style="">${info[0]}</p>`;
					html += `<p style="">${info[1][JSG.locale].description}</p>`;
				} else {
					html = `<div id="func${index}" style="padding: 3px;background-color: white">`;
					html += `<p style="">${info[0]}</p>`;
				}
				html += '</div>';
				return html;
			})
			.join('');
	}

	generateFunctionHTML(candidates) {
		return candidates
			.map((info) => {
				let html;
				let parameters;
				html = '<div style="padding: 3px;background-color: #DDDDDD">';
				if (this.funcInfo === undefined || this.funcInfo.paramIndex === undefined) {
					parameters = `<p style="width:315px">${info[0]}(${info[1][JSG.locale].argumentList})</p>`;
				} else {
					const params = info[1][JSG.locale].argumentList.split(',');
					parameters = `<p style="width:315px">${info[0]}(`;
					params.forEach((param, paramIndex) => {
						if (paramIndex === this.funcInfo.paramIndex) {
							parameters  += `<span style="font-weight: bold">${param}</span>`;
						} else {
							parameters  += `${param}`;
						}
						if (paramIndex !== params.length - 1) {
							parameters  += ', ';
						}
					});
					parameters  += `)</p>`;
				}
				parameters = parameters.replace(/,/gi, JSG.getParserLocaleSettings().separators.parameter);
				html += parameters;
				html += `<div id="closeFunc" style="width:15px;height:15px;position: absolute; top: 3px; right: 0px; font-size: 10pt; font-weight: bold; color: #777777;cursor: pointer">x</div>`;
				html += `<p style="margin: 10px 0px 4px 0px;font-style: italic">${JSG.getLocalizedString(
					'Summary'
				)}</p>`;
				html += `<p>${info[1][JSG.locale].description}</p>`;
				html += `<p style="margin: 10px 0px 4px 0px;font-style: italic">`;
				html += `<a href="https://docs.cedalo.com/functions/${info[1].category}/${info[0]
					.toLowerCase()
					.replace(/\./g, '')}.html" target="_blank">`;
				html += `${JSG.getLocalizedString('More Info')}</a></p>`;
				html += '</div>';
				return html;
			})
			.join('');
	}

	handleFunctionListKey(event, view) {
		if (this.isReferenceByKeyAllowed(view) || !this.funcs || !this.funcs.length) {
			return false;
		}
		switch (event.key) {
			case 'ArrowUp':
				{
					this.funcIndex = Math.max(0, this.funcIndex - 1);
					event.preventDefault();
					event.stopPropagation();
					this.updateFunctionInfo();
					const funcElem = this.funcDiv.querySelector(`#func${this.funcIndex}`);
					if (funcElem) {
						funcElem.scrollIntoView(true);
					}
				}
				return true;
			case 'ArrowDown': {
				this.funcIndex = Math.min(this.funcs.length - 1, this.funcIndex + 1);
				event.preventDefault();
				event.stopPropagation();
				this.updateFunctionInfo();
				const funcElem = this.funcDiv.querySelector(`#func${this.funcIndex}`);
				if (funcElem) {
					funcElem.scrollIntoView(false);
				}
				return true;
			}
			case 'Tab':
			case 'Enter':
				if (this.insertFunctionFromList()) {
					event.preventDefault();
					event.stopPropagation();
					return true;
				}
		}
		return false;
	}

	insertFunctionFromList() {
		if (this.replaceInfo !== undefined) {
			let text = `${this.funcs[this.funcs.length > 1 ? this.funcIndex : 0][0]}`;
			let formula = this.div.textContent;
			// if (text === this.replaceInfo.value) {
			// 	return false;
			// }
			if (formula[this.replaceInfo.start + this.replaceInfo.length + 1] !== '(') {
				text += '()';
			}
			const pos = this.saveSelection();
			pos.start = this.replaceInfo.start + text.length;
			pos.end = pos.start;
			formula =
				formula.substr(0, this.replaceInfo.start + 1) +
				text +
				formula.substr(this.replaceInfo.start + this.replaceInfo.length + 1);
			this.div.textContent = formula;
			this.restoreSelection(pos);
			this.updateFunctionInfo();
			return true;
		}

		return false;
	}

	static setFunctionInfo(info) {
		functionInfo = info;
	}

	handleFunctionListMouseDown(event) {
		if (event.target.tagName === 'A') {
			return;
		}

		this.funcIndex = Number(event.currentTarget.id.substr(4));
		this.updateFunctionInfo();
		if (this.insertFunctionFromList()) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	updateFunctionInfo() {
		this.funcs = this.getPotentialFunctionsUnderCursor();
		if (this.funcs && this.funcs.length) {
			let html;
			if (this.funcs.length === 1) {
				html = this.generateFunctionHTML(this.funcs);
			} else {
				html = this.generateFunctionListHTML(this.funcs);
			}
			if (this.funcDiv === undefined) {
				const y = this.div.offsetTop + this.div.clientHeight + 2;
				this.funcDiv = document.createElement('div');
				this.funcDiv.style.position = 'absolute';
				this.funcDiv.style.fontName = 'Verdana';
				this.funcDiv.style.fontSize = '8pt';
				this.funcDiv.style.width = '350px';
				this.funcDiv.style.maxHeight = `${this.div.parentNode.clientHeight - y}px`;
				this.funcDiv.style.overflowY = 'auto';
				this.funcDiv.style.color = '#333333';
				this.funcDiv.style.cursor = 'default';
				this.funcDiv.style.wordBreak = 'break-word';
				this.funcDiv.style.backgroundColor = 'white';
				this.funcDiv.style.border = '1px solid #BBBBBB';
				this.funcDiv.style.left = `${this.div.offsetLeft}px`;
				this.funcDiv.style.boxShadow = '3px 3px 4px #CCCCCC';
				this.funcDiv.style.top = `${y}px`;
				this.div.parentNode.appendChild(this.funcDiv);
			}
			this.funcDiv.innerHTML = html;
			const children = [...this.funcDiv.childNodes];
			children.forEach((child) => {
				child.addEventListener('mousedown', (event) => this.handleFunctionListMouseDown(event), false);
			});
			if (this.funcs.length === 1) {
				document.getElementById('closeFunc').addEventListener(
					'mousedown',
					(event) => {
						this.div._ignoreBlur = true;
						event.preventDefault();
						event.stopPropagation();
						this.removeFunctionHelp();
						this.div.focus();
						this.div._ignoreBlur = false;
					},
					false
				);
			}
		} else if (this.funcDiv) {
			this.removeFunctionHelp();
		}
	}

	updateEditRangesModel(text) {
		let term;

		// reset
		const ranges = this.activateEditRanges();

		if (text.length && text.charAt(0) === '=' /* || alwaysReplace */) {
			term = this.parseTextToTerm(text);
		}

		if (term === undefined) {
			text = text.replace(/(\r\n|\n|\r)/gm, '');
			return Strings.encodeXML(text);
		}

		term.traverse((lterm) => {
			const { operand } = lterm;
			if (operand && operand instanceof SheetReference) {
				const refRange = operand._range;
				if (refRange /* && refRange.getSheet() === this.formulaSheet */) {
					const copy = refRange.copy();
					copy.shiftFromSheet();
					ranges.add(copy, RANGE_COLORS[ranges.getSize() % RANGE_COLORS.length]);
				}
			}
			// }
			return true;
		});

		text = text.replace(/(\r\n|\n|\r)/gm, '');

		let formulaUpper = text.toUpperCase();
		let index = 0;
		let result = '';
		let pos;
		let err = false;

		formulaUpper = Strings.encodeXML(formulaUpper);
		let formula = Strings.encodeXML(text);

		// now for each range in ranges rangetostring -> find in textContent -> replace by span -> set
		ranges.getRanges().forEach((range) => {
			const copy = range.copy();
			copy.shiftToSheet();
			const rangeString = copy.toString({ useName: true, item: this.formulaSheet });

			pos = formulaUpper.indexOf(rangeString.toUpperCase());
			if (pos === -1) {
				err = true;
			}

			result += formula.slice(0, pos);
			result += `<span id="range" style="color: ${
				RANGE_COLORS[index % RANGE_COLORS.length]
			}">${rangeString}</span>`;

			formula = formula.slice(pos + rangeString.length);
			formulaUpper = formulaUpper.slice(pos + rangeString.length);

			index += 1;
		});

		result += formula;

		if (err) {
			// better change nothing than wrong
			return text;
		}

		return result;
	}

	updateEditRangesView() {
		const old = this.getEditRangeCount();
		const formula = this.updateEditRangesModel(this.div.textContent, this.alwaysReplace);
		const pos = this.saveSelection();

		this.div.innerHTML = formula;

		this.restoreSelection(pos);

		const newCount = this.getEditRangeCount();
		if (newCount || (newCount === 0 && old)) {
			this.invalidate();
		}
	}

	invalidate() {
		this.viewer.getGraph().markDirty();
		this.viewer.getInteractionHandler().repaint();
	}

	updateReference(event, view) {
		const ranges = this.setActiveRange(view);
		const selection = this.getEditRanges();

		switch (event.key) {
			case 'F4': {
				const index = selection.getActiveRangeIndex();
				const cellRange = selection.getAt(index);
				if (cellRange._x1R && cellRange._x2R && cellRange._y1R && cellRange._y2R) {
					cellRange._x1R = false;
					cellRange._x2R = false;
					cellRange._y1R = false;
					cellRange._y2R = false;
				} else if (!cellRange._x1R && !cellRange._x2R && !cellRange._y1R && !cellRange._y2R) {
					cellRange._x1R = true;
					cellRange._x2R = true;
					cellRange._y1R = false;
					cellRange._y2R = false;
				} else if (cellRange._x1R && cellRange._x2R && !cellRange._y1R && !cellRange._y2R) {
					cellRange._x1R = false;
					cellRange._x2R = false;
					cellRange._y1R = true;
					cellRange._y2R = true;
				} else {
					cellRange._x1R = true;
					cellRange._x2R = true;
					cellRange._y1R = true;
					cellRange._y2R = true;
				}
				break;
			}
			default:
				view.updateSelectionFromEvent(event.key, event.shiftKey, event.ctrlKey, this.getEditRanges());
				break;
		}

		event.preventDefault();
		event.stopPropagation();

		this.updateFormula(ranges, selection.getActiveRange());
	}

	updateReferenceFromDrag(event, view, range) {
		const selection = this.getEditRanges();

		const index = this.rangeIndex;
		if (index !== undefined) {
			const rangeOld = selection.getAt(index);
			if (rangeOld && range.isEqualTo(rangeOld)) {
				return;
			}
			if (rangeOld) {
				range._color = rangeOld._color;
				range._x1R = rangeOld._x1R;
				range._x2R = rangeOld._x2R;
				range._y1R = rangeOld._y1R;
				range._y2R = rangeOld._y2R;
			}
			selection.setAt(index, range);

			this.updateFormula(selection, index);
		}
	}

	updateReferenceFromMouse(event, view) {
		const selection = this.getEditRanges();

		if (this.alwaysReplace && this.getActiveRangeIndex() === undefined && this.getEditRangeCount()) {
			this.setActiveRangeIndex(0);
		}

		const ranges = this.setActiveRange(view);

		let point = event.location.copy();
		point = view.translateToSheet(point, this.viewer);

		const cell = view.getCell(point, true, false);

		const index = selection.getActiveRange();
		if (index !== undefined) {
			const rangeOld = selection.getAt(index);
			if (this.startCell) {
				const range = view.getItem().getRangeFromPositions(this.startCell, cell);
				if (rangeOld && range.isEqualTo(rangeOld)) {
					return;
				}
				if (rangeOld) {
					range._color = rangeOld._color;
					range._x1R = rangeOld._x1R;
					range._x2R = rangeOld._x2R;
					range._y1R = rangeOld._y1R;
					range._y2R = rangeOld._y2R;
				}
				selection.setAt(index, range);
				view.showCell(cell);
			} else {
				selection.update(index, view.getItem().getRangeFromPositions(cell));
				this.startCell = cell;
			}
		}

		this.updateFormula(ranges, index);
	}

	updateFormula(ranges, index) {
		const refText = ranges.toStringByIndex(index, { useName: true, item: this.formulaSheet });

		// simply replace
		if (this.alwaysReplace) {
			this.div.innerHTML = this.allowNoEqual ? refText : `=${refText}`;
			this.updateEditRangesView();
			this.selectedRangeByIndex(0);
		} else {
			if (this.oldContent === undefined) {
				this.oldContent = this.div.innerHTML;
				this.oldContentPos = this.saveSelection();
			}

			this.div.innerHTML = this.oldContent;
			this.restoreSelection(this.oldContentPos);
			this.insertTextAtCursor(refText, index);

			this.restoreSelection({
				start: this.oldContentPos.start + refText.length,
				end: this.oldContentPos.start + refText.length
			});
		}

		this.invalidate();
	}

	selectedRangeByIndex(index) {
		// clean first
		const refs = this.div.getElementsByTagName('span');
		for (let i = refs.length - 1; i >= 0; i -= 1) {
			if (refs[i].id === 'range' && refs[i].textContent === '') {
				this.div.removeChild(refs[i]);
			}
		}

		this.oldContent = undefined;
		this.oldContentPos = undefined;

		const range = document.createRange();
		if (refs[index].childNodes.length) {
			range.selectNodeContents(refs[index].childNodes[0]);
		}

		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	}

	getSelectedRangeIndex() {
		if (!this.isRangeSelected()) {
			return undefined;
		}
		return this.getSelectedRangeIndexNoRange();
	}

	getSelectedRangeIndexNoRange() {
		const sel = window.getSelection();

		if (sel.rangeCount === 0) {
			return undefined;
		}
		const range = sel.getRangeAt(0);

		// clean first
		let refs = this.div.getElementsByTagName('span');
		for (let i = refs.length - 1; i >= 0; i -= 1) {
			if (refs[i].id === 'range' && refs[i].textContent === '') {
				this.div.removeChild(refs[i]);
			}
		}

		refs = this.div.getElementsByTagName('span');
		for (let i = 0; i < refs.length; i += 1) {
			if (refs[i].id === 'range' && refs[i] === range.startContainer.parentNode) {
				return i;
			}
		}
		return undefined;
	}

	toggleReferenceType(event, view) {
		const index = this.getSelectedRangeIndexNoRange();
		if (index !== undefined) {
			this.setActiveRangeIndex(index);
			this.selectedRangeByIndex(index);
			this.updateReference(event, view);
		}
	}

	isReferenceByKeyAllowed() {
		if (!this.isReferenceMode()) {
			return false;
		}

		if (this.alwaysReplace || this.isRangeSelected() || this.oldContent) {
			return true;
		}

		const previous = this.getTextAtCursor(-1);

		return this.isReferenceChar(previous);
	}

	isReferencePointingAllowed() {
		if (this.isRangeSelected() || this.alwaysReplace) {
			return true;
		}

		const previous = this.getTextAtCursor(-1);
		return this.isReferenceChar(previous);
	}

	isRangeSelected() {
		const sel = window.getSelection();

		if (sel === undefined || sel.rangeCount === 0) {
			return false;
		}

		const range = sel.getRangeAt(0);
		if (range === undefined) {
			return false;
		}

		if (range.commonAncestorContainer === undefined || range.commonAncestorContainer.parentNode.id !== 'range') {
			return false;
		}
		if (range.startContainer !== range.endContainer) {
			return false;
		}

		let text = range.startContainer.textContent;
		text = text.substring(0, range.endOffset - range.startOffset);

		return CellRange.parse(text, this.formulaSheet, true);
	}

	handleDoubleClick() {
		const sel = window.getSelection();

		if (sel === undefined) {
			return;
		}

		const range = sel.getRangeAt(0);
		if (range === undefined) {
			return;
		}

		try {
			let rangeNew;
			if (this.focusNode) {
				if (this.focusNode.parentNode.id === 'range') {
					const text = this.focusNode.textContent;
					rangeNew = document.createRange();
					rangeNew.setStart(this.focusNode, 0);
					rangeNew.setEnd(this.focusNode, text.length);
				} else if (this.focusNode === sel.focusNode) {
					const separator = JSG.getParserLocaleSettings().separators.parameter;
					let offset = this.focusOffset;
					const text = this.focusNode.textContent;
					let startOffset;
					while (offset >= 0 && offset < text.length) {
						if (text.charAt(offset) === separator || text.charAt(offset) === '(') {
							startOffset = offset + 1;
							break;
						}
						offset -= 1;
					}
					offset = this.focusOffset;
					let endOffset;
					while (offset < text.length) {
						if (text.charAt(offset) === separator || text.charAt(offset) === ')') {
							endOffset = offset;
							break;
						}
						offset += 1;
					}
					if (startOffset !== undefined && endOffset !== undefined) {
						rangeNew = document.createRange();
						rangeNew.setStart(this.focusNode, startOffset);
						rangeNew.setEnd(this.focusNode, endOffset);
					}
				}
			}
			if (rangeNew) {
				sel.removeAllRanges();
				sel.addRange(rangeNew);
			}
			// eslint-disable-next-line no-empty
		} catch (e) {}
	}

	insertTextAtCursor(text, index) {
		const sel = window.getSelection();
		if (sel.getRangeAt && sel.rangeCount) {
			const range = sel.getRangeAt(0);
			range.deleteContents();

			const span = document.createElement('span');
			span.id = 'range';
			span.style.color = RANGE_COLORS[index % RANGE_COLORS.length];
			// set the content of the span
			const refText = document.createTextNode(text);
			span.appendChild(refText);

			range.insertNode(span);
		}
	}

	isReferenceChar(char) {
		switch (char) {
			case '=':
			case '<':
			case '>':
			case '^':
			case '%':
			case '&':
			case '|':
			case '+':
			case '-':
			case '*':
			case '/':
			case ',':
			case ';':
			case '(':
				return true;
		}

		return this.allowNoEqual && char === '';
	}

	getTextAtCursor(offset) {
		const pos = this.saveSelection();
		if (pos) {
			return this.div.textContent.length + offset >= 0 ? this.div.textContent[pos.start + offset] : '';
		}

		return '';
	}

	/**
	 * Returns the current text selection start and end position.
	 *
	 * @method saveSelection
	 * @return {Object} Object with start and end index as properties.
	 */
	saveSelection() {
		let charIndex = 0;
		let start = 0;
		let end = 0;
		let foundStart = false;
		const stop = {};
		const sel = window.getSelection();

		const traverseTextNodes = (node, range) => {
			if (node.nodeType === 3) {
				if (!foundStart && node === range.startContainer) {
					start = charIndex + range.startOffset;
					foundStart = true;
				}
				if (foundStart && node === range.endContainer) {
					end = charIndex + range.endOffset;
					throw stop;
				}
				charIndex += node.length;
			} else {
				let i;
				let len;
				// eslint-disable-next-line
				for (i = 0, len = node.childNodes.length; i < len; ++i) {
					traverseTextNodes(node.childNodes[i], range);
				}
			}
		};

		if (sel.rangeCount && this.div) {
			const element = this.div;
			try {
				traverseTextNodes(element, sel.getRangeAt(0));
			} catch (ex) {
				if (ex !== stop) {
					throw ex;
				}
			}
		}

		return {
			start,
			end
		};
	}

	/**
	 * Restores the selection based on the given start and end index of the selection.
	 *
	 * @method restoreSelection
	 * @param {Object} savedSel Object with a start and end property containing the selection start index and end index.
	 */
	restoreSelection(savedSel) {
		let charIndex = 0;
		let foundStart = false;
		const stop = {};
		const element = this.div;

		const range = document.createRange();
		range.setStart(element, 0);
		range.setEnd(element, 0);

		const traverseTextNodes = (node) => {
			if (node.nodeType === 3) {
				const nextCharIndex = charIndex + node.length;
				if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
					range.setStart(node, savedSel.start - charIndex);
					foundStart = true;
				}
				if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
					range.setEnd(node, savedSel.end - charIndex);
					throw stop;
				}
				charIndex = nextCharIndex;
			} else {
				let i;
				let len;
				// eslint-disable-next-line
				for (i = 0, len = node.childNodes.length; i < len; ++i) {
					traverseTextNodes(node.childNodes[i]);
				}
			}
		};

		const sel = window.getSelection();

		try {
			traverseTextNodes(element);
		} catch (ex) {
			if (ex === stop) {
				sel.removeAllRanges();
				sel.addRange(range);
				return;
			}
			throw ex;
		}

		let last = element.lastChild;
		while (last && last.lastChild && last.lastChild.nodeType === 1 && last.lastChild.nodeName !== 'BR') {
			last = last.lastChild;
		}
		if (last !== null) {
			range.selectNodeContents(last);
			const selection = window.getSelection();
			if (selection) {
				selection.removeAllRanges();
				selection.addRange(range);
				selection.collapseToEnd();
			}
		}
	}
}
