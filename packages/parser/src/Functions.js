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

// default function definitions...
module.exports.Functions = {
	/**
	 * Create Drawing in given cell range
	 * @param name
	 * @param range to display drawing in.
	 * @returns {string} Name if successful
	 * @constructor
	 */
	// TODO move to machineserver-core
	'DRAW.ELLIPSE': (scope, ...terms) => {
		if (scope.graphCells === undefined) {
			return OK.TRUE;
		}
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.updateGraphItem(scope, terms, 'ellipse', false) : ERROR.NOT_AVAILABLE;
	},
	'DRAW.RECTANGLE': (scope, ...terms) => {
		if (scope.graphCells === undefined) {
			return OK.TRUE;
		}
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.updateGraphItem(scope, terms, 'rectangle', false) : ERROR.NOT_AVAILABLE;
	},
	'DRAW.LABEL': (scope, ...terms) => {
		if (scope.graphCells === undefined) {
			return OK.TRUE;
		}
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.updateGraphItem(scope, terms, 'label', false) : ERROR.NOT_AVAILABLE;
	},
	'DRAW.POLYGON': (scope, ...terms) => {
		if (scope.graphCells === undefined) {
			return OK.TRUE;
		}
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.updateGraphItem(scope, terms, 'polygon', false) : ERROR.NOT_AVAILABLE;
	},
	'DRAW.BEZIER': (scope, ...terms) => {
		if (scope.graphCells === undefined) {
			return OK.TRUE;
		}
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.updateGraphItem(scope, terms, 'bezier', false) : ERROR.NOT_AVAILABLE;
	},
	'DRAW.STREAMCHART': (scope, ...terms) => {
		if (scope.graphCells === undefined) {
			return OK.TRUE;
		}
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.updateGraphItem(scope, terms, 'plot', false) : ERROR.NOT_AVAILABLE;
	},
	'DRAW.LINE': (scope, ...terms) => {
		if (scope.graphCells === undefined) {
			return OK.TRUE;
		}
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.updateGraphItem(scope, terms, 'line', false) : ERROR.NOT_AVAILABLE;
	},
	'DRAW.CHECKBOX': (scope, ...terms) => {
		if (scope.graphCells === undefined) {
			return OK.TRUE;
		}
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.updateGraphItem(scope, terms, 'checkbox', false) : ERROR.NOT_AVAILABLE;
	},
	'DRAW.BUTTON': (scope, ...terms) => {
		if (scope.graphCells === undefined) {
			return OK.TRUE;
		}
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.updateGraphItem(scope, terms, 'button', false) : ERROR.NOT_AVAILABLE;
	},
	'DRAW.SLIDER': (scope, ...terms) => {
		if (scope.graphCells === undefined) {
			return OK.TRUE;
		}
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.updateGraphItem(scope, terms, 'slider', false) : ERROR.NOT_AVAILABLE;
	},
	'DRAW.KNOB': (scope, ...terms) => {
		if (scope.graphCells === undefined) {
			return OK.TRUE;
		}
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.updateGraphItem(scope, terms, 'knob', false) : ERROR.NOT_AVAILABLE;
	},
	SERIES: () => {
		return OK.TRUE;
	},
	SERIESTIME: () => {
		return OK.TRUE;
	},
	CELLCHART: () => {
		return '';
	},
	AXIS: () => {
		return OK.TRUE;
	},
	VALUERANGE: () => {
		return OK.TRUE;
	},
	CLASSIFYPOINT: (scope, ...terms) => {
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.ptInPolygon(scope, terms) : ERROR.NOT_AVAILABLE;
	},
	/**
	 * @param linestyle
	 * @param linewidth
	 * @param linecolor
	 */
	LINEFORMAT: (scope, ...terms) => {
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.getLineFormat(terms) : ERROR.NOT_AVAILABLE;
	},
	FILLLINEARGRADIENT: (scope, ...terms) => {
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.getLinearGradientFill(terms) : ERROR.NOT_AVAILABLE;
	},
	FILLRADIALGRADIENT: (scope, ...terms) => {
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.getRadialGradientFill(terms) : ERROR.NOT_AVAILABLE;
	},
	FILLPATTERN: (scope, ...terms) => {
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.getPatternFill(terms) : ERROR.NOT_AVAILABLE;
	},
	FILLVIDEO: (scope, ...terms) => {
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.getPatternVideo(terms) : ERROR.NOT_AVAILABLE;
	},
	FONTFORMAT: (scope, ...terms) => {
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.getFontFormat(terms) : ERROR.NOT_AVAILABLE;
	},
	ATTRIBUTES: (scope, ...terms) => {
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.getAttributes(terms) : ERROR.NOT_AVAILABLE;
	},
	EVENTS: (scope, ...terms) => {
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.getEvents(terms) : ERROR.NOT_AVAILABLE;
	},
	QRCODE: (scope, ...terms) => {
		const drawings = scope.getDrawings && scope.getDrawings();
		return drawings ? drawings.getQRCode(terms) : ERROR.NOT_AVAILABLE;
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
	ONCLICK: (/* scope, ...terms */) => OK.TRUE,
	LOCALNOW: (/* scope, ...terms */) => '#[LocalDate]',
	ONDOUBLECLICK: (/* scope, ...terms */) => OK.TRUE,
	ONMOUSEDOWN: (/* scope, ...terms */) => OK.TRUE,
	ONMOUSEUP: (/* scope, ...terms */) => OK.TRUE,
	ONVALUECHANGE: (/* scope, ...terms */) => OK.TRUE,
	SHOWDIALOG: (/* scope, ...terms */) => OK.TRUE,
	'OPEN.URL': (/* scope, ...terms */) => OK.TRUE,

	IF: (scope, ...terms) => {
		if (terms.length > 1) {
			const condition = !!valueOr(terms[0].value, false);
			const onTrue = valueOr(terms[1].value, true);
			const onFalse = terms[2] ? valueOr(terms[2].value, null) : null;
			return condition ? onTrue : onFalse;
		}
		return ERROR.ARGS;
	}
};
