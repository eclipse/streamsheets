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
		const that = this;

		if (typeof canvasArg === 'string' || canvasArg instanceof String) {
			this.canvas = document.getElementById(canvasArg);
		} else {
			this.canvas = canvasArg;
		}

		// check that canvas has a tabindex to be focusable...
		if (this.canvas.getAttribute('tabindex') === null) {
			this.canvas.setAttribute('tabindex', '0');
		}

		this.graphics = new ScalableGraphics(this.canvas, cs);
		this.root = new View();

		// paint-repaint context:
		this._context = {
			isPainting: false
		};

		const cancelInteraction = (event) => {
			if (this.interactionHandler) {
				const interaction = this.interactionHandler.getActiveInteraction();
				if (interaction instanceof CreateItemInteraction) {
					interaction.cancelInteraction(event, this.interactionHandler.viewer);
					this.paint();
				}
			}
		};

		function setTouchMode(flag) {
			JSG.touchDevice = flag;
			JSG.findRadius = flag ? 600 : 300;
			JSG.portFindRadius = flag ? 400 : 200;
			SelectionStyle.MARKER_SIZE = flag ? 450 : 200;
			SelectionStyle.ROTATE_MARKER_DISTANCE = flag ? 1200 : 800;
		}

		const notifyPasteEvent = (ev) => {
			const focus = document.activeElement;
			if (focus.id === this.canvas.id) {
				if (this.interactionHandler) {
					this.interactionHandler.handlePasteEvent(ev);
				}
			}
		};

		function notifyMouseEvent(ev) {
			ev.event.preventDefault();
			setTouchMode(false);
			if (that.interactionHandler) {
				that.interactionHandler.handleMouseEvent(ev);
			} else {
				that.root.handleMouseEvent(ev);
			}
		}

		function notifyGestureEvent(ev) {
			ev.location.x = that.graphics.getCoordinateSystem().deviceToLogX(ev.location.x);
			ev.location.y = that.graphics.getCoordinateSystem().deviceToLogY(ev.location.y);

			setTouchMode(ev.gesture.pointerType === 'touch');

			if (that.interactionHandler) {
				switch (ev.type) {
					case MouseEvent.MouseEventType.DOWN:
					case MouseEvent.MouseEventType.MOVE:
					case MouseEvent.MouseEventType.UP:
					case MouseEvent.MouseEventType.DBLCLK:
						that.interactionHandler.handleMouseEvent(ev);
						break;
					default:
						that.interactionHandler.handleGestureEvent(ev);
						break;
				}
			}
		}

		function notifyDragEvent(ev) {
			ev.location.x = that.graphics.getCoordinateSystem().deviceToLogX(ev.location.x);
			ev.location.y = that.graphics.getCoordinateSystem().deviceToLogY(ev.location.y);

			if (that.interactionHandler) {
				that.interactionHandler.handleDragEvent(ev);
			} else {
				that.root.handleDragEvent(ev);
			}
		}

		function onTouchDefault(event) {
			event.preventDefault();
		}

		function onTouchCancel(event) {
			const me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.CANCEL);

			notifyGestureEvent(me);
			that.paint();
			that.currentEvent = 0;
		}

		function onTouchIt(event) {
			if (event.srcEvent.type !== 'mousedown') {
				JSG.debug.log('Touch');
				that.currentEvent = GestureEvent.GestureEventType.TOUCH;
				const me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.DRAGSTART);
				if (me) {
					notifyGestureEvent(me);
				}
				that.paint();
			}
		}

		function onTouchHold(event) {
			if (event.srcEvent.type !== 'mousedown') {
				JSG.debug.log('Hold');
				onTouchCancel(event);
			}
		}

		function onTouchDragStart(event) {
			if (that.currentEvent === 0) {
				JSG.debug.log('DragStart');
				that.currentEvent = GestureEvent.GestureEventType.DRAG;
				const me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.DRAGSTART);
				if (me) {
					notifyGestureEvent(me);
				}
				that.paint();
			}
		}

		function onTouchDrag(event) {
			if (event.srcEvent.type !== 'move') {
				let me;
				if (that.currentEvent === GestureEvent.GestureEventType.TOUCH) {
					that.currentEvent = GestureEvent.GestureEventType.DRAG;
					me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.DRAG);
				} else if (that.currentEvent === GestureEvent.GestureEventType.DRAG) {
					me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.DRAG);
				}
				if (me) {
					notifyGestureEvent(me);
				}
				that.paint();
			}
		}

		function onTouchDragEnd(event) {
			if (event.srcEvent.type !== 'mouseup') {
				if (that.currentEvent === GestureEvent.GestureEventType.DRAG) {
					const me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.DRAGEND);
					if (me) {
						notifyGestureEvent(me);
					}
					that.paint();
					that.currentEvent = 0;
				}
			}
		}

		function onTouchTap(event) {
			if (
				event &&
				event.srcEvent.type !== 'mouseup' &&
				that.currentEvent !== GestureEvent.GestureEventType.DBLTAP
			) {
				const me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.TAPUP);
				if (me) {
					notifyGestureEvent(me);
				}

				that.paint();
				that.currentEvent = 0;
			}
		}

		function onTouchDoubleTap(event) {
			if (event.srcEvent.type !== 'mouseup') {
				JSG.debug.log('DoubleTap');
				let me;
				if (that.currentEvent === GestureEvent.GestureEventType.TOUCH) {
					JSG.debug.log('DragEnd');
					me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.DRAGEND);
					if (me) {
						notifyGestureEvent(me);
					}
				}
				me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.DBLTAP);
				if (me) {
					notifyGestureEvent(me);
				}
				that.paint();
				that.currentEvent = GestureEvent.GestureEventType.DBLTAP;
			}
		}

		function onTouchTransformStart(event) {
			if (that.currentEvent === GestureEvent.GestureEventType.DRAG) {
				onTouchCancel(event);
			} else if (that.currentEvent === GestureEvent.GestureEventType.TOUCH) {
				onTouchCancel(event);
				that.currentEvent = GestureEvent.GestureEventType.TRANSFORMSTART;
			} else {
				that.currentEvent = GestureEvent.GestureEventType.TRANSFORMSTART;
			}
		}

		function onTouchTransform(event) {
			let me;

			if (that.currentEvent === GestureEvent.GestureEventType.PAN) {
				JSG.debug.log('Pan');
				me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.PAN);
			} else if (that.currentEvent === GestureEvent.GestureEventType.TRANSFORMSTART) {
				JSG.debug.log('PanStart');
				that.currentEvent = GestureEvent.GestureEventType.PAN;
				me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.PANSTART);
			}

			if (me) {
				notifyGestureEvent(me);
				that.paint();
			}
		}

		function onTouchRotate(event) {
			let me;

			if (that.currentEvent === GestureEvent.GestureEventType.ROTATE) {
				JSG.debug.log('Rotate');
				me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.ROTATE);
			} else if (that.currentEvent === GestureEvent.GestureEventType.TRANSFORMSTART) {
				JSG.debug.log('RotateStart');
				that.currentEvent = GestureEvent.GestureEventType.ROTATE;
				me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.ROTATESTART);
			}

			if (me) {
				notifyGestureEvent(me);
				that.paint();
			}
		}

		function onTouchPinch(event) {
			let me;

			if (that.currentEvent === GestureEvent.GestureEventType.PINCH) {
				JSG.debug.log('Pinch');
				me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.PINCH);
			} else if (that.currentEvent === GestureEvent.GestureEventType.TRANSFORMSTART) {
				JSG.debug.log('PinchStart');
				that.currentEvent = GestureEvent.GestureEventType.PINCH;
				me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.PINCHSTART);
			}

			if (me) {
				notifyGestureEvent(me);
				that.paint();
			}
		}

		function onTouchSwipe(event) {}

		function onTouchTransformEnd(event) {
			let me;

			if (that.currentEvent === GestureEvent.GestureEventType.ROTATE) {
				JSG.debug.log('RotateEnd');
				me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.ROTATEEND);
			} else if (that.currentEvent === GestureEvent.GestureEventType.PINCH) {
				JSG.debug.log('PinchEnd');
				me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.PINCHEND);
			} else if (that.currentEvent === GestureEvent.GestureEventType.PAN) {
				JSG.debug.log('PanEnd');
				me = GestureEvent.fromEvent(that, event, GestureEvent.GestureEventType.PANEND);
			}

			if (me) {
				notifyGestureEvent(me);
				that.paint();
			}

			that.currentEvent = 0;
		}

		function onDragEnter(ev) {
			const event = DragEvent.fromEvent(that.canvas, ev, DragEvent.DragEventType.ENTER);
			event.cs = that.graphics.getCoordinateSystem();
			notifyDragEvent(event);
		}

		function onDragOver(ev) {
			if (ev.preventDefault) {
				ev.preventDefault();
			}
			const event = DragEvent.fromEvent(that.canvas, ev, DragEvent.DragEventType.OVER);
			event.cs = that.graphics.getCoordinateSystem();
			notifyDragEvent(event);
		}

		function onDragLeave(ev) {
			const event = DragEvent.fromEvent(that.canvas, ev, DragEvent.DragEventType.LEAVE);
			event.cs = that.graphics.getCoordinateSystem();
			notifyDragEvent(event);
		}

		function onDragExit(ev) {
			const event = DragEvent.fromEvent(that.canvas, ev, DragEvent.DragEventType.EXIT);
			event.cs = that.graphics.getCoordinateSystem();
			notifyDragEvent(event);
		}

		function onDrop(ev) {
			const event = DragEvent.fromEvent(that.canvas, ev, DragEvent.DragEventType.DROP);
			event.cs = that.graphics.getCoordinateSystem();
			notifyDragEvent(event);
			if (ev.preventDefault) {
				ev.preventDefault();
			}
			that.paint();

			return false;
		}

		function isClkDblClk() {
			const now = new Date().getTime();
			that._dblClk = now - that._lastClick < 300;
			that._lastClick = now;

			return that._dblClk;
		}

		function isDragging() {
			return that.interactionHandler !== undefined ? that.interactionHandler.isDragging : false;
		}

		function onMouseDown(ev) {
			// ignore second click for double click
			if (isClkDblClk()) {
				return;
			}

			// TO EARLY HERE: that.canvas.focus();
			//= > Want to handle mouse event before we get any focus events. E.g. on inline text editing with friends...
			that.currentEvent = GestureEvent.GestureEventType.DRAG;

			const me = that.createMouseEvent(ev, MouseEvent.MouseEventType.DOWN);
			// right-click to show a context-menu is handled by onContextMenu!!
			notifyMouseEvent(me);
			that.paint();
			// }
			if (!me.keepFocus) {
				that.canvas.focus();
			}
		}

		function onMouseMove(ev) {
			const me = that.createMouseEvent(ev, MouseEvent.MouseEventType.MOVE);
			if (me.isInCanvas() || isDragging()) {
				notifyMouseEvent(me);
				if (me.doRepaint) {
					that.paint();
				}
			} else {
				JSG.toolTip.removeTooltip();
			}
		}

		function onMouseUp(ev) {
			if (that._dblClk) {
				that._dblClk = false;
				return;
			}

			const me = that.createMouseEvent(ev, MouseEvent.MouseEventType.UP);
			// right-click to show a context-menu is handled by onContextMenu!!
			if (me.isInCanvas() || isDragging()) {
				notifyMouseEvent(me);
				that.paint();
			}

			// cancelInteraction(me);
		}

		function onMouseGet() {
			if (!JSG.keepFocus) {
				document.onmousemove = onMouseMove;
				document.onmouseup = onMouseUp;
			}
		}

		function onMouseDblClk(ev) {
			const me = that.createMouseEvent(ev, MouseEvent.MouseEventType.DBLCLK);
			notifyMouseEvent(me);
			that.paint();
		}

		function onContextMenu(ev) {
			const me = that.createMouseEvent(ev, MouseEvent.MouseEventType.CONTEXT);

			notifyMouseEvent(me);
			if (me.doRepaint) {
				that.paint();
			}
			return false;
		}

		function onMouseExit(ev) {
			const me = that.createMouseEvent(ev, MouseEvent.MouseEventType.EXIT);
			notifyMouseEvent(me);
			JSG.toolTip.removeTooltip();
			if (me.doRepaint) {
				that.paint();
			}
		}

		function onMouseWheel(ev) {
			const me = that.createMouseEvent(ev, MouseEvent.MouseEventType.WHEEL);
			notifyMouseEvent(me);
			that.paint();
		}

		function onKeyDown(ev) {
			that.onKeyEvent(ev, KeyEvent.KeyEventType.DOWN);
		}

		function onKeyUp(ev) {
			return that.onKeyEvent(ev, KeyEvent.KeyEventType.UP);
		}

		const onPaste = (ev) => {
			const pe = new ClientEvent(this.canvas, ev, 0);

			if (pe) {
				notifyPasteEvent(pe);
				that.paint();
			}
		};

		let handler;

		// attach listeners to canvas and DOM:
		this.canvas.addEventListener('mousedown', onMouseDown, false);

		if (JSG.debug.USE_DOC_DISPATCHER) {
			DocumentEventDispatcher.addEventListener('onmouseup', this, onMouseUp);
			DocumentEventDispatcher.addEventListener('onmousemove', this, onMouseMove);
		} else {
			this.canvas.addEventListener('mousemove', onMouseGet, false);
		}

		if (JSG.touchDevice) {
			this.canvas.addEventListener('touchstart', onTouchDefault, true);
			this.canvas.addEventListener('touchmove', onTouchDefault, true);
			this.canvas.addEventListener('touchend', onTouchDefault, true);
			this.canvas.addEventListener('touchcancel', onTouchCancel, true);

			handler = new Hammer(this.canvas);

			//  {
			// 	transform_min_rotation: 5,
			// 		transform_min_scale: 0.1,
			// 		tap_max_touchtime: 2500,
			// 		hold_timeout: 2500
			// }
			handler.on('panstart', onTouchDragStart);
			handler.on('panmove', onTouchDrag);
			handler.on('panend', onTouchDragEnd);
			handler.on('tap', onTouchTap);
			handler.on('doubletap', onTouchDoubleTap);
			// handler.on('hold', onTouchHold);
			handler.on('rotate', onTouchRotate);
			handler.on('pinch', onTouchPinch);
			handler.on('swipe', onTouchSwipe);
			handler.on('press', onTouchIt);

			handler.get('pan').set({ direction: Hammer.DIRECTION_ALL });
			handler.get('press').set({ time:  0});
			// handler.on('transformstart', onTouchTransformStart);
			// handler.on('transform', onTouchTransform);
			// handler.on('transformend', onTouchTransformEnd);
		}

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

		this.currentEvent = 0;
		this._lastClick = new Date().getTime();
		this._dblClk = false;

		this.removeEventListeners = () => {
			// remove from canvas:
			const { canvas } = that;
			canvas.removeEventListener('mousedown', onMouseDown, false);
			canvas.removeEventListener('mousemove', onMouseGet, false);
			if (JSG.touchDevice) {
				canvas.removeEventListener('touchstart', onTouchDefault, true);
				canvas.removeEventListener('touchmove', onTouchDefault, true);
				canvas.removeEventListener('touchend', onTouchDefault, true);
				canvas.removeEventListener('touchcancel', onTouchCancel, true);
				if (handler !== undefined) {
					handler.off('panstart', onTouchDragStart);
					handler.off('panmove', onTouchDrag);
					handler.off('panend', onTouchDragEnd);
					handler.off('tap', onTouchTap);
					handler.off('doubletap', onTouchDoubleTap);
					// handler.off('hold', onTouchHold);
					handler.off('rotate', onTouchRotate);
					handler.off('pinch', onTouchPinch);
					handler.off('swipe', onTouchSwipe);
					handler.off('press', onTouchIt);
					// handler.off('transformstart', onTouchTransformStart);
					// handler.off('transform', onTouchTransform);
					// handler.off('transformend', onTouchTransformEnd);
				}
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
			if (JSG.debug.USE_DOC_DISPATCHER) {
				DocumentEventDispatcher.removeEventListener('onmouseup', this);
				DocumentEventDispatcher.removeEventListener('onmousemove', this);
			} else {
				document.onmouseup = undefined;
				document.onmousemove = undefined;
			}
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
	 * Returns the current graphics context. This is the native canvas context2D object.
	 *
	 * @method getGraphicsContext
	 * @return {context2D} The graphics 2D Canvas context.
	 */
	getGraphicsContext() {
		return this.graphics.getContext();
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
	 * @param {type} param_name param_description.
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
		// TODO (mr & ah): dies hier ist ein problem. globales abschalten des drawings ist wohl eher
		// schlecht, da sich unabhängige komponenten gegenseitig stören können. siehe graph & navigator
		//= > brauchen eine bessere lösung...
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
	 * @return {return_type} return_description
	 */
	setInteractionHandler(interactionHandler) {
		// TODO think: abstraction with listeners instead of direct connection to GraphicsSystem??
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
	 * @param {Event} ev Native Javascript mouse event object.
	 * @param {MouseEvent.MouseEventType} [type] Optional mouse event type. If not given the framework tries to
	 *     match the type property of given native event.
	 * @return {MouseEvent} An event object which represents mouse events within the <code>JSG</code>
	 *     framework.
	 * @since 2.0.20.4
	 */
	createMouseEvent(ev, type) {
		type = type || MouseEvent.MouseEventType.fromEvent(ev);
		const me = MouseEvent.fromEvent(this.canvas, ev, type);
		me.cs = this.graphics.getCoordinateSystem();
		me.location.set(me.cs.deviceToLogX(me.location.x), me.cs.deviceToLogY(me.location.y));
		return me;
	}

	/**
	 * Called on global key event.</br>
	 * This will propagate the event to current InteractionHandler or to the root view if no handler was set.
	 *
	 * @method onKeyEvent
	 * @param {Event} ev The native key event.
	 * @param {KeyEvent.KeyEventType} type The key event type, i.e. either up or down.
	 */
	onKeyEvent(ev, type) {
		const keyEvent = KeyEvent.fromEvent(this.canvas, ev, type);
		keyEvent.cs = this.graphics.getCoordinateSystem();
		this._notifyKeyEvent(keyEvent);
		if (keyEvent.doRepaint) {
			this.paint();
		}
		if (keyEvent.doPreventDefault) {
			if (ev.preventDefault) {
				ev.preventDefault();
			}
		}
		return keyEvent;
	}

	/**
	 * Propagates key event to current InteractionHandler or to the root view if no handler was set.
	 *
	 * @method _notifyKeyEvent
	 * @param {KeyEvent} ev The key event.
	 * @private
	 */
	_notifyKeyEvent(ev) {
		ev.location.x = this.graphics.getCoordinateSystem().deviceToLogX(ev.location.x);
		ev.location.y = this.graphics.getCoordinateSystem().deviceToLogY(ev.location.y);

		if (this.interactionHandler) {
			this.interactionHandler.handleKeyEvent(ev);
		} else {
			this.root.handleKeyEvent(ev);
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

		this.that = undefined;
		this.root = undefined;
		this.handler = undefined;
		this.graphics = undefined;
	}
}

export default GraphicSystem;
