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
// Production steps of ECMA-262, Edition 6, 22.1.2.1
// Reference: https://people.mozilla.org/~jorendorff/es6-draft.html#sec-array.from
/* eslint-disable */
if (!Array.from) {
	Array.from = (function() {
		var toStr = Object.prototype.toString;
		var isCallable = function(fn) {
			return (
				typeof fn === 'function' ||
				toStr.call(fn) === '[object Function]'
			);
		};
		var toInteger = function(value) {
			var number = Number(value);
			if (isNaN(number)) {
				return 0;
			}
			if (number === 0 || !isFinite(number)) {
				return number;
			}
			return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
		};
		var maxSafeInteger = Math.pow(2, 53) - 1;
		var toLength = function(value) {
			var len = toInteger(value);
			return Math.min(Math.max(len, 0), maxSafeInteger);
		};

		// The length property of the from method is 1.
		return function from(arrayLike /*, mapFn, thisArg */) {
			// 1. Let C be the this value.
			var C = this;

			// 2. Let items be ToObject(arrayLike).
			var items = Object(arrayLike);

			// 3. ReturnIfAbrupt(items).
			if (arrayLike == null) {
				throw new TypeError(
					'Array.from requires an array-like object - not null or undefined'
				);
			}

			// 4. If mapfn is undefined, then let mapping be false.
			var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
			var T;
			if (typeof mapFn !== 'undefined') {
				// 5. else
				// 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
				if (!isCallable(mapFn)) {
					throw new TypeError(
						'Array.from: when provided, the second argument must be a function'
					);
				}

				// 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
				if (arguments.length > 2) {
					T = arguments[2];
				}
			}

			// 10. Let lenValue be Get(items, "length").
			// 11. Let len be ToLength(lenValue).
			var len = toLength(items.length);

			// 13. If IsConstructor(C) is true, then
			// 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
			// 14. a. Else, Let A be ArrayCreate(len).
			var A = isCallable(C) ? Object(new C(len)) : new Array(len);

			// 16. Let k be 0.
			var k = 0;
			// 17. Repeat, while k < len… (also steps a - h)
			var kValue;
			while (k < len) {
				kValue = items[k];
				if (mapFn) {
					A[k] =
						typeof T === 'undefined'
							? mapFn(kValue, k)
							: mapFn.call(T, kValue, k);
				} else {
					A[k] = kValue;
				}
				k += 1;
			}
			// 18. Let putStatus be Put(A, "length", len, true).
			A.length = len;
			// 20. Return A.
			return A;
		};
	})();
}
/* eslint-enable */

/**
 * Utility class which provides static method to handle <code>Array</code> related tasks.</br>
 * <b>Note:</b> this class can be reference via <code>Arrays</code> too.
 *
 * @class Arrays
 * @constructor
 */
class Arrays {
	/**
	 * Moves an item within an array.
	 *
	 * @method move
	 * @param {Array} array The array to move in.
	 * @param {Number} from Index to move from.
	 * @param {Number} to Index to move to.
	 * @return {Boolean} <code>true</code> if item was moved, <code>false</code> otherwise.
	 * @static
	 */
	static move(array, from, to) {
		// local variables
		let i;
		let tmp;
		// cast input parameters to integers
		from = parseInt(from, 10);
		to = parseInt(to, 10);
		// if positions are different and inside array
		if (
			from !== to &&
			from >= 0 &&
			from <= array.length &&
			to >= 0 &&
			to <= array.length
		) {
			// save element from position 1
			tmp = array[from];
			// move element down and shift other elements up
			if (from < to) {
				for (i = from; i < to; i += 1) {
					array[i] = array[i + 1];
				}
			} else {
				// move element up and shift other elements down
				for (i = from; i > to; i -= 1) {
					array[i] = array[i - 1];
				}
			} // put element from position 1 to destination
			array[to] = tmp;
			return true;
		}
		return false;
	}

	/**
	 * Adds all elements from given array to specified array.
	 *
	 * @method addAll
	 * @param {Array} array The array to add to.
	 * @param {Array} from The array to take the elements from.
	 * @return {Array} The target array.
	 * @static
	 */
	static addAll(array, from) {
		array.push(...from);
		return array;
	}

	/**
	 * Removes specified element from given array.
	 *
	 * @method remove
	 * @param {Array} array The array to remove from.
	 * @param {Object} obj The element to remove.
	 * @return {Boolean} <code>true</code> if item was removed, <code>false</code> otherwise.
	 * @static
	 */
	static remove(array, obj) {
		const index = array.indexOf(obj);
		if (index > -1) {
			array.splice(index, 1);
			return true;
		}
		return false;
	}

	/**
	 * Removes elements from given array.
	 *
	 * @method removeElements
	 * @param {Array} array The array to remove from.
	 * @param {Number} index Index to start removing.
	 * @param {Number} num Number of elements to remove.
	 * @return {Array} Remove items.
	 * @static
	 */
	static removeElements(array, index, num) {
		return array.splice(index, num);
	}

	/**
	 * Removes and returns the element at given index from specified array.
	 *
	 * @method removeAt
	 * @param {Array} array The array to remove from.
	 * @param {Number} index Index of element to be removed.
	 * @return {Object} removed element or <code>undefined</code> if none was removed
	 * @static
	 */
	static removeAt(array, index) {
		let removed;
		if (index > -1) {
			removed = array.splice(index, 1);
			if (removed !== undefined && removed.length > 0) {
				return removed[0];
			}
		}
		return undefined;
	}

	/**
	 * Removes all elements within given array.
	 *
	 * @method removeAll
	 * @param {Array} array The array to remove from.
	 * @static
	 */
	static removeAll(array) {
		array.length = 0;
	}

	/**
	 * Checks if given array contains specified element.
	 *
	 * @method contains
	 * @param {Array} array The array to check.
	 * @param {Object} obj The element to check for.
	 * @return {Boolean} <code>true</code> if given element is within array, <code>false</code> otherwise
	 * @static
	 */
	static contains(array, obj) {
		const index = array.indexOf(obj);
		return index > -1;
	}

	/**
	 * Inserts specified elements into given array starting at index.<br/>
	 * If index is less than 0 or greater than array length or not defined at all, the objects are added at array end.
	 *
	 * @example
	 *     var myArray = [0,1,2,3,4],
	 *         objArray = [obj1, obj2, obj3];
	 *
	 *     Arrays.insertAt(myArray, 2, obj1, obj2, obj3); //results in [0,1,obj1,obj2,obj3,2,3,4]
	 *     //or: Arrays.insertAt(myArray, 2, objArray);   //results in [0,1,obj1,obj2,obj3,2,3,4]
	 *
	 * @method insertAt
	 * @param {Array} array The array to insert into.
	 * @param {Number} index Array index to insert at.
	 * @param {Object | Array} elements Elements to insert.
	 * @static
	 */
	static insertAt(...args) {
		let array;
		let elements;
		let index;

		if (args.length > 2) {
			array = Array.prototype.shift.apply(args);
			index = Array.prototype.shift.apply(args);
			if (
				index < 0 ||
				index > array.length ||
				index === null ||
				index === undefined
			) {
				index = array.length;
			}
			elements = Array.isArray(args[0])
				? args[0]
				: Array.prototype.slice.call(args);
			args = [index, 0].concat(elements);
			Array.prototype.splice.apply(array, args);
		}
	}

	/**
	 * Checks if given array is empty
	 *
	 * @method isEmpty
	 * @param {Array} array The array to check.
	 * @return {Boolean} <code>true</code> if array is empty, <code>false</code> otherwise
	 * @static
	 */
	static isEmpty(array) {
		return array.length === 0;
	}

	/**
	 * Iterates through given array and calls specified function on each element. If provided
	 * function returns false the traversal is stopped.
	 *
	 * @example
	 *     Arrays.every(array, function(el) {return true;});
	 *
	 * @method every
	 * @param {Array} array The array to traverse.
	 * @param {Function} func the function to call
	 * @static
	 */
	static every(array, func) {
		let i;
		let n;

		for (i = 0, n = array.length; i < n; i += 1) {
			if (!func(array[i])) {
				break;
			}
		}
	}

	/**
	 * Ensures that the given array has the specified length. If passed array is smaller then the specified length
	 * it will be filled up using the passed <code>factoryFunc</code> function.
	 *
	 * @method keep
	 * @param {Array} array The array to manipulate.
	 * @param {Number} n The amount of elements the resulting array should have.
	 * @param {Function} factoryFunc A factory function to create new array elements if required.
	 * @static
	 */
	static keep(array, n, factoryFunc) {
		let i;
		for (i = array.length; i < n; i += 1) {
			array.push(factoryFunc.call(array));
		}
		array.length = n < 0 ? 0 : n;
	}

	/**
	 * Creates an array from given arguments.<br/>
	 * Note: if first argument is an array only this is returned as array!
	 *
	 * @example
	 *     var a = Arrays.toArray("hello", "world");
	 *
	 * @method toArray
	 * @param {Object} objects* A list of objects to use as array contents.
	 * @return {Array} A new array containing specified objects.
	 * @static
	 */
	static toArray(...args) {
		const arr = [];

		if (args.length === 1) {
			if (
				Object.prototype.toString.call(args[0]) === '[object Arguments]'
			) {
				[args] = args;
			}
			if (Array.isArray(args[0])) {
				return args[0];
			}
		}
		arr.push(...args);
		return arr;
	}

	/**
	 * Inserts empty elements into given array.
	 *
	 * @method insertEmpty
	 * @param {Array} array The array to insert elements into.
	 * @param {Number} at Index to start insert at.
	 * @param {Number} num Number of elements to insert.
	 * @param {Number} limit Max array size.
	 * @return {Boolean} <code>true</code> if elements were inserted, <code>false</code> otherwise.
	 * @static
	 */
	static insertEmpty(array, at, num, limit) {
		// local variables
		let i;
		// cast input parameters to integers
		at = parseInt(at, 10);
		num = parseInt(num, 10);
		// if positions are different and inside array
		if (limit !== undefined && array.length + num > limit) {
			return false;
		}
		if (at >= 0 && at <= array.length && num > 0) {
			for (i = array.length - 1; i >= at; i -= 1) {
				if (array[i] === undefined) {
					delete array[i + num];
				} else {
					array[i + num] = array[i];
				}
			}
			for (i = 0; i < num; i += 1) {
				delete array[i + at];
			}
			return true;
		}
		return false;
	}
}

module.exports = Arrays;
