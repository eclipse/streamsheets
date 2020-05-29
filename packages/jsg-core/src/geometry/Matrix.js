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
const JSG = require('../JSG');

/**
 *  Simple 2x2 Matrix for transformation. Currently only used for rotation.
 *
 * @class Matrix
 * @constructor
 */
class Matrix {
	constructor() {
		this._rotmatrix = [1, 0, 0, 1];
		// (1,0) -> (cos, sin) & (0,1) -> (-sin, cos)
		this._isRotated = false;
	}

	/**
	 * Create a matrix from the given string. The string is parsed and the values are assign to the matrix. The
	 * values must be comma separated. Four values must be supplied (e.g.: "1,0,0,1")
	 *
	 * @method fromString
	 * @param {String} str String to parse.
	 * @return {Matrix} New Matrix with values.
	 * @static
	 */
	static fromString(str) {
		const matrix = new Matrix();
		const numbers = str.split(',');
		let i;

		for (i = 0; i < 4; i += 1) {
			matrix._rotmatrix[i] = Number(numbers[i]);
		}
		return matrix;
	}

	hasRotation() {
		return this._isRotated;
	}

	/**
	 * Checks whether another Matrix is equal to this one.
	 *
	 * @method isEqualTo
	 * @param {Matrix} other Matrix to compare with.
	 * @param {Number} [accuracy] The tolerance for comparison. If not given an accuracy of 0.001 is used.
	 * @return {Boolean} True, if matrices are equal.
	 */
	isEqualTo(other, accuracy) {
		let equal = true;
		let i;

		accuracy = accuracy === undefined ? 0.001 : accuracy;
		// accuracy not used yet
		for (i = 0; i < 4 && equal; i += 1) {
			equal =
				Math.abs(this._rotmatrix[i] - other._rotmatrix[i]) <= accuracy;
		}
		return equal;
	}

	/**
	 * Copy the matrix.
	 *
	 * @method copy
	 * @return {Matrix} A new allocated copy of this matrix.
	 */
	copy() {
		const copy = new Matrix();
		copy.setTo(this);
		return copy;
	}

	/**
	 * Get the angle defined in this matrix in radians.
	 *
	 * @method getAngle
	 * @return {Number} Angle.
	 */
	getAngle() {
		if (!this._isRotated) {
			return 0;
		}

		return Math.atan2(this._rotmatrix[1], this._rotmatrix[0]);
	}

	/**
	 * Rotate the matrix by the given angle.
	 *
	 * @method rotate
	 * @param {Number} angle Angle to rotate the matrix by.
	 */
	rotate(angle) {
		// check, if nothing to do
		if (
			this._rotmatrix[0] === 1 &&
			this._rotmatrix[1] === 0 &&
			this._rotmatrix[2] === 0 &&
			this._rotmatrix[3] === 1 &&
			!angle
		) {
			return;
		}

		const sin = Math.sin(angle);
		const cos = Math.cos(angle);

		function rotateColumn(col) {
			const x = col.x * cos - col.y * sin;
			const y = col.x * sin + col.y * cos;
			col.set(x, y);
		}

		// this._rotmatrix = [1,0,0,1]; //(1,0) -> (cos, sin) & (0,1) -> (-sin, cos)
		const col1 = JSG.ptCache.get(this._rotmatrix[0], this._rotmatrix[1]);
		rotateColumn(col1);
		this._rotmatrix[0] = col1.x;
		this._rotmatrix[1] = col1.y;

		const col2 = JSG.ptCache.get(this._rotmatrix[2], this._rotmatrix[3]);
		rotateColumn(col2);
		this._rotmatrix[2] = col2.x;
		this._rotmatrix[3] = col2.y;

		this._isRotated = !(
			this._rotmatrix[0] === 1 &&
			this._rotmatrix[1] === 0 &&
			this._rotmatrix[2] === 0 &&
			this._rotmatrix[3] === 1
		);
		JSG.ptCache.release(col1, col2);
	}

	/**
	 * Rotate a given point using the matrix definition.
	 *
	 * @method rotatePoint
	 * @param {Point} point Point to be rotated.
	 * @return {Point} Result point
	 */
	rotatePoint(point) {
		if (this._isRotated) {
			const { x, y } = point;
			point.x = this._rotmatrix[0] * x + this._rotmatrix[2] * y;
			point.y = this._rotmatrix[1] * x + this._rotmatrix[3] * y;
		}
		return point;
	}

	/**
	 * Rotate a given point using the matrix definition in negative direction.
	 *
	 * @method rotatePointInverse
	 * @param {Point} point Point to be rotated.
	 * @return {Point} Result point
	 */
	rotatePointInverse(point) {
		if (this._isRotated) {
			const { x, y } = point;
			point.x = this._rotmatrix[0] * x + this._rotmatrix[1] * y;
			point.y = this._rotmatrix[2] * x + this._rotmatrix[3] * y;
		}
		return point;
	}

	/**
	 * Assign a new angle in radians to the matrix definition.
	 *
	 * @method setAngle
	 * @param {Nummber} angle New angle to assign.
	 */
	setAngle(angle) {
		this.setToIdentity();
		if (angle) {
			this.rotate(angle);
		}
	}

	/**
	 * Resets this matrix so that it equals the identity matrix.
	 *
	 * @method setToIdentity
	 */
	setToIdentity() {
		this._rotmatrix[0] = 1;
		this._rotmatrix[1] = 0;
		this._rotmatrix[2] = 0;
		this._rotmatrix[3] = 1;
		this._isRotated = false;
	}

	/**
	 * Assign the values of another matrix to this matrix.
	 *
	 * @method setTo
	 * @param {Matrix} matrix Matrix to retrieve values from.
	 */
	setTo(matrix) {
		this._rotmatrix = matrix._rotmatrix.slice(0);
		this._isRotated = matrix._isRotated;
	}

	/**
	 * Return a string representation of the matrix.
	 *
	 * @method toString
	 * @return {String} Matrix content as String separated by commas.
	 */
	toString() {
		return this._rotmatrix.toString();
	}
}

module.exports = Matrix;
