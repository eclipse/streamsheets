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
import { Arrays, Numbers, default as JSG } from '@cedalo/jsg-core';

/**
 * The base model to track scrolling. Each scroll update should be performed through this class in order to inform
 * any observer. Observers can be registered and unregistered with {{#crossLink
 * "RangeModel/addObserver:method"}}{{/crossLink}} and {{#crossLink
 * "RangeModel/removeObserver:method"}}{{/crossLink}} respectively. Each registered observer must
 * implement an <code>onRangeChange(rangemodel, type)</code> method which is called with the changed range model
 * instance and one of the predefined change types.
 *
 * @class RangeModel
 * @constructor
 */
class RangeModel {
	constructor() {
		this._min = 0;
		this._max = 0;
		this._extent = 0;
		this._thumb = 0;
		this._value = 0;
		this._observers = [];
	}

	/**
	 * Adds given object to the list of observers which will be notified on RangeModel changes.</br>
	 * The observer mast implement a <code>onRangeChange</code> method.
	 *
	 * @method addObserver
	 * @param {Object} observer The observer to add.
	 */
	addObserver(observer) {
		if (!Arrays.contains(this._observers, observer)) {
			this._observers.push(observer);
		}
	}

	/**
	 * Removes given object from the observers list.
	 *
	 * @method removeObserver
	 * @param {Object} observer The observer to remove.
	 */
	removeObserver(observer) {
		Arrays.remove(this._observers, observer);
	}

	/**
	 * Notifies each registered observer about a change specified by given type.
	 *
	 * @method _notifyRangeChange
	 * @param {Number} type The change type, i.e. one of predefined change type constants.
	 * @private
	 */
	_notifyRangeChange(type) {
		this._observers.forEach((observer) => {
			observer.onRangeChange(this, type);
		});
	}

	/**
	 * Sets all given values.</br>
	 * Note: this might raises two events. One for a possible change of minimum, maximum or extent and an additional
	 * one if the value was changed too.
	 *
	 * @method setAll
	 * @param {Number} min The new range minimum.
	 * @param {Number} max The new range maximum.
	 * @param {Number} extent The new range extent.
	 * @param {Number} value The new range value.
	 */
	setAll(min, max, extent, value) {
		const changed =
			!Numbers.areEqual(this._min, min) ||
			!Numbers.areEqual(this._max, max) ||
			!Numbers.areEqual(this._extent, extent);
		if (changed) {
			this._min = min;
			this._max = max;
			this._extent = extent;
			this._notifyRangeChange(RangeModel.CHANGED_RANGE);
		}
		// adjust current value to match new range:
		if (value || value === 0) {
			this.setValue(value);
		}
	}

	/**
	 * Sets new range bounds.</br>
	 * Note: this might raises two events. One for a possible change of minimum or maximum and an additional one if
	 * the value must be changed too due to bounds change.
	 *
	 * @method setRange
	 * @param {Number} min The new range minimum.
	 * @param {Number} max The new range maximum.
	 */
	setRange(min, max) {
		const changed = !Numbers.areEqual(this._min, min) || !Numbers.areEqual(this._max, max);
		if (changed) {
			this._min = min;
			this._max = max;
			this._notifyRangeChange(RangeModel.CHANGED_RANGE);
			// adjust current value to match new range
			this.setValue(this._value);
		}
	}

	/**
	 * Returns the current range minimum.
	 *
	 * @method getMin
	 * @return {Number} The minimum bound.
	 */
	getMin() {
		return this._min;
	}

	/**
	 * Sets new range minimum.</br>
	 * Note: this might raises two events. One for a possible change of the minimum bound and an additional one if
	 * the value must be changed too due to bounds change.
	 *
	 * @method setMin
	 * @param {Number} min The new range minimum.
	 */
	setMin(min) {
		if (!Numbers.areEqual(this._min, min)) {
			this._min = min;
			this._notifyRangeChange(RangeModel.CHANGED_MIN);
			// adjust current value to match new range
			this.setValue(this._value);
		}
	}

	/**
	 * Returns the current range maximum.
	 *
	 * @method getMax
	 * @return {Number} The maximum bound.
	 */
	getMax() {
		return this._max;
	}

	/**
	 * Sets new range maximum.</br>
	 * Note: this might raises two events. One for a possible change of the maximum bound and an additional one if
	 * the value must be changed too due to bounds change.
	 *
	 * @method setMax
	 * @param {Number} max The new range maximum.
	 */
	setMax(max) {
		this._max = max;
		if (!Numbers.areEqual(this._max, max)) {
			this._max = max;
			this._notifyRangeChange(RangeModel.CHANGED_MAX);
			// adjust current value to match new range
			this.setValue(this._value);
		}
	}

	/**
	 * Returns the current range extent.
	 *
	 * @method getExtent
	 * @return {Number} The range extent.
	 */
	getExtent() {
		return this._extent;
	}

	/**
	 * Sets new range extent.</br>
	 * Note: this might raises two events. One for a possible change of the range extent and an additional one if
	 * the value must be changed too due to extent change.
	 *
	 * @method setExtent
	 * @param {Number} extent The new range extent.
	 */
	setExtent(extent) {
		if (!Numbers.areEqual(this._extent, extent)) {
			this._extent = extent;
			this._notifyRangeChange(RangeModel.CHANGED_EXTENT);
			// adjust current value to match new range
			this.setValue(this._value);
		}
	}

	/**
	 * Returns the current range value.
	 *
	 * @method getValue
	 * @return {Number} The range value.
	 */
	getValue() {
		return this._value;
	}

	/**
	 * Sets new range value.</br>
	 * Note: this might raises a value change event.
	 *
	 * @method setValue
	 * @param {Number} value The new range value.
	 */
	setValue(value) {
		// check value in range
		value = Math.max(Math.min(value, this._max - this._extent), this._min);
		if (!Numbers.areEqual(this._value, value)) {
			this._value = value;
			this._notifyRangeChange(RangeModel.CHANGED_VALUE);
		}
	}

	toString() {
		return `min:${this._min}, max:${this._max}, extent:${this._extent}, value:${this._value}`;
	}

	/**
	 * Event flag to signal change of RangeModel minimum.
	 *
	 * @property CHANGED_MIN
	 * @type {Number}
	 * @static
	 */
	static get CHANGED_MIN() {
		return 1;
	}
	/**
	 * Event flag to signal change of RangeModel maximum.
	 *
	 * @property CHANGED_MAX
	 * @type {Number}
	 * @static
	 */
	static get CHANGED_MAX() {
		return 2;
	}
	/**
	 * Event flag to signal a general change of RangeModel, i.e. at least the minimum, maximum or extent have changed.
	 *
	 * @property CHANGED_RANGE
	 * @type {Number}
	 * @static
	 */
	static get CHANGED_RANGE() {
		return 4;
	}
	/**
	 * Event flag to signal change of RangeModel extent.
	 *
	 * @property CHANGED_EXTENT
	 * @type {Number}
	 * @static
	 */
	static get CHANGED_EXTENT() {
		return 8;
	}
	/**
	 * Event flag to signal change of RangeModel value.
	 *
	 * @property CHANGED_VALUE
	 * @type {Number}
	 * @static
	 */
	static get CHANGED_VALUE() {
		return 16;
	}
}

export default RangeModel;
