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
/* global document Hammer FileReader */

import { default as JSG, Point } from '@cedalo/jsg-core';
import Hammer from 'hammerjs';
import View from '../View';
import SelectionStyle from '../../graph/view/selection/SelectionStyle';
import ScalableGraphics from './ScalableGraphics';
import DocumentEventDispatcher from './DocumentEventDispatcher';
import ClientEvent from '../events/ClientEvent';
import DragEvent from '../events/DragEvent';
import GestureEvent from '../events/GestureEvent';
import KeyEvent from '../events/KeyEvent';
import MouseEvent from '../events/MouseEvent';
import CreateItemInteraction from '../../graph/interaction/CreateItemInteraction';

/**
 * The GraphicSystem is the main class to handle events and drawing requests.</br>
 * Therefore a reference to an html canvas element is required to which the GraphicSystem will register itself as
 * listener to the various key, touch and mouse events. These events are transformed from native events to their
 * corresponding API
 * {{#crossLink "ClientEvent"}}{{/crossLink}}s and then propagated to a registered
 * {{#crossLink "InteractionHandler"}}{{/crossLink}} or, if no InteractionHandler was set, to the
 * main root {{#crossLink "View"}}{{/crossLink}}.</br> A drawing request can be triggered by a call to
 * {{#crossLink "GraphicSystem/paint:method"}}{{/crossLink}}. However, it is rarely necessary to call
 * <code>paint</code> directly. In most cases a repaint is required as a result of handling an event notification. Then
 * the preferred way is to simpy set the {{#crossLink "ClientEvent/doRepaint:property"}}{{/crossLink}}
 * property to <code>true</code>.</br> Finally, if the GraphicSystem is no longer needed {{#crossLink
 * "GraphicSystem/destroy:method"}}{{/crossLink}} should be called to perform a clean up and to
 * deregister all registered listeners.
 *
 * @class GraphicSystem
 * @constructor
 * Creates a GraphicSystem for the given canvas.
 * @param {canvas | String} canvasArg Id of the canvas element to be used or a canvas element.
 * @param {MetricCoordinateSystem} cs Coordinate System to be used for scaling objects.
 */
class GraphicSystem {
	constructor(canvasArg, cs) {
		if (typeof canvasArg === 'string' || canvasArg instanceof String) {
			this.canvas = document.getElementById(canvasArg);
		} else {
			this.canvas = canvasArg;
		}

		// check this canvas has a tabindex to be focusable...
		if (this.canvas.getAttribute('tabindex') === null) {
			this.canvas.setAttribute('tabindex', '0');
		}

		this.graphics = new ScalableGraphics(this.canvas, cs);

		// paint-repaint context:
		this._context = {
			isPainting: false
		};

		const setTouchMode = (flag) => {
			JSG.touchDevice = flag;
			JSG.findRadius = flag ? 600 : 300;
			JSG.portFindRadius = flag ? 400 : 200;
			SelectionStyle.MARKER_SIZE = 200;
			SelectionStyle.ROTATE_MARKER_DISTANCE = 800;
		};

		const notifyPasteEvent = (ev) => {
			const focus = document.activeElement;
			if (focus.id === this.canvas.id) {
				if (this.interactionHandler) {
					this.interactionHandler.handlePasteEvent(ev);
				}
			}
		};

		const notifyMouseEvent = (ev) => {
			ev.event.preventDefault();
			setTouchMode(false);
			if (this.interactionHandler) {
				this.interactionHandler.handleMouseEvent(ev);
			}
		};

		const notifyGestureEvent = (ev) => {
			// ev.location.x = this.graphics.getCoordinateSystem().deviceToLogX(ev.location.x);
			// ev.location.y = this.graphics.getCoordinateSystem().deviceToLogY(ev.location.y);
			//
			setTouchMode(ev.gesture.pointerType === 'touch');

			if (this.interactionHandler) {
				switch (ev.type) {
					case MouseEvent.MouseEventType.DOWN:
					case MouseEvent.MouseEventType.MOVE:
					case MouseEvent.MouseEventType.UP:
					case MouseEvent.MouseEventType.DBLCLK:
						this.interactionHandler.handleMouseEvent(ev);
						break;
					default:
						this.interactionHandler.handleGestureEvent(ev);
						break;
				}
			}
		};

		const notifyDragEvent = (ev) => {
			// ev.location.x = this.graphics.getCoordinateSystem().deviceToLogX(ev.location.x);
			// ev.location.y = this.graphics.getCoordinateSystem().deviceToLogY(ev.location.y);

			if (this.interactionHandler) {
				this.interactionHandler.handleDragEvent(ev);
			}
		};

		const onTouchDefault = (event) => {
			event.preventDefault();
		};

		const onTouchCancel = (event) => {
			const me = this.createGestureEvent(event, GestureEvent.GestureEventType.CANCEL);
			if (me) {
				notifyGestureEvent(me);
				this.paint();
			}
		}

		const onTouchHold = (event) => {
			if (event.srcEvent.type !== 'mousedown') {
				JSG.debug.log('Hold');
				onTouchCancel(event);
			}
		}

		const onTouchPanStart = (event) => {
			if (event.pointerType === 'mouse') {
				return;
			}

			let me = this.createGestureEvent(event, GestureEvent.GestureEventType.TOUCHMOVE);
			if (me) {
				notifyGestureEvent(me);
			}

			if (!this._press && this.interactionHandler) {
				const interaction = this.interactionHandler.getActiveInteraction();
				me = this.createGestureEvent(event, GestureEvent.GestureEventType.PANSTART);
				if (me && interaction && interaction.isUsingPan(me, this.interactionHandler.viewer)) {
					notifyGestureEvent(me);
					this.paint();
					return;
				}
			}

			if (!this._press) {
				me = this.createGestureEvent(event, GestureEvent.GestureEventType.TAPDOWN);
				if (me) {
					notifyGestureEvent(me);
					this.paint();
				}
			}
		}

		const onTouchPan = (event) => {
			if (event.pointerType === 'mouse') {
				return;
			}

			if (!this._press && this.interactionHandler) {
				const interaction = this.interactionHandler.getActiveInteraction();
				const me = this.createGestureEvent(event, GestureEvent.GestureEventType.PAN);
				if (me && interaction && interaction.isUsingPan(me, this.interactionHandler.viewer)) {
					notifyGestureEvent(me);
					this.paint();
					return;
				}
			}

			const me = this.createGestureEvent(event, GestureEvent.GestureEventType.TOUCHMOVE);
			if (me) {
				notifyGestureEvent(me);
				this.paint();
			}
		}

		const onTouchPanEnd = (event) => {
			if (event.pointerType === 'mouse') {
				return;
			}

			if (!this._press && this.interactionHandler) {
				const interaction = this.interactionHandler.getActiveInteraction();
				const me = this.createGestureEvent(event, GestureEvent.GestureEventType.PANEND);
				if (me && interaction && interaction.isUsingPan(me, this.interactionHandler.viewer)) {
					notifyGestureEvent(me);
					this.paint();
					return;
				}
			}

			const me = this.createGestureEvent(event, GestureEvent.GestureEventType.TAPUP);
			if (me) {
				notifyGestureEvent(me);
				this.paint();
			}
			this._press = false;
		}

		const onTouchPress = (event) => {
			if (event.pointerType === 'mouse') {
				return;
			}
			let me = this.createGestureEvent(event, GestureEvent.GestureEventType.TOUCHMOVE);
			if (me) {
				notifyGestureEvent(me);
			}
			me = this.createGestureEvent(event, GestureEvent.GestureEventType.TAPDOWN);
			if (me) {
				notifyGestureEvent(me);
				this.paint();
			}
			this._press = true;
		}

		const onTouchTap = (event) => {
			if (event.pointerType === 'mouse') {
				return;
			}
			if (event.tapCount === 1) {
				let me = this.createGestureEvent(event, GestureEvent.GestureEventType.TOUCHMOVE);
				if (me) {
					notifyGestureEvent(me);
				}
				me = this.createGestureEvent(event, GestureEvent.GestureEventType.TAPDOWN);
				if (me) {
					notifyGestureEvent(me);
				}
				me = this.createGestureEvent(event, GestureEvent.GestureEventType.TAPUP);
				if (me) {
					notifyGestureEvent(me);
				}
				this._press = false;
			}

			this.paint();
		}

		const onTouchDoubleTap = (event) => {
			if (event.pointerType === 'mouse') {
				return;
			}
			if (event.tapCount === 2) {
				const me = this.createGestureEvent(event, GestureEvent.GestureEventType.DBLTAP);
				if (me) {
					notifyGestureEvent(me);
				}
			}
		}

		const onTouchPinchStart = () => {}

		const onTouchPinch = (event) => {
			if (event.pointerType === 'mouse') {
				return;
			}

			if (!this._pinStartZoom) {
				this._pinStartZoom = this.interactionHandler.viewer.getZoom();
			}
			const zoom = this._pinStartZoom * event.scale;
			if (zoom >= 0.5 && zoom <= 2) {
				this.interactionHandler.viewer.setZoom(zoom);
			}
		}

		const onTouchPinchEnd = (event) => {
			if (event.pointerType === 'mouse') {
				return;
			}

			this._pinStartZoom = undefined;
		}

		const onDragEnter = (event) => {
			const ev = this.createDragEvent( event, DragEvent.DragEventType.ENTER);
			notifyDragEvent(ev);
		}

		const onDragOver = (event) => {
			if (event.preventDefault) {
				event.preventDefault();
			}
			const ev = this.createDragEvent( event, DragEvent.DragEventType.OVER);
			notifyDragEvent(ev);
		}

		const onDragLeave = (event) => {
			const ev = this.createDragEvent( event, DragEvent.DragEventType.LEAVE);
			notifyDragEvent(ev);
		}

		const onDragExit = (event) => {
			const ev = this.createDragEvent( event, DragEvent.DragEventType.EXIT);
			notifyDragEvent(ev);
		}

		const onDrop = (event) => {
			const ev = this.createDragEvent( event, DragEvent.DragEventType.DROP);
			notifyDragEvent(ev);
			if (event.preventDefault) {
				event.preventDefault();
			}
			this.paint();

			return false;
		}

		const isClkDblClk = () => {
			const now = new Date().getTime();
			this._dblClk = now - this._lastClick < 300;
			this._lastClick = now;

			return this._dblClk;
		};

		const isDragging = () => {
			return this.interactionHandler !== undefined ? this.interactionHandler.isDragging : false;
		};

		const onMouseDown = (event) => {
			// ignore second click for double click
			if (isClkDblClk()) {
				return;
			}

			const me = this.createMouseEvent( event, MouseEvent.MouseEventType.DOWN);
			// right-click to show a context-menu is handled by onContextMenu!!
			notifyMouseEvent(me);
			this.paint();

			if (!me.keepFocus) {
				this.canvas.focus();
			}
		};

		const onMouseMove = (event) => {
			const me = this.createMouseEvent( event, MouseEvent.MouseEventType.MOVE);
			if (me.isInCanvas() || isDragging()) {
				notifyMouseEvent(me);
				if (me.doRepaint) {
					this.paint();
				}
			} else {
				JSG.toolTip.removeTooltip();
			}
		};

		const onMouseUp = (event) => {
			if (this._dblClk) {
				this._dblClk = false;
				return;
			}

			const me = this.createMouseEvent( event, MouseEvent.MouseEventType.UP);
			// right-click to show a context-menu is handled by onContextMenu!!
			if (me.isInCanvas() || isDragging()) {
				notifyMouseEvent(me);
				this.paint();
			}
		};

		const onMouseGet = () => {
			if (!JSG.keepFocus) {
				document.onmousemove = onMouseMove;
				document.onmouseup = onMouseUp;
			}
		};

		const onMouseDblClk = (event) => {
			const me = this.createMouseEvent( event, MouseEvent.MouseEventType.DBLCLK);
			notifyMouseEvent(me);
			this.paint();
		};

		const onContextMenu = (event) => {
			const me = this.createMouseEvent( event, MouseEvent.MouseEventType.CONTEXT);

			notifyMouseEvent(me);
			if (me.doRepaint) {
				this.paint();
			}
			return false;
		};

		const onMouseExit = (event) => {
			const me = this.createMouseEvent( event, MouseEvent.MouseEventType.EXIT);
			notifyMouseEvent(me);
			JSG.toolTip.removeTooltip();
			if (me.doRepaint) {
				this.paint();
			}
		};

		const onMouseWheel = (event) => {
			const me = this.createMouseEvent( event, MouseEvent.MouseEventType.WHEEL);
			notifyMouseEvent(me);
			this.paint();
		};

		const onKeyDown = (event) => {
			this.onKeyEvent( event, KeyEvent.KeyEventType.DOWN);
		};

		const onKeyUp = (event) => {
			return this.onKeyEvent( event, KeyEvent.KeyEventType.UP);
		};

		const onPaste = (event) => {
			const pe = new ClientEvent(this.canvas,  event, 0);

			if (pe) {
				notifyPasteEvent(pe);
				this.paint();
			}
		};

		// attach listeners to canvas and DOM:
		this.canvas.addEventListener('mousedown', onMouseDown, false);

		DocumentEventDispatcher.addEventListener('onmouseup', this, onMouseUp);
		DocumentEventDispatcher.addEventListener('onmousemove', this, onMouseMove);

		this.canvas.addEventListener('touchstart', onTouchDefault, true);
		this.canvas.addEventListener('touchmove', onTouchDefault, true);
		this.canvas.addEventListener('touchend', onTouchDefault, true);
		this.canvas.addEventListener('touchcancel', onTouchCancel, true);

		const handler = new Hammer(this.canvas);

		handler.on('panstart', onTouchPanStart);
		handler.on('panmove', onTouchPan);
		handler.on('panend', onTouchPanEnd);
		handler.on('tap', onTouchTap);
		handler.on('doubletap', onTouchDoubleTap);
		// handler.on('hold', onTouchHold);
		handler.on('pinchstart', onTouchPinchStart);
		handler.on('pinchmove', onTouchPinch);
		handler.on('pinchend', onTouchPinchEnd);
		handler.on('press', onTouchPress);

		handler.get('pan').set({ direction: Hammer.DIRECTION_ALL });
		handler.get('press').set({ time:  500});
		handler.get('pinch').set({ enable:  true});
		handler.get('tap').set({ posThreshold:  50, threshold: 8});
		handler.get('doubletap').set({ posThreshold:  50, threshold: 8});

		this.canvas.addEventListener('contextmenu', onContextMenu, false);
		this.canvas.addEventListener('wheel', onMouseWheel, false);
		this.canvas.addEventListener('dblclick', onMouseDblClk, false);
		this.canvas.addEventListener('dragenter', onDragEnter, false);
		this.canvas.addEventListener('dragover', onDragOver, false);
		this.canvas.addEventListener('dragleave', onDragLeave, false);
		this.canvas.addEventListener('dragexit', onDragExit, false);
		this.canvas.addEventListener('drop', onDrop, false);
		this.canvas.addEventListener('keyup', onKeyUp, false);
		this.canvas.addEventListener('keydown', onKeyDown, false);
		document.addEventListener('paste', onPaste, false);

		this._lastClick = new Date().getTime();
		this._dblClk = false;
		this._press = false;

		this.removeEventListeners = () => {
			// remove from canvas:
			const { canvas } = this;
			canvas.removeEventListener('mousedown', onMouseDown, false);
			canvas.removeEventListener('mousemove', onMouseGet, false);
			canvas.removeEventListener('touchstart', onTouchDefault, true);
			canvas.removeEventListener('touchmove', onTouchDefault, true);
			canvas.removeEventListener('touchend', onTouchDefault, true);
			canvas.removeEventListener('touchcancel', onTouchCancel, true);
			if (handler !== undefined) {
				handler.off('panstart', onTouchPanStart);
				handler.off('panmove', onTouchPan);
				handler.off('panend', onTouchPanEnd);
				handler.off('pinchstart', onTouchPinchStart);
				handler.off('pinchmove', onTouchPinch);
				handler.off('pinchend', onTouchPinchEnd);
				handler.off('tap', onTouchTap);
				handler.off('doubletap', onTouchDoubleTap);
				// handler.off('hold', onTouchHold);
				handler.off('pinch', onTouchPinch);
			}
			canvas.removeEventListener('contextmenu', onContextMenu, false);
			canvas.removeEventListener('wheel', onMouseWheel, false);
			canvas.removeEventListener('dblclick', onMouseDblClk, false);
			canvas.removeEventListener('dragenter', onDragEnter, false);
			canvas.removeEventListener('dragover', onDragOver, false);
			canvas.removeEventListener('dragleave', onDragLeave, false);
			canvas.removeEventListener('dragexit', onDragExit, false);
			canvas.removeEventListener('drop', onDrop, false);
			canvas.removeEventListener('keyup', onKeyUp, false);
			canvas.removeEventListener('keydown', onKeyDown, false);
			document.removeEventListener('paste', onPaste, false);

			// remove from document:
			DocumentEventDispatcher.removeEventListener('onmouseup', this);
			DocumentEventDispatcher.removeEventListener('onmousemove', this);
		};
	}

	/**
	 * Sets the coordinate system to use.
	 *
	 * @method setCoordinateSystem
	 * @param {CoordinateSystem} cs The new coordinate system.
	 */
	setCoordinateSystem(cs) {
		this.graphics.setCoordinateSystem(cs);
	}

	getCoordinateSystem() {
		return this.graphics.getCoordinateSystem();
	}

	/**
	 * Returns the current graphics instance used for drawing.
	 *
	 * @method getGraphics
	 * @return {Graphics} The currently used graphics instance.
	 */
	getGraphics() {
		return this.graphics;
	}

	/**
	 * Returns the native canvas object.
	 *
	 * @method getCanvas
	 * @return {canvas} The native canvas object.
	 */
	getCanvas() {
		return this.canvas;
	}

	/**
	 * Returns the current canvas size as point.
	 *
	 * @method getSize
	 * @param {Point} [reusepoint] An optional point to reuse. If none is provided a new point will be
	 *     created.
	 * @return {Point} The canvas size.
	 */
	getSize(reusepoint) {
		const size = reusepoint !== undefined ? reusepoint : new Point(0, 0);
		return size.set(this.canvas.width, this.canvas.height);
	}

	/**
	 * Resizes inner canvas object to specified size.</br>
	 * Note: this will trigger a repaint.
	 *
	 * @method resize
	 * @param {Number} width The new canvas width.
	 * @param {Number} height The new canvas height.
	 */
	resize(width, height) {
		if (this.interactionHandler) {
			this.interactionHandler.handleResizeCanvas(width, height);
		}
		this.canvas.width = width;
		this.canvas.height = height;
		this.paint();
	}

	/**
	 * Sets the main root view to draw on canvas.</br>
	 * Note: this will trigger a repaint.
	 *
	 * @method setContent
	 * @param {View} view The new root view.
	 */
	setContent(view) {
		this.root = view;
		this.paint();
	}

	getContent() {
		return this.root;
	}

	/**
	 * Returns the curren cursor style setting used by inner canvas object.
	 *
	 * @method getCursor
	 * @return {String} The current cursor style.
	 */
	getCursor() {
		return this.canvas.style.cursor;
	}

	/**
	 * Sets the cursor style to be used by inner canvas object.
	 *
	 * @method setCursor
	 * @param {String} name The new cursor style string to use.
	 */
	setCursor(name) {
		if (this.canvas.style.cursor !== name) {
			this.canvas.style.cursor = name;
		}
	}

	/**
	 * Draws the current root view and all of its subviews.
	 *
	 * @method paint
	 * @param {Boolean} force Specify <code>true</code> to force a paint no matter of current inner state.
	 */
	paint(force) {
		const paintCtxt = this._context;
		if (paintCtxt.isPainting === false) {
			// const now = Date.now();
			paintCtxt.isPainting = true;
			this._doPaint(force);
			paintCtxt.isPainting = false;
			// console.log(Date.now() - now + 'ms painting');
		}
	}

	/**
	 * Internal method which actually triggers the repaint.
	 *
	 * @method _doPaint
	 * @param {Boolean} force Specify <code>true</code> to force a paint no matter of current inner state.
	 * @private
	 */
	_doPaint(force) {
		if (!JSG.drawingDisabled || force) {
			this.graphics._context2D.setTransform(1, 0, 0, 1, 0, 0);
			this.graphics._context2D.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.root.draw(this.graphics);
		}
		if (JSG.debug.DUMP_CACHE_SIZE) {
			JSG.debug.log('size of caches after paint:', true);
			JSG.debug.log(`\tbox cache: ${JSG.boxCache.boxes.length} -> in use: ${JSG.boxCache.inUse()}`, true);
			JSG.debug.log(`\trect cache: ${JSG.rectCache.rects.length} -> in use: ${JSG.rectCache.inUse()}`, true);
			JSG.debug.log(`\tpoint cache: ${JSG.ptCache.points.length} -> in use: ${JSG.ptCache.inUse()}`, true);
		}
	}

	/**
	 * Sets the main InteractionHandler to use. The InteractionHandler will get all mouse, key and touch events.
	 *
	 * @method setInteractionHandler
	 * @param {InteractionHandler} interactionHandler The new InteractionHandler to use.
	 */
	setInteractionHandler(interactionHandler) {
		if (this.interactionHandler) {
			this.interactionHandler.unregisterGraphicSystem();
		}
		this.interactionHandler = interactionHandler;
		if (this.interactionHandler) {
			this.interactionHandler.registerGraphicSystem(this);
		}
	}

	/**
	 * Creates a <code>JSG</code> mouse event from given native one.
	 * @method createMouseEvent
	 * @param {event} event Native Javascript mouse event object.
	 * @param {MouseEvent.MouseEventType} [type] Optional mouse event type. If not given the framework tries to
	 *     match the type property of given native event.
	 * @return {MouseEvent} An event object which represents mouse events within the <code>JSG</code>
	 *     framework.
	 * @since 2.0.20.4
	 */
	createMouseEvent( event, type) {
		type = type || MouseEvent.MouseEventType.fromEvent(event);
		const me = MouseEvent.fromEvent(this.canvas,  event, type);
		me.cs = this.graphics.getCoordinateSystem();
		me.location.set(me.cs.deviceToLogX(me.location.x), me.cs.deviceToLogY(me.location.y));
		return me;
	}

	createDragEvent( event, type) {
		const de = DragEvent.fromEvent(this.canvas,  event, type);
		de.cs = this.graphics.getCoordinateSystem();
		de.location.set(de.cs.deviceToLogX(de.location.x), de.cs.deviceToLogY(de.location.y));
		return de;
	}

	createGestureEvent( event, type) {
		const me = GestureEvent.fromEvent(this, event, type);
		if (me) {
			me.cs = this.graphics.getCoordinateSystem();
			me.location.set(me.cs.deviceToLogX(me.location.x), me.cs.deviceToLogY(me.location.y));
		}
		return me;
	}

	/**
	 * Called on global key event.</br>
	 * This will propagate the event to current InteractionHandler or to the root view if no handler was set.
	 *
	 * @method onKeyEvent
	 * @param {Event} event The native key event.
	 * @param {KeyEvent.KeyEventType} type The key event type, i.e. either up or down.
	 */
	onKeyEvent( event, type) {
		const keyEvent = KeyEvent.fromEvent(this.canvas,  event, type);
		keyEvent.cs = this.graphics.getCoordinateSystem();
		this.notifyKeyEvent(keyEvent);
		if (keyEvent.doRepaint) {
			this.paint();
		}
		if (keyEvent.doPreventDefault) {
			if (event.preventDefault) {
				event.preventDefault();
			}
		}
		return keyEvent;
	}

	/**
	 * Propagates key event to current InteractionHandler or to the root view if no handler was set.
	 *
	 * @method notifyKeyEvent
	 * @param {KeyEvent} ev The key event.
	 * @private
	 */
	notifyKeyEvent(ev) {
		ev.location.x = this.graphics.getCoordinateSystem().deviceToLogX(ev.location.x);
		ev.location.y = this.graphics.getCoordinateSystem().deviceToLogY(ev.location.y);

		if (this.interactionHandler) {
			this.interactionHandler.handleKeyEvent(ev);
		}
	}

	/**
	 * Called when this GraphicSystem is no longer needed to clean up required resources.
	 *
	 * @method destroy
	 */
	destroy() {
		this.removeEventListeners();
		this.setInteractionHandler(undefined);

		this.root = undefined;
		this.handler = undefined;
		this.graphics = undefined;
	}
}

export default GraphicSystem;
