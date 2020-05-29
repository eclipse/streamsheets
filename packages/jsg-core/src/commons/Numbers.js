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
/**
 * Utility class which provides static method to handle <code>Number</code> related tasks.</br>
 *
 * @class Numbers
 * @constructor
 */
class Numbers {
	/**
	 * Checks if value is defined, i.e. not equals <code>null</code> or <code>undefined</code>.<br/>
	 * Note: this will not check if value is a number at all. The value 0 returns <code>true</code>.
	 *
	 * @method isDefined
	 * @param {Number} value The value to check.
	 * @return {Boolean} <code>true</code> if the number value is defined or 0, <code>false</code> otherwise.
	 * @static
	 * @since 1.6.0
	 */
	static isDefined(value) {
		return value || value === 0;
	}

	/**
	 * Checks, if specified value represents a Number.
	 *
	 * @method isNumber
	 * @param {Number} value Number to validate.
	 * @return {Boolean} <code>true</code> if its a number, else <code>false</code>.
	 * @static
	 */
	static isNumber(value) {
		// ATTENTION: typeof new Number(42) === "object" !!! but new Number should never be used anyway...
		return !!((value || value === 0) && typeof value === 'number');
		// following is more correct but slower:
		// return ((value || value === 0)) && Object.prototype.toString.call(value) === "[object Number]";
	}

	/**
	 * Checks, if specified value can be converted into a Number.
	 *
	 * @method canBeNumber
	 * @param {Number} value Number to validate.
	 * @return {Boolean} <code>true</code> if can be converted into a number, <code>false</code> otherwise.
	 * @static
	 */
	static canBeNumber(value) {
		return !Number.isNaN(parseFloat(value)) && Number.isFinite(value);
	}

	/**
	 * Checks if both numbers have same sign.
	 *
	 * @method haveSameSign
	 * @param {Number} nr1 First number to validate.
	 * @param {Number} nr2 Second number to validate.
	 * @return {Boolean} <code>true</code> if both numbers have same sign, <code>false</code> otherwise.
	 * @static
	 */
	static haveSameSign(nr1, nr2) {
		// to prevent possible overflow on this * other > 0
		return nr1 < 0 === nr2 < 0;
	}

	/**
	 * Checks, if both numbers are equal or close to equal with some tolerance.
	 *
	 * @method areEqual
	 * @param {Number} nr1 First number to check.
	 * @param {Number} nr2 Second number to check.
	 * @param {Number} accuracy Tolerance value to be used for comparison.
	 * @return {Boolean} <code>true</code> if both numbers are equal, <code>false</code> otherwise.
	 * @static
	 */
	static areEqual(nr1, nr2, accuracy) {
		return accuracy === undefined
			? nr1 === nr2
			: nr2 !== undefined && Math.abs(nr1 - nr2) < accuracy;
	}

	/**
	 * Checks if specified Number is even.
	 *
	 * @method isEven
	 * @param {Number} value Number to validate.
	 * @return {Boolean} <code>true</code> if value is event, <code>false</code> otherwise.
	 * @static
	 */
	static isEven(value) {
		return value % 2 === 0;
	}

	static digitsBefore( value ) {
		let j = 0;

		while( value >= 1.0 ) {
			value /= 10.0;
			j += 1;
		}
		return j;
	}

	static digitsBehind(value) {
		let j = 0;

		while ( value <= 1.0 ) {
			value *= 10.0;
			j += 1;
		}
		return( j );
	}
	/**
	 * Formats given number
	 *
	 * @method format
	 * @param {Number} nr The number to format.
	 * @param {Number} [decPlaces=2] The number of decimal places.
	 * @param {String} [thouSeparator=.] An optional thousand marker.
	 * @param {String} [decSeparator=,] An optional decimal separator to use.
	 * @param {String} [currencySymbol=$] An optional currency symbol to use. If not given "$" is used.
	 * @return {String} The formatted number string.
	 */

	static format(nr, decPlaces, thouSeparator, decSeparator, currencySymbol) {
		decPlaces = Math.abs(decPlaces);
		decPlaces = Number.isNaN(decPlaces) ? 2 : decPlaces;
		decSeparator = decSeparator || '.';
		thouSeparator = thouSeparator || ',';
		currencySymbol = currencySymbol !== undefined ? currencySymbol : '$';

		const sign = nr < 0 ? '-' : '';
		const i =
			parseInt((nr = Math.abs(+nr || 0).toFixed(decPlaces)), 10) +
			String('');
		let j = i.length;

		j = j > 3 ? j % 3 : 0;

		return (
			sign +
			currencySymbol +
			(j ? i.substr(0, j) + thouSeparator : '') +
			i.substr(j).replace(/(\d{3})(?=\d)/g, `$1${thouSeparator}`) +
			(decPlaces
				? decSeparator +
				  Math.abs(nr - i)
						.toFixed(decPlaces)
						.slice(2)
				: '')
		);
	}
}

module.exports = Numbers;
