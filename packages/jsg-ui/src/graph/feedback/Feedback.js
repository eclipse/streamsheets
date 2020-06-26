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
import { default as JSG, TextNode, GraphUtils, Event, FormatAttributes, ItemAttributes, Point } from '@cedalo/jsg-core';

/**
 * A Feedback is a visual representation for a corresponding
 * {{#crossLink "GraphItem"}}{{/crossLink}} during an interaction, like move,
 * resize and others.</br>
 * The special thing about Feedbacks is that they provide methods to influence
 * the inner state of an item as well as a <code>draw</code> method to draw itself. So feedbacks act
 * as a view and a controller. However, a Feedback is neither a Controller nor a View and has
 * therefore a module on its own.</br>
 * Typically a Feedback can be created in two different ways. First and usually the simplest way
 * to create a Feedback is via {{#crossLink
 * "ModelController/createFeedback:method"}}{{/crossLink}}. This returns a completely initialized
 * and set up Feedback instance. But in some cases the returned feedback is not quite suited, so its possible to create
 * it via its constructor too. Note: in this case the feedback item and the feedback view must be created, initialized
 * and set up manually before first usage.</br> Feedbacks are always drawn on top of a {{#crossLink
 * "GraphView"}}{{/crossLink}}, so keep in mind that the coordinate system of the Feedback view is
 * relative to the
 * {{#crossLink "Graph"}}{{/crossLink}}'s origin.</br>
 * Some calculations between interaction requires access to the primary GraphItem which can be
 * retrieved via getOriginalItem(). Please note that it is not encouraged to change the original
 * item through a Feedback instance.
 */

/**
 * The default Feedback instance.
 *
 * @class Feedback
 * @constructor
 * @param {GraphItem} fbItem Model to use for Feedback.
 * @param {GraphItemView} fbView View to use for Feedback.
 * @param {GraphItem} orgItem Model of the original controller the feedback was derived from.
 */
class Feedback {
	constructor(fbItem, fbView, orgItem) {
		this._fbItem = fbItem;
		this._fbView = fbView;
		this._orgItem = orgItem;
		this._fbItem.addEventListener(Event.ALL, this);
		// enhance fbItem...
		this._fbItem._original = orgItem;
		this._fbItem.getOriginal = () => this._fbItem._original;
	}

	/**
	 * Called after a Feedback instance was created.</br>
	 * Subclasses may overwrite to perform custom initialization.
	 *
	 * @method init
	 * @private
	 */
	init(keepFormat) {
		function hasSubItems(item) {
			const kids = item.getItems();
			return kids.length === 1 ? !(kids[0] instanceof TextNode) : kids.length > 1;
		}

		// copy doesn't copy parent (what is correct!!), so we have to set it ourself...
		this._fbItem._parent = this._orgItem.getGraph();
		// parent of feedback is the graph... orgItem.getParent();
		if (!hasSubItems(this._fbItem) && keepFormat === false) {
			// if line style is invisible we draw a solid border around fbItem by default:
			const format = this._fbItem.getFormat();
			if (format.getLineStyle().getValue() === FormatAttributes.LineStyle.NONE) {
				format.setLineStyle(FormatAttributes.LineStyle.SOLID);
			}
		}
		this._fbItem.refresh();
		this._translate(this._orgItem, this._orgItem.getGraph());

		// returns true if item has sub items other the label aka TextNode
	}

	/**
	 * Translate Feedback coordinates from one GraphItem to another. Coordinates are always relative
	 * to its parent. The translation converts coordinates relative to one GraphItem to coordinates
	 * relative to the other GraphItem
	 *
	 * @method _translate
	 * @param {GraphItem} fromItem Item to translate coordinates from.
	 * @param {GraphItem} toItem Item to translate coordinates to.
	 * @private
	 */
	_translate(fromItem, toItem) {
		if (fromItem === undefined || toItem === undefined || fromItem === toItem) {
			return;
		}
		let angle = fromItem.getAngle().getValue();
		const oldangle = angle;
		const origin = fromItem.getOrigin();
		GraphUtils.traverseItemUp(fromItem.getParent(), toItem, (item) => {
			angle += item.getAngle().getValue();
			item.translateToParent(origin);
			return true;
		});
		this._translateTo(origin, angle, oldangle);
	}

	_translateTo(newOrigin, newAngle) {
		this.setAngle(newAngle);
		this.setOriginTo(newOrigin);
	}

	/**
	 * Draw Feedback to the given graphics.
	 *
	 * @method draw
	 * @param {Graphics} graphics Graphics to use for drawing.
	 */
	draw(graphics) {
		if (this._fbView !== undefined) {
			this._fbView.draw(graphics);
		}
	}

	/**
	 * Get the associated model of the feedback.
	 *
	 * @method getItem
	 * @return {GraphItem} Item that is associated with feedback.
	 */
	getItem() {
		return this._fbItem;
	}

	/**
	 * Get the associated model of the feedback.
	 *
	 * @method getFeedbackItem
	 * @return {GraphItem} Item that is associated with feedback.
	 */
	getFeedbackItem() {
		return this._fbItem;
	}

	/**
	 * Get the associated original model that the feedback. where the item was derived from. Be careful
	 * if you intend to change properties of the original model.
	 *
	 * @method getFeedbackItem
	 * @return {GraphItem} Item that is associated with feedback.
	 */
	getOriginalItem() {
		return this._orgItem;
	}

	/**
	 * Get the associated view of the feedback.
	 *
	 * @method getFeedbackView
	 * @return {GraphItemView} View that is associated with feedback.
	 */
	getFeedbackView() {
		return this._fbView;
	}

	/**
	 * Set the associated view for the feedback.
	 *
	 * @method setFeedbackView
	 * @param {GraphItemView} View to associate with the feedback.
	 */
	setFeedbackView(view) {
		this._fbView = view;
	}

	/**
	 * Get current angle of Feedback item.
	 *
	 * @method getAngle
	 * @return {Number} Angle in radians.
	 */
	getAngle() {
		return this._fbItem.getAngle().getValue();
	}

	/**
	 * Set angle of Feedback item.
	 *
	 * @method setAngle
	 * @param {Number} Angle in radians.
	 */
	setAngle(angle) {
		this._fbItem.setAngle(angle);
	}

	/**
	 * Set the origin of the Feedback.
	 *
	 * @method setOriginTo
	 * @param {Point} point Origin to set.
	 */
	setOriginTo(point) {
		this._fbItem.setOriginTo(point);
	}

	/**
	 * Get the origin of the Feedback.
	 *
	 * @method getOrigin
	 * @return {Point} point Current Origin of Feedback.
	 */
	getOrigin(reusepoint) {
		const location = reusepoint !== undefined ? reusepoint : new Point(0, 0);
		return this._fbItem.getOrigin(location);
	}

	/**
	 * Get the item atttribute List of the model of the Feedback.
	 *
	 * @method getItemAttributes
	 * @return {ItemAttributes} Item attributes of the model.
	 */
	getItemAttributes() {
		return this._fbItem.getItemAttributes();
	}

	/**
	 * Get the format of the feedback item.
	 *
	 * @method getFormat
	 * @return {JSG.mode.attr.FormatAttributes} Format attribute list.
	 */
	getFormat() {
		return this._fbItem.getFormat();
	}

	/**
	 * Checks to see, if item is moveable.
	 *
	 * @method isMoveable
	 * @return {boolean} True, if Feedback is moveable.
	 */
	isMoveable() {
		// return this._fbItem.getItemAttributes().getMoveable().getValue();
		return this._fbItem.isMoveable();
	}

	/**
	 * Returns the setting for move direction.<br/>
	 * See {{#crossLink \"ItemAttributes.Moveable\"}}{{/crossLink}} for predefined values.
	 *
	 * @method getMoveable
	 * @return {Number} The move direction flag set to this feedback item.
	 * @since 1.6.0
	 */
	getMoveable() {
		return this._fbItem
			.getItemAttributes()
			.getMoveable()
			.getValue();
	}

	/**
	 * Set moveable flag of feedback.
	 *
	 * @method setMoveable
	 * @param {Number} movedir Flag to define move capabilities of item.
	 */
	setMoveable(movedir) {
		this._fbItem.setItemAttribute(ItemAttributes.MOVEABLE, movedir);
	}

	/**
	 * Checks to see, if item is rotatable.
	 *
	 * @method isRotatable
	 * @return {boolean} True, if Feedback is rotatable.
	 */
	isRotatable() {
		return this._fbItem
			.getItemAttributes()
			.getRotatable()
			.getValue();
	}

	/**
	 * Rotates feedback around given pin.
	 *
	 * @method rotate
	 * @param {Number} angle Angle in radians.
	 * @param {Pin} pin Pin to rotate around.
	 */
	rotate(angle, pin) {
		const fbItem = this._fbItem;
		fbItem.rotate(angle, pin);
		fbItem.refresh();
	}

	/**
	 * Get current bounding box of feedback item.
	 *
	 * @method getBoundingBox
	 * @param {BoundingBox} [reusebox] Box, that can be used for return the value.
	 * @return {BoundingBox} Current BoundingBox of item.
	 */
	getBoundingBox(reusebbox) {
		return this._fbItem.getBoundingBox(reusebbox);
	}

	initResize(selbbox) {
		// overwritten by EdgeFeedback to handle multiselection!!
	}

	resize(newselbbox) {
		// overwritten by EdgeFeedback to handle multiselection!!
	}

	updateReshapePoint(index, point) {
		const fbItem = this._fbItem;
		const coordinate = fbItem.getReshapeCoordinateAt(index);

		let xValue = Math.min(coordinate.getXMax(), point.x);
		xValue = Math.max(coordinate.getXMin(), xValue);

		let yValue = Math.min(coordinate.getYMax(), point.y);
		yValue = Math.max(coordinate.getYMin(), yValue);

		fbItem.setReshapeCoordinateAt(index, xValue, yValue);
		fbItem.refresh();
	}

	handlePreEvent(event) {}

	handlePostEvent(event) {
		// we do a simple refresh on each property change...
		if (event.source !== this._fbItem) {
			// NOTE: some events are raised by this._fbItem and needs an item#refresh()!! e.g. rotate, reshape...
			//= > those are handled (i.e. refreshed) within the corresponding method...
			this._fbItem.refresh();
		}
	}

	/**
	 * Calls layout of underlying feedback item.
	 *
	 * @method layout
	 * @since 1.6.18
	 */
	layout() {
		this._fbItem.layout();
	}
}

export default Feedback;
