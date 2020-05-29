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
	default as JSG,
	Notification,
	NotificationCenter,
	FormatAttributes,
	CommandStack,
	CompoundCommand,
	ChangeItemOrderCommand,
	UnGroupItemsCommand,
	CollapseItemCommand,
	GroupItemsCommand,
	SizeItemsCommand,
	PasteItemsCommand,
	DeleteItemCommand,
	SetAttributesMapCommand,
	GroupCreator,
	StreamSheetContainer,
	FormatItemCommand,
	TextFormatItemCommand,
	TextFormatAttributes,
	AlignItemsCommand,
	BezierLineShape,
	BezierShape,
	OrthoLineShape,
	LineShape,
	EllipseShape,
	Point
} from '@cedalo/jsg-core';
import EditBezierShapeInteraction from './EditBezierShapeInteraction';
import EditLineShapeInteraction from './EditLineShapeInteraction';
import EditShapeInteraction from './EditShapeInteraction';
import MarqueeInteraction from './MarqueeInteraction';
import DragEvent from '../../ui/events/DragEvent';
import GestureEvent from '../../ui/events/GestureEvent';
import KeyEvent from '../../ui/events/KeyEvent';
import MouseEvent from '../../ui/events/MouseEvent';

/**
 * The base InteractionHandler which is registered to {{#crossLink "GraphicSystem"}}{{/crossLink}}
 * by default.<br/>
 * An InteractionHandler will receive all mouse, key and touch events from the GraphicSystem and
 * dispatches them to the currently active {{#crossLink "Interaction"}}{{/crossLink}}.
 * If no interaction is currently set active the default interaction of {{#crossLink
 * "ControllerViewer"}}{{/crossLink}} is activated and used. Hence, {{#crossLink
 * "ControllerViewer/getDefaultInteraction:method"}}{{/crossLink}} should never return
 * <code>undefined</code>.<br/> Another main feature of an InteractionHandler is the handling of {{#crossLink
 * "Command"}}{{/crossLink}}s. To support undo/redo a task should be wrapped into a Command and
 * should be executed via
 * {{#crossLink "InteractionHandler/execute:method"}}{{/crossLink}}.<br/>
 * Furthermore this class defines some convenience methods like
 * {{#crossLink "InteractionHandler/copySelection:method"}}{{/crossLink}} or
 * {{#crossLink "InteractionHandler/paste:method"}}{{/crossLink}} too.<br/>
 *
 * An InteractionHandler sends following notification: </br>
 * <ul>
 *    <li>{{#crossLink
 * "InteractionHandler/ACTIVE_INTERACTION_NOTIFICATION:property"}}{{/crossLink}}</li>
 * </ul>
 *
 *
 * @class InteractionHandler
 * @param {ScrollableViewer} viewer Viewer to attach to the InteractionHandler
 * @constructor
 */
class InteractionHandler {
	constructor(viewer) {
		this.viewer = viewer;
		this.isDragging = false;
		this.gfxsys = undefined;
		this.commandStack = new CommandStack();
		this.activeInteraction = undefined;
	}

	/**
	 * Registers given GraphicSystem to this InteractionHandler. This method is called by GraphicSystem
	 * on framework setup.
	 *
	 * @method registerGraphicSystem
	 * @param {GraphicSystem} gfxsys The GraphicSystem to register.
	 */
	registerGraphicSystem(gfxsys) {
		this.gfxsys = gfxsys;
	}

	/**
	 * Unregisters a former added GraphicSystem.
	 *
	 * @method unregisterGraphicSystem
	 */
	unregisterGraphicSystem() {
		this.gfxsys = undefined;
	}

	/**
	 * Convenience method to get the default Interaction of a registered {{#crossLink
	 * "ControllerViewer"}}{{/crossLink}}.
	 *
	 * @method getDefaultInteraction
	 * @return {Interaction} The default Interaction.
	 */
	getDefaultInteraction() {
		return this.viewer.getDefaultInteraction();
	}

	/**
	 * Sets the active Interaction to given one.<br/>
	 * This method sends a
	 * {{#crossLink "InteractionHandler/ACTIVE_INTERACTION_NOTIFICATION:property"}}{{/crossLink}}
	 * notification.
	 *
	 * @method setActiveInteraction
	 * @param {Interaction} interaction The interaction to become active.
	 */
	setActiveInteraction(interaction) {
		if (this.activeInteraction) {
			this.activeInteraction.deactivate(this.viewer);
		}

		this.activeInteraction = interaction;

		if (this.activeInteraction) {
			this.activeInteraction.setInteractionHandler(this);
			this.activeInteraction.activate(this.viewer);
		}
		NotificationCenter.getInstance().send(
			new Notification(InteractionHandler.ACTIVE_INTERACTION_NOTIFICATION, this)
		);
	}

	/**
	 * Gets the currently active Interaction. If no Interaction was set active, the default Interaction
	 * of registered ControllerViewer is returned.
	 *
	 * @method getActiveInteraction
	 * @return {Interaction} The currently active interaction.
	 */
	getActiveInteraction() {
		if (!this.activeInteraction) {
			this.setActiveInteraction(this.viewer.getDefaultInteraction());
		}
		return this.activeInteraction;
	}

	/**
	 * Calls <code>cancelInteraction</code> on currently active interaction.</br>
	 *
	 * @method cancelActiveInteraction
	 */
	cancelActiveInteraction() {
		const activeInteraction = this.getActiveInteraction();
		if (activeInteraction) {
			activeInteraction.cancelInteraction(undefined, this.viewer);
		}
	}

	/**
	 * Disposes this InteractionHandler.<br/>
	 * This will deactivate current active interaction and remove any active scroll timer.
	 *
	 * @method dispose
	 */
	dispose() {
		if (this.activeInteraction) {
			this.activeInteraction.deactivate(this.viewer);
		}
	}

	/**
	 * Notifies the current active interaction about canvas resize.
	 *
	 * @method handleResizeCanvas
	 * @param {Number} width The new canvas width.
	 * @param {Number} height The new canvas height.
	 */
	handleResizeCanvas(width, height) {
		if (!this.getActiveInteraction().onResizeCanvas(width, height, this.viewer)) {
			this.setActiveInteraction(this.viewer.getDefaultInteraction());
		}
	}

	handlePasteEvent(event) {
		this.getActiveInteraction().onPaste(event, this.viewer);
	}

	/**
	 * Handles given gesture event, i.e. translates its location and passes the event to currently active Interaction.
	 *
	 * @method handleGestureEvent
	 * @param {GestureEvent} event The current gesture event.
	 */
	handleGestureEvent(event) {
		const tmppoint = new Point(0, 0);

		const initStart = () => {
			this.isDragging = true;
			event.isDragging = true;
			tmppoint.setTo(event.location);
			this.viewer.translateFromParent(tmppoint);
			this.getActiveInteraction().setStartLocation(tmppoint);
		};

		if (!this.viewer.handleGestureEvent(event, this)) {
			tmppoint.setTo(event.location);
			this.viewer.translateFromParent(tmppoint);
			this.getActiveInteraction().setLastLocation(this.getActiveInteraction().getCurrentLocation());
			this.getActiveInteraction().setCurrentLocation(tmppoint);

			switch (event.type) {
				case GestureEvent.GestureEventType.CANCEL:
					this.setActiveInteraction(this.viewer.getDefaultInteraction());
					break;
				case GestureEvent.GestureEventType.ROTATESTART:
					initStart();
					this.getActiveInteraction().onRotateStart(event, this.viewer);
					break;
				case GestureEvent.GestureEventType.ROTATE:
					this.getActiveInteraction().onRotate(event, this.viewer);
					break;
				case GestureEvent.GestureEventType.ROTATEEND:
					this.isDragging = false;
					this.getActiveInteraction().onRotateEnd(event, this.viewer);
					break;
				case GestureEvent.GestureEventType.PINCHSTART:
					initStart();
					this.getActiveInteraction().onPinchStart(event, this.viewer);
					break;
				case GestureEvent.GestureEventType.PINCH:
					this.getActiveInteraction().onPinch(event, this.viewer);
					break;
				case GestureEvent.GestureEventType.PINCHEND:
					this.isDragging = false;
					this.getActiveInteraction().onPinchEnd(event, this.viewer);
					break;
				case GestureEvent.GestureEventType.PANSTART:
					initStart();
					this.getActiveInteraction().onPanStart(event, this.viewer);
					break;
				case GestureEvent.GestureEventType.PAN:
					this.getActiveInteraction().onPan(event, this.viewer);
					break;
				case GestureEvent.GestureEventType.PANEND:
					this.isDragging = false;
					this.getActiveInteraction().onPanEnd(event, this.viewer);
					break;
				case GestureEvent.GestureEventType.HOLD:
					initStart();
					this.getActiveInteraction().onHold(event, this.viewer);
					break;
			}
		}
	}

	/**
	 * Handles given mouse event, i.e. translates it location and passes the event to currently active
	 * Interaction.<br/>
	 * Refer to {{#crossLink "InteractionHandler/handleRightClick:method"}}{{/crossLink}} to
	 * handle click events with secondary mouse button and {{#crossLink
	 * "InteractionHandler/handleContextMenu:method"}}{{/crossLink}} to handle the request to
	 * show a context menu.
	 *
	 *
	 * @method handleMouseEvent
	 * @param {MouseEvent} event The current mouse event.
	 */
	handleMouseEvent(event) {
		const tmppoint = JSG.ptCache.get().setTo(event.location);
		let interaction = this.getActiveInteraction();
		const evtype = event.type;
		const TYPE = MouseEvent.MouseEventType;

		// console.log('--------------------');
		// console.log("before fromParent:\t\t" + tmppoint.toString());
		// console.log("after toParent:\t\t\t" +
		// this.viewer._translateToParent(this.viewer.translateFromParent(tmppoint.copy())).toString());
		// console.log("after toParent(OLD):\t" +
		// this.viewer.translateToParent(this.viewer.translateFromParent(tmppoint.copy())).toString());
		// console.log('--------------------');

		this.oldcursor = this.oldcursor || this.getCursor();
		this.viewer.translateFromParent(tmppoint);
		interaction.setLastLocation(interaction.getCurrentLocation());
		interaction.setCurrentLocation(tmppoint);
		// special case: we need to handle mouse-wheel first, because of ContentNodeView...
		if (evtype === TYPE.WHEEL) {
			this.isDragging = false;
			interaction.onMouseWheel(event, this.viewer);
			if (!event.isConsumed) {
				this.viewer.handleMouseEvent(event, this);
			}
		} else if (!this.viewer.handleMouseEvent(event, this)) {
			// check viewer first if event is not consumed...:
			if (this.oldcursor) {
				// restore cursor which might was changed by viewer event handling...
				this.setCursor(this.oldcursor);
				this.oldcursor = undefined;
			}

			// cancel current interaction on mouse down:
			if (this.doCancelActiveInteraction(interaction, event)) {
				if (interaction) {
					// correctly finish current interaction...
					interaction.finishInteraction(event, this.viewer);
					// another interaction is active now
					interaction = this.getActiveInteraction();
					interaction.setLastLocation(interaction.getCurrentLocation());
					interaction.setCurrentLocation(tmppoint);
				}
			}
			if (!(interaction instanceof MarqueeInteraction)) {
				this.viewer.collectControllers(event);
			}
			// handle context menu event
			if (evtype === TYPE.CONTEXT) {
				this.handleContextMenu(event);
			} else if (event.isClicked(MouseEvent.ButtonType.RIGHT)) {
				switch (evtype) {
					case TYPE.DOWN:
						this.isDragging = true;
						interaction.setStartLocation(tmppoint);
						interaction.onRightMouseDown(event, this.viewer);
						break;
					case TYPE.UP:
						this.isDragging = false;
						interaction.onRightMouseUp(event, this.viewer);
						break;
				}
				// this.handleRightClick(event);
			} else {
				switch (evtype) {
					case TYPE.DOWN:
						this.isDragging = true;
						interaction.setStartLocation(tmppoint);
						interaction.onMouseDown(event, this.viewer);
						break;
					case TYPE.DBLCLK:
						interaction.onMouseDoubleClick(event, this.viewer);
						break;
					case TYPE.MOVE:
						if (this.isDragging) {
							event.isDragging = true;
							interaction.onMouseDrag(event, this.viewer);
						} else {
							interaction.onMouseMove(event, this.viewer);
						}
						break;
					case TYPE.UP:
						this.isDragging = false;
						interaction.onMouseUp(event, this.viewer);
						break;
					case TYPE.EXIT:
						this.isDragging = false;
						interaction.onMouseExit(event, this.viewer);
						break;
				}
			}
		}
		if (this.isDragging) {
			interaction.setRepaintOnDrag(event);
		}
		JSG.ptCache.release(tmppoint);
	}

	/**
	 * Called in {{#crossLink "InteractionHandler/handleMouseEvent:method"}}{{/crossLink}}
	 * to check if current active interaction should be canceled.<br/>
	 * Subclasses might overwrite to implement custom behaviour. Default implementation simply checks
	 * if event is marked as consumed.
	 *
	 * @method doCancelActiveInteraction
	 * @param {Interaction} interaction The active interaction.
	 * @param {MouseEvent} event The current mouse event.
	 * @return {Boolean} <code>true</code> to cancel interaction, <code>false</code> otherwise.
	 */
	doCancelActiveInteraction(interaction, event) {
		// TODO is this is enough: return event.isConsumed;
		if (event.type === MouseEvent.MouseEventType.DOWN) {
			if (interaction.doCancelInteraction(event, this.viewer)) {
				return true;
			}
			const isScrollbarEvent = this.viewer.isScrollBarEvent && this.viewer.isScrollBarEvent(event);
			return isScrollbarEvent && interaction !== this.viewer.getDefaultInteraction();
		}
		return false;
	}

	/**
	 * Called from {{#crossLink "InteractionHandler/handleMouseEvent:method"}}{{/crossLink}}
	 * if a mouse down or up event occurred with right (secondary) button pressed.<br/>
	 * Subclasses might overwrite to implement custom behaviour. Default implementation simply pass this
	 * event to current active interaction if it has a <code>handleRightClick(event, viewer)</code> function.<br/>
	 * Note: please refer to {{#crossLink
	 * "InteractionHandler/handleContextMenu:method"}}{{/crossLink}} to display a context menu.
	 *
	 * @method handleRightClick
	 * @param {MouseEvent} event The mouse event which is currently handled.
	 */
	handleRightClick(event) {
		const interaction = this.getActiveInteraction();
		if (interaction.handleRightClick) {
			interaction.handleRightClick(event, this.viewer);
		}
	}

	/**
	 * Called when a context menu should be displayed.<br/>
	 * Subclasses might overwrite to implement custom behaviour. Default implementation simply pass this
	 * event to current active interaction if it provides a <code>handleContextMenu(event, viewer)</code> function.
	 *
	 * @method handleContextMenu
	 * @param {MouseEvent} event The mouse event which request context menu.
	 * @since 1.6.34
	 */
	handleContextMenu(event) {
		const interaction = this.getActiveInteraction();
		if (interaction.handleContextMenu) {
			interaction.handleContextMenu(event, this.viewer);
		}
	}

	/**
	 * Handles given mouse drag event, i.e. translates it location and passes the event to currently active Interaction.
	 *
	 * @method handleDragEvent
	 * @param {MouseEvent} event The current mouse event.
	 */
	handleDragEvent(event) {
		const tmppoint = new Point(0, 0);
		tmppoint.setTo(event.location);
		this.viewer.translateFromParent(tmppoint);
		this.getActiveInteraction().setCurrentLocation(tmppoint);
		switch (event.type) {
			case DragEvent.DragEventType.DROP:
				this.getActiveInteraction().onDrop(event, this.viewer);
				break;
			case DragEvent.DragEventType.ENTER:
				this.getActiveInteraction().onDragEnter(event, this.viewer);
				break;
			case DragEvent.DragEventType.EXIT:
				this.getActiveInteraction().onDragExit(event, this.viewer);
				break;
			case DragEvent.DragEventType.LEAVE:
				this.getActiveInteraction().onDragLeave(event, this.viewer);
				break;
			case DragEvent.DragEventType.OVER:
				this.getActiveInteraction().onDragOver(event, this.viewer);
				break;
		}
	}

	/**
	 * Handles given key event, i.e. translates it location and passes the event to currently active Interaction.
	 *
	 * @method handleKeyEvent
	 * @param {KeyEvent} event The current key event.
	 */
	handleKeyEvent(event) {
		if (!this.viewer.handleKeyEvent(event, this)) {
			const tmppoint = new Point(0, 0);
			const interaction = this.getActiveInteraction();

			tmppoint.setTo(event.location);
			this.viewer.translateFromParent(tmppoint);
			interaction.setCurrentLocation(tmppoint);

			// this.viewer.getGraphView().clearFeedback();

			// should we cancel interaction?
			if (interaction.doCancelInteraction(event, this.viewer)) {
				interaction.cancelInteraction(event, this.viewer);
				this.isDragging = false;
			} else {
				switch (event.type) {
					case KeyEvent.KeyEventType.DOWN:
						interaction.onKeyDown(event, this.viewer);
						break;
					case KeyEvent.KeyEventType.UP:
						interaction.onKeyUp(event, this.viewer);
						break;
				}
			}
		}
	}

	/**
	 * Returns the current cursor style.<br/>
	 * See {{#crossLink "Cursor.Style"}}{{/crossLink}} for predefined style constants.
	 *
	 * @method getCursor
	 * @return {String} The current cursor style.
	 */
	getCursor() {
		return this.gfxsys.getCursor();
	}

	/**
	 * Sets a new cursor style.<br/>
	 * See {{#crossLink "Cursor.Style"}}{{/crossLink}} for predefined style constants.
	 *
	 * @method setCursor
	 * @param {String} cursor A cursor style name.
	 */
	setCursor(cursor) {
		if (this.gfxsys) {
			this.gfxsys.setCursor(cursor);
		}
	}

	/**
	 * Triggers a paint request to the internally used {{#crossLink "GraphicSystem"}}{{/crossLink}}.
	 *
	 * @method repaint
	 */
	repaint() {
		this.gfxsys.paint();
	}

	/**
	 * Executes given Command and calls <code>completionfunc</code> if specified. The executed command
	 * and the viewer are passed as arguments to the completion function.<br/>
	 *
	 * @method execute
	 * @param {Command} cmd The command to execute.
	 * @param {Function} [completionfunc] An optional function to call after execution.
	 */
	execute(cmd, completionfunc) {
		if (cmd._noDraw === undefined) {
			JSG.setDrawingDisabled(true);
		}
		this.commandStack.execute(cmd);
		if (completionfunc !== undefined) {
			completionfunc.call(this, cmd, this.viewer);
		}
		// mark interaction context:
		cmd._interaction = this.getActiveInteraction();
		if (cmd._keepFeedback !== true) {
			this.viewer.getGraphView().clearFeedback();
		}
		if (cmd._noDraw === undefined) {
			this.viewer.getGraph().setChanged(true);
			JSG.setDrawingDisabled(false);
		}
		this.repaint();
	}

	/**
	 * Calls <code>undo</code> of the next available command from the command stack.<br/>
	 * Triggers a repaint afterwards.
	 *
	 * @method undo
	 */
	undo() {
		if (this.isUndoAvailable()) {
			JSG.setDrawingDisabled(true);
			this.viewer.clearSelection();
			// getSelectionView().setRotationAngle(0);
			const cmd = this.commandStack.undo();
			if (cmd !== undefined) {
				// cmd.restoreStateAfterUndo(this.viewer);
				const selection = [];
				cmd.doAfterUndo(selection, this.viewer);
				if (selection.length > 0) {
					cmd.selectAll(selection, this.viewer);
				}

				// check interaction context:
				if (cmd._interaction !== this.getActiveInteraction()) {
					cmd._interaction = undefined;
					this.setActiveInteraction(this.viewer.getDefaultInteraction());
				}
			}
			this.viewer.getGraph().setChanged(true);
			JSG.setDrawingDisabled(false);
			this.repaint();
		}
	}

	/**
	 * Checks if a undo is possible, i.e. an undo command is available.
	 *
	 * @method isUndoAvailable
	 * @return {Boolean} <code>true</code> if an undo command is available, <code>false</code> otherwise.
	 */
	isUndoAvailable() {
		return this.commandStack.undostack.length !== 0;
	}

	/**
	 * Calls <code>redo</code> of the next available command from the command stack.<br/>
	 * Triggers a repaint afterwards.
	 *
	 * @method redo
	 */
	redo() {
		if (this.isRedoAvailable()) {
			JSG.debug.log('redo command!');
			JSG.setDrawingDisabled(true);
			// analog to undo we clear selection. only done to trigger a selection notification
			//= > informs "outer" components of changes although selection might not change. example: label text and
			// property grid...
			this.viewer.clearSelection();
			// this.viewer.getSelectionView().setRotationAngle(0);
			const cmd = this.commandStack.redo();
			if (cmd !== undefined) {
				const selection = [];
				// cmd.restoreStateAfterRedo(this.viewer);
				cmd.doAfterRedo(selection, this.viewer);
				if (selection.length > 0) {
					cmd.selectAll(selection, this.viewer);
				}
			}
			this.viewer.getGraph().setChanged(true);
			JSG.setDrawingDisabled(false);
			this.repaint();
		}
	}

	/**
	 * Checks if a redo is possible, i.e. a redo command is available.
	 *
	 * @method isRedoAvailable
	 * @return {Boolean} <code>true</code> if a redo command is available, <code>false</code> otherwise.
	 */
	isRedoAvailable() {
		return this.commandStack.redostack.length !== 0;
	}

	/**
	 * Copies current selection.<br>
	 * See {{#crossLink "InteractionHandler/paste:method"}}{{/crossLink}} and
	 * {{#crossLink "InteractionHandler/isPasteAvailable:method"}}{{/crossLink}} too.
	 *
	 * @method copySelection
	 */
	copySelection() {
		JSG.clipOffset = new Point(0, 0);
		JSG.clipXML = JSG.copyItems(this.viewer.getSelection());

		const focus = document.activeElement;
		const textarea = document.createElement('textarea');

		// Place in top-left corner of screen regardless of scroll position.
		textarea.style.position = 'fixed';
		textarea.style.top = 0;
		textarea.style.left = 0;

		// Ensure it has a small width and height. Setting to 1px / 1em
		// doesn't work as this gives a negative w/h on some browsers.
		textarea.style.width = '1px';
		textarea.style.height = '1px';
		textarea.style.padding = 0;
		textarea.style.border = 'none';
		textarea.style.outline = 'none';
		textarea.style.boxShadow = 'none';
		textarea.style.background = 'transparent';

		document.body.appendChild(textarea);

		/* Copy the text inside the text field */
		textarea.value = JSG.clipXML;
		textarea.select();

		document.execCommand('Copy');
		document.body.removeChild(textarea);
		focus.focus();
	}

	/**
	 * Copies the format of current selection.<br>
	 * See {{#crossLink "InteractionHandler/pasteFormat:method"}}{{/crossLink}} and
	 * {{#crossLink "InteractionHandler/isPasteFormatAvailable:method"}}{{/crossLink}} too.
	 *
	 * @method copySelectionFormat
	 */
	copySelectionFormat() {
		const selection = this.viewer.getSelection();
		if (selection.length === 1) {
			JSG.clipFormat = selection[0]
				.getModel()
				.getFormat()
				.copy();
			JSG.clipTextFormat = selection[0]
				.getModel()
				.getTextFormat()
				.copy();
		}
	}

	/**
	 * Copies current selection and creates and executes required {{#crossLink
	 * "DeleteItemCommand"}}{{/crossLink}}s.<br/> See {{#crossLink
	 * "InteractionHandler/paste:method"}}{{/crossLink}} and
	 * {{#crossLink "InteractionHandler/isPasteAvailable:method"}}{{/crossLink}} too.
	 *
	 * @method cutSelection
	 */
	cutSelection() {
		JSG.clipOffset = new Point(0, 0);
		JSG.clipXML = JSG.copyItems(this.viewer.getSelection());

		const deleteCmd = new CompoundCommand();
		const selection = this.viewer.getSelection();
		let i;

		for (i = selection.length - 1; i >= 0; i -= 1) {
			if (selection[i].getModel().isDeleteable()) {
				deleteCmd.add(new DeleteItemCommand(selection[i].getModel()));
			}
		}
		this.execute(deleteCmd);
		this.viewer.clearSelection();
		this.viewer.clearAllLayer();
		// additional call to repaint() to update selection rect...
		this.repaint();
	}

	/**
	 * Creates and executes required {{#crossLink "PasteItemsCommand"}}{{/crossLink}}.<br/>
	 * If no {{#crossLink "GraphItem"}}{{/crossLink}}s were copied before, i.e. a paste is not
	 * available, calling this method has no effect.<br> See {{#crossLink
	 * "InteractionHandler/copySelection:method"}}{{/crossLink}} and
	 * {{#crossLink "InteractionHandler/isPasteAvailable:method"}}{{/crossLink}} too.
	 *
	 * @method paste
	 */
	paste() {
		if (!this.isPasteAvailable()) {
			return;
		}

		const selectionProvider = this.viewer.getSelectionProvider();
		if (selectionProvider.hasSingleSelection() &&
			(selectionProvider.getFirstSelection().getModel() instanceof StreamSheetContainer)) {
			return;
		}

		const cmd = new PasteItemsCommand(JSG.clipXML, this.viewer);
		this.execute(cmd);
	}

	/**
	 * Checks if a paste of formerly copied {{#crossLink "GraphItem"}}{{/crossLink}}s is available.<br/>
	 * See {{#crossLink "InteractionHandler/copySelection:method"}}{{/crossLink}} too.
	 *
	 * @method isPasteAvailable
	 * @return {Boolean} <code>true</code> if paste is available, <code>false</code> otherwise.
	 */
	isPasteAvailable() {
		return JSG.clipXML !== undefined;
	}

	/**
	 * Creates and executes required {{#crossLink "FormatItemCommand"}}{{/crossLink}}s or
	 * {{#crossLink "TextFormatItemCommand"}}{{/crossLink}}s to paste copied formats to
	 * current selection.<br/>
	 * If no formats were copied before, i.e. a paste is not available, calling this method has no effect.<br>
	 * See {{#crossLink "InteractionHandler/copySelectionFormat:method"}}{{/crossLink}} and
	 * {{#crossLink "InteractionHandler/isPasteFormatAvailable:method"}}{{/crossLink}} too.
	 *
	 * @method pasteFormat
	 */
	pasteFormat() {
		if (!this.isPasteFormatAvailable()) {
			return;
		}
		const newFormat = JSG.clipFormat.copy();
		const newTextFormat = JSG.clipTextFormat !== undefined ? JSG.clipTextFormat.copy() : undefined;
		const cmd = new CompoundCommand();
		const selection = this.viewer.getSelection();

		selection.forEach((sel) => {
			cmd.add(new FormatItemCommand(sel.getModel(), newFormat));
			if (newTextFormat !== undefined) {
				cmd.add(new TextFormatItemCommand(sel.getModel(), newTextFormat));
			}
		});

		this.execute(cmd);
	}

	/**
	 * Checks if a paste format is available, i.e. if one was copied to internal clipboard.<br/>
	 * See {{#crossLink "InteractionHandler/copySelectionFormat:method"}}{{/crossLink}} too.
	 *
	 * @method isPasteFormatAvailable
	 * @return {Boolean} <code>true</code> if a format is available, <code>false</code> otherwise.
	 */
	isPasteFormatAvailable() {
		const selection = this.viewer.getSelection();
		return selection.length !== 0 && JSG.clipFormat !== undefined;
	}

	/**
	 * Creates and executes required {{#crossLink "DeleteItemCommand"}}{{/crossLink}}s to delete
	 * current selection.<br/>
	 *
	 * @method groupSelection
	 */
	deleteSelection() {
		const selection = this.viewer.getSelection();
		const deleteables = [];

		selection.forEach((sel) => {
			const item = sel.getModel();
			if (item.isDeleteable()) {
				deleteables.push(item);
			}
		});

		if (deleteables.length > 0) {
			// sort deleteables array
			deleteables.sort(
				(a, b) =>
					// <0 if ai<bi; >0 if ai>bi; =0 on equal... -1 to reverse sort...
					-1 * (a.getIndex() - b.getIndex())
			);
			const deleteCmd = new CompoundCommand();

			deleteables.forEach((deleteable) => {
				deleteCmd.add(new DeleteItemCommand(deleteable));
			});
			this.execute(deleteCmd);
		}
		this.viewer.clearSelection();
		this.viewer.clearAllLayer();
	}

	/**
	 * Creates and executes required {{#crossLink "GroupItemsCommand"}}{{/crossLink}}s to group
	 * current selection.<br/>
	 *
	 * @method groupSelection
	 */
	groupSelection() {
		const selection = this.viewer.getSelection();
		this.viewer.clearSelection();
		const groupCommand = new GroupItemsCommand(selection, new GroupCreator());
		this.execute(groupCommand, (cmd, viewer) => {
			// select inside function, so we don't have to repaint twice...
			cmd.selectAll(cmd._group, viewer);
		});
	}

	/**
	 * Creates and executes required {{#crossLink "UnGroupItemsCommand"}}{{/crossLink}}s to ungroup
	 * current selection.<br/>
	 *
	 * @method ungroupSelection
	 */
	ungroupSelection() {
		const cmd = new CompoundCommand();
		const selection = this.viewer.getSelection();

		selection.forEach((sel) => {
			const group = sel.getModel();
			cmd.add(new UnGroupItemsCommand(group));
		});

		this.execute(cmd);
	}

	/**
	 * Creates and executes required {{#crossLink "ChangeItemOrderCommand"}}{{/crossLink}}s to change
	 * the drawing order of current selection.<br/> See {{#crossLink
	 * "ChangeItemOrderCommand.Action"}}{{/crossLink}} too.
	 *
	 * @method changeDrawingOrderSelection
	 * @param {ChangeItemOrderCommand.Action} changeOrderFlag One of the predefined Action definitions.
	 */
	changeDrawingOrderSelection(changeOrderFlag) {
		const cmd = new CompoundCommand();
		const selection = this.viewer.getSelection();
		let i;
		let n;

		if (changeOrderFlag === ChangeItemOrderCommand.Action.UP) {
			for (i = selection.length - 1; i >= 0; i -= 1) {
				cmd.add(new ChangeItemOrderCommand(selection[i].getModel(), changeOrderFlag, this.viewer));
			}
		} else {
			for (i = 0, n = selection.length; i < n; i += 1) {
				cmd.add(new ChangeItemOrderCommand(selection[i].getModel(), changeOrderFlag, this.viewer));
			}
		}
		this.execute(cmd);
	}

	/**
	 * Activates an {{#crossLink "EditShapeInteraction"}}{{/crossLink}} instance for current
	 * selection. Note: this will work for single selection only.
	 *
	 * @method editSelection
	 */
	editSelection() {
		const selection = this.viewer.getSelection();
		if (selection.length !== 1) {
			return;
		}

		let shapeInteraction;
		const shapeType = selection[0]
			.getModel()
			.getShape()
			.getType();
		switch (shapeType) {
			case LineShape.TYPE:
			case OrthoLineShape.TYPE:
				shapeInteraction = new EditLineShapeInteraction();
				break;
			case BezierShape.TYPE:
			case BezierLineShape.TYPE:
			case EllipseShape.TYPE:
				shapeInteraction = new EditBezierShapeInteraction();
				break;
			default:
				shapeInteraction = new EditShapeInteraction();
		}
		this.setActiveInteraction(shapeInteraction);
	}

	/**
	 * Creates and executes a {{#crossLink "AlignItemsCommand"}}{{/crossLink}} for the current active
	 * selection using the specified align flag.<br/>
	 * See {{#crossLink "AlignItemsCommand.Alignment"}}{{/crossLink}} too.
	 *
	 * @method alignSelection
	 * @param {AlignItemsCommand.Alignment} alignFlag One of the predefined Alignment definitions.
	 */
	alignSelection(alignFlag) {
		const selection = this.viewer.getSelectionProvider().getSelectedItems();
		const alignCommand = new AlignItemsCommand(selection, alignFlag);
		this.execute(alignCommand);
	}

	/**
	 * Creates and executes a {{#crossLink "SizeItemsCommand"}}{{/crossLink}} for the current active
	 * selection using the specified flag.<br/>
	 * See {{#crossLink "SizeItemsCommand.Action"}}{{/crossLink}} too.
	 *
	 * @method sizeSelection
	 * @param {SizeItemsCommand.Action} sizeFlag One of the predefined SizeItems definitions.
	 */
	sizeSelection(sizeFlag) {
		const selection = this.viewer.getSelectionProvider().getSelectedItems();
		const sizeCommand = new SizeItemsCommand(selection, sizeFlag);
		this.execute(sizeCommand);
	}

	/**
	 * Changes format attributes of current selection. The attributes to change and the new values
	 * (or {{#crossLink "BooleanExpression"}}{{/crossLink}}s) are defined by name-value pairs
	 * within given map.
	 *
	 * @method applyFormatMap
	 * @param {Dictionary} map A map with name-value pairs.
	 */
	applyFormatMap(map) {
		this.applyMapToSelection(map, FormatAttributes.NAME);
	}

	/**
	 * Changes text format attributes of current selection. The attributes to change and the new values
	 * (or {{#crossLink "BooleanExpression"}}{{/crossLink}}s) are defined by name-value pairs
	 * within given map.
	 *
	 * @method applyTextFormatMap
	 * @param {Dictionary} map A map with name-value pairs.
	 */
	applyTextFormatMap(map) {
		this.applyMapToSelection(map, TextFormatAttributes.NAME);
	}

	/**
	 * Checks if given attributes can be applied to the {{#crossLink "AttributeList"}}{{/crossLink}}
	 * specified by <code>listpath</code>. The attributes to apply are defined by name-value pairs within given map.
	 * The provided attribute names must all belong to the same AttributeList which is referenced by the
	 * <code>listpath</code> parameter.
	 *
	 * @method canApplyAttributes
	 * @param {Dictionary} map A map with name-value pairs.
	 * @param {String} listpath A complete path to an AttributeList whose attributes should be changed.
	 * @return {Boolean} <code>true</code> if values can be applied, <code>false</code> otherwise.
	 */
	canApplyAttributes(map, listpath) {
		const interaction = this.getActiveInteraction();
		if (interaction.canApplyAttributes(map, listpath, this.viewer)) {
			return true;
		}

		const selection = this.viewer.getSelection();
		return selection.length !== 0;
	}

	/**
	 * Changes several attributes of current selection. The attributes to change and the new values
	 * (or {{#crossLink "BooleanExpression"}}{{/crossLink}}s) are defined by name-value pairs
	 * within given map. The provided attribute names must all belong to the same
	 * {{#crossLink "AttributeList"}}{{/crossLink}} which is referenced by the
	 * <code>listpath</code> parameter.
	 *
	 * @method applyMapToSelection
	 * @param {Dictionary} map A map with name-value pairs.
	 * @param {String} listpath A complete path to an AttributeList whose attributes should be changed.
	 */
	applyMapToSelection(map, listpath) {
		const interaction = this.getActiveInteraction();
		if (interaction.onApplyAttributes(map, listpath, this.viewer)) {
			return;
		}

		const selection = this.viewer.getSelection();
		if (selection.length !== 0) {

			if (selection[0].getView().applyAttributes(map, this.viewer)) {
				return;
			}

			const cmd = new CompoundCommand();

			selection.forEach((sel) => {
				const item = sel.getModel();
				// TODO review Group handling: should we give the group a chance to check attribute?
				if (JSG.isGroup(item)) {
					const groupitems = item.getItems();
					groupitems.forEach((groupitem) => {
						cmd.add(new SetAttributesMapCommand(groupitem, map, listpath));
					});
				} else {
					cmd.add(new SetAttributesMapCommand(item, map, listpath));
				}
			});

			this.execute(cmd);
		}
	}

	/**
	 * Executes a link expression registered to the {{#crossLink "GraphItem"}}{{/crossLink}} of given
	 * controller. If no link was registered to the GraphItem, calling this method has no effect.<br/> See {{#crossLink
	 * "GraphItem/getLink:method"}}{{/crossLink}} too.
	 *
	 * @method executeLink
	 * @param {GraphItemController} controller The model controller of the GraphItem to execute
	 *     the link of.
	 */
	executeLink(controller) {
		const link = controller
			.getModel()
			.getLink()
			.getValue();
		if (!link.length) {
			return;
		}

		const sep = link.indexOf(':');
		if (sep === -1) {
			return;
		}
		const command = link.substring(0, sep);
		const argument = link.substring(sep + 1);
		if (!argument.length) {
			return;
		}

		switch (command) {
			case 'http':
			case 'https':
				window.open(link, '_blank');
				break;
		}
	}

	collapse(item) {
		const cmd = new CollapseItemCommand(item);
		this.execute(cmd);
		return true;
	}

	/**
	 * Notification name which qualifies the notification send on activating a new interaction.
	 *
	 * @property ACTIVE_INTERACTION_NOTIFICATION
	 * @type {String}
	 * @static
	 * @since 2.0.20.5
	 */
	static get ACTIVE_INTERACTION_NOTIFICATION() {
		return 'interactionhandler.active.interaction.notification';
	}
}


export default InteractionHandler;
