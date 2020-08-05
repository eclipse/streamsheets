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

import {
	CompoundCommand,
	default as JSG,
	Dictionary,
	Event,
	FormatAttributes,
	GraphSettings,
	GraphUtils,
	ItemAttributes,
	MathUtils,
	Notification,
	NotificationCenter,
	Point,
	SetTextCommand,
	TextFormatAttributes,
	TextNodeAttributes
} from '@cedalo/jsg-core';
import GraphView from '../view/GraphView';
import AbstractInteraction from './AbstractInteraction';
import GraphItemController from '../controller/GraphItemController';
import LayerId from '../view/LayerId';
import KeyEvent from '../../ui/events/KeyEvent';
import { FloatingToolbar, ToolBreak, ToolButton, ToolColor, ToolList, ToolSeparator } from '../view/FloatingToolbar';
import Cursor from '../../ui/Cursor';

/**
 * Interaction that handles the text editing. When activated a contenteditable div is created. While editing
 * the position of the div is rearranged to reflect the node text alignment.
 *
 * @class EditTextInteraction
 * @extends AbstractInteraction
 * @constructor
 */
class EditTextInteraction extends AbstractInteraction {
	constructor() {
		super();

		this.div = undefined;
		this._appliedText = false;
		// flag to signal that text was applied so it is not applied again...
		this._controller = undefined;
		this._notifyFlag = true;
		this._toolBar = undefined;
		this._compStyle = undefined;
		this._savedSelection = undefined;
		this._readOnly = false;

		this._formatInfo = {
			formatMap: new Dictionary(),
			protect: false,
			reset(force) {
				if (!force && this.protect) {
					return;
				}
				this.protect = false;
				this.formatMap.clear();
			}
		};
		// used for on demand text creation. contains the text creation command, should be undone on cancel...
		this.createcmd = undefined;
		// used to check for text changes before applying new text...
		this._startText = undefined;
	}

	/**
	 * Activate the interaction. Here we register Notifications. The text editor is created
	 * explicitly in the method startEdit.
	 *
	 * @method activate
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	activate(viewer) {
		const nc = NotificationCenter.getInstance();
		nc.register(this, NotificationCenter.SCROLL_NOTIFICATION);
		nc.register(this, NotificationCenter.ZOOM_NOTIFICATION);
		nc.register(this, NotificationCenter.DISPLAY_MODE_NOTIFICATION);
	}

	/**
	 * Deactivate the text editor. The contenteditable div is destroyed, the toolbar removed and
	 * Notifications unregistered. The focus is set back to the canvas.
	 *
	 * @method deactivate
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	deactivate(viewer) {
		// PROB: we are listening for blur-events, so we come here again during node#removeChild(div)!!
		// FIX: we mark div as removed...
		this.createcmd = undefined;
		this._startText = undefined;
		this._item._editing = false;
		this._item.getGraph().markDirty();

		if (this.div === undefined || this.div._rm !== true) {
			if (this.div !== undefined) {
				this._item.setItemAttribute(ItemAttributes.VISIBLE, true);
				this.div._rm = true;
				// mark as removed
				const canvas = viewer.getCanvas();
				canvas.focus();
				// set focus to prevent blue-bug in FF30...
				canvas.parentNode.removeChild(this.div);
				// triggers blur-event!!
				this.div = undefined;
			}
			this._controller = undefined;
			if (this._toolBar !== undefined) {
				this._toolBar.remove();
				this._toolBar = undefined;
			}

			const nc = NotificationCenter.getInstance();
			nc.unregister(this, NotificationCenter.SCROLL_NOTIFICATION);
			nc.unregister(this, NotificationCenter.ZOOM_NOTIFICATION);
			nc.unregister(this, NotificationCenter.DISPLAY_MODE_NOTIFICATION);

			super.deactivate(viewer);
		}
	}

	/**
	 * Handles notifications. Here we react to scrolling and zooming by closing the editor.
	 *
	 * @method onNotification
	 * @param {Notification} notification Notification info.
	 */
	onNotification(notification) {
		let finish = false;
		switch (notification.name) {
			case NotificationCenter.ZOOM_NOTIFICATION:
			case NotificationCenter.DISPLAY_MODE_NOTIFICATION:
				finish = true;
				break;
			case NotificationCenter.SCROLL_NOTIFICATION:
				finish = this._notifyFlag;
				break;
		}
		if (finish === true) {
			this.finishInteraction(undefined, this.getViewer());
		}
	}

	onMouseMove(event, viewer) {
		if (!this.isInside(this._controller, event.location)) {
			this.setCursor(Cursor.Style.AUTO);
		}
	}

	onMouseDrag(event, viewer) {
		this.lastLocation.setTo(this.currentLocation);
	}

	onMouseDown(event, viewer) {
		if (this.isInside(this._controller, event.location)) {
			this.startEdit(this._controller, event, viewer);
			event.event.doPreventDefault = true;
		} else {
			this.finishInteraction(event, viewer);
		}
	}

	onMouseUp(event, viewer) {
		// cannot ignore onMouseUp, which is fired document wide!! => need it to get mouse click outside GraphEditor
		// if not handled inner div simply lose focus...!!

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
			const item = controller.getModel();
			const bounds = item.getTranslatedBoundingBox(item.getGraph()).getBoundingRectangle();
			return bounds.containsPoint(this.getViewer().translateFromParent(location.copy()));
		}

		return false;
	}

	isViewMode(controller) {
		const settings = controller
			.getModel()
			.getGraph()
			.getSettings();
		return settings.getViewMode() === GraphSettings.ViewMode.READ_ONLY;
	}

	/**
	 * Sets the controller of the editing TextNode.
	 *
	 * @method setController
	 * @param {GraphItemController} controller Controller of edited textnode.
	 */
	setController(controller) {
		this._controller = controller;
	}

	/**
	 * Starts editing a TextNode. A contenteditable div is created and all event listeners are initialized. The DIV is
	 * placed accordingly and scrolled into view.
	 *
	 * @method startEdit
	 * @param {GraphItemController} controller Controller of edited textnode.
	 * @param {Event} event Event that initiated the interaction.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	startEdit(controller, event, viewer) {
		const onSelect = () => {
			this._formatInfo.reset();
		};

		const onMouseDown = () => {};

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

		this.showTextNode(viewer);

		// this._item.setItemAttribute(ItemAttributes.VISIBLE, false);
		this._item._editing = true;
		event.doRepaint = true;
		this._item.getGraph().markDirty();

		this._cancel = false;

		viewer.getSelectionView().setVisible(false);

		const cs = viewer.getCoordinateSystem();
		const textFormat = this._item.getTextFormat();

		this.storeUndoText(this._item);

		const div = document.createElement('div');

		// set up DIV to reflect TextNode format
		// global css settings

		if (!this.isViewMode(controller)) {
			div.contentEditable = 'true';
		}

		//    div.style.resize = "none";
		div.id = 'jsgTextEdit';
		div.tabIndex = '5';
		div.zIndex = 100;
		// on top of everything
		div.style.position = 'absolute';
		div.style.minHeight = '11px';
		div.style.minWidth = '30px';
		div.style.overflow = 'visible';
		div.style.cssFloat = 'none';
		div.style.boxSizing = 'border-box';
		div.style.display = 'inline-block';

		// force word break by width
		if (this.doWrapText()) {
			div.style.wordWrap = 'break-word';
		}

		div.style.whiteSpace = 'normal';

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
		div.style.fontSize = `${textFormat.getFontSize().getValue()}pt`;
		div.style.fontFamily = textFormat.getFontName().getValue();
		div.style.fontWeight =
			textFormat.getFontStyle().getValue() & TextFormatAttributes.FontStyle.BOLD ? 'bold' : 'normal';
		div.style.fontStyle =
			textFormat.getFontStyle().getValue() & TextFormatAttributes.FontStyle.ITALIC ? 'italic' : 'normal';
		div.style.textDecoration =
			textFormat.getFontStyle().getValue() & TextFormatAttributes.FontStyle.UNDERLINE ? 'underline' : 'none';
		div.style.lineHeight = textFormat.getLineHeight().getValue();
		const color = textFormat.getFontColor().getValue();
		// if font is white it will be invisible, use black font in this case
		if (color === '#FFFFFF' && JSG.theme.fill === '#FFFFFF') {
			div.style.color = '#000000';
		} else 	if (color === '#000000' && JSG.theme.fill === '#000000') {
			div.style.color = '#FFFFFF';
		} else {
			div.style.color = color;
		}


		div.style.textAlign = this._item.getTextAlign();

		// padding around text
		const attributes = this._item.getItemAttributes();
		div.style.paddingLeft = `${cs.logToDeviceXNoZoom(attributes.getLeftMargin().getValue(), false)}px`;
		div.style.paddingTop = `${cs.logToDeviceYNoZoom(attributes.getTopMargin().getValue(), false)}px`;
		div.style.paddingRight = `${cs.logToDeviceXNoZoom(attributes.getRightMargin().getValue(), false)}px`;
		div.style.paddingBottom = `${cs.logToDeviceYNoZoom(attributes.getBottomMargin().getValue(), false)}px`;
		div.autofocus = true;

		this.div = div;
		this._richText = textFormat.getRichText().getValue();

		document.execCommand('defaultParagraphSeparator', null, 'p');
		canvas.parentNode.appendChild(div);

		div.innerHTML = this.getEditText(this._item);

		// forces FF and IE to recalc size
		div.style.left = '0px';
		div.style.top = '0px';

		// create toolbar for rich text
		if (this._richText === true) {
			this.addToolbar(viewer);
		}

		// place div and scroll div into view, if necessary
		this.updateTextArea(viewer, false, true);

		// select complete text
		if (window.getSelection) {
			const selection = window.getSelection();
			const range = document.createRange();
			let elem = div;
			while (elem.childNodes.length === 1) {
				elem = elem.childNodes[0];
			}

			range.selectNodeContents(elem);
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

		if (this._richText === true) {
			this.updateToolbar(viewer);
		}

		this._startText = this._getNewText();
	}

	/**
	 * Handles the paste event. Here we wait until the paste really occured and try to clean the resulting HTML.
	 *
	 * @method handlePaste
	 * @param {HTML DOM Event} e Event info.
	 * @return {Boolean} Always true.
	 */
	handlePaste(e) {
		// event is sent before content is pasted, so we simply wait for it to happen
		this._savedSelection = this.saveSelection();

		setTimeout(() => {
			this.clean(this.div);
			this.restoreSelection(this._savedSelection);
		}, 20);

		return true;
	}

	/**
	 * Handles the KeyPress event. Here we check if a formatting has been applied, while no text has
	 * been selected. If so, the formatting is applied to the incoming char.
	 *
	 * @method handleKeyPress
	 * @param {HTML DOM Event} ev Event info.
	 */
	handleKeyPress(ev) {
		// do only if a format was applied and changed, when the selection was collapsed
		if (this._formatInfo.formatMap.isEmpty()) {
			return;
		}
		const sel = window.getSelection();

		if (sel === undefined || !sel.isCollapsed) {
			return;
		}

		let range = sel.getRangeAt(0);

		// this way on change event will not reset format info.
		this._formatInfo.protect = true;

		const span = document.createElement('span');

		// apply changed font settings
		this._formatInfo.formatMap.iterate((key, value) => {
			switch (key) {
				case 'bold':
					span.style.fontWeight = value ? 'bold' : 'normal';
					break;
				case 'italic':
					span.style.fontStyle = value ? 'italic' : 'normal';
					break;
				case 'underline':
					span.style.textDecoration = value ? 'underline' : 'normal';
					break;
				case 'fontsize':
					span.style.fontSize = `${value}pt`;
					break;
				case 'fontname':
					span.style.fontFamily = value;
					break;
				case 'fontcolor':
					span.style.color = value;
					break;
			}
		});

		span.textContent = String.fromCharCode(ev.which || ev.keyCode);
		range.insertNode(span);

		range = document.createRange();
		range.selectNodeContents(span);
		sel.removeAllRanges();
		sel.addRange(range);
		sel.collapseToEnd();

		this._formatInfo.reset(true);

		ev.preventDefault();
	}

	/**
	 * Handles key up event triggered by native HTML <code>textarea</code> element which is used to
	 * edit texts.
	 *
	 * @method handleKeyUp
	 * @param {KeyboardEvent} ev Native keyboard event triggered by inner used <code>textarea</code>.
	 * @return {Boolean} Event return
	 */
	handleKeyUp(ev) {
		this._formatInfo.reset();

		if (ev.keyCode === 18 || ev.altKey) {
			ev.preventDefault();
			return false;
		}

		this.updateTextArea(this.getViewer(), true);
		this.updateToolbar(this.getViewer());

		return undefined;
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
		switch (ev.keyCode) {
			case 9:
				// tab
				ev.preventDefault();
				break;
			case 32:
				// Space
				if (ev.altKey) {
					ev.preventDefault();
					ev.stopPropagation();
					return false;
				}
				break;
			case 27: {
				// ESC
				const viewer = this.getViewer();
				const canvas = viewer.getGraphicSystem().getCanvas();
				const keyEvent = KeyEvent.fromEvent(canvas, ev, KeyEvent.KeyEventType.DOWN);
				this.cancelInteraction(keyEvent, viewer);
				break;
			}
			default:
				break;
		}

		return undefined;
	}

	/**
	 * Handles text change event triggered by native HTML element which is used to
	 * edit texts.
	 *
	 * @method handleChange
	 * @param {Event} ev Native change event triggered by inner used <code>textarea</code>.
	 * @return {Boolean} Event return
	 */
	handleChange(ev) {
		this.updateTextArea(this.getViewer(), true);
	}

	/**
	 * Handles focus event triggered by native HTML element which is used to
	 * edit texts.
	 *
	 * @method handleBlur
	 * @param {FocusEvent} ev Native focus event triggered by inner used <code>textarea</code>.
	 * @return {Boolean} Event return
	 */
	handleBlur(ev) {
		// we might come here on first finish & command execution, so don't finish/execute again...
		const viewer = this.getViewer();

		setTimeout(() => {
			if (this._toolBar === undefined) {
				if (this.div !== undefined) {
					this.finishInteraction(undefined, viewer);
				}
				return;
			}
			if (
				ev.relatedTarget &&
				ev.relatedTarget !== this._toolBar._div &&
				ev.relatedTarget.tagName.toLowerCase() !== 'select'
			) {
				this.finishInteraction(undefined, viewer);
			}
		}, 1);
	}

	/**
	 * Stores the text prior to text editing. This text is used for the undo command.
	 *
	 * @method storeUndoText
	 * @param {TextNode} item Node to retrieve text from.
	 */
	storeUndoText(item) {
		this._undoText = item.getText().copy();
	}

	/**
	 * Gets the text from the TextNode for editing.
	 *
	 * @method getEditText
	 * @param {TextNode} item Node to retrieve text from.
	 * @return {String} Text content of TextNode.
	 */
	getEditText(item) {
		return item.repair(item.getText().getValue());
	}

	getEditOrigin(viewer) {
		const item = this._item;
		let angle = item.getAngle().getValue();
		const cs = viewer.getCoordinateSystem();
		const canvas = viewer.getCanvas();
		const center = this._item.getPinPoint();
		const size = item.getSizeAsPoint();
		const hAlign = item
			.getTextFormat()
			.getHorizontalAlignment()
			.getValue();
		const vAlign = item
			.getTextFormat()
			.getVerticalAlignment()
			.getValue();
		const sizeMode = item
			.getItemAttributes()
			.getSizeMode()
			.getValue();
		const maxHeight = item
			.getItemAttributes()
			.getMaximumHeight()
			.getValue();
		const origin = new Point(0, 0);

		if (size.x > item._sizeText.x) {
			switch (hAlign) {
				case TextFormatAttributes.TextAlignment.LEFT:
					break;
				case TextFormatAttributes.TextAlignment.CENTER:
					size.x = item._sizeText.x;
					break;
				case TextFormatAttributes.TextAlignment.RIGHT:
					center.x += (size.x - item._sizeText.x) / 2;
					size.x = item._sizeText.x;
					break;
			}
		} else if (size.x < item._sizeText.x) {
			switch (hAlign) {
				case TextFormatAttributes.TextAlignment.LEFT:
					center.x += (size.x - item._sizeText.x) / 2;
					size.x = item._sizeText.x;
					break;
				case TextFormatAttributes.TextAlignment.CENTER:
					size.x = item._sizeText.x;
					break;
				case TextFormatAttributes.TextAlignment.RIGHT:
					break;
			}
		}
		if (size.y > item._sizeText.y) {
			switch (vAlign) {
				case TextFormatAttributes.VerticalTextAlignment.TOP:
					break;
				case TextFormatAttributes.VerticalTextAlignment.CENTER:
					size.y = item._sizeText.y;
					break;
				case TextFormatAttributes.VerticalTextAlignment.BOTTOM:
					center.y += (size.y - item._sizeText.y) / 2;
					size.y = item._sizeText.y;
					break;
			}
		} else if (size.y < item._sizeText.y) {
			if (sizeMode & TextNodeAttributes.SizeMode.HEIGHT || maxHeight) {
				//	center.y -= (size.y - item._sizeText.y) / 2;
				size.y = item._sizeText.y;
			} else {
				switch (vAlign) {
					case TextFormatAttributes.VerticalTextAlignment.TOP:
						center.y += (size.y - item._sizeText.y) / 2;
						size.y = item._sizeText.y;
						break;
					case TextFormatAttributes.VerticalTextAlignment.CENTER:
						size.y = item._sizeText.y;
						break;
					case TextFormatAttributes.VerticalTextAlignment.BOTTOM:
						break;
				}
			}
		}
		let graphCenter = new Point(0, 0);
		GraphUtils.traverseUp(this._controller.getView().getParent(), viewer.getRootView(), (v) => {
			if (v instanceof GraphView) {
				graphCenter = center.copy();
			}
			v.translateToParent(center);
			if (v.getItem) {
				angle += v
					.getItem()
					.getAngle()
					.getValue();
			}
			return true;
		});

		const rootOffsetX = center.x - graphCenter.x;
		const rootOffsetY = center.y - graphCenter.y;

		center.x = cs.logToDeviceX(center.x - rootOffsetX, false) + cs.logToDeviceX(rootOffsetX, false);
		center.y = cs.logToDeviceY(center.y - rootOffsetY, false) + cs.logToDeviceY(rootOffsetY, false);
		size.x = cs.logToDeviceXNoZoom(size.x, false);
		size.y = cs.logToDeviceYNoZoom(size.y, false);

		origin.x =
			center.x - ((size.x * Math.cos(angle) - size.y * Math.sin(angle)) * cs.getZoom()) / 2 + canvas.offsetLeft;
		origin.y =
			center.y - ((size.y * Math.cos(angle) + size.x * Math.sin(angle)) * cs.getZoom()) / 2 + canvas.offsetTop;

		return origin;
	}

	/**
	 * Update the position of the DIV based on the content of the DIV and the text position relative to the parent node.
	 *
	 * @method updateTextArea
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {Boolean} [scroll] False, if the TextNode shall not be scrolled into view.
	 * @private
	 */
	updateTextArea(viewer, scroll, initial) {
		if (!this.div) {
			return;
		}

		const item = this._item;
		let angle = item.getAngle().getValue();
		const cs = viewer.getCoordinateSystem();
		const canvas = viewer.getCanvas();
		const center = this._item.getPinPoint();
		const size = item.getSizeAsPoint();
		const maxHeight = item
			.getItemAttributes()
			.getMaximumHeight()
			.getValue();
		const hPosition = item
			.getTextFormat()
			.getHorizontalPosition()
			.getValue();
		const vPosition = item
			.getTextFormat()
			.getVerticalPosition()
			.getValue();
		const hAlign = item
			.getTextFormat()
			.getHorizontalAlignment()
			.getValue();
		const vAlign = item
			.getTextFormat()
			.getVerticalAlignment()
			.getValue();
		const sizeMode = item
			.getItemAttributes()
			.getSizeMode()
			.getValue();
		let horizontal;
		let vertical;

		if (this.doWrapText()) {
			const width = Math.ceil(
				cs.logToDeviceXNoZoom(
					item
						.getSize()
						.getWidth()
						.getValue(),
					false
				)
			);
			this.div.style.width = `${width}px`;
			this.div.style.maxWidth = `${width}px`;
		}

		if (initial) {
			let vFlag = false;
			let hFlag = false;
			if (size.x > item._sizeText.x) {
				switch (hAlign) {
					case TextFormatAttributes.TextAlignment.LEFT:
						break;
					case TextFormatAttributes.TextAlignment.CENTER:
						size.x = item._sizeText.x;
						break;
					case TextFormatAttributes.TextAlignment.RIGHT:
						center.x += (size.x - item._sizeText.x) / 2;
						size.x = item._sizeText.x;
						break;
				}
				hFlag = true;
			} else if (size.x < item._sizeText.x) {
				switch (hAlign) {
					case TextFormatAttributes.TextAlignment.LEFT:
						center.x += (size.x - item._sizeText.x) / 2;
						size.x = item._sizeText.x;
						break;
					case TextFormatAttributes.TextAlignment.CENTER:
						size.x = item._sizeText.x;
						break;
					case TextFormatAttributes.TextAlignment.RIGHT:
						break;
				}
				hFlag = true;
			}
			if (size.y > item._sizeText.y) {
				switch (vAlign) {
					case TextFormatAttributes.VerticalTextAlignment.TOP:
						break;
					case TextFormatAttributes.VerticalTextAlignment.CENTER:
						size.y = item._sizeText.y;
						break;
					case TextFormatAttributes.VerticalTextAlignment.BOTTOM:
						center.y += (size.y - item._sizeText.y) / 2;
						size.y = item._sizeText.y;
						break;
				}
				vFlag = true;
			} else if (size.y < item._sizeText.y) {
				if (sizeMode & TextNodeAttributes.SizeMode.HEIGHT || maxHeight) {
					size.y = item._sizeText.y;
				} else {
					switch (vAlign) {
						case TextFormatAttributes.VerticalTextAlignment.TOP:
							center.y += (size.y - item._sizeText.y) / 2;
							size.y = item._sizeText.y;
							break;
						case TextFormatAttributes.VerticalTextAlignment.CENTER:
							size.y = item._sizeText.y;
							break;
						case TextFormatAttributes.VerticalTextAlignment.BOTTOM:
							break;
					}
				}
				vFlag = true;
			}
			let graphCenter = new Point(0, 0);
			GraphUtils.traverseUp(this._controller.getView().getParent(), viewer.getRootView(), (v) => {
				if (v instanceof GraphView) {
					graphCenter = center.copy();
				}
				v.translateToParent(center);
				if (v.getItem) {
					angle += v
						.getItem()
						.getAngle()
						.getValue();
				}
				return true;
			});

			const rootOffsetX = center.x - graphCenter.x;
			const rootOffsetY = center.y - graphCenter.y;

			center.x = cs.logToDeviceX(center.x - rootOffsetX, false) + cs.logToDeviceX(rootOffsetX, false);
			center.y = cs.logToDeviceY(center.y - rootOffsetY, false) + cs.logToDeviceY(rootOffsetY, false);
			size.x = cs.logToDeviceXNoZoom(size.x, false);
			size.y = cs.logToDeviceYNoZoom(size.y, false);

			this._angle = angle;
			if (hFlag) {
				this._orgX = center.x - ((size.x * Math.cos(angle) - size.y * Math.sin(angle)) * cs.getZoom()) / 2;
			} else {
				this._orgX =
					center.x -
					((this.div.clientWidth * Math.cos(angle) - this.div.clientHeight * Math.sin(angle)) *
						cs.getZoom()) /
						2;
			}
			if (vFlag) {
				this._orgY = center.y - ((size.y * Math.cos(angle) + size.x * Math.sin(angle)) * cs.getZoom()) / 2;
			} else {
				this._orgY =
					center.y -
					((this.div.clientHeight * Math.cos(angle) + this.div.clientWidth * Math.sin(angle)) *
						cs.getZoom()) /
						2;
			}
			this._sizeX = this.div.clientWidth;
			this._sizeY = this.div.clientHeight;
		}

		const sizeChangeX = (this.div.clientWidth - this._sizeX) * cs.getZoom();
		const sizeChangeY = (this.div.clientHeight - this._sizeY) * cs.getZoom();

		let offsetLeftChangeX = sizeChangeX * Math.cos(this._angle);
		let offsetLeftChangeY = -sizeChangeY * Math.sin(this._angle);

		let offsetTopChangeX = sizeChangeX * Math.sin(this._angle);
		let offsetTopChangeY = sizeChangeY * Math.cos(this._angle);

		// size.x = this.div.clientWidth * Math.cos(this._angle) - this.div.clientHeight * Math.sin(this._angle);
		// size.y = this.div.clientHeight * Math.cos(this._angle) + this.div.clientWidth * Math.sin(this._angle);

		if (
			sizeMode === TextNodeAttributes.SizeMode.NONE ||
			hPosition === TextFormatAttributes.HorizontalTextPosition.CUSTOM
		) {
			switch (hAlign) {
				case TextFormatAttributes.TextAlignment.LEFT:
					horizontal = 'left';
					break;
				case TextFormatAttributes.TextAlignment.CENTER:
					horizontal = 'center';
					break;
				case TextFormatAttributes.TextAlignment.RIGHT:
					horizontal = 'right';
					break;
			}
		} else {
			switch (hPosition) {
				case TextFormatAttributes.HorizontalTextPosition.TOLEFT:
				case TextFormatAttributes.HorizontalTextPosition.RIGHT:
					horizontal = 'right';
					break;
				case TextFormatAttributes.HorizontalTextPosition.LEFT:
				case TextFormatAttributes.HorizontalTextPosition.TORIGHT:
					horizontal = 'left';
					break;
				case TextFormatAttributes.HorizontalTextPosition.CENTER:
					horizontal = 'center';
					break;
			}
		}

		if (
			sizeMode === TextNodeAttributes.SizeMode.NONE ||
			vPosition === TextFormatAttributes.VerticalTextPosition.CUSTOM
		) {
			switch (vAlign) {
				case TextFormatAttributes.VerticalTextAlignment.TOP:
					vertical = 'top';
					break;
				case TextFormatAttributes.VerticalTextAlignment.CENTER:
					vertical = 'center';
					break;
				case TextFormatAttributes.VerticalTextAlignment.BOTTOM:
					vertical = 'bottom';
					break;
			}
		} else {
			// if (this.div.clientHeight > cs.logToDeviceYNoZoom(size.y)) {
			// vertical = "top";
			// } else {
			switch (vPosition) {
				case TextFormatAttributes.VerticalTextPosition.ONTOP:
				case TextFormatAttributes.VerticalTextPosition.BOTTOM:
					vertical = 'bottom';
					break;
				case TextFormatAttributes.VerticalTextPosition.TOP:
				case TextFormatAttributes.VerticalTextPosition.BELOWBOTTOM:
					vertical = 'top';
					break;
				case TextFormatAttributes.VerticalTextPosition.CENTER:
					vertical = 'center';
					break;
				case TextFormatAttributes.VerticalTextPosition.BELOWRIGHTSTART:
					horizontal = 'left';
					vertical = 'top';
					break;
			}
		}

		switch (horizontal) {
			case 'left':
				offsetLeftChangeX = 0;
				offsetTopChangeX = 0;
				break;
			case 'center':
				offsetLeftChangeX /= 2;
				offsetTopChangeX /= 2;
				break;
		}

		switch (vertical) {
			case 'top':
				offsetTopChangeY = 0;
				offsetLeftChangeY = 0;
				break;
			case 'center':
				offsetTopChangeY /= 2;
				offsetLeftChangeY /= 2;
				break;
		}

		this.div.style.left = `${(this._orgX - offsetLeftChangeX - offsetLeftChangeY + canvas.offsetLeft).toFixed()}px`;
		this.div.style.top = `${(this._orgY - offsetTopChangeY - offsetTopChangeX + canvas.offsetTop).toFixed()}px`;

		this.div.style.transform = `rotate(${MathUtils.toDegrees(
			this._angle,
			true
		)}deg) scale(${cs.getZoom()},${cs.getZoom()})`;
		this.div.style.transformOrigin = 'left top';

		if (this._toolBar !== undefined) {
			this._toolBar.place(this.div.getBoundingClientRect());
		}
	}

	showTextNode(viewer) {
		const canvas = viewer.getCanvas();
		const cs = viewer.getCoordinateSystem();
		const sizeScale = cs.logToDeviceXNoZoom(750);
		const sizeScroll = cs.logToDeviceXNoZoom(450);
		const vrect = viewer.getGraphView().getVisibleViewRect();
		const origin = this.getEditOrigin(viewer);
		const box = this._item.getTranslatedBoundingBox();
		const textRect = box.getBoundingRectangle();
		const panel = viewer.getScrollPanel();
		const scroll = panel.getScrollPosition(JSG.ptCache.get());
		const offset = JSG.ptCache.get(0, 0);
		const p = JSG.ptCache.get(0, 0);
		const rotatedTextSize = box.getRotationMatrix().rotatePoint(this._item._sizeText.copy());
		let size;
		let change = false;

		if (origin.x < canvas.offsetLeft + sizeScale) {
			change = true;
			scroll.x = textRect.x + offset.x - 2000;
		} else {
			size = cs.logToDeviceX(rotatedTextSize.x, false);
			if (origin.x + size > canvas.offsetLeft + canvas.offsetWidth - sizeScroll) {
				change = true;
				p.set(textRect.getRight(), textRect.getBottom());
				scroll.x = textRect.getRight() + offset.x - vrect.width + 2000;
			}
		}

		if (origin.y < canvas.offsetTop + sizeScale) {
			change = true;
			scroll.y = textRect.y + offset.y - 1000;
		} else {
			size = cs.logToDeviceY(rotatedTextSize.y, false);
			if (origin.y + size > canvas.offsetTop + canvas.offsetHeight - sizeScroll) {
				change = true;
				p.set(textRect.getRight(), textRect.getBottom());
				scroll.y = textRect.getBottom() + offset.y - vrect.height + 1000;
			}
		}

		if (change) {
			this._notifyFlag = false;
			panel.setScrollPositionTo(scroll);
			this.getInteractionHandler().repaint();
			this._notifyFlag = true;
		}

		JSG.ptCache.release(offset, scroll, p);
	}

	doWrapText() {
		if (this._item) {
			const sizemode = this._item
				.getItemAttributes()
				.getSizeMode()
				.getValue();
			return sizemode & TextNodeAttributes.SizeMode.WIDTH;
		}
		return false;
	}

	updateFeedback(event, viewer, offset) {}

	createCommand(offset, selectedController, event, viewer) {}

	onMouseExit(event, viewer) {
		return false;
	}

	_getNewText() {
		let i;
		const p = this.div.querySelectorAll('p:empty');

		// TODO additional validation -> clean?

		for (i = p.length - 1; i > -1; i -= 1) {
			p[i].parentNode.removeChild(p[i]);
		}

		return this.div.innerHTML;
	}

	createSetTextCommand(item) {
		const newText = this._getNewText();
		return new SetTextCommand(item, this._undoText, newText);
	}

	willFinish(event, viewer) {
		if (!this._applyText(viewer)) {
			this.cancelInteraction(event, viewer);
		}
	}

	_applyText(viewer) {
		let cmd = this.createSetTextCommand(this._item);
		const interactionHandler = this.getInteractionHandler();
		const doApply = this._startText !== this._getNewText() && interactionHandler !== undefined && cmd !== undefined;

		if (doApply) {
			// this is necessary as text change does not trigger an GRPAHITEM_CHANGED event and stream eventhandler does get informed
			// about the text change, but the visible change. But then the text content must be set to update the formula
			this._item.setText(this._getNewText());
			const notification = new Notification(GraphItemController.ITEM_CHANGED_NOTIFICATION, this);
			const notEvent = new Event(Event.CUSTOM, 0);
			notEvent.source = this._item;
			notification.event = notEvent;
			notification.viewer = viewer;
			NotificationCenter.getInstance().send(notification);
		}

		// set item to visible here because possible command execution may trigger an edge-layout which requires
		// a visible text-node to layout correctly...
		this._item.setItemAttribute(ItemAttributes.VISIBLE, true);

		if (doApply) {
			// combine with creation command if it exists:
			if (this.createcmd) {
				const commands = new CompoundCommand();
				commands.add(this.createcmd);
				commands.add(cmd);
				// delay execution???
				commands.delayExecution = cmd.delayExecution;
				cmd = commands;
			}
			if (!cmd.delayExecution) {
				this._appliedText = true;
				interactionHandler.execute(cmd);
			}
		}

		// const notification = new Notification(GraphItemController.ITEM_CHANGED_NOTIFICATION, this);
		// const notEvent = new Event(Event.CUSTOM, 0);
		// notEvent.source = this._item;
		// notification.event = notEvent;
		// notification.viewer = viewer;
		// NotificationCenter.getInstance().send(notification);

		return doApply;
	}

	didFinish(event, viewer) {
		super.didFinish(event, viewer);

		viewer.clearLayer(LayerId.TOOLBAR);
		viewer.getSelectionView().setVisible(true);

		// set item to visible again should do no harm...
		this._item.setItemAttribute(ItemAttributes.VISIBLE, true);

		this.getInteractionHandler().repaint();
	}

	cancelInteraction(event, viewer) {
		this._resetText();
		if (this.createcmd) {
			this.createcmd.undo();
		}
		super.cancelInteraction(event, viewer);
	}

	_resetText() {
		this._item.setText(this._undoText);
	}

	/**
	 * Checks HTML content for invalid tags or styles and replaces any invalid HTML data.
	 *
	 * @method clean
	 * @param {DOM Node} node Node to retrieve HTML from.
	 */
	clean(node) {
		const nodes = [];

		const filterStyle = (source, target) => {
			if (target.removeAttribute) {
				target.removeAttribute('style');
			}
			if (target.style && this._richText) {
				target.style.fontStyle = source.style.fontStyle;
				target.style.fontSize = source.style.fontSize;
				target.style.fontFamily = source.style.fontFamily;
				target.style.fontWeight = source.style.fontWeight;
				target.style.textDecoration = source.style.textDecoration;
				target.style.color = source.style.color;
			}
		};

		const copyAllowedStyles = (source, target) => {
			if (source.style && target.style && this._richText) {
				target.style.fontStyle = source.style.fontStyle;
				target.style.fontSize = source.style.fontSize;
				target.style.fontFamily = source.style.fontFamily;
				target.style.fontWeight = source.style.fontWeight;
				target.style.textDecoration = source.style.textDecoration;
				target.style.color = source.style.color;
			}
		};

		const cloneNode = (lnode) => {
			const ret = lnode.cloneNode(true);
			if (ret.removeAttribute) {
				ret.removeAttribute('class');
			}
			filterStyle(lnode, ret);
			// replace space by nbsp
			return ret;
		};

		const addChildren = (source, target, tag) => {
			let i;
			let item;

			for (i = 0; i < source.childNodes.length; i += 1) {
				item = source.childNodes.item(i);
				switch (item.nodeName.toLowerCase()) {
					case 'p':
						if (item.hasChildNodes() && item.innerText.length) {
							if (tag === 'li') {
								const el = document.createElement('br');
								if (target === undefined) {
									nodes.push(el);
								} else {
									target.appendChild(el);
								}
								// watch out loop is reset !
								i = -1;
								source = item;
							} else if (target === undefined) {
								nodes.push(cloneNode(item));
							} else {
								target.appendChild(cloneNode(item));
							}
						}
						break;
					case 'span': {
						const el = document.createElement('span');
						copyAllowedStyles(item, el);
						target.appendChild(el);
						addChildren(item, el, item.nodeName.toLowerCase());
						break;
					}
					case 'br':
						target.appendChild(cloneNode(item));
						break;
					case 'font':
					case 'u':
					case 'i':
					case 'b':
					case 'em':
					case 'strong':
						target.appendChild(cloneNode(item));
						break;
					case 'a':
						addChildren(item, target, tag);
						break;
					case 'h1':
					case 'h2':
					case 'h3':
					case 'h4':
					case 'h5':
					case 'h6':
						if (tag === 'li') {
							addChildren(item, target, tag);
						} else {
							// convert to paragraph
							const el = document.createElement('p');
							if (target === undefined) {
								nodes.push(el);
							} else {
								target.appendChild(el);
							}
							addChildren(item, el, tag);
						}
						break;
					case '#text':
						// wrap text in paragraph
						if (tag === 'li') {
							// if the node is not cloned it is removed from the existing spot !
							target.appendChild(cloneNode(item));
						} else if (target === undefined) {
							nodes.push(cloneNode(item));
						} else {
							target.appendChild(cloneNode(item));
						}
						break;
					case 'li': {
						const el = document.createElement('li');
						el.style.textAlign = item.style.textAlign;
						// LI should always have a parent
						if (target !== undefined) {
							target.appendChild(el);
						}
						addChildren(item, el, item.nodeName.toLowerCase());
						break;
					}
					case 'div':
						// ignore and add children
						addChildren(item, target, tag);
						break;
					case 'ul':
					case 'ol':
						// ignore sub list and add children to parent list
						addChildren(item, target, tag);
						break;
					default:
						// ignore unwanted
						break;
				}
			}
		};

		// build new dom allowing only valid tags

		let i;
		let item;
		let el;

		for (i = 0; i < node.childNodes.length; i += 1) {
			item = node.childNodes.item(i);
			switch (item.nodeName.toLowerCase()) {
				case 'p':
					// check for empty paragraph
					if (item.hasChildNodes() && item.innerText.length) {
						nodes.push(cloneNode(item));
					}
					break;
				case 'h1':
				case 'h2':
				case 'h3':
				case 'h4':
				case 'h5':
				case 'h6':
					// convert to paragraph
					// format ??
					el = document.createElement('p');
					nodes.push(el);
					addChildren(item, el);
					break;
				case '#text':
					// wrap text in paragraph
					el = document.createElement('p');
					el.textContent = item.nodeValue;
					nodes.push(el);
					break;
				case 'div':
					// ignore and add children
					addChildren(item, undefined);
					break;
				case 'ul':
				case 'ol':
					// check for empty list
					if (item.hasChildNodes()) {
						el = document.createElement(item.nodeName.toLowerCase());
						nodes.push(el);
						addChildren(item, el);
					}
					break;
				default:
					// ignore unwanted
					break;
			}
		}

		node.innerHTML = '';

		for (i = 0; i < nodes.length; i += 1) {
			node.appendChild(nodes[i]);
		}
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

		if (sel.rangeCount) {
			try {
				traverseTextNodes(this.div, sel.getRangeAt(0));
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

		const range = document.createRange();
		range.setStart(this.div, 0);
		range.setEnd(this.div, 0);

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
		sel.removeAllRanges();

		try {
			traverseTextNodes(this.div);
		} catch (ex) {
			if (ex === stop) {
				sel.addRange(range);
				return;
			}
			throw ex;
		}

		let last = this.div.lastChild;
		while (last && last.lastChild && last.lastChild.nodeType === 1 && last.lastChild.nodeName !== 'BR') {
			last = last.lastChild;
		}
		range.selectNodeContents(last);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		selection.collapseToEnd();
	}

	canApplyAttributes(viewer, map, listpath) {
		return true;
	}

	onApplyAttributes(viewer, map, listpath) {
		const isTagType = (node, type) => node.tagName.toLowerCase() === type;

		const findParagraph = (el) => {
			if (!el) {
				return undefined;
			}

			do {
				if (el.tagName && (isTagType(el, 'li') || isTagType(el, 'p'))) {
					return el;
				}
				el = el.parentNode;
			} while (el);

			return undefined;
		};

		const addChildren = (node, finish, nodes, filter) => {
			let current = node.firstChild;

			do {
				if (current.nodeType === 1 && (isTagType(current, 'li') || isTagType(current, 'p'))) {
					if (filter === undefined || filter(current)) {
						nodes.push(current);
					}
				}
				if (current.hasChildNodes()) {
					if (!addChildren(current, finish, nodes, filter)) {
						// done
						return false;
					}
				}

				if (current === finish) {
					// done
					return false;
				}

				current = current.nextSibling;
			} while (current);

			// continue
			return true;
		};

		const getNextParagraphNodes = (start, end, range, nodes, filter) => {
			while (start) {
				if (start.tagName && (isTagType(start, 'li') || isTagType(start, 'p'))) {
					if (filter === undefined || filter(start)) {
						nodes.push(start);
					}
				}
				if (start.hasChildNodes()) {
					if (!addChildren(start, end, nodes, filter)) {
						break;
					}
				}
				if (start === end) {
					return false;
				}

				start = start.nextElementSibling;
			}

			return true;
		};

		const getParagraphNodes = (range, filter) => {
			// get all nodes in the range of type p, li
			const nodes = [];
			let start;
			let end;

			if (range.startContainer.nodeType === 3) {
				start = findParagraph(range.startContainer);
			} else {
				start = range.startContainer;
			}
			if (range.endContainer.nodeType === 3) {
				end = findParagraph(range.endContainer);
			} else {
				end = range.endContainer;
			}
			if (start === undefined || end === undefined) {
				return nodes;
			}

			while (start && getNextParagraphNodes(start, end, range, nodes, filter)) {
				start = start.parentNode;
				if (start) {
					start = start.nextElementSibling;
				}
			}

			return nodes;
		};

		const formatParagraph = (style) => {
			// apply format to all <p>, <li> in selected range
			const sel = window.getSelection();
			let i;

			if (sel === undefined) {
				return;
			}
			const range = sel.getRangeAt(0);
			if (range === undefined) {
				return;
			}
			const paras = getParagraphNodes(range);

			for (i = 0; i < paras.length; i += 1) {
				paras[i].style.textAlign = style;
			}
		};

		const insertBefore = (newNode, referenceNode) => {
			this.div.insertBefore(newNode, referenceNode);
		};

		const replaceParagraphBy = (type) => {
			// replace all <p>, <li> in selected range with new type
			const sel = window.getSelection();
			let i;
			let j;
			let node;
			let para;
			let el;
			let first;
			let last;

			// get selection
			if (sel === undefined) {
				return;
			}

			this._savedSelection = this.saveSelection();

			const range = sel.getRangeAt(0);
			// if none selected use the one at caret
			if (sel.isCollapsed /* || paras.length === 0 */) {
				// selection within paragraph oder at caret
				node = findParagraph(sel.anchorNode);
				if (node !== undefined) {
					first = node;
					last = node;
				}
			} else {
				if (range === undefined) {
					return;
				}
				node = findParagraph(range.startContainer);
				if (node !== undefined) {
					first = node;
				}
				node = findParagraph(range.endContainer);
				if (node !== undefined) {
					last = node;
				}
			}

			// no valid selection
			if (first === undefined || last === undefined) {
				return;
			}

			// find first p node before selection
			if (isTagType(first, 'li')) {
				first = first.parentNode;
				while (first.previousElementSibling && !isTagType(first, 'p')) {
					first = first.previousElementSibling;
				}
			} else {
				while (first.previousElementSibling && !isTagType(first.previousElementSibling, 'p')) {
					first = first.previousElementSibling;
				}
			}

			// find p node after selection
			if (isTagType(last, 'li')) {
				last = last.parentNode;
				while (last.nextElementSibling && !isTagType(last, 'p')) {
					last = last.nextElementSibling;
				}
			} else {
				while (last.nextElementSibling && !isTagType(last.nextElementSibling, 'p')) {
					last = last.nextElementSibling;
				}
			}

			if (first === null || last === null) {
				return;
			}

			const paras = getParagraphNodes(range);

			// get all p/li

			const rangeAll = document.createRange();
			rangeAll.setStart(first, 0);
			rangeAll.setEnd(last, 0);

			const allParas = getParagraphNodes(rangeAll);

			// go through nodes and set new type

			for (i = 0; i < allParas.length; i += 1) {
				// in selection?
				for (j = 0; j < paras.length; j += 1) {
					if (paras[j] === allParas[i]) {
						break;
					}
				}
				if (j === paras.length) {
					// assign current type
					if (allParas[i].tagName.toLowerCase() === 'p') {
						allParas[i].__type = 'p';
					} else if (allParas[i].tagName.toLowerCase() === 'li') {
						allParas[i].__type = allParas[i].parentNode.tagName.toLowerCase();
					}
				} else {
					// assign new type
					allParas[i].__type = type;
				}
			}

			const insert = last.nextElementSibling;

			// remove all nodes first
			for (i = 0; i < allParas.length; i += 1) {
				para = allParas[i];
				para.parentNode.removeChild(para);
			}

			let curType = first.tagName.toLowerCase();
			let listNode;

			listNode = first;

			// build new structure
			for (i = 0; i < allParas.length; i += 1) {
				para = allParas[i];
				switch (para.__type) {
					case 'p':
						if (!isTagType(para, para.__type)) {
							el = document.createElement('p');
							if (para.className !== undefined && para.className.length !== 0) {
								el.className = para.className;
							}
							el.innerHTML = para.innerHTML;
							insertBefore(el, insert);
						} else {
							insertBefore(para, insert);
						}
						curType = 'p';
						listNode = undefined;
						break;
					case 'ul':
					case 'ol':
						if (curType !== para.__type) {
							listNode = document.createElement(para.__type);
							insertBefore(listNode, insert);
							curType = para.__type;
						}
						el = document.createElement('li');
						if (para.className !== undefined && para.className.length !== 0) {
							el.className = para.className;
						}
						el.innerHTML = para.innerHTML;
						listNode.appendChild(el);
						break;
				}
				para.__type = undefined;
			}

			this.clean(this.div);
			this.restoreSelection(this._savedSelection);
		};

		const formatSelection = (section, value) => {
			// apply format to selected range or if range is collapsed, save or append format info
			// and apply after the next keypress
			const sel = window.getSelection();
			let current;
			let toolValue;
			let toolitem;

			if (sel === undefined) {
				return;
			}

			if (sel.isCollapsed) {
				if (!this._compStyle) {
					return;
				}
				// just save potential style and apply it, when key is pressed
				// reason : you can not set caret in empty span
				// here we collect styles - only if not already applied
				switch (section) {
					case 'bold':
						current = !!(this._compStyle.fontWeight === 'bold' || this._compStyle.fontWeight === '700');
						toolitem = this._toolBar.getItemById('bold');
						toolValue = !!toolitem.isSelected();
						break;
					case 'italic':
						current = this._compStyle.fontStyle === 'italic';
						toolitem = this._toolBar.getItemById('italic');
						toolValue = !!toolitem.isSelected();
						break;
					case 'underline':
						current = this._compStyle.textDecoration === 'underline';
						toolitem = this._toolBar.getItemById('underline');
						toolValue = !!toolitem.isSelected();
						break;
					case 'fontsize':
						current = String(Math.round((parseInt(this._compStyle.fontSize, 10) * 72) / JSG.dpi.y));
						toolitem = this._toolBar.getItemById('fontsize');
						toolValue = toolitem.getValue();
						break;
					case 'fontname':
						current = this._compStyle.fontName;
						toolitem = this._toolBar.getItemById('fontname');
						toolValue = toolitem.getValue();
						break;
					case 'fontcolor':
						current = this._compStyle.fontName;
						toolitem = this._toolBar.getItemById('fontcolor');
						toolValue = value;
						break;
				}
				if (
					toolValue === current ||
					section === 'fontname' ||
					section === 'fontsize' ||
					section === 'fontcolor'
				) {
					this._formatInfo.formatMap.put(section, value);
				} else {
					this._formatInfo.formatMap.remove(section);
				}
			} else {
				switch (section) {
					case 'bold':
						document.execCommand('bold', false, value);
						break;
					case 'italic':
						document.execCommand('italic', false, value);
						break;
					case 'underline':
						document.execCommand('underline', false, value);
						break;
					case 'fontsize': {
						document.execCommand('fontsize', false, 2);
						const fontElements = this.div.getElementsByTagName('font');
						let i;
						let span;
						let end;

						sel.removeAllRanges();

						for (i = fontElements.length - 1; i >= 0; i -= 1) {
							const font = fontElements[i];
							if (font.size === '2') {
								span = document.createElement('span');
								span.style.fontSize = `${value}pt`;
								span.style.fontFamily = font.face;
								span.innerHTML = font.innerHTML;
								font.parentNode.replaceChild(span, font);
								if (end === undefined) {
									end = span;
								}
							}
						}
						if (span !== undefined && end !== undefined) {
							const range = document.createRange();
							range.setStartBefore(span);
							range.setEndAfter(end);
							sel.addRange(range);
						}
						break;
					}
					case 'fontname':
						document.execCommand('fontname', false, value);
						break;
					case 'fontcolor':
						document.execCommand('foreColor', false, value);
						break;
				}
			}

			this.div.focus();
		};

		let toolitem;

		switch (listpath) {
			case 'textformat':
				map.iterate((key, value) => {
					switch (key) {
						case 'bullets':
							toolitem = this._toolBar.getItemById('bullets');
							if (toolitem.isSelected()) {
								replaceParagraphBy('p');
							} else {
								replaceParagraphBy('ul');
							}
							break;
						case 'numbered':
							toolitem = this._toolBar.getItemById('numbered');
							if (toolitem.isSelected()) {
								replaceParagraphBy('p');
							} else {
								replaceParagraphBy('ol');
							}
							break;
						case 'bulletsoff':
							replaceParagraphBy('p');
							break;
						case TextFormatAttributes.FONTNAME:
							formatSelection('fontname', value);
							break;
						case TextFormatAttributes.FONTSIZE:
							formatSelection('fontsize', value);
							break;
						case TextFormatAttributes.FONTCOLOR:
							formatSelection('fontcolor', value);
							break;
						case TextFormatAttributes.FONTSTYLE:
							switch (value) {
								case TextFormatAttributes.FontStyle.BOLD:
									toolitem = this._toolBar.getItemById('bold');
									formatSelection('bold', !toolitem.isSelected());
									break;
								case TextFormatAttributes.FontStyle.ITALIC:
									toolitem = this._toolBar.getItemById('italic');
									formatSelection('italic', !toolitem.isSelected());
									break;
								case TextFormatAttributes.FontStyle.UNDERLINE:
									toolitem = this._toolBar.getItemById('underline');
									formatSelection('underline', !toolitem.isSelected());
									break;
							}
							break;
						case TextFormatAttributes.HORIZONTALALIGN:
							switch (value) {
								case TextFormatAttributes.TextAlignment.LEFT:
									formatParagraph('left');
									break;
								case TextFormatAttributes.TextAlignment.CENTER:
									formatParagraph('center');
									break;
								case TextFormatAttributes.TextAlignment.RIGHT:
									formatParagraph('right');
									break;
							}
							break;
					}
				});
				break;
		}

		this.updateTextArea(viewer, true);
		this.updateToolbar(viewer);

		return false;
	}

	/**
	 * Adds a toolbar above the contenteditable DIV.
	 *
	 * @method addToolbar
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	addToolbar(viewer) {
		const pos = new Point(this.div.style.left, this.div.style.top - 30);

		if (this.isViewMode(this._controller)) {
			return;
		}

		this._toolBar = new FloatingToolbar('jsgTextToolbar', pos);

		this._toolBar.addTool(
			new ToolList(
				'fontname',
				(selection) => {
					const formatmap = new Dictionary();
					formatmap.put(TextFormatAttributes.FONTNAME, selection);
					this.onApplyAttributes(viewer, formatmap, 'textformat');
				},
				this.getFontNames(),
				this.getFontNames(),
				120,
				'Arial'
			)
		);
		this._toolBar.addTool(
			new ToolList(
				'fontsize',
				(selection) => {
					const formatmap = new Dictionary();
					formatmap.put(TextFormatAttributes.FONTSIZE, selection);
					this.onApplyAttributes(viewer, formatmap, 'textformat');
				},
				this.getFontSizes(),
				this.getFontSizes(),
				50,
				'10'
			)
		);

		this._toolBar.addTool(new ToolSeparator());

		this._toolBar.addTool(
			new ToolColor(
				'fontcolor',
				(color) => {
					const formatmap = new Dictionary();
					formatmap.put(TextFormatAttributes.FONTCOLOR, color);
					this.onApplyAttributes(viewer, formatmap, 'textformat');
				},
				JSG.ImagePool.IMG_FONTCOLOR,
				'#000000'
			)
		);

		this._toolBar.addTool(new ToolBreak());

		this._toolBar.addTool(
			new ToolButton(
				'bold',
				() => {
					const formatmap = new Dictionary();
					formatmap.put(TextFormatAttributes.FONTSTYLE, TextFormatAttributes.FontStyle.BOLD);
					this.onApplyAttributes(viewer, formatmap, 'textformat');
				},
				JSG.ImagePool.IMG_BOLD
			)
		);
		this._toolBar.addTool(
			new ToolButton(
				'italic',
				() => {
					const formatmap = new Dictionary();
					formatmap.put(TextFormatAttributes.FONTSTYLE, TextFormatAttributes.FontStyle.ITALIC);
					this.onApplyAttributes(viewer, formatmap, 'textformat');
				},
				JSG.ImagePool.IMG_ITALIC
			)
		);
		this._toolBar.addTool(
			new ToolButton(
				'underline',
				() => {
					const formatmap = new Dictionary();
					formatmap.put(TextFormatAttributes.FONTSTYLE, TextFormatAttributes.FontStyle.UNDERLINE);
					this.onApplyAttributes(viewer, formatmap, 'textformat');
				},
				JSG.ImagePool.IMG_UNDERLINE
			)
		);

		this._toolBar.addTool(new ToolSeparator());

		this._toolBar.addTool(
			new ToolButton(
				'left',
				() => {
					const formatmap = new Dictionary();
					formatmap.put(TextFormatAttributes.HORIZONTALALIGN, TextFormatAttributes.TextAlignment.LEFT);
					this.onApplyAttributes(viewer, formatmap, 'textformat');
				},
				JSG.ImagePool.IMG_LEFT_ALIGN
			)
		);
		this._toolBar.addTool(
			new ToolButton(
				'center',
				() => {
					const formatmap = new Dictionary();
					formatmap.put(TextFormatAttributes.HORIZONTALALIGN, TextFormatAttributes.TextAlignment.CENTER);
					this.onApplyAttributes(viewer, formatmap, 'textformat');
				},
				JSG.ImagePool.IMG_CENTER_ALIGN
			)
		);
		this._toolBar.addTool(
			new ToolButton(
				'right',
				() => {
					const formatmap = new Dictionary();
					formatmap.put(TextFormatAttributes.HORIZONTALALIGN, TextFormatAttributes.TextAlignment.RIGHT);
					this.onApplyAttributes(viewer, formatmap, 'textformat');
				},
				JSG.ImagePool.IMG_RIGHT_ALIGN
			)
		);

		this._toolBar.addTool(new ToolSeparator());

		this._toolBar.addTool(
			new ToolButton(
				'bullets',
				() => {
					const formatmap = new Dictionary();
					formatmap.put('bullets', '');
					this.onApplyAttributes(viewer, formatmap, 'textformat');
				},
				JSG.ImagePool.IMG_BULLETS
			)
		);
		this._toolBar.addTool(
			new ToolButton(
				'numbered',
				() => {
					const formatmap = new Dictionary();
					formatmap.put('numbered', '');
					this.onApplyAttributes(viewer, formatmap, 'textformat');
				},
				JSG.ImagePool.IMG_NUMBERED
			)
		);
	}

	/**
	 * Updates the toolbar status based on the current cursor position.
	 *
	 * @method updateToolbar
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	updateToolbar(viewer) {
		if (this._toolBar === undefined) {
			return;
		}

		const sel = window.getSelection();

		if (sel === undefined) {
			return;
		}

		let node = sel.focusNode;
		let listNode = sel.focusNode;
		let type = 'p';

		while (node && node.parentNode) {
			if (node.nodeType !== 3) {
				break;
			}
			node = node.parentNode;
		}

		if (!node) {
			return;
		}

		while (listNode && listNode.parentNode) {
			if (listNode.nodeType === 1) {
				const name = listNode.tagName.toLowerCase();
				if (name === 'ol' || name === 'ul') {
					type = name;
					break;
				}
				if (name === 'div') {
					break;
				}
			}
			listNode = listNode.parentNode;
		}

		const compStyle = window.getComputedStyle(node, null);
		const { State } = ToolButton;

		if (!compStyle) {
			return;
		}

		const updateAlignment = () => {
			if (compStyle === undefined) {
				return;
			}
			const toolitemL = this._toolBar.getItemById('left');
			const toolitemC = this._toolBar.getItemById('center');
			const toolitemR = this._toolBar.getItemById('right');

			switch (compStyle.textAlign) {
				case 'left':
					toolitemL.setState(State.SELECTED);
					toolitemC.setState(State.NORMAL);
					toolitemR.setState(State.NORMAL);
					break;
				case 'center':
					toolitemL.setState(State.NORMAL);
					toolitemC.setState(State.SELECTED);
					toolitemR.setState(State.NORMAL);
					break;
				case 'right':
					toolitemL.setState(State.NORMAL);
					toolitemC.setState(State.NORMAL);
					toolitemR.setState(State.SELECTED);
					break;
			}
		};

		let toolitem = this._toolBar.getItemById('fontname');
		if (this._formatInfo.formatMap.contains('fontname')) {
			toolitem.setValue(this._formatInfo.formatMap.get('fontname'));
		} else {
			toolitem.setValue(compStyle.fontFamily.replace(/"/g, ''));
		}

		toolitem = this._toolBar.getItemById('fontsize');
		if (this._formatInfo.formatMap.contains('fontsize')) {
			toolitem.setValue(this._formatInfo.formatMap.get('fontsize'));
		} else {
			toolitem.setValue(Math.round((parseInt(compStyle.fontSize, 10) * 72) / JSG.dpi.y));
		}

		toolitem = this._toolBar.getItemById('bold');
		if (this._formatInfo.formatMap.contains('bold')) {
			toolitem.setState(this._formatInfo.formatMap.get('bold') === true ? State.SELECTED : State.NORMAL);
		} else {
			toolitem.setState(
				compStyle.fontWeight === 'bold' || compStyle.fontWeight === '700' ? State.SELECTED : State.NORMAL
			);
		}

		toolitem = this._toolBar.getItemById('italic');
		if (this._formatInfo.formatMap.contains('italic')) {
			toolitem.setState(this._formatInfo.formatMap.get('italic') === true ? State.SELECTED : State.NORMAL);
		} else {
			toolitem.setState(compStyle.fontStyle === 'italic' ? State.SELECTED : State.NORMAL);
		}

		toolitem = this._toolBar.getItemById('underline');
		if (this._formatInfo.formatMap.contains('underline')) {
			toolitem.setState(this._formatInfo.formatMap.get('underline') === true ? State.SELECTED : State.NORMAL);
		} else {
			toolitem.setState(compStyle.textDecoration === 'underline' ? State.SELECTED : State.NORMAL);
		}

		updateAlignment();

		toolitem = this._toolBar.getItemById('bullets');
		toolitem.setState(type === 'ul' ? State.SELECTED : State.NORMAL);

		toolitem = this._toolBar.getItemById('numbered');
		toolitem.setState(type === 'ol' ? State.SELECTED : State.NORMAL);

		this._compStyle = compStyle;
		this.getInteractionHandler().repaint();
	}

	getFontSizes() {
		return ['6', '8', '10', '12', '14', '18', '24', '30'];
	}

	getFontNames() {
		return [
			'Arial',
			'Courier New',
			'Georgia',
			'Lucida',
			'Lucida Sans',
			'Palatino',
			'Tahoma',
			'Times New Roman',
			'Trebuchet MS',
			'Verdana'
		];
	}
}

JSG.createTextStyles = () => {
	const addStyle = (description) => {
		const style = document.createElement('style');

		style.type = 'text/css';
		style.innerHTML = description;
		document.getElementsByTagName('head')[0].appendChild(style);
	};

	// to define bullet and numbering left space and paragraph distance
	addStyle('#jsgTextEdit ul, ol {-webkit-padding-start : 1.5em; padding-left : 1.5em;}');
	addStyle('#jsgTextEdit ul, ol, p {margin-top : 0.5em; margin-bottom : 0.5em;}');
	addStyle('#jsgTextEdit p:first-child {margin-top : 0.0em; margin-bottom : 0.5em;}');
	addStyle('#jsgTextEdit p:last-child {margin-top : 0.5em; margin-bottom : 0.0em;}');
	addStyle('#jsgTextEdit p:only-child {margin-top : 0.0em; margin-bottom : 0.0em;}');
	addStyle('#jsgTextEdit ol:first-child {margin-top : 0.0em; margin-bottom : 0.5em;}');
	addStyle('#jsgTextEdit ol:last-child {margin-top : 0.5em; margin-bottom : 0.0em;}');
	addStyle('#jsgTextEdit ol:only-child {margin-top : 0.0em; margin-bottom : 0.0em;}');
	addStyle('#jsgTextEdit ul:first-child {margin-top : 0.0em; margin-bottom : 0.5em;}');
	addStyle('#jsgTextEdit ul:last-child {margin-top : 0.5em; margin-bottom : 0.0em;}');
	addStyle('#jsgTextEdit ul:only-child {margin-top : 0.0em; margin-bottom : 0.0em;}');

	addStyle('#jsgTextEditSplit ul, ol {-webkit-padding-start : 1.5em; padding-left : 1.5em;}');
	addStyle('#jsgTextEditSplit ul, ol, p {margin-top : 0.5em; margin-bottom : 0.5em;}');
	addStyle('#jsgTextEditSplit p:first-child {margin-top : 0.0em; margin-bottom : 0.5em;}');
	addStyle('#jsgTextEditSplit p:last-child {margin-top : 0.5em; margin-bottom : 0.0em;}');
	addStyle('#jsgTextEditSplit p:only-child {margin-top : 0.0em; margin-bottom : 0.0em;}');
	addStyle('#jsgTextEditSplit ol:first-child {margin-top : 0.0em; margin-bottom : 0.5em;}');
	addStyle('#jsgTextEditSplit ol:last-child {margin-top : 0.5em; margin-bottom : 0.0em;}');
	addStyle('#jsgTextEditSplit ol:only-child {margin-top : 0.0em; margin-bottom : 0.0em;}');
	addStyle('#jsgTextEditSplit ul:first-child {margin-top : 0.0em; margin-bottom : 0.5em;}');
	addStyle('#jsgTextEditSplit ul:last-child {margin-top : 0.5em; margin-bottom : 0.0em;}');
	addStyle('#jsgTextEditSplit ul:only-child {margin-top : 0.0em; margin-bottom : 0.0em;}');

	addStyle('#jsgTextToolbar div:hover{background-color:#00ff00};');
};

JSG.createTextStyles();

export default EditTextInteraction;
