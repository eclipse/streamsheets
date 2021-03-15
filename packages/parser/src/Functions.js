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
const { serialnumber } = require('@cedalo/commons');
const { ERROR, OK } = require('./ReturnCodes');


const valueOr = (value, defVal) => value == null ? defVal : value;

const isPointOnLineSegment = (point, linestart, lineend) => {
	// taken from getLinePointDistance which returns a Math.sqrt() value, which is not needed here...
	const dist = (v, wx, wy) => ((v.x - wx) * (v.x - wx)) + ((v.y - wy) * (v.y - wy));

	const getSquaredPointLineSegmentDistance = (p, v, w) => {
		let d;

		d = dist(v, w.x, w.y);
		if (d === 0) {
			d = dist(p, v.x, v.y);
		} else {
			const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / d;
			if (t < 0) {
				d = dist(p, v.x, v.y);
			} else if (t > 1) {
				d = dist(p, w.x, w.y);
			} else {
				d = dist(p, v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
			}
		}
		return d;
	};

	return getSquaredPointLineSegmentDistance(point, linestart, lineend) < 0.1;
};

/**
 * Checks whether a point lies within a polygon.
 *
 * @method isPointInPolygon
 * @param {Point}points Array of points that describe the polygon.
 * @param {Point}p Point to check for.
 * @return {Boolean}Returns true, if point lies within the polygon, else false.
 * @static
 */
const isPointInPolygon = (points, p) => {
	let p1 = points[0];
	let inside = false;
	let i;

	for (i = 1; i <= points.length; i += 1) {
		const p2 = points[i % points.length];
		// bail out early if point is on current line segment...
		if (isPointOnLineSegment(p, p1, p2)) {
			return 0;
		}
		if ((p1.y < p.y && p2.y >= p.y) || (p2.y < p.y && p1.y >= p.y)) {
			if (p1.x + (((p.y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x)) < p.x) {
				inside = !inside;
			}
		}
		p1 = p2;
	}
	return inside ? 1 : -1;
};


// default function definitions...
module.exports.Functions = {
	CLASSIFYPOINT: (scope, ...terms) => {
		const value = (cell) => {
			const val = cell && cell.value;
			return (val != null && (typeof val === 'number')) ? val : 0;
		};

		if (terms.length < 3) {
			return ERROR.ARGS;
		}

		const p = {
			x: Number(terms[0].value),
			y: Number(terms[1].value)
		};
		const pts = [];

		const range = terms[2].value;
		// must be a range...
		if (range && range.start && range.end) {
			if (range.width !== 2) {
				return ERROR.ARGS;
			}

			let pt;

			range.iterate((cell) => {
				if (pt === undefined) {
					pt = {};
				}
				if (pt.x !== undefined) {
					pt.y = value(cell);
					pts.push(pt);
					pt = undefined;
				} else {
					pt.x = value(cell);
				}
			});
		} else {
			return ERROR.ARGS;
		}

		return isPointInPolygon(pts, p);
	},
	QRCODE: (scope, ...terms) => {
		return `qrcode:${String(terms[0].value)}`;
		// return OK.TRUE;
	},
	POWER: (scope, ...terms) => {
		if (terms.length !== 2) {
			return ERROR.ARGS;
		}
		const value = Number(terms[0].value);
		const power = Number(terms[1].value);

		return value ** power;
	},
	/**
	 * Convert the given radian angle to degrees
	 *
	 * @param {Number} angle Angle to convert.
	 * @return {Number} Angle in degrees.
	 */
	DEGREES: (scope, ...terms) => {
		if (terms.length !== 1) {
			return ERROR.ARGS;
		}
		const angle = Number(terms[0].value);

		return (angle / Math.PI) * 180;
	},
	/**
	 * Convert the given degrees angle to radian
	 *
	 * @param {Number} angle Angle to convert.
	 * @return {Number} Angle in radians.
	 */
	RADIANS: (scope, ...terms) => {
		if (terms.length !== 1) {
			return ERROR.ARGS;
		}

		return (Number(terms[0].value) / 180) * Math.PI;
	},
	/**
	 * Returns Pi
	 *
	 * @return {Number} The PI constant.
	 */
	PI: () => Math.PI,
	/**
	 * Calculates the square root of the given value
	 *
	 * @param {Number} value Value to use.
	 * @return {Number} Square Root of value.
	 */
	SQRT: (scope, ...terms) => {
		if (terms.length !== 1) {
			return ERROR.ARGS;
		}
		const value = Number(terms[0].value);

		return Math.sqrt(value);
	},
	/**
	 * Retrieves time elapsed since 1.1.1900
	 *
	 * @return {Number} Number of days elapsed. Fractional part represents partial day.
	 */
	NOW: () => {
		return serialnumber.now();
	},
	YEAR: (scope, ...terms) => {
		return terms.length === 1 ? serialnumber.year(terms[0].value) : ERROR.ARGS;
	},
	MONTH: (scope, ...terms) => {
		return terms.length === 1 ? serialnumber.month(terms[0].value) : ERROR.ARGS;
	},
	DAY: (scope, ...terms) => {
		return terms.length === 1 ? serialnumber.day(terms[0].value) : ERROR.ARGS;
	},
	WEEKDAY: (scope, ...terms) => {
		return terms.length === 1 ? serialnumber.weekday(terms[0].value) : ERROR.ARGS;
	},
	HOUR: (scope, ...terms) => {
		return terms.length === 1 ? serialnumber.hours(terms[0].value) : ERROR.ARGS;
	},
	MINUTE: (scope, ...terms) => {
		return terms.length === 1 ? serialnumber.minutes(terms[0].value) : ERROR.ARGS;
	},
	SECOND: (scope, ...terms) => {
		return terms.length === 1 ? serialnumber.seconds(terms[0].value) : ERROR.ARGS;
	},
	MILLISECOND: (scope, ...terms) => {
		return terms.length === 1 ? serialnumber.milliseconds(terms[0].value) : ERROR.ARGS;
	},
	AND: (scope, ...terms) => !terms.some((term) => {
		const { value } = term;
		// ignore undefined or strings:
		return (value !== undefined && !(typeof value === 'string') && !value);
	}),
	RANDID: (scope, ...terms) => {
		if (terms.length !== 1) {
			return ERROR.ARGS;
		}

		let text = '';
		const size = terms[0].value;
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

		for (let i = 0; i < size; i += 1) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return text;
	},
	/**
	 * Evaluate random number within given interval
	 * @param minimum Minimum value to create random value from.
	 * @param maximum Maximum value to create random value from.
	 * @returns {Number} Random number between minimum and maximum value.
	 * @constructor
	 */
	RANDBETWEEN: (scope, ...terms) => {
		if (terms.length !== 2) {
			return ERROR.ARGS;
		}

		const minimum = terms[0].value;
		const maximum = terms[1].value;

		return Math.round(minimum + ((maximum - minimum) * Math.random()));
	},

	ROUND: (scope, ...terms) => {
		if (terms.length < 1) {
			return ERROR.ARGS;
		}

		const number = terms[0].value;
		const digits = terms.length > 1 ? terms[1].value : 0;
		const factor = 10 ** digits;
		return Math.round(number * factor) / factor;
	},

	LEFT: (scope, ...terms) => {
		if (terms.length > 0) {
			const text = terms[0].value.toString();
			const num = terms.length > 1 ? terms[1].value : 1;
			return text.substr(0, num);
		}
		return ERROR.ARGS;
	},

	LEN: (scope, ...terms) => (terms.length !== 1 ? ERROR.ARGS : terms[0].value.toString().length),

	LOCALNOW: (/* scope, ...terms */) => '#[LocalDate]',

	MAX: (scope, ...terms) => terms.reduce((max, curr) => {
		const val = !curr.value ? 0 : curr.value;
		return val > max ? val : max;
	}, -Number.MAX_VALUE),

	MID: (scope, ...terms) => {
		if (terms.length > 1) {
			const text = terms[0].value.toString();
			const start = terms[1].value;
			const num = terms.length > 2 ? terms[2].value : undefined;
			return text.substr(start - 1, num);
		}
		return ERROR.ARGS;
	},

	MIN: (scope, ...terms) => terms.reduce((min, curr) => (curr.value > min ? min : curr.value), Number.MAX_VALUE),

	NOT: (scope, ...terms) => (terms.length !== 1 ? ERROR.ARGS : !terms[0].value),

	OR: (scope, ...terms) => terms.some((term) => {
		const { value } = term;
		return (typeof value === 'string') || !!value;
	}),

	RIGHT: (scope, ...terms) => {
		if (terms.length > 0) {
			const text = terms[0].value.toString();
			const num = terms.length > 1 ? terms[1].value : 1;
			return text.substr(-num, num);
		}
		return ERROR.ARGS;
	},

	SEARCH: (scope, ...terms) => {
		if (terms.length > 1) {
			let searchText = terms[0].value.toString();
			let text = terms[1].value.toString();
			const startAt = terms.length > 2 ? terms[2].value - 1 : undefined;
			text = text.toUpperCase();
			searchText = searchText.toUpperCase();
			const ret = text.indexOf(searchText, startAt);
			return ret === -1 ? ERROR.VALUE : ret + 1;
		}
		return ERROR.ARGS;
	},

	SUM: (scope, ...terms) => terms.reduce((sum, curr) => (sum + curr.value), 0),

	SIN: (scope, ...terms) => (terms.length ? Math.sin(terms[0].value) : ERROR.ARGS),

	COS: (scope, ...terms) => (terms.length ? Math.cos(terms[0].value) : ERROR.ARGS),

	TAN: (scope, ...terms) => (terms.length ? Math.tan(terms[0].value) : ERROR.ARGS),

	ARCSIN: (scope, ...terms) => (terms.length ? Math.asin(terms[0].value) : ERROR.ARGS),

	ARCCOS: (scope, ...terms) => (terms.length ? Math.acos(terms[0].value) : ERROR.ARGS),

	ARCTAN: (scope, ...terms) => (terms.length ? Math.atan(terms[0].value) : ERROR.ARGS),

	ARCTAN2: (scope, ...terms) => (terms.length === 2 ? Math.atan2(terms[0].value, terms[1].value) : ERROR.ARGS),
	// for compatibility
	ATAN2: (scope, ...terms) => (terms.length === 2 ? Math.atan2(terms[0].value, terms[1].value) : ERROR.ARGS),
	ATAN: (scope, ...terms) => (terms.length ? Math.atan(terms[0].value) : ERROR.ARGS),
	ACOS: (scope, ...terms) => (terms.length ? Math.acos(terms[0].value) : ERROR.ARGS),
	ASIN: (scope, ...terms) => (terms.length ? Math.asin(terms[0].value) : ERROR.ARGS),


	IF: (scope, ...terms) => {
		if (terms.length > 1) {
			const condition = !!valueOr(terms[0].value, false);
			// eslint-disable-next-line no-nested-ternary
			return condition ? valueOr(terms[1].value, true) : terms[2] ? valueOr(terms[2].value, null) : null;
		}
		return ERROR.ARGS;
	},

	// TMP. FUNCTION DUMMIES:
	ATTRIBUTES: () => OK.TRUE,
	AXIS: () => OK.TRUE,
	CELLCHART: () => '',
	'DRAW.BEZIER': () => OK.TRUE,
	'DRAW.BUTTON': () => OK.TRUE,
	'DRAW.CHECKBOX': () => OK.TRUE,
	'DRAW.ELLIPSE': () => OK.TRUE,
	'DRAW.KNOB': () => OK.TRUE,
	'DRAW.LABEL': () => OK.TRUE,
	'DRAW.LINE': () => OK.TRUE,
	'DRAW.POLYGON': () => OK.TRUE,
	'DRAW.RECTANGLE': () => OK.TRUE,
	'DRAW.SLIDER': () => OK.TRUE,
	'DRAW.STREAMCHART': () => OK.TRUE,
	EVENTS: () => OK.TRUE,
	FILLLINEARGRADIENT: () => OK.TRUE,
	FILLRADIALGRADIENT: () => OK.TRUE,
	FILLPATTERN: () => OK.TRUE,
	FONTFORMAT: () => OK.TRUE,
	LINEFORMAT: () => OK.TRUE,
	ONCLICK: (/* scope, ...terms */) => OK.TRUE,
	ONDOUBLECLICK: (/* scope, ...terms */) => OK.TRUE,
	ONMOUSEDOWN: (/* scope, ...terms */) => OK.TRUE,
	ONMOUSEUP: (/* scope, ...terms */) => OK.TRUE,
	ONVALUECHANGE: (/* scope, ...terms */) => OK.TRUE,
	'OPEN.URL': (/* scope, ...terms */) => OK.TRUE,
	SERIES: () => OK.TRUE,
	SERIESTIME: () => OK.TRUE,
	SETVALUE: (/* scope, ...terms */) => OK.TRUE,
	SHOWDIALOG: (/* scope, ...terms */) => OK.TRUE,
	SHOWVALUES: (/* scope, ...terms */) => OK.TRUE,
	VALUERANGE: () => OK.TRUE
};
