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
/*  global window */

import {
	default as JSG,
	Notification,
	NotificationCenter,
	Point,
} from '@cedalo/jsg-core';
import GraphViewer from './GraphViewer';
import ScrollPanel from '../ScrollPanel';
import GraphViewPanel from '../GraphViewPanel';
import MouseEvent from '../events/MouseEvent';
import Cursor from '../Cursor';

const isZoomDisabled = (graph) => {
	const viewParams = graph.getViewParams ? graph.getViewParams() : undefined;
	return viewParams && viewParams.zoomdisabled;
};

// =====================================================================================================================
// INTERNAL!! USED TO HANDLE SCROLL RELATED EVENTS FOR SCROLLABLEVIEWER!!
class Handler {
	constructor(viewer) {
		this.viewer = viewer;
		this.isPanning = false;
		this.isDragging = false;
		this.pendingUp = false;
		this.scrolltimer = undefined;
		this.panpos = new Point(0, 0);
		this.scrollpos = new Point(0, 0);
	}

	destroy(event) {
		this.reset();
	}

// resets internal state...
	reset() {
		if (this.isPanning) {
			this.isPanning = false;
			// notify one more time to signal pan stop... TODO should we use own (pan-)notifications? -> attention: we
			// get scroll notifications too!!
			NotificationCenter.getInstance().send(
				new Notification(NotificationCenter.SCROLL_NOTIFICATION,
					this.viewer.getScrollPanel()));
		}
		this.isDragging = false;
		this.pendingUp = false;
		this.stopAutoScroll();
	}

	handleKeyEvent(event, intHandler) {
		this.reset();
		return false;
	}

	handleMouseEvent(event, intHandler) {
		const TYPE = MouseEvent.MouseEventType;
		let handleIt = false;
		const rightclick = event.isClicked(MouseEvent.ButtonType.RIGHT);

		switch (event.type) {
		case TYPE.DOWN:
			this.reset();
			if (this.viewer.getScrollPanel().isScrollBarEvent(event)) {
				this.viewer.getScrollPanel().handleMouseEvent(event);
				this.isDragging = true;
				// HANDLE ONLY SCROLLBAR DRAG!! -> others may concern to context menu...
				handleIt = true;
			}
			if (rightclick) {
				const graph = this.viewer.getGraph();
				if (graph && graph.getSettings().getPanningEnabled() === true) {
					this.startPan(event);
					this.viewer.setCursor(Cursor.Style.EXECUTE);
					handleIt = true;
				}
			}
			break;
		case TYPE.MOVE:
			this.pendingUp = false;
			handleIt = this.isDragging || this.isPanning || this.viewer.getScrollPanel().isScrollBarEvent(event);
			if (rightclick) {
				this.isPanning = this.doPan(event) || this.isPanning;
				if (this.isPanning) {
					this.viewer.setCursor(Cursor.Style.EXECUTE);
				}
			} else if (this.isDragging) {
				this.viewer.getScrollPanel().handleMouseEvent(event);
			} else if (intHandler.isDragging) {
				this.startAutoScroll(event);
			}
			break;
		case TYPE.UP:
			handleIt = this.isDragging || this.isPanning;
			if (this.isDragging) {
				this.viewer.getScrollPanel().handleMouseEvent(event);
			}
			this.reset();
			this.pendingUp = handleIt;
			break;
			// case TYPE.EXIT: NOT REGISTERED!!!
		case TYPE.WHEEL:
			this.reset();
			if (event && !event.event.ctrlKey && !event.event.altKey) {
				this.viewer.getScrollPanel().handleMouseEvent(event);
				handleIt = true;
			}
			break;
		case TYPE.CONTEXT:
			// called directly after mouse up with right click!! :/
			handleIt = this.pendingUp;
			this.reset();
			break;
		}
		// if(handleIt) {
		//     event.consume();
		// }
		event.doRepaint = handleIt || event.doRepaint;
		return handleIt;
	}

	startPan(event) {
		this.panpos.set(event.event.clientX, event.event.clientY);
		this.viewer.getScrollPanel().getScrollPosition(this.scrollpos);
	}

	doPan(event) {
		const graph = this.viewer.getGraph();
		if (graph && graph.getSettings().getPanningEnabled() === false) {
			return false;
		}

		const cs = this.viewer.getCoordinateSystem();
		const panX = event.event.clientX - this.panpos.x;
		const panY = event.event.clientY - this.panpos.y;
		this.viewer.getScrollPanel().setScrollPosition(this.scrollpos.x - cs.deviceToLogX(
			panX), this.scrollpos.y - cs.deviceToLogY(panY));
		return Math.abs(panX) > 3 || Math.abs(panY) > 3;
	}

	startAutoScroll(event) {
		if (this.viewer.getScrollPanel().getScrollBarsMode() !== JSG.ScrollBarMode.HIDDEN) {
			const graph = this.viewer.getGraph();
			// var sbEvent = interaction.isScrollBarEvent();
			if (graph && graph.getSettings().getAutoScroll()) { // && !sbEvent) {
				const outside = !event.isInCanvas();
				if (this.scrolltimer === undefined && outside) {
					this.scrolltimer = setInterval(() => {
						this.autoscroll(event, this.viewer);
					}, 300);
				} else if (!outside) {
					this.stopAutoScroll();
				}
			}
		}
	}

	autoscroll(event, viewer) {
		let x;
		let y;
		const panel = viewer.getScrollPanel();

		if (event.gesture) {
			x = event.gesture.pointers[0].clientX;
			y = event.gesture.pointers[0].clientY;
		} else {
			x = event.event.clientX;
			y = event.event.clientY;
		}
		if (x <= event.canvasRect.left) {
			if (Math.abs(x - event.canvasRect.left) < 100) {
				panel.scroll(-500);
			} else {
				panel.scroll(-1500);
			}
		} else if (x >= event.canvasRect.right) {
			if (Math.abs(x - event.canvasRect.right) < 100) {
				panel.scroll(500);
			} else {
				panel.scroll(1500);
			}
		}
		if (y <= event.canvasRect.top) {
			if (Math.abs(y - event.canvasRect.top) < 100) {
				panel.scroll(0, -500);
			} else {
				panel.scroll(0, -1500);
			}
		} else if (y >= event.canvasRect.bottom) {
			if (Math.abs(y - event.canvasRect.bottom) < 100) {
				panel.scroll(0, 500);
			} else {
				panel.scroll(0, 1500);
			}
		}
		viewer.getGraphicSystem().paint();
	}

	/**
	 * Removes an eventually started scroll timer.<br/>
	 * @method stopAutoScroll
	 */
	stopAutoScroll() {
		if (this.scrolltimer) {
			window.clearInterval(this.scrolltimer);
			this.scrolltimer = undefined;
		}
	}
}

/**
 * A <code>GraphViewer</code> subclass which uses a {{#crossLink
 * "ViewPanel"}}{{/crossLink}} to show its content. This view panel is embedded within a scroll panel
 * which is either passed to the constructor function or is an instance of {{#crossLink
 * "ScrollPanel"}}{{/crossLink}} by default.</br> To detect mouse events which occur on {{#crossLink
 * "ScrollBar"}}{{/crossLink}} of a <code>ScrollPanel</code> all mouse handling methods of current
 * default {{#crossLink "Interaction"}}{{/crossLink}} are decorated by {{#crossLink
 * "ScrollableViewerInteractionDecorator"}}{{/crossLink}}.</br>
 * {{#crossLink "ScrollableViewer/layout:method"}}{{/crossLink}} should be called if the size of the
 * enclosing container or element has changed and {{#crossLink
 * "ScrollableViewer/setZoom:method"}}{{/crossLink}} can be called to zoom displayed content.</br>
 *
 * @class ScrollableViewer
 * @extends GraphViewer
 * @constructor
 * @param {GraphicSystem} graphicSystem The graphic system to use for drawing, interaction and
 *     transformation.
 * @param {ScrollPanel} [scrollPanel] An optional custom scroll panel.
 */
class ScrollableViewer extends GraphViewer {
	constructor(graphicSystem, scrollPanel) {
		super(graphicSystem);

		this._scrollPanel = scrollPanel || new ScrollPanel(this);
		this._scrollPanel.setViewPanel(new GraphViewPanel(this));
		this._scrollhandler = new Handler(this);
		// this._decorator = new ScrollableViewerInteractionDecorator(this._scrollPanel);
		// this._decorator.decorateInteraction(this.getDefaultInteraction());
	}

	// overwritten
	destroy() {
		// this._decorator.destroy();
		this._decorator = undefined;
		this._scrollPanel.destroy();
		this._scrollPanel = undefined;
		this._scrollhandler.destroy();
		this._scrollhandler = undefined;
		super.destroy();
	}

	// overwritten to decorate interaction...
	setDefaultInteraction(interaction) {
		if (this._decorator) {
			this._decorator.decorateInteraction(interaction);
		}
		super.setDefaultInteraction(interaction);
	}

	handleKeyEvent(event, intHandler) {
		return this._scrollhandler.handleKeyEvent(event, intHandler);
	}

	handleMouseEvent(event, intHandler) {
		return this._scrollhandler.handleMouseEvent(event, intHandler);
	}

	/**
	 * Call this whenever the size of the surrounding element has changed.
	 *
	 * @method layout
	 * @param {Number} width The new width to use for this viewer.
	 * @param {Number} height The new height to use for this viewer.
	 */
	layout(width, height) {
		this._scrollPanel.setBounds(0, 0, width, height);
		this._scrollPanel.layout();
	}

	// overwritten
	setContent(modelController) {
		super.setContent(modelController);
		const viewPanel = this._scrollPanel.getViewPanel();
		viewPanel.setView(super.getRootView());
		// set initial scroll position:
		const vpbounds = viewPanel.getBounds(JSG.rectCache.get());
		this._scrollPanel.setScrollPosition(vpbounds.x, vpbounds.y);
		JSG.rectCache.release(vpbounds);
	}

	// overwritten
	getRootView() {
		return this._scrollPanel;
	}

	/**
	 * Returns the internally used <code>ScrollPanel</code>.
	 *
	 * @method getScrollPanel
	 * @return {ScrollPanel} The used <code>ScrollPanel</code>.
	 */
	getScrollPanel() {
		return this._scrollPanel;
	}

	/**
	 * Checks if given event occurred on one of the internal used scrollbars.
	 *
	 * @method isScrollBarEvent
	 * @param {ClientEvent} event The current event to check.
	 * @return {Boolean} <code>true</code> if event occurred on an internal scrollbar, <code>false</code> otherwise.
	 */
	isScrollBarEvent(event) {
		return this._scrollPanel.isScrollBarEvent(event);
	}

	collectVisibleControllersAt(location, controllers) {
		const loc = JSG.ptCache.get(location.x, location.y);
		this.translateFromParent(loc);
		super.collectVisibleControllersAt(loc, controllers);
		JSG.ptCache.release(loc);
	}

// overwritten
	findControllerAt(location, flags, condition) {
		// adjust location:
		const loc = JSG.ptCache.get(location.x, location.y);
		this.translateFromParent(loc);
		const controller = super.findControllerAt(loc, flags, condition);
		JSG.ptCache.release(loc);
		return controller;
	}

// overwritten
	findControllerByConditionAndLocation(location, condition) {
		// adjust location:
		const loc = JSG.ptCache.get(location.x, location.y);
		this.translateFromParent(loc);
		const controller = super.findControllerByConditionAndLocation(loc, condition);
		JSG.ptCache.release(loc);
		return controller;
	}

// overwritten
	findControllerByConditionAndBox(box, condition) {
		return super.findControllerByConditionAndBox(box, condition);
	}

// overwritten
	translateFromParent(point) {
		this._scrollPanel.translateFromViewPort(point);
		return this.rootController.getView().translateFromParent(point);
	}

// overwritten
	translateToParent(point) {
		// changed -> calc page offset before scroll offset
		this.rootController.getView().translateToParent(point);
		return this._scrollPanel.translateToViewPort(point);
	}

	_translateToParent(point) {
		// changed -> calc page offset before scroll offset
		this.rootController.getView()._translateToParent(point);
		return this._scrollPanel.translateToViewPort(point);
	}

	translateFromRoot(point, toView) {
		this._scrollPanel.translateFromViewPort(point);
		return super.translateFromRoot(point, toView);
	}

	translateToRoot(point, fromView) {
		super.translateToRoot(point, fromView);
		return this._scrollPanel.translateToViewPort(point);
	}


	/**
	 * Sets the new zoom factor.</br>
	 * Note: this method accepts the predefined zoom factors {{#crossLink
	 * "GraphEditor/ZOOM_FIT:property"}}{{/crossLink}},
	 * {{#crossLink "GraphEditor/ZOOM_FITHORZ:property"}}{{/crossLink}}, and {{#crossLink
	 * "GraphEditor/ZOOM_FITVERT:property"}}{{/crossLink}} to perform special zoom behavior.
	 *
	 * @method setZoom
	 * @param {Number} factor The new zoom to use.
	 */
	setZoom(factor) {
		const graph = this.getGraph();
		const cs = this.getCoordinateSystem();

		if (isZoomDisabled(graph)) {
			return;
		}


		const translateToScrollPosition = (rect) => ({
			left: rect.x - 1000,
			top: rect.y - 1000,
			right: rect.getRight() + 1000,
			bottom: rect.getBottom() + 1000
		});

		const doZoom = (lfactor) => {
			const bounds = this._scrollPanel.getBounds(JSG.rectCache.get());
			const oldFactor = cs.getZoom();

			bounds.width = cs.logToDeviceX(bounds.width);
			bounds.height = cs.logToDeviceY(bounds.height);

			lfactor = Math.min(lfactor, 8);
			lfactor = Math.max(lfactor, 0.01);

			cs.setZoom(lfactor);

			// adjust scrollpos to keep center of viewport
			const visibleRect = this.getScrollPanel().getVisibleViewRect(JSG.rectCache.get());
			const scrollPos = this._scrollPanel.getScrollPosition(JSG.ptCache.get());

			const newWidth = visibleRect.width * oldFactor / lfactor;
			const newHeight = visibleRect.height * oldFactor / lfactor;

			let xPos = scrollPos.x + (visibleRect.width - newWidth) / 2;
			let yPos = scrollPos.y + (visibleRect.height - newHeight) / 2;

			if (this.hasSelection() === true) {
				// always keep selection visible during zooming
				const selRect = JSG.rectCache.get();
				this.getSelectionView().getBoundingBox().getBoundingRectangle(selRect);
				const pos = translateToScrollPosition(selRect);

				if (pos.left < xPos) {
					xPos = pos.left;
				}
				if (pos.top < yPos) {
					yPos = pos.top;
				}
				if (pos.right > xPos + newWidth) {
					xPos = pos.right - newWidth;
				}
				if (pos.bottom > yPos + newHeight) {
					yPos = pos.bottom - newHeight;
				}

				JSG.rectCache.release(selRect);
			}

			this._scrollPanel.setScrollPosition(xPos, yPos);

			this.layout(cs.deviceToLogX(bounds.width), cs.deviceToLogY(bounds.height));

			JSG.rectCache.release(bounds, visibleRect);
			JSG.ptCache.release(scrollPos);
		};

		if (factor < 0) {
			if (graph.getItemCount() === 0) {
				// does not make sense, if no item existing
				return;
			}
			const pos = translateToScrollPosition(graph.getUsedRect());
			const xfact = (cs.deviceToLogXNoZoom(
				this._graphicSystem.getCanvas().width) - 1250) / (pos.right - pos.left);
			const yfact = (cs.deviceToLogYNoZoom(
				this._graphicSystem.getCanvas().height) - 1250) / (pos.bottom - pos.top);
			switch (factor) {
			case -1: // GraphEditor.ZOOM_FIT:
				doZoom(Math.min(xfact, yfact));
				break;
			case -3: // GraphEditor.ZOOM_FITVERT:
				doZoom(yfact);
				break;
			case -2: // GraphEditor.ZOOM_FITHORZ:
				doZoom(xfact);
				break;
			}
			this._scrollPanel.setScrollPosition(pos.left, pos.top);
		} else {
			doZoom(factor);
		}

		graph.markDirty();
		if (JSG.zoomMarkChanged) {
			graph.setChanged(true);
		}

		if (this.areNotificationsEnabled()) {
			NotificationCenter.getInstance().send(
				new Notification(NotificationCenter.ZOOM_NOTIFICATION, this));
		}
	}

	/**
	 * Returns the current zoom factor.
	 *
	 * @method getZoom
	 * @return {Number} The current zoom factor.
	 */
	getZoom() {
		return this.getCoordinateSystem().getZoom();
	}
}

export default ScrollableViewer;
