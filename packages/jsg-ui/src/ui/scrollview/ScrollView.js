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
import { default as JSG, Point } from '@cedalo/jsg-core';
import Widget from '../Widget';
import ViewPort from './ViewPort';
import ScrollBar from './ScrollBar';
import RangeModel from './RangeModel';
import MouseEvent from '../events/MouseEvent';

/**
 * The scrollview module contains a set of classes to implement scrolling functionality. It includes a view, which
 * layouts the {{#crossLink "ScrollBar"}}{{/crossLink}}s and the content to scroll. A scrollbar itself
 * consists of two {{#crossLink "Arrow"}}{{/crossLink}} buttons, a so called scrollbar
 * {{#crossLink "Thumb"}}{{/crossLink}} and a scrollbar {{#crossLink
 * "Range"}}{{/crossLink}}. These classes also handle the mouse input to initiate scroll activities.
 * The glue between the scrolled content and the scrollbars is defined by a {{#crossLink "RangeModel"}}{{/crossLink}}
 * which notifies its registered observers about scroll changes.
 */

/**
 * The ScrollView contains the {{#crossLink "ScrollBar"}}{{/crossLink}}s and a
 * {{#crossLink "ViewPort"}}{{/crossLink}} to scroll its content. The content itself is displayed by
 * a {{#crossLink "ViewPanel"}}{{/crossLink}} which in turn is used by the view port. To update and
 * refresh each part all changes to the scroll position or which affects scrolling are done via the
 * {{#crossLink "RangeModel"}}{{/crossLink}}.
 *
 * @class ScrollView
 * @extends Widget
 * @constructor
 * @param {CoordinateSystem} cs The coordinate system to use for size calculations.
 */
class ScrollView extends Widget {
	constructor(cs) {
		super();

		this._cs = cs;
		this.getFormat().setFillColor(JSG.theme.graph);

		// ...and a viewport (which is last in event queue...):
		this._viewport = this.add(new ViewPort());
		this.setViewPanel(this._viewport.getViewPanel());

		// scrollbars to navigate within ViewPanel
		this._hScrollbar = this.add(new ScrollBar(false));
		this._hScrollbar.addListener(this);
		this._vScrollbar = this.add(new ScrollBar(true));
		this._vScrollbar.addListener(this);

		// connect range model:
		this._vScrollbar.setRangeModel(this._viewport.getVerticalRangeModel());
		this._hScrollbar.setRangeModel(this._viewport.getHorizontalRangeModel());

		// we register to rangemodel too, to be informed about scroll events...
		this._viewport.getVerticalRangeModel().addObserver(this);
		this._viewport.getHorizontalRangeModel().addObserver(this);
	}

	destroy() {
		// remove listeners & observers...
		this._hScrollbar.removeListener(this);
		this._vScrollbar.removeListener(this);
		this._viewport.getVerticalRangeModel().removeObserver(this);
		this._viewport.getHorizontalRangeModel().removeObserver(this);
	}

	/**
	 * Translates given point from viewport parent coordinate system down to viewport coordinate system.
	 *
	 * @method translateFromViewPort
	 * @param {Point} point The point to translate.
	 * @return {Point} The passed and now translated point.
	 */
	translateFromViewPort(point) {
		return this._viewport.translateFromParent(point);
	}

	/**
	 * Translates given point from viewport coordinate system up to viewport parent coordnate system.
	 *
	 * @method translateToViewPort
	 * @param {Point} point The point to translate.
	 * @return {Point} The passed and now translated point.
	 */
	translateToViewPort(point) {
		return this._viewport.translateToParent(point);
	}

	/**
	 * Returns the vertical Scrollbar currently used by this ScrollView.
	 *
	 * @method getVerticalScrollbar
	 * @return {ScrollBar} The currently used vertical Scrollbar.
	 * @since 1.6.0
	 */
	getVerticalScrollbar() {
		return this._vScrollbar;
	}

	/**
	 * Returns the horizontal Scrollbar currently used by this ScrollView.
	 *
	 * @method getHorizontalScrollbar
	 * @return {ScrollBar} The currently used horizontal Scrollbar.
	 * @since 1.6.0
	 */
	getHorizontalScrollbar() {
		return this._hScrollbar;
	}

	/**
	 * Returns the ViewPanel currently used by this ScrollView.
	 *
	 * @method getViewPanel
	 * @return {ViewPanel} The currently used ViewPanel.
	 */
	getViewPanel() {
		return this._viewport.getViewPanel();
	}

	/**
	 * Sets the new ViewPanel to use.
	 *
	 * @method setViewPanel
	 * @param {ViewPanel} viewpanel The new ViewPanel.
	 */
	setViewPanel(viewpanel) {
		this._viewport.setViewPanel(viewpanel);
	}

	/**
	 * Returns the ViewPort used by this ScrollView.
	 *
	 * @method getViewPort
	 * @return {ViewPort} The ViewPort of this ScrollView.
	 */
	getViewPort() {
		return this._viewport;
	}

	/**
	 * Returns the bounds of currently visible view region of inner {{#crossLink
	 * "ViewPort"}}{{/crossLink}}.
	 *
	 * @method getVisibleViewRect
	 * @param {Rectangle} [reuserect] Optional rectangle to reuse. If not given a new one will be created.
	 * @return {Rectangle} The bounds of currently visible view region.
	 * @since 1.6.43
	 */
	getVisibleViewRect(reuserect) {
		return this._viewport.getVisibleViewRect(reuserect);
	}

	// overwritten to prevent layout call...
	invalidate() {
		this.setValid(false);
	}

	// overwritten to stop propagating revalidate to parent...
	revalidate() {
		this.invalidate();
		this.validate();
	}

	validate() {
		// first validate children:
		super.validate();
		// then layout ourself:
		this.layout();
	}

	layout(prefbounds) {
		const bounds = prefbounds ? JSG.rectCache.get().setTo(prefbounds) : this.getClientArea(JSG.rectCache.get());
		// inner bounds, without scrollbars...
		const innerBounds = JSG.rectCache.get().setTo(bounds);
		const sbsize = this._cs ? this._cs.metricToLogYNoZoom(ScrollBar.SIZE) : ScrollBar.SIZE;

		innerBounds.width -= sbsize;
		innerBounds.height -= sbsize;

		this._viewport.layout();
		// first layout call to refresh viewport bounds... (fixed scrollbar visible after load...)
		const vpBounds = this._viewport.getPreferredBounds(innerBounds, JSG.rectCache.get());

		let showHSb = Math.floor(vpBounds.width) > bounds.width || vpBounds.x < bounds.x;
		let showVSb = Math.floor(vpBounds.height) > bounds.height || vpBounds.y < bounds.y;

		showHSb = showHSb || (showVSb && Math.floor(vpBounds.width) > innerBounds.width);
		showVSb = showVSb || (showHSb && Math.floor(vpBounds.height) > innerBounds.height);

		this._hScrollbar.setVisible(showHSb);
		this._vScrollbar.setVisible(showVSb);

		const tmprect = JSG.rectCache.get();

		if (this._hScrollbar.isVisible()) {
			bounds.height -= sbsize;
		}

		if (this._vScrollbar.isVisible()) {
			bounds.width -= sbsize;
		}

		this._viewport.setBoundsTo(bounds);
		this._viewport.layout();

		if (this._hScrollbar.isVisible()) {
			tmprect.setTo(bounds);
			tmprect.y += bounds.height;
			tmprect.height = sbsize;
			this._hScrollbar.setBoundsTo(tmprect);
			this._hScrollbar.layout();
		}
		if (this._vScrollbar.isVisible()) {
			tmprect.setTo(bounds);
			tmprect.x += bounds.width;
			tmprect.width = sbsize;
			this._vScrollbar.setBoundsTo(tmprect);
			this._vScrollbar.layout();
		}
		JSG.rectCache.release(bounds, innerBounds, vpBounds, tmprect);
	}

	/**
	 * Convenience method to set the display mode for both ScrollBars.<br/>
	 * This method takes two optional <code>Number</code> parameters. The first one specifies the visibility mode for
	 * the horizontal scrollbar and the second one the visibility mode of the vertical scrollbar. If no parameter is
	 * given both ScrollBars are set to <code>AUTO</code> mode and if only a single parameter is defined it determines
	 * the visibility mode of both ScrollBars.</br> Refer to {{#crossLink
	 * "JSG.ScrollBarMode"}}{{/crossLink}} too.
	 *
	 * @method setScrollBarsMode
	 * @param {Number} [...mode] Zero, one or two mode constants to specify the ScrollBars visibility.
	 */
	setScrollBarsMode(...args) {
		const modeH = args.length ? args[0] : JSG.ScrollBarMode.AUTO;
		const modeV = args.length === 2 ? args[1] : modeH;
		this._hScrollbar.setMode(modeH);
		this._vScrollbar.setMode(modeV);
	}

	getScrollBarsMode() {
		return this._hScrollbar.getMode();
	}

	/**
	 * Checks if given event happened over one of ScrollViews scrollbars.
	 *
	 * @method isScrollBarEvent
	 * @param {ClientEvent} ev The event to check.
	 * @return {Boolean} <code>true</code> event happend either of horizontal or vertical scrollbar, <code>false</code>
	 *     otherwise.
	 */
	isScrollBarEvent(ev) {
		const location = JSG.ptCache.get().setTo(ev.location);

		this.translateFromParent(location);
		const hits = this.hitsScrollBar(location);
		JSG.ptCache.release(location);
		return hits;
	}

	areScrollBarsVisible() {
		return this._hScrollbar.isVisible() || this._vScrollbar.isVisible();
	}

	/**
	 * Checks if provided location is inside one of the scrollbars. </br>
	 * The optional <code>vertical</code> parameter can be used to check only one scrollbar. I.e. if it
	 * is set to <code>true</code> only the vertical scrollbar will be tested. If it is set to
	 * <code>false</code> only the horizontal one is checked and if it is <code>undefined</code> both scrollbars
	 * are querried.
	 *
	 * @method hitsScrollBar
	 * @param {Point} location The location to check.
	 * @param {Boolean} [vertical] If set to <code>true</code> only the vertical scrollbar is check, if it is set to
	 * <code>false</code> only the horizontal one.
	 * @return {Boolean} <code>true</code> if given location is within checked scrollbars.
	 */
	hitsScrollBar(location, vertical) {
		if (vertical === true) {
			return this._hitsScrollBar(this._vScrollbar, location);
		}
		if (vertical === false) {
			return this._hitsScrollBar(this._hScrollbar, location);
		}
		// vertical not set at all:
		return this._hitsScrollBar(this._hScrollbar, location) || this._hitsScrollBar(this._vScrollbar, location);
	}

	/**
	 * Checks if given location is within the bounds of provided scrollbar.
	 *
	 * @method _hitsScrollBar
	 * @param {ScrollBar} scrollbar The scrollbar to check against.
	 * @param {Point} location    The location to check.
	 * @return {Boolean} <code>true</code> if location is inside scrollbar, <code>false</code> otherwise.
	 * @private
	 */
	_hitsScrollBar(scrollbar, location) {
		return scrollbar.isVisible() && scrollbar.contains(location.x, location.y);
	}

	/**
	 * Returns the current scroll position as point.
	 *
	 * @method getScrollPosition
	 * @param {Point} [reusepoint] A point to reuse. If not given, a new one will be created.
	 * @return {Point} The current scroll position.
	 */
	getScrollPosition(reusepoint) {
		const pos = reusepoint || new Point();
		pos.x = this._hScrollbar.getRangeModel().getValue();
		pos.y = this._vScrollbar.getRangeModel().getValue();
		return pos;
	}

	/**
	 * Sets the new scroll position to given point.
	 *
	 * @method setScrollPositionTo
	 * @param {Point} scrollpt The new scroll position.
	 */
	setScrollPositionTo(scrollpt) {
		this.setScrollPosition(scrollpt.x, scrollpt.y);
	}

	/**
	 * Sets the new scroll position to given x and y.
	 *
	 * @method setScrollPosition
	 * @param {Number} hScroll The new horizontal scroll position.
	 * @param {Number} vScroll The new vertical scroll position.
	 */
	setScrollPosition(hScroll, vScroll) {
		this.setRangeValue(this._hScrollbar.getRangeModel(), hScroll);
		this.setRangeValue(this._vScrollbar.getRangeModel(), vScroll);
	}

	/**
	 * Scrolls by the amount of given delta in horizontal and vertical direction.
	 *
	 * @method scroll
	 * @param {Number} xDelta The amount to scroll in horizontal direction.
	 * @param {Number} yDelta The amount to scroll in vertical direction.
	 */
	scroll(xDelta, yDelta) {
		let scroll;
		let rangemodel;

		if (xDelta) {
			rangemodel = this._hScrollbar.getRangeModel();
			scroll = rangemodel.getValue() + xDelta;
			this.setRangeValue(rangemodel, scroll);
		}
		if (yDelta) {
			rangemodel = this._vScrollbar.getRangeModel();
			scroll = rangemodel.getValue() + yDelta;
			this.setRangeValue(rangemodel, scroll);
		}
	}

	/**
	 * Called if internal used view panel was resized.
	 *
	 * @method onViewPanelResized
	 * @param {ViewPanel} viewpanel The ViewPanel which has resized.
	 */
	onViewPanelResized(viewpanel) {
		this._hScrollbar.layout();
		this._vScrollbar.layout();
	}

	/**
	 * Handles mouse events, i.e. passes given event to inner scrollbars.
	 *
	 * @method handleMouseEvent
	 * @param {MouseEvent} ev The mouse event.
	 */
	handleMouseEvent(ev) {
		if (this.doHandleEvent(ev) || ev.isDragging) {
			this.translateFromParent(ev.location);
		} else {
			ev.type = MouseEvent.MouseEventType.EXIT;
		}
		this._hScrollbar.handleMouseEvent(ev);
		this._vScrollbar.handleMouseEvent(ev);

		// if (ev.isConsumed) { <-- handles all, e.g. mouse wheel too. but this doesn't looks good right now...
		if (ev.type === MouseEvent.MouseEventType.UP || ev.type === MouseEvent.MouseEventType.EXIT) {
			// TODO be more specific, e.g. its raised by arrow click too...
			if (this._hScrollbar.isDragThumbFinished() || this._vScrollbar.isDragThumbFinished()) {
				this._viewport.revalidate();
			}
		}
	}

	/**
	 * Handles mouse drag events.
	 *
	 * @method handleDragEvent
	 * @param {DragEvent} ev The drag event.
	 */
	handleDragEvent(ev) {
		// container hidden -> ignore
		if (this._parent.isVisible()) {
			if (this.doHandleEvent(ev)) {
				this.translateFromParent(ev.location);
			}

			return super.handleDragEvent(ev);
		}
		return undefined;
	}

	/**
	 * Checks if given event might be handled by this scroll view.</br>
	 * Subclasses might overwrite to filter or pass any kinds of events. Default implementation simply checks for event
	 * location.
	 *
	 * @method doHandleEvent
	 * @param {ClientEvent} ev The event to check.
	 * @return {Boolean} <code>true</code> to handle event, <code>false</code> otherwise.
	 */
	doHandleEvent(ev) {
		return this._bounds.contains(ev.location.x, ev.location.y);
	}

	/**
	 * Called when the thumb of a scrollbar is dragged.
	 *
	 * @method onThumbDrag
	 * @param {ScrollBar} scrollbar The scrollbar which thumb is dragged.
	 * @param {Number} newValue The new scroll value.
	 * @param {Number} delta    The drag amount.
	 */
	onThumbDrag(scrollbar, newValue, delta) {
		this.setRangeValue(scrollbar.getRangeModel(), newValue);
	}

	/**
	 * Called when the up or left arrow button of a scrollbar was pressed.
	 *
	 * @method onUp
	 * @param {ScrollBar} scrollbar The scrollbar which button was pressed.
	 */
	onUp(scrollbar) {
		const rangemodel = scrollbar.getRangeModel();
		this.setRangeValue(rangemodel, this._stepUp(rangemodel));
	}

	/**
	 * Determines the new scroll value for a single step in up or left direction.
	 *
	 * @method _stepUp
	 * @param {RangeModel} rangemodel The range model to use for calculation.
	 * @return {Number} The new scroll value.
	 * @private
	 */
	_stepUp(rangemodel) {
		return rangemodel.getValue() - this._pageDelta(rangemodel) / 10;
	}

	/**
	 * Called when the down or right arrow button of a scrollbar was pressed.
	 *
	 * @method onDown
	 * @param {ScrollBar} scrollbar The scrollbar which button was pressed.
	 */
	onDown(scrollbar) {
		const rangemodel = scrollbar.getRangeModel();
		this.setRangeValue(rangemodel, this._stepDown(rangemodel));
	}

	/**
	 * Determines the new scroll value for a single step in down or right direction.
	 *
	 * @method _stepDown
	 * @param {RangeModel} rangemodel The range model to use for calculation.
	 * @return {Number} The new scroll value.
	 * @private
	 */
	_stepDown(rangemodel) {
		return rangemodel.getValue() + this._pageDelta(rangemodel) / 10;
	}

	/**
	 * Called on a mouse click within the up or left button and the scrollbar thumb. Signals to scroll about the amount
	 * of a single page.
	 *
	 * @method onPageUp
	 * @param {ScrollBar} scrollbar The scrollbar which was clicked.
	 */
	onPageUp(scrollbar) {
		const rangemodel = scrollbar.getRangeModel();
		this.setRangeValue(rangemodel, rangemodel.getValue() - this._pageDelta(rangemodel));
	}

	/**
	 * Called on a mouse click within the down or right button and the scrollbar thumb. Signals to scroll about the
	 * amount of a single page.
	 *
	 * @method onPageUp
	 * @param {ScrollBar} scrollbar The scrollbar which was clicked.
	 */
	onPageDown(scrollbar) {
		const rangemodel = scrollbar.getRangeModel();
		this.setRangeValue(rangemodel, rangemodel.getValue() + this._pageDelta(rangemodel));
	}

	/**
	 * Defines the scroll amount of a single page.
	 *
	 * @method _pageDelta
	 * @param {RangeModel} rangemodel The range model to use for calculation.
	 * @return {Number} The amount to scroll for a single page move.
	 * @private
	 */
	_pageDelta(rangemodel) {
		return rangemodel.getExtent() * 0.8;
	}

	/**
	 * Called to set new scroll value of the internal RangeModel.<br/>
	 * This method can be overwritten by subclasses. E.g. to extend range according to new scroll value. Default
	 * implementation simply passes new value given RangeModel.
	 *
	 * @method setRangeValue
	 * @param {RangeModel} rangemodel The RangeModel to set the value of.
	 * @param {Number} newvalue The new scroll value.
	 */
	setRangeValue(rangemodel, newvalue) {
		rangemodel.setValue(newvalue);
	}

	/**
	 * Called when one of the internal used RangeModel has changed.<br/>
	 * This method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method onRangeChange
	 * @param {RangeModel} rangemodel The RangeModel which has changed.
	 * @param {Number} type    A change type constant which is one of the predefined by RangeModel.
	 */
	onRangeChange(rangemodel, type) {}
}

export default ScrollView;
