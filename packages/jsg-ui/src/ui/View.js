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
import {
	Arrays,
	default as JSG
} from '@cedalo/jsg-core';

/**
 * Within this module you find some of the core classes to display and interact with a {{#crossLink
 * "Graph"}}{{/crossLink}} model, namely {{#crossLink "Graphics"}}{{/crossLink}},
 * {{#crossLink "GraphicSystem"}}{{/crossLink}},
 * {{#crossLink "GraphViewer"}}{{/crossLink}} and {{#crossLink
 * "ClientEvent"}}{{/crossLink}}.</br> While <code>Graphics</code> provide a simple wrapper around an
 * HTML <code>canvas</code> 2D context, to ease and support scaled drawing, the <code>GraphicSystem</code> is mainly
 * used to pass events from the browser to the framework. In doing so the browser events are converted to framework
 * events to provide additional information and to transform between browser coordinate system and the logical
 * coordinate system of the graph. This transformation is handled by the {{#crossLink
 * "CoordinateSystem"}}{{/crossLink}} class.</br> To visually represent a {{#crossLink
 * "GraphItem"}}{{/crossLink}} model a
 * {{#crossLink "GraphItemView"}}{{/crossLink}} is used. The connection between both classes is done via
 * a corresponding {{#crossLink "ModelController"}}{{/crossLink}} instance. In order to display a
 * controller or a hierarchy of controllers a subclass of {{#crossLink "ControllerViewer"}}{{/crossLink}}
 * is used, like the mentioned GraphViewer or a {{#crossLink "ScrollableViewer"}}{{/crossLink}}.</br>
 * As an example of how all these classes work together one can look at the {{#crossLink
 * "GraphEditor"}}{{/crossLink}}. The <code>GraphEditor</code> creates default instances of a
 * <code>CoordinateSystem</code>, a <code>GraphicSystem</code> and a <code>GraphViewer</code>. Only a
 * <code>canvas</code> element must be provided to visualize an arbitrary graph model.</br>
 * </br>
 * Several of the classes defined in this module send {{#crossLink
 * "Notification"}}{{/crossLink}}.s. Those are used as a sort of high level event mechanism
 * without a tight coupling between sender and receiver objects. For more information about this concept refer to the
 * {{#crossLinkModule "JSGnotifications"}}{{/crossLinkModule}} module. Classes which will send notifications
 * document this within their class documentation.</br>
 */

/**
 * A View is the base class of all visible elements within this framework. It defines generic functions to handle view
 * logic like the management of sub-views, drawing and basic handling and dispatching of events (key, mouse, drag).
 * Usually a View is sub-classed and not used on its own. E.g. a {{#crossLink
 * "GraphItemView"}}{{/crossLink}} uses a view as its base class to represent a graph item as well as a
 * {{#crossLink "Widget"}}{{/crossLink}} does to represent an UI control.</br>
 * </br>
 * If the state of a view has changed call {{#crossLink "View/invalidate:method"}}{{/crossLink}} or
 * {{#crossLink "View/revalidate:method"}}{{/crossLink}} to layout it again. To complete a view update
 * {{#crossLink "View/validate:method"}}{{/crossLink}} should be called sometimes after. If no layout is
 * required
 * in either <code>invalidate</code> or <code>validate</code> phase simply call {{#crossLink
 * "View/setValid:method"}}{{/crossLink}}. Please refer to the corresponding method documentation for more
 * information.
 *
 * @class View
 * @constructor
 */

class View {
	constructor() {
		this._subviews = [];
		this._parent = undefined;
		this._isVisible = true;
		this._resizeListeners = [];
		// maybe we should insert a flag/state ??
		this._valid = true;
	}

	/**
	 * Creates a deep copy of this view.</br>
	 * Note: deep copy means that all registered sub-views are copied too.
	 *
	 * @method copy
	 * @return {View} A copy of this view.
	 */
	copy() {
		const copy = this.newInstance();

		this._subviews.forEach((subview) => {
			const cv = subview.copy();
			copy.addView(cv);
		});
		copy._parent = this._parent;
		copy._isVisible = this._isVisible;
		return copy;
	}

	/**
	 * Creates a new view instance. This method is part of our copy pattern.
	 *
	 * @method newInstance
	 * @return {View} A new view instance.
	 */
	newInstance() {
		return new View();
	}

	/**
	 * Returns the parent view of this view.
	 *
	 * @method getParent
	 * @return {View} The parent view of this view.
	 */
	getParent() {
		return this._parent;
	}

	/**
	 * Sets a new parent view for this view.
	 *
	 * @method setParent
	 * @param {View} parent The new parent view of this view.
	 * @since 1.6.43
	 */
	setParent(parent) {
		this._parent = parent;
	}


	/**
	 * Adds a sub-view to this view at specified index.
	 *
	 * @method addView
	 * @param {View} view View to add as a sub-view.
	 * @param {Number} [index] An optional position index within in the sub-views list. If not supplied, the
	 * view will be added to the end of the list.
	 * @return {View} View, that was added.
	 */
	addView(view, index) {
		if (index >= 0) {
			Arrays.insertAt(this._subviews, index, view);
		} else {
			this._subviews.push(view);
		}
		view._parent = this;

		return view;
	}

	/**
	 * Removes given view from the sub-views list.
	 *
	 * @method removeView
	 * @param {View} view View to remove.
	 * @return {Boolean} <code>true</code> if view was removed otherwise <code>false</code>
	 */
	removeView(view) {
		return Arrays.remove(this._subviews, view);
	}

	/**
	 * Removes all registered sub-views.
	 *
	 * @method removeAllViews
	 */
	removeAllViews() {
		this._subviews = [];
	}

	/**
	 * Checks, if this view has any sub-views.
	 *
	 * @method hasSubviews
	 * @return {Boolean} <code>true</code> if this view has at least on sub-view, <code>false</code> otherwise.
	 */
	hasSubviews() {
		return this._subviews.length > 0;
	}


	/**
	 * Returns all currently registered sub-views.</br>
	 * <b>Note:</b> although this method grants direct access to inner list of sub-views it is not
	 * recommended to change this list directly.
	 *
	 * @method getSubviews
	 * @return {Array} The list of all currently added sub-views.
	 */
	getSubviews() {
		return this._subviews;
	}

	/**
	 * Returns the sub-view at given index or <code>undefined</code> if index is not valid.
	 *
	 * @method getSubViewAt
	 * @param {Number} index Index of desired sub-view.
	 * @return {View} The sub-view at index or <code>undefined</code>.
	 */
	getSubviewAt(index) {
		return (index < 0 || index > this._subviews.length) ? undefined : this._subviews[index];
	}

	/**
	 * Returns the number of sub views.
	 *
	 * @method getSubViewCount
	 * @return {Number} Number of sub views.
	 * @since 1.6.2
	 */
	getSubviewCount() {
		return this._subviews.length;
	}

	/**
	 * Invalidates this view, i.e. its valid state is set to <code>false</code>.</br>
	 * Additionally layout() is called on this view and on all of its sub-views. Note: if layout is not required it is
	 * better to call {{#crossLink "View/setValid:method"}}{{/crossLink}}.
	 *
	 * @method invalidate
	 */
	invalidate() {
		this._valid = false;

		this._subviews.forEach((subview) => {
			subview.layout();
		});
		this.layout();
	}


	/**
	 * Calls invalidate on this view and revalidates its parent if this view has one.</br>
	 * Note: if the layout step on invalidate is not required it is better to call {{#crossLink
	 * "View/setValid:method"}}{{/crossLink}}. In this case revalidation of parent must be done manually.
	 *
	 * @method revalidate
	 */
	revalidate() {
		this.invalidate();
		if (this._parent) {
			this._parent.revalidate();
		}
	}

	/**
	 * Validates this view and all of its sub-views if it is marked as invalid.</br>
	 * Note: {{#crossLink "View/relayout:method"}}{{/crossLink}} will be called. If this is not wanted it is
	 * better to call {{#crossLink "View/setValid:method"}}{{/crossLink}}. In this case the validation of
	 * registered sub-views must be done manually.
	 *
	 * @method validate
	 */
	validate() {
		if (!this.isValid()) {
			this._valid = true;
			// TODO relayout is actually a layout() but layout is currently used :(  => to be reviewed...
			this.relayout();
			this._subviews.forEach((subview) => {
				subview.validate();
			});
		}
	}

	/**
	 * In contrast to {{#crossLink "View/layout:method"}}{{/crossLink}}, which is called by
	 * {{#crossLink "View/invalidate:method"}}{{/crossLink}}, relayout is called during validation by
	 * {{#crossLink "View/validate:method"}}{{/crossLink}}.</br>
	 * Note: this method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method relayout
	 */
	relayout() {
	}

	/**
	 * Sets this view state to valid if <code>true</code> is passed, to <code>false</code> otherwise.</br>
	 * Use this method in favor of {{#crossLink "View/invalidate:method"}}{{/crossLink}} or
	 * {{#crossLink "View/revalidate:method"}}{{/crossLink}} if additional layout is not required.
	 *
	 * @method setValid
	 * @param {Boolean} doIt Specify <code>true</code> if this view is in valid state, <code>false</code> otherwise.
	 */
	setValid(doIt) {
		this._valid = (doIt === true);
	}

	/**
	 * Returns the current valid state of this view.
	 *
	 * @method isValid
	 * @return {Boolean} <code>true</code> if this view is in valid state, <code>false</code> otherwise.
	 */
	isValid() {
		return this._valid;
	}


	/**
	 * Checks if this view is visible.
	 *
	 * @method isVisible
	 * @return {Boolean} <code>true</code> if view is visible, <code>false</code> otherwise.
	 */
	isVisible() {
		return this._isVisible;
	}

	/**
	 * Sets the visible flag for this view.
	 *
	 * @method setVisible
	 * @param {Boolean} doIt Specify <code>true</code> to show view or <code>false</code> to hide it.
	 */
	setVisible(doIt) {
		this._isVisible = doIt;
	}

	/**
	 * Gets the BoundingBox of this view.</br>
	 * Note: this method must be overwritten by subclasses. The generic view does not have its own coordinates.
	 * Therefore the default implementation returns <code>undefined</code>!
	 *
	 * @method getBoundingBox
	 * @return {BoundingBox} The BoundingBox of this view.
	 */
	getBoundingBox() {
		return undefined;
	}

	/**
	 * Returns the rotation angle of this view in radiant.</br>
	 * This method can be overwritten by subclasses. Default implementation simply returns 0.
	 *
	 * @method getAngle
	 * @return {Number} Rotation angle in radiant.
	 */
	getAngle() {
		return 0;
	}

	/**
	 * Checks if given point is within this view.</br>
	 * Note: this method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>false</code>.
	 *
	 * @method containsPoint
	 * @param {Point} point Point to check for.
	 * @param {Shape.FindFlags} findFlag Find logic flag.
	 * @return {Boolean} <code>true</code> if view contains given point, <code>false</code> otherwise..
	 */
	containsPoint(point, findFlag) {
		return false;
	}

	/**
	 * Layouts this view.</br>
	 * Note: this method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method layout
	 */
	layout() {
	}

	/**
	 * Draws this view using given graphics.</br>
	 * Note: this method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method draw
	 * @param {Graphics} graphics Graphics class to use for generating output.
	 */
	draw(graphics) {
	}


	/**
	 * Draws the sub views of this view using given graphics.</br>
	 * This simply calls {{#crossLink "View/draw:method"}}{{/crossLink}} on each registered sub-view.
	 *
	 * @method drawSubViews
	 * @param {Graphics} graphics Graphics class to use for generating output.
	 */
	drawSubViews(graphics) {
		this._subviews.forEach((subview) => {
			subview.draw(graphics);
		});
	}

	/**
	 * Translates a point from the parent coordinate system.</br>
	 * Note: this method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method translateFromParent
	 * @param {Point} point Point to translate.
	 * @return {Point} Given and now translated point as convenience.
	 */
	translateFromParent(point) {
		return point;
	}

	/**
	 * Translates a point to the parent coordinate system.</br>
	 * Note: this method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method translateToParent
	 * @param {Point} point Point to translate.
	 * @return {Point} Given and now translated point as convenience.
	 */
	translateToParent(point) {
		return point;
	}

	/**
	 * Called by the system to handle mouse events.</br>
	 * Note: subclasses can overwrite this method to handle mouse events. Default implementation simply passes given
	 * event to all registered sub-views.
	 *
	 * @method handleMouseEvent
	 * @param {MouseEvent} ev Event info class.
	 */
	handleMouseEvent(ev) {
		this._subviews.forEach((subview) => {
			subview.handleMouseEvent(ev);
		});
	}

	/**
	 * Called by the system to handle drag and drop events.</br>
	 * Note: subclasses can overwrite this method to handle drag and drop events. Default implementation simply passes
	 * given event to all registered sub-views. Traversal of sub-views is stopped if event was consumed.
	 *
	 * @method handleDragEvent
	 * @param {DragEvent} ev Event info class.
	 * @return {Boolean} <code>true</code> if event is consumed by this view or <code>false</code> if not.
	 */
	handleDragEvent(ev) {
		let i;
		let n;
		let consumed = false;

		for (i = 0, n = this._subviews.length; i < n && !consumed; i += 1) {
			consumed |= this._subviews[i].handleDragEvent(ev);
		}
		return consumed;
	}

	/**
	 * Called by the system to handle key events.</br>
	 * Note: subclasses can overwrite this method to handle key events. Default implementation simply passes given event
	 * to all registered sub-views. Traversal of sub-views is stopped if event was consumed.
	 *
	 * @method handleKeyEvent
	 * @param {KeyEvent} ev Event info class.
	 * @return {Boolean} <code>true</code> if event is consumed by this view or <code>false</code> if not.
	 */
	handleKeyEvent(ev) {
		let i;
		let n;
		let consumed = false;

		for (i = 0, n = this._subviews.length; i < n && !consumed; i += 1) {
			consumed |= this._subviews[i].handleKeyEvent(ev);
		}
		return consumed;
	}

	/**
	 * Adds a resize listener to this view. The resize listener will be called, if the view is resized. A resize
	 * listener can be any class that contains a <code>onResize(view)</code> method which is called with this view as
	 * parameter.
	 *
	 * @method addResizeListener
	 * @param {Object} listener Any class that contains a <code>onResize(view)</code> method..
	 */
	addResizeListener(listener) {
		this._resizeListeners.push(listener);
	}

	/**
	 * Remove a resize listener from this view.
	 *
	 * @method removeResizeListener
	 * @param {Object} listener Class that was previously added as a resize listener.
	 */
	removeResizeListener(listener) {
		Arrays.remove(this._resizeListeners, listener);
	}

	/**
	 * Fires an <code>onResize(view)</code> event to all registered resize listeners.
	 *
	 * @method _fireOnResize
	 * @private
	 */
	_fireOnResize() {
		const self = this;
		this._resizeListeners.forEach((value, index, array) => {
			value.onResize(self);
		});
	}

	/**
	 * Gets the index position of this view within the sub-views list of its parent.</br>
	 * Note: <code>-1</code> is returned if this view has no parent or is not correctly registered to it.
	 *
	 * @method getIndex
	 * @return {Number} Position of view in parents sub view list.
	 */
	getIndex() {
		return this._parent ? this._parent._subviews.indexOf(this) : -1;
	}

	/**
	 * Moves this view within the sub-views list of its parent to specified index position.
	 *
	 * @method moveToIndex
	 * @param {Number} newIndex New position.
	 */
	moveToIndex(newIndex) {
		const index = this._parent._subviews.indexOf(this);
		Arrays.move(this._parent._subviews, index, newIndex);
	}

	/**
	 * Moves this view to the last position of the sub-views list of its parent.
	 *
	 * @method moveToTop
	 */
	moveToTop() {
		const index = this._parent._subviews.indexOf(this);
		Arrays.move(this._parent._subviews, index, this._parent._subviews.length - 1);
	}

	/**
	 * Moves this view one position up within the sub-views list of its parent.
	 *
	 * @method moveUp
	 */
	moveUp() {
		const index = this._parent._subviews.indexOf(this);
		if (index < this._parent._subviews.length - 1) {
			Arrays.move(this._parent._subviews, index, index + 1);
		}
	}

	/**
	 * Moves this view to the first position of the sub-views list of its parent.
	 *
	 * @method moveToBottom
	 */
	moveToBottom() {
		const index = this._parent._subviews.indexOf(this);
		Arrays.move(this._parent._subviews, index, 0);
	}

	/**
	 * Moves this view one position down within the sub-views list of its parent.
	 *
	 * @method moveDown
	 */
	moveDown() {
		const index = this._parent._subviews.indexOf(this);
		if (index > 0) {
			Arrays.move(this._parent._subviews, index, index - 1);
		}
	}
}

export default View;
