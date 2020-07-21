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
/* global window document Node */

import {
	default as JSG,
	CellsNode,
	Shape,
	Point,
	Rectangle,
	HeaderNode,
	StreamSheet,
	SheetHeaderNode,
	MathUtils,
	FormatAttributes,
	TextFormatAttributes,
	GraphUtils
} from '@cedalo/jsg-core';
import WorksheetView from '../view/WorksheetView';
import CellEditor from '../view/CellEditor';
import EditTextInteraction from './EditTextInteraction';
import KeyEvent from '../../ui/events/KeyEvent';
import Cursor from '../../ui/Cursor';

/**
 * Interaction that handles the text editing. When activated a contenteditable div is created. While editing
 * the position of the div is rearranged to reflect the node text alignment.
 *
 * @class EditCellInteraction
 * @extends AbstractInteraction
 * @constructor
 */
export default class EditCellInteraction extends EditTextInteraction {
	constructor() {
		super();

		this._richText = false;
	}

	doWrapText() {
		return false;
	}

	handleBlur(ev) {
		if (
			!this._cellEditor.isReferenceMode() &&
			this.div !== undefined &&
			this.div._ignoreBlur !== true &&
			(!ev.relatedTarget || ev.relatedTarget.tagName !== 'A')
		) {
			this.finishInteraction(undefined, this.getViewer());
		}
	}

	getCurrentView(viewer) {
		const controller = viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => true);

		if (controller && controller.getView().getWorksheetView) {
			return controller.getView().getWorksheetView();
		}

		return undefined;
	}

	onMouseDown(event, viewer) {
		const controller = this.getSheetController(event, viewer);

		if (controller) {
			this._interaction.setStartLocation(this.startLocation);
			this._interaction.setCurrentLocation(this.currentLocation);
			this._interaction._controller = controller;
			this._interaction._hitCode = controller.getView().getHitCode(event.location, viewer);
		}

		let point = event.location.copy();
		const view = this.getWorksheetView();

		point = view.translateToSheet(point, viewer);

		if (view.doHandleEventAt(point, event)) {
			event.keepFocus = true;
			event.location = point;
			view.handleMouseEvent(event);
		} else if (controller) {
			if (
				this._cellEditor.isReferenceMode() ||
				this._interaction._hitCode === WorksheetView.HitCode.REFERENCEMOVE ||
				this._cellEditor.isReferencePointingAllowed(view)
			) {
				this._interaction.onMouseDown(event, viewer);
			} else {
				if (this.checkFormula(this._item) === false) {
					return;
				}
				// finish this interaction first to assign value to current cell
				this.div._ignoreBlur = true;
				this.finishInteraction(event, viewer);
				// this.div._ignoreBlur = false;
				this.getInteractionHandler().setActiveInteraction(this._interaction);
				this._interaction.onMouseDown(event, viewer);
			}
		}
	}

	onMouseMove(event, viewer) {
		const controller = this.getSheetController(event, viewer);
		if (controller) {
			const view = controller.getView();
			const hitCode = view.getHitCode(event.location, viewer);
			view.setCursor(hitCode, this);
		} else {
			this.setCursor(Cursor.Style.AUTO);
		}
	}

	onMouseDrag(event, viewer) {
		const view = this.getWorksheetView();

		this._interaction.setStartLocation(this.startLocation);
		this._interaction.setCurrentLocation(this.currentLocation);
		// this._interaction._controller = this._controller;

		let point = event.location.copy();
		point = view.translateToSheet(point, viewer);

		if (view.doHandleEventAt(point, event)) {
			event.keepFocus = true;
			event.location = point;
			view.handleMouseEvent(event);
		} else if (this._cellEditor.startCell || this._interaction._hitCode === WorksheetView.HitCode.REFERENCEMOVE) {
			this._interaction.onMouseDrag(event, viewer);
		} else {
			super.onMouseDrag(event, viewer);
		}
	}

	onMouseUp(event, viewer) {
		// cannot ignore onMouseUp, which is fired document wide!! => need it to get mouse click outside GraphEditor
		// if not handled inner div simply lose focus...!!

		this._interaction._feedback = undefined;

		// if (this._cellEditor.isReferenceMode()) {
		// 	// this.div.focus();
		// } else if (!this.isInside(this._controller, event.location)) {
		// 	this.finishInteraction(event, viewer);
		// }
	}

	onMouseWheel(event, viewer) {
		this._interaction._controller = this._controller;
		this._interaction.onMouseWheel(event, viewer);
	}

	getSheetController(event, viewer) {
		if (event.isConsumed) {
			return undefined;
		}

		let controller = viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => true);
		if (controller) {
			if (
				!(controller.getModel() instanceof CellsNode) &&
				!(controller.getModel() instanceof HeaderNode) &&
				!(controller.getModel() instanceof SheetHeaderNode) &&
				!(controller.getModel() instanceof StreamSheet)
			) {
				let cont = controller;
				while (cont && !(cont.getModel() instanceof StreamSheet)) {
					cont = cont.getParent();
				}
				if (cont) {
					const view = cont.getView().getWorksheetView();
					const cell = view.getCellInside(event, viewer);
					if (cell.x === -1 || cell.y === -1) {
						controller = cont;
					} else {
						cont = undefined;
					}
				}
				if (cont === undefined) {
					controller = undefined;
				}
			}
			if (controller !== undefined && !(controller.getView() instanceof WorksheetView)) {
				controller = controller.getParent().getParent();
			}
		}

		return controller;
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
				.getTranslatedRectangleox(this._item.getGraph())
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
	startEdit(controller, event, viewer) {
		const onSelect = () => {
			const selection = window.getSelection();
			if (selection.isCollapsed) {
				this._cellEditor.focusOffset = selection.focusOffset;
				this._cellEditor.focusNode = selection.focusNode;
			}
			this._cellEditor.deActivateReferenceMode();
		};
		const onMouseDown = () => {};
		const onMouseUp = (ev) => this.handleMouseUp(ev);
		const onDblClick = (ev) => this.handleDblClick(ev);
		const onKeyUp = (ev) => this.handleKeyUp(ev);
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

		this._controller = controller;
		this._item = controller.getModel();
		this._newEdit = !(event.event.key === undefined || event.event.key === 'F2');

		const canvas = viewer.getCanvas();
		const cs = viewer.getCoordinateSystem();
		const textFormat = this._item.getTextFormat();

		viewer.getSelectionView().setVisible(false);

		const div = document.createElement('div');

		if (!this.isViewMode(controller)) {
			div.contentEditable = 'true';
		}

		this._cellEditor = CellEditor.activateCellEditor(div, viewer, this._item);

		div.style.resize = 'none';
		div.id = 'jsgTextEdit';
		div.tabIndex = '5';
		div.zIndex = 100;
		div.spellcheck = false;
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

		// css settings due to TextNode Format
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
		div.style.fontSize = /* textFormat.getFontSize().getValue() +*/ '9pt';
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
		if (color === '#FFFFFF' && JSG.theme.fill === '#FFFFFF') {
			div.style.color = '#000000';
		} else 	if (color === '#000000' && JSG.theme.fill === '#000000') {
			div.style.color = '#FFFFFF';
		} else {
			div.style.color = color;
		}

		div.style.boxShadow = '2px 2px 2px lightgrey';
		// div.style.textAlign = this._item.getTextAlign();

		// padding around text
		const attributes = this._item.getItemAttributes();
		div.style.paddingLeft = `${cs.logToDeviceXNoZoom(attributes.getLeftMargin().getValue() + 100)}px`;
		div.style.paddingTop = `${cs.logToDeviceYNoZoom(attributes.getTopMargin().getValue() + 100)}px`;
		div.style.paddingRight = `${cs.logToDeviceXNoZoom(attributes.getRightMargin().getValue() + 200)}px`;
		div.style.paddingBottom = `${cs.logToDeviceYNoZoom(attributes.getBottomMargin().getValue() + 100)}px`;
		div.style.whiteSpace = 'pre-wrap';

		div.autofocus = true;

		const style = document.createElement('style');

		// special style for  cell edit
		style.type = 'text/css';
		style.innerHTML = '#jsgTextEdit ul, ol, p {margin-top : 0.25em; margin-bottom : 0.25em;}';
		document.getElementsByTagName('head')[0].appendChild(style);

		this.div = div;

		document.execCommand('defaultParagraphSeparator', null, 'p');
		canvas.parentNode.appendChild(div);

		if (this._newEdit) {
			div.innerHTML = '';
		} else {
			div.innerHTML = this.getEditText(this._item);
		}

		// place div and scroll div into view, if necessary
		this.updateTextArea(viewer, true, true);

		const view = this.getWorksheetView();

		if (event.event.key === '=') {
			this._cellEditor.activateReferenceMode();
		}

		this._cellEditor.updateEditRangesView(view);

		// select complete text
		if (window.getSelection) {
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(div);
			selection.removeAllRanges();
			selection.addRange(range);
			selection.collapseToEnd();
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

	handleMouseUp(ev) {
		this._cellEditor.updateFunctionInfo();
	}

	handleDblClick(ev) {
		const view = this.getWorksheetView();
		this._cellEditor.handleDoubleClick(view);
		this._cellEditor.deActivateReferenceMode();
	}

	handlePaste(e) {}

	handleChange(ev) {
		this.updateTextArea(this.getViewer(), false, false);
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
		const viewer = this.getViewer();

		const finish = (key) => {
			const view = this.getWorksheetView();
			if (this.checkFormula(this._item) === false) {
				this._newEdit = false;
				ev.preventDefault();
				ev.stopPropagation();
				return;
			}

			const canvas = viewer.getGraphicSystem().getCanvas();
			ev.preventDefault();
			ev.stopPropagation();

			this._interaction.setStartLocation(this.startLocation);
			this._interaction.setCurrentLocation(this.currentLocation);
			this._interaction._controller = this._controller;
			this._interaction._hitCode = WorksheetView.HitCode.SHEET;

			const keyEvent = KeyEvent.fromEvent(canvas, ev, key);
			this.div._ignoreBlur = true;
			this.finishInteraction(keyEvent, viewer);
			// this.div._ignoreBlur = false;
			this.getInteractionHandler().setActiveInteraction(this._interaction);
			if (key !== 13) {
				this._interaction.onKeyDown(keyEvent, viewer);
			}
			view.showActiveCell();
			view.notifySelectionChange(viewer);
			this.getInteractionHandler().repaint();
		};

		let view = this.getWorksheetView();
		if (this._interaction && this._interaction._controller) {
			view = this._interaction._controller.getView();
		}

		if (this._cellEditor.handleFunctionListKey(ev, view)) {
			return undefined;
		}

		switch (ev.key) {
			case 'F2':
				this._cellEditor.toggleReferenceMode();
				this._newEdit = false;
				break;
			case 'F4':
				this._cellEditor.toggleReferenceType(ev, view);
				break;
			case 'ArrowLeft':
				if (this._cellEditor.isReferenceByKeyAllowed()) {
					const index = this._cellEditor.getSelectedRangeIndex();
					this._cellEditor.activateReferenceMode();
					if (index !== undefined) {
						this._cellEditor.setActiveRangeIndex(index);
					}
					this._cellEditor.updateReference(ev, view);
				} else if (
					(this._newEdit && !this._cellEditor.isReferenceMode()) ||
					this._cellEditor.isReferenceMode()
				) {
					finish(KeyEvent.KeyEventType.LEFT);
				}
				break;
			case 'ArrowRight':
				if (this._cellEditor.isReferenceByKeyAllowed()) {
					const index = this._cellEditor.getSelectedRangeIndex();
					this._cellEditor.activateReferenceMode();
					if (index !== undefined) {
						this._cellEditor.setActiveRangeIndex(index);
					}
					this._cellEditor.updateReference(ev, view);
				} else if (
					(this._newEdit && !this._cellEditor.isReferenceMode()) ||
					this._cellEditor.isReferenceMode()
				) {
					finish(KeyEvent.KeyEventType.RIGHT);
				}
				break;
			case 'ArrowUp':
				if (this._cellEditor.isReferenceByKeyAllowed()) {
					const index = this._cellEditor.getSelectedRangeIndex();
					this._cellEditor.activateReferenceMode();
					if (index !== undefined) {
						this._cellEditor.setActiveRangeIndex(index);
					}
					this._cellEditor.updateReference(ev, view);
				} else if (
					(this._newEdit && !this._cellEditor.isReferenceMode()) ||
					this._cellEditor.isReferenceMode()
				) {
					finish(KeyEvent.KeyEventType.UP);
				}
				break;
			case 'ArrowDown':
				if (this._cellEditor.isReferenceByKeyAllowed()) {
					const index = this._cellEditor.getSelectedRangeIndex();
					this._cellEditor.activateReferenceMode();
					if (index !== undefined) {
						this._cellEditor.setActiveRangeIndex(index);
					}
					this._cellEditor.updateReference(ev, view);
				} else if (
					(this._newEdit && !this._cellEditor.isReferenceMode()) ||
					this._cellEditor.isReferenceMode()
				) {
					finish(KeyEvent.KeyEventType.DOWN);
				}
				break;
			default:
				break;
		}

		if (this._cellEditor.isReferenceChar(ev.key, view)) {
			this._cellEditor.oldContent = undefined;
		}

		switch (ev.key) {
			case 'Tab':
				ev.preventDefault();
				break;
			case 'Space':
				if (ev.altKey) {
					ev.preventDefault();
					ev.stopPropagation();
					return false;
				}
				break;
			case 'Escape': {
				// ESC
				const canvas = viewer.getGraphicSystem().getCanvas();
				const keyEvent = KeyEvent.fromEvent(canvas, ev, KeyEvent.KeyEventType.DOWN);
				this.div._ignoreBlur = true;
				this.cancelInteraction(keyEvent, viewer);
				// this.div._ignoreBlur = false;
				break;
			}
			case 'Enter':
				if (ev.altKey) {
					// TODO
				} else {
					finish(13);
					return false;
				}
				break;
			default:
				break;
		}

		return undefined;
	}

	handleKeyUp(ev) {
		if (ev.keyCode === 18 || ev.altKey) {
			ev.preventDefault();
			return false;
		}

		this.updateTextArea(this.getViewer(), false, false);

		switch (ev.key) {
			case 'F2':
			case 'F4':
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'ArrowRight':
			case 'ArrowDown':
			case 'Shift':
			case 'Control':
			case 'Enter':
				ev.preventDefault();
				ev.stopPropagation();
				break;
			default:
				this._cellEditor.updateEditRangesView(this.getWorksheetView());
				break;
		}

		this._cellEditor.updateFunctionInfo();

		return undefined;
	}

	invalidate() {
		const ws = this.getWorksheet();
		const interactionHandler = this.getInteractionHandler();

		ws.getGraph().markDirty();
		interactionHandler.repaint();
	}

	getWorksheet() {
		return this._controller
			.getView()
			.getWorksheetView()
			.getItem();
	}

	getWorksheetView() {
		return this._controller.getView().getWorksheetView();
	}

	getActiveCell() {
		const view = this.getWorksheetView();
		return view.getOwnSelection().getActiveCell();
	}
	/**
	 * Stores the text prior to text editing. This text is used for the undo command.
	 *
	 * @method storeUndoText
	 * @param {TextNode} item Node to retrieve text from.
	 */
	storeUndoText() {
		// this._undoText = item.getText().copy();
	}

	/**
	 * Retrieves the text from the TextNode for editing.
	 *
	 * @method getEditText
	 * @param {TextNode} item Node to retrieve text from.
	 * @return {String} Text content of TextNode.
	 */
	getEditText() {
		const view = this.getWorksheetView();
		const activeCell = view.getOwnSelection().getActiveCell();
		const value = view.getEditString(activeCell);

		return `<p>${value}</p>`;
	}

	_resetText() {}

	/**
	 * Update the position of the DIV based on the content of the DIV and the text position relative to the parent node.
	 *
	 * @method updateTextArea
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {Boolean} [scroll] False, if the TextNode shall not be scrolled into view.
	 */
	updateTextArea(viewer, scroll, initial) {
		if (!this.div) {
			return;
		}

		const item = this._item;
		const angle = item.getAngle().getValue();
		const cs = viewer.getCoordinateSystem();
		const canvas = viewer.getCanvas();
		// let size = item.getSizeAsPoint();

		const cellRect = this.getCellRect(this._controller, viewer);
		const center = new Point(cellRect.x + cellRect.width / 2, cellRect.y + cellRect.height / 2);
		const size = new Point(cellRect.width, cellRect.height);

		GraphUtils.traverseUp(this._controller.getView(), viewer.getRootView(), (v) => {
			v.translateToParent(center);
			return true;
		});

		this.div.style.minWidth = `${cs.logToDeviceX(cellRect.width, false)}px`;

		if (this.doWrapText()) {
			// add border width
			const width =
				Math.ceil(
					cs.logToDeviceXNoZoom(
						item
							.getSize()
							.getWidth()
							.getValue(),
						false
					)
				) + 2;
			this.div.style.width = `${width}px`;
			this.div.style.maxWidth = `${width}px`;
		}

		if (initial === false) {
			return;
		}

		let origin = '';

		// TODO fix zoom rotation bug, the rotation center has to adapt the transformOrigin change.
		// TODO get alignment from cell
		const alignment = TextFormatAttributes.HorizontalTextPosition.LEFT;
		switch (alignment) {
			case TextFormatAttributes.HorizontalTextPosition.TOLEFT:
				origin = 'right';
				this.div.style.left = `${(
					cs.logToDeviceX(center.x, false) +
					cs.logToDeviceX(size.x / 2, false) +
					canvas.offsetLeft -
					this.div.offsetWidth
				).toFixed()}px`;
				break;
			case TextFormatAttributes.HorizontalTextPosition.LEFT:
				origin = 'left';
				this.div.style.left = `${(
					cs.logToDeviceX(center.x, false) -
					cs.logToDeviceX(size.x / 2, false) +
					canvas.offsetLeft
				).toFixed()}px`;
				break;
			case TextFormatAttributes.HorizontalTextPosition.CUSTOM:
			case TextFormatAttributes.HorizontalTextPosition.CENTER:
				origin = 'center';
				this.div.style.left = `${(
					cs.logToDeviceX(center.x, false) +
					canvas.offsetLeft -
					this.div.offsetWidth / 2
				).toFixed()}px`;
				break;
			case TextFormatAttributes.HorizontalTextPosition.RIGHT:
				origin = 'right';
				this.div.style.left = `${(
					cs.logToDeviceX(center.x, false) +
					cs.logToDeviceX(size.x / 2, false) +
					canvas.offsetLeft -
					this.div.offsetWidth
				).toFixed()}px`;
				break;
			case TextFormatAttributes.HorizontalTextPosition.TORIGHT:
				origin = 'left';
				this.div.style.left = `${(
					cs.logToDeviceX(center.x, false) -
					cs.logToDeviceX(size.x / 2, false) +
					canvas.offsetLeft
				).toFixed()}px`;
				break;
			default:
				break;
		}

		switch (
			item
				.getTextFormat()
				.getVerticalPosition()
				.getValue()
		) {
			case TextFormatAttributes.VerticalTextPosition.ONTOP:
				origin += ' bottom';
				this.div.style.top = `${(
					cs.logToDeviceY(center.y, false) +
					cs.logToDeviceY(size.y / 2, false) +
					canvas.offsetTop -
					this.div.offsetHeight
				).toFixed()}px`;
				break;
			case TextFormatAttributes.VerticalTextPosition.TOP:
				origin += ' top';
				this.div.style.top = `${(
					cs.logToDeviceY(center.y, false) -
					cs.logToDeviceY(size.y / 2, false) +
					canvas.offsetTop
				).toFixed()}px`;
				break;
			case TextFormatAttributes.VerticalTextPosition.CUSTOM:
			case TextFormatAttributes.VerticalTextPosition.CENTER:
				origin += ' center';
				this.div.style.top = `${(
					cs.logToDeviceY(center.y, false) +
					canvas.offsetTop -
					this.div.offsetHeight / 2
				).toFixed()}px`;
				break;
			case TextFormatAttributes.VerticalTextPosition.BOTTOM:
				origin += ' bottom';
				this.div.style.top = `${(
					cs.logToDeviceY(center.y, false) +
					cs.logToDeviceY(size.y / 2, false) +
					canvas.offsetTop -
					this.div.offsetHeight
				).toFixed()}px`;
				break;
			case TextFormatAttributes.VerticalTextPosition.BELOWBOTTOM:
				origin += ' top';
				this.div.style.top = `${(
					cs.logToDeviceY(center.y, false) -
					cs.logToDeviceY(size.y / 2, false) +
					canvas.offsetTop
				).toFixed()}px`;
				break;
			default:
				break;
		}

		const zoom = Math.max(1, cs.getZoom());
		this.div.style.transform = `rotate(${MathUtils.toDegrees(angle, true)}deg) scale(${zoom},${zoom})`;
		this.div.style.transformOrigin = origin;
	}

	getCellRect() {
		const view = this._controller.getView().getWorksheetView();
		const activeCell = view.getOwnSelection().getActiveCell();
		const cellRect = view.getCellRect(activeCell);
		const origin = new Point(cellRect.x, cellRect.y);

		return new Rectangle(origin.x, origin.y, cellRect.width, cellRect.height);
	}

	_getNewText() {
		// innerText for IE, textContent for other browsers
		return this.div.textContent;
	}

	findTextNode(element) {
		let textnode = element.nodeType === 3 ? element : undefined;
		if (!textnode) {
			const childnodes = element.childNodes;
			for (let i = 0; i < childnodes.length && !textnode; i += 1) {
				textnode = this.findTextNode(childnodes[i]);
			}
		}
		return textnode;
	}
	setCursorAt(index) {
		const textnode = this.findTextNode(this.div);
		// TODO: find position, if there are colored cell ref sections
		if (textnode && textnode.length >= index) {
			const range = document.createRange();
			range.setStart(textnode, index);
			range.setEnd(textnode, index);
			const selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
			selection.collapseToEnd();
		}
	}
	checkFormula(item) {
		const newText = this._getNewText();
		const view = this.getWorksheetView();

		try {
			view.getItem().textToExpression(newText);
		} catch (e) {
			this.div._ignoreBlur = true;
			this._cellEditor.deActivateReferenceMode();
			view.notifyMessage({
				message: e.message,
				focusElement: this.div,
				focusIndex: e.index !== undefined ? e.index + 1 : 1
			});
			return false;
		}

		return true;
	}

	removeRanges(viewer) {
		this._cellEditor.removeEditRanges();
		this._cellEditor.deActivateReferenceMode();
		viewer.getGraph().markDirty();
	}

	deactivate(viewer) {
		this.removeRanges(viewer);
		CellEditor.deActivateCellEditor();
		super.deactivate(viewer);
	}

	cancelInteraction(event, viewer) {
		this.didFinish(event, viewer);
		this.getInteractionHandler().repaint();
	}

	willFinish(event, viewer) {
		const view = this.getWorksheetView();
		let data;

		try {
			data = view.getItem().textToExpression(this._getNewText());
		} catch (e) {
			return;
		}

		const ref = view.getOwnSelection().activeCellToString();
		let cmd = new JSG.SetCellDataCommand(this._item, ref, data.expression, true);
		const interactionHandler = this.getInteractionHandler();

		if (cmd !== undefined) {
			interactionHandler.execute(cmd);
			if (data.numberFormat) {
				cmd = view.getNumberFormatCommand(
					viewer,
					view.getOwnSelection().getActiveCell(),
					data.numberFormat,
					data.localCulture
				);
				if (cmd) {
					interactionHandler.execute(cmd);
				}
			}
		}
	}

	didFinish(event, viewer) {
		// super.didFinish(event, viewer);
		viewer.getSelectionView().setVisible(true);
		const interactionHandler = this.getInteractionHandler();
		interactionHandler.setActiveInteraction(interactionHandler.getDefaultInteraction());
	}
}
