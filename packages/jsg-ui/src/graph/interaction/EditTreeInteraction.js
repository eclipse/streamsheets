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

import { default as JSG, FormatAttributes, TextFormatAttributes, GraphUtils, MathUtils, Point } from '@cedalo/jsg-core';

import EditTextInteraction from './EditTextInteraction';
import KeyEvent from '../../ui/events/KeyEvent';

/**
 * Interaction that handles TreeView item selection and edit.
 *
 * @class EditTreeInteraction
 *
 * @constructor
 */
export default class EditTreeInteraction extends EditTextInteraction {
	constructor() {
		super();
		this._controller = undefined;
		this._treeInteraction = undefined;
	}

	setTreeInteraction(treeInteraction) {
		this._treeInteraction = treeInteraction;
	}

	doWrapText() {
		return false;
	}

	onMouseDown(event, viewer) {
		this.finishInteraction(event, viewer);
	}

	onMouseUp(event, viewer) {
		if (!this.isInside(this._controller, event.location)) {
			this.finishInteraction(event, viewer);
		}
	}

	/**
	 * Checks whether a point lies inside the controller.
	 *
	 * @method isInside
	 * @param {GraphItemController} controller Controller of edited textnode.
	 * @param {Point} location Location to check.
	 * @return {Boolean} True, if location is inside textnode.
	 */
	isInside(controller, location) {
		if (controller !== undefined) {
			const bounds = controller
				.getModel()
				.getTranslatedBoundingBox(this._item.getGraph())
				.getBoundingRectangle();
			return bounds.containsPoint(this.getViewer().translateFromParent(location.copy()));
		}

		return false;
	}

	/**
	 * Starts editing a TextNode. A contenteditable div is created and all event listeners are initialized.
	 * The DIV is placed accordingly and scrolled into view.
	 *
	 * @method startEdit
	 * @param {GraphItemController} controller Controller of edited textnode.
	 * @param {Event} event Event that initiated the interaction.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	startEdit(controller, event, viewer, isKeyEditing) {
		const onSelect = () => {
			this._formatInfo.reset();
		};

		const onMouseDown = () => {};

		const onDblClick = () => {
			const sel = window.getSelection();

			if (sel === undefined) {
				return;
			}

			const range = sel.getRangeAt(0);
			if (range === undefined) {
				return;
			}

			const rangeNew = document.createRange();
			let text = range.startContainer.textContent;
			if (text.charAt(range.startOffset - 1) === '"') {
				rangeNew.setStart(range.startContainer, range.startOffset - 1);
			}
			text = range.endContainer.textContent;
			if (text.charAt(range.endOffset) === '"') {
				rangeNew.setEnd(range.endContainer, range.endOffset + 1);
			}

			sel.addRange(rangeNew);
		};

		const onMouseUp = () => {
			setTimeout(() => {
				this.updateToolbar(viewer);
			}, 100);
		};

		const onKeyUp = (ev) => {
			this.updateToolbar(viewer);
			return this.handleKeyUp(ev);
		};

		const onKeyDown = (ev) => this.handleKeyDown(ev);
		const onKeyPress = (ev) => this.handleKeyPress(ev);
		const onChange = (ev) => this.handleChange(ev);
		const onBlur = (ev) => this.handleBlur(ev);
		const onHandlePaste = (ev) => this.handlePaste(ev);

		const onDragDisable = (ev) => {
			ev.preventDefault();
			return false;
		};

		if (controller === undefined || this.div !== undefined) {
			return;
		}

		if (event) {
			event.isConsumed = true;
		}

		const canvas = viewer.getCanvas();

		this._controller = controller;
		this._item = controller.getModel();
		this._selectedItem = controller.getView().getSelectedItem();
		this._isKeyEditing = isKeyEditing;
		this._cancel = false;

		viewer.getSelectionView().setVisible(false);

		const cs = viewer.getCoordinateSystem();
		const textFormat = this._item.getTextFormat();

		const div = document.createElement('div');

		// set up DIV to reflect TextNode format
		// global css settings

		if (!this.isViewMode(controller)) {
			div.contentEditable = 'true';
		}

		div.style.resize = 'none';
		div.id = 'jsgTextEdit';
		div.tabIndex = '5';
		div.zIndex = 100; // on top of everything
		div.style.position = 'absolute';
		div.style.border = '2px solid #4285F4';
		div.style.minHeight = '11px';
		div.style.minWidth = '30px';
		div.style.overflow = 'visible';
		div.style.cssFloat = 'none';
		div.style.boxSizing = 'border-box';

		// force word break by width
		if (this.doWrapText()) {
			div.style.wordWrap = 'break-word';
			div.style.display = 'inline-block';
		} else {
			div.style.display = 'inline-block';
		}

		// css settings due to Tex tNode Format
		div.style.background =
			this._item
				.getFormat()
				.getFillStyle()
				.getValue() === FormatAttributes.FillStyle.NONE
				? 'none'
				: this._item
						.getFormat()
						.getFillColor()
						.getValue();
		div.style.fontSize = `${textFormat.getFontSize().getValue()}pt`;
		div.style.fontFamily = textFormat.getFontName().getValue();
		/* eslint-disable no-bitwise */
		div.style.fontWeight =
			textFormat.getFontStyle().getValue() & TextFormatAttributes.FontStyle.BOLD ? 'bold' : 'normal';
		div.style.fontStyle =
			textFormat.getFontStyle().getValue() & TextFormatAttributes.FontStyle.ITALIC ? 'italic' : 'normal';
		div.style.textDecoration =
			textFormat.getFontStyle().getValue() & TextFormatAttributes.FontStyle.UNDERLINE ? 'underline' : 'none';
		div.style.lineHeight = this._item._lineHeight;
		const color = textFormat.getFontColor().getValue();
		// if font is white it will be invisible, use black font in this case
		if (color !== '#FFFFFF') {
			div.style.color = color;
		}

		// padding around text
		div.style.padding = '4px';
		div.autofocus = true;

		const style = document.createElement('style');

		// special style for cell edit
		style.type = 'text/css';
		style.innerHTML = '#jsgTextEdit ul, ol, p {margin-top : 0.25em; margin-bottom : 0.25em;}';
		document.getElementsByTagName('head')[0].appendChild(style);

		this.div = div;

		document.execCommand('defaultParagraphSeparator', null, 'p');
		canvas.parentNode.appendChild(div);

		if (!this._isKeyEditing && (this._selectedItem.value === undefined || this._selectedItem.value === null)) {
			this._selectedItem.value = '';
		}

		const text = this.getEditText();

		div.innerHTML = text;

		// place div and scroll div into view, if necessary
		this.updateTextArea(viewer);

		// select complete text
		if (window.getSelection) {
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(div);
			selection.removeAllRanges();
			selection.addRange(range);
		}

		div.focus();

		// register event listener to intercept contenteditable behaviour and other
		div.addEventListener('keyup', onKeyUp, false);
		div.addEventListener('keydown', onKeyDown, false);
		div.addEventListener('keypress', onKeyPress, false);
		div.addEventListener('input', onChange, false);
		div.addEventListener('onchange', onChange, false);
		div.addEventListener('mousedown', onMouseDown, false);
		div.addEventListener('mouseup', onMouseUp, false);
		div.addEventListener('dblclick', onDblClick, false);
		div.addEventListener('blur', onBlur, false);
		div.addEventListener('select', onSelect, false);
		div.addEventListener('selectstart', onSelect, false);
		div.addEventListener('selectionchange', onSelect, false);
		div.addEventListener('dragenter', onDragDisable, false);
		div.addEventListener('dragover', onDragDisable, false);
		div.addEventListener('dragleave', onDragDisable, false);
		div.addEventListener('dragexit', onDragDisable, false);
		div.addEventListener('drop', onDragDisable, false);
		div.addEventListener('paste', onHandlePaste, false);
	}

	/**
	 * Handles key down event triggered by native HTML <code>textarea</code> element which is used to
	 * edit texts.
	 *
	 * @method handleKeyDown
	 * @param {KeyboardEvent} ev Native keyboard event..
	 * @return {Boolean} Event return
	 */
	handleKeyDown(ev) {
		const finish = (key) => {
			const viewer = this.getViewer();
			const canvas = viewer.getGraphicSystem().getCanvas();
			const keyEvent = KeyEvent.fromEvent(canvas, ev, key);

			ev.preventDefault();
			ev.stopPropagation();

			const interactionHandler = this.getInteractionHandler();
			this.finishInteraction(keyEvent, viewer);
			interactionHandler.repaint();
		};

		switch (ev.keyCode) {
			case 13:
				// enter Key
				if (ev.altKey) {
					// TODO
				} else {
					finish(KeyEvent.KeyEventType.DOWN);
					return false;
				}
				break;
			default:
				break;
		}

		return undefined;
	}

	/**
	 * Retrieves the text from the TextNode for editing.
	 *
	 * @method getEditText
	 * @param {TextNode} item Node to retrieve text from.
	 * @return {String} Text content of TextNode.
	 */
	getEditText() {
		const view = this._controller.getView();
		const selectedItem = view.getSelectedItem();
		let value = '<br>';
		if (selectedItem !== undefined) {
			if (this._isKeyEditing) {
				value = selectedItem.key;
			} else {
				({ value } = selectedItem);
			}
		}
		if (value === '') {
			value = '<br>';
		}

		return `<p>${value}</p>`;
	}

	/**
	 * Update the position of the DIV based on the content of the DIV and the text position relative to the parent node.
	 *
	 * @method updateTextArea
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	updateTextArea(viewer) {
		if (!this.div) {
			return;
		}

		const item = this._item;
		const angle = item.getAngle().getValue();
		const cs = viewer.getCoordinateSystem();
		const canvas = viewer.getCanvas();

		const cellRect = this.getSelectedItemRect(this._isKeyEditing);
		const center = new Point(cellRect.x + cellRect.width / 2, cellRect.y + cellRect.height / 2);
		const size = new Point(cellRect.width, cellRect.height);

		GraphUtils.traverseUp(this._controller.getView(), viewer.getRootView(), (v) => {
			v.translateToParent(center);
			return true;
		});

		this.div.style.minWidth = `${cs.logToDeviceX(cellRect.width + 150, false)}px`;

		this.div.style.left = `${(
			cs.logToDeviceX(center.x, false) -
			cs.logToDeviceX(size.x / 2, false) +
			canvas.offsetLeft
		).toFixed()}px`;

		this.div.style.top = `${(
			cs.logToDeviceY(center.y, false) +
			canvas.offsetTop -
			this.div.offsetHeight / 2
		).toFixed()}px`;

		const zoom = Math.max(1, cs.getZoom());
		this.div.style.transform = `rotate(${MathUtils.toDegrees(angle, true)}deg) scale('${zoom},${zoom})`;
		this.div.style.transformOrigin = 'left center';
	}

	willFinish(event, viewer) {
		this._applyText(viewer);
	}

	didFinish(event, viewer) {
		super.didFinish(event, viewer);
		this.getInteractionHandler().repaint();
	}

	_resetText() {}

	getSelectedItemRect(keyEditing) {
		const view = this._controller.getView();
		const selectedItem = view.getSelectedItem();

		return view.getItemRect(selectedItem, keyEditing);
	}

	cancelInteraction(event, viewer) {
		super.cancelInteraction(event, viewer);
	}

	_getNewText() {
		// innerText for IE, textContent for other browsers

		return this.div.textContent;
	}

	_applyText() {
		const interactionHandler = this.getInteractionHandler();
		const cmd = this.createSetTextCommand();
		if (interactionHandler !== undefined && cmd !== undefined) {
			if (!cmd.delayExecution) {
				this._appliedText = true;
				const view = this._controller.getView();
				const selectedItem = view.getSelectedItem();
				interactionHandler.execute(cmd);
				// need to update selection string
				view.setSelectedItem(selectedItem.drawlevel, this.getViewer());
			}
			return true;
		}
		return false;
	}

	createSetTextCommand() {
		// note: item is typeof TreeItemsModel
		const newText = this._getNewText();
		const view = this._controller.getView();
		const selectedItem = view.getSelectedItem();

		const oldText = this._isKeyEditing ? selectedItem.key : selectedItem.value;

		return new JSG.SetTreeItemDataCommand(this._item, selectedItem.level, oldText, newText, this._isKeyEditing);
	}
}
