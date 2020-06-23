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
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const {	runFunction, values: { isNumber } } = require('../../utils');

const ERROR = FunctionErrors.code;

const ensureIsInRange = (val, min, max) => Math.min(max, Math.max(val, min));
const areAllNumbers = (...numbers) => numbers.every(isNumber);

const cmyk = {
	color: { c: 0, m: 0, y: 0, k: 0 },
	error: undefined,
	fromStr(str) {
		const colors = str.split(',').reduce((all, p, idx) => {
			// eslint-disable-next-line no-nested-ternary
			if (idx === 0) p = p.startsWith('c') ? p.substr(6) : p.startsWith('(') ? p.substr(1) : p;
			else if (idx === 3 && p.endsWith(')')) p = p.substring(0, p.length - 1);
			const nr = convert.toNumber(p);
			if (nr != null) all.push(nr);
			return all;
		}, []);
		return colors.length === 4 ? this.set(...colors) : undefined;
	},
	set(c, m, y, k) {
		this.error = this.error || (!areAllNumbers(c, m, y, k) ? ERROR.VALUE : undefined);
		if (!this.error) {
			this.color.c = ensureIsInRange(Math.round(c),0, 100);
			this.color.m = ensureIsInRange(Math.round(m),0, 100);
			this.color.y = ensureIsInRange(Math.round(y),0, 100);
			this.color.k = ensureIsInRange(Math.round(k),0, 100);
		}
		return this;
	},
	toString() {
		return `${this.color.c},${this.color.m},${this.color.y},${this.color.k}`;
	},
	hex() {
		return this.rgb().hex();
	},
	hsl() {
		return this.rgb().hsl();
	},
	hsv() {
		return this.rgb().hsv();
	},
	rgb() {
		const c = this.color.c / 100;
		const m = this.color.m / 100;
		const y = this.color.y / 100;
		const k = this.color.k / 100;
		const r = 1 - Math.min(1, c * (1 - k) + k);
		const g = 1 - Math.min(1, m * (1 - k) + k);
		const b = 1 - Math.min(1, y * (1 - k) + k);
		// eslint-disable-next-line
		return rgb.set(r * 255, g * 255, b * 255);
	}
};

const hex = {
	color: 0,
	error: undefined,
	fromStr(str) {
		str = str.startsWith('#') ? str.substr(1) : str;
		return this.set(parseInt(str, 16));
	},
	fill(str) {
		return `${'000000'.substring(str.length)}${str}`;
	},
	set(color) {
		this.error = this.error || (!isNumber(color) ? ERROR.VALUE : undefined);
		this.color = color;
		return this;
	},
	toString() {
		return this.fill(this.color.toString(16).toUpperCase());
	},
	cmyk() {
		return this.rgb().cmyk();
	},
	hsl() {
		return this.rgb().hsl();
	},
	hsv() {
		return this.rgb().hsv();
	},
	rgb() {
		const color = this.color;
		// eslint-disable-next-line
		return rgb.set((color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
	}
};

const hsl = {
	color: { h: 0, s: 0, l: 0 },
	error: undefined,
	fromStr(str) {
		const colors = str.split(',').reduce((all, p, idx) => {
			// eslint-disable-next-line no-nested-ternary
			if (idx === 0) p = p.startsWith('h') ? p.substr(4) : p.startsWith('(') ? p.substr(1) : p;
			else if (idx === 2 && p.endsWith(')')) p = p.substring(0, p.length - 1);
			const nr = convert.toNumber(p);
			if (nr != null) all.push(nr);
			return all;
		}, []);
		return colors.length === 3 ? this.set(...colors) : undefined;
	},

	set(h, s, l) {
		this.error = !areAllNumbers(h, s, l) ? ERROR.VALUE : undefined;
		if (!this.error) {
			this.color.h = ensureIsInRange(Math.round(h), 0, 360);
			this.color.s = ensureIsInRange(Math.round(s), 0, 100);
			this.color.l = ensureIsInRange(Math.round(l), 0, 100);
		}
		return this;
	},
	toString() {
		return `${this.color.h},${this.color.s},${this.color.l}`;
	},
	cmyk() {
		return this.rgb().cmyk();
	},
	hex() {
		return this.rgb().hex();
	},
	hsv() {
		return this.rgb().hsv();
	},
	_conv(h, t1, t2, pos) {
		// i=0
		let val = t1;
		let t = h + (1 / 3) * -(pos - 1);
		// eslint-disable-next-line no-nested-ternary
		t += t < 0 ? 1 : (t > 1 ? -1 : 0);

		if (6 * t < 1) val = t1 + (t2 - t1) * 6 * t;
		else if (2 * t < 1) val = t2;
		else if (3 * t < 2) val = t1 + (t2 - t1) * (2 / 3 - t) * 6;
		return val * 255;
	},
	rgb() {
		const h = this.color.h / 360;
		const s = this.color.s / 100;
		const l = this.color.l / 100;
		if (s === 0) {
			const val = l * 255;
			// eslint-disable-next-line
			return rgb.set(val, val, val);
		}

		const t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const t1 = 2 * l - t2;
		// eslint-disable-next-line
		return rgb.set(this._conv(h, t1, t2, 0), this._conv(h, t1, t2, 1), this._conv(h, t1, t2, 2))
	}
};
const hsv = {
	color: { h: 0, s: 0, v: 0 },
	error: undefined,
	fromStr(str) {
		const colors = str.split(',').reduce((all, p, idx) => {
			// eslint-disable-next-line no-nested-ternary
			if (idx === 0) p = p.startsWith('h') ? p.substr(4) : p.startsWith('(') ? p.substr(1) : p;
			else if (idx === 2 && p.endsWith(')')) p = p.substring(0, p.length - 1);
			const nr = convert.toNumber(p);
			if (nr != null) all.push(nr);
			return all;
		}, []);
		return colors.length === 3 ? this.set(...colors) : undefined;
	},
	set(h, s, v) {
		this.error = !areAllNumbers(h, s, v) ? ERROR.VALUE : undefined;
		if (!this.error) {
			this.color.h = ensureIsInRange(Math.round(h), 0, 360);
			this.color.s = ensureIsInRange(Math.round(s), 0, 100);
			this.color.v = ensureIsInRange(Math.round(v), 0, 100);
		}
		return this;
	},
	toString() {
		return `${this.color.h},${this.color.s},${this.color.v}`;
	},
	cmyk() {
		return this.rgb().cmyk();
	},
	hex() {
		return this.rgb().hex();
	},
	hsl() {
		const h = this.color.h % 360;
		const s = this.color.s / 100;
		const v = this.color.v / 100;
		const hue = (2 - s) * v;
		const sat = hue !== 0 ? (s * v) / (hue < 1 ? hue : 2 - hue) : 0;
		return hsl.set(h, sat * 100, hue/ 2 * 100);
	},
	rgb() {
		const h = this.color.h / 60;
		const s = this.color.s / 100;
		const v = 255 * this.color.v / 100;
		const hi = Math.floor(h);
		const f = h - hi;
		const p = v * (1 - s);
		const q = v * (1 - s * f);
		const t = v * (1 - s * (1 - f));
		/* eslint-disable */
		if (hi === 1) return rgb.set(q, v, p);
		if (hi === 2) return rgb.set(p, v, t);
		if (hi === 3) return rgb.set(p, q, v);
		if (hi === 4) return rgb.set(t, p, v);
		if (hi === 5) return rgb.set(v, p, q);
		// 0 & 6
		return rgb.set(v, t, p);
		/* eslint-enable */
	}
};

const rgb = {
	color: { r: 0, g: 0, b: 0 },
	error: undefined,
	fromStr(str) {
		// rgb(,,) or (,,) or ,,
		const colors = str.split(',').reduce((all, p, idx) => {
			// eslint-disable-next-line no-nested-ternary
			if (idx === 0) p = p.startsWith('r') ? p.substr(4) : p.startsWith('(') ? p.substr(1) : p;
			else if (idx === 2 && p.endsWith(')')) p = p.substring(0, p.length - 1);
			const nr = convert.toNumber(p);
			if (nr != null) all.push(nr);
			return all;
		}, []);
		return this.set(...colors);
	},
	set(r, g, b) {
		this.error = !areAllNumbers(r, g, b) ? ERROR.VALUE : undefined;
		if (!this.error) {
			this.color.r = ensureIsInRange(Math.round(r), 0, 255);
			this.color.g = ensureIsInRange(Math.round(g), 0, 255);
			this.color.b = ensureIsInRange(Math.round(b), 0, 255);
		}
		return this;
	},
	toString() {
		// which format should we use? rgb(r,g,b), (r,g,b) or simple r,g,b
		return `${this.color.r},${this.color.g},${this.color.b}`;
	},
	cmyk() {
		const red = this.color.r / 255;
		const green = this.color.g / 255;
		const blue = this.color.b / 255;
		const k = Math.min(1 - red, 1 - green, 1 - blue);
		const c = (1 - red - k) / (1 - k) || 0;
		const m = (1 - green - k) / (1 - k) || 0;
		const y = (1 - blue - k) / (1 - k) || 0;
		return cmyk.set(Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100));
	},
	hex() {
		// eslint-disable-next-line no-bitwise
		return hex.set(((this.color.r & 0xff) << 16) + ((this.color.g & 0xff) << 8) + (this.color.b & 0xff));
	},
	hsl() {
		const red = this.color.r / 255;
		const green = this.color.g / 255;
		const blue = this.color.b / 255;
		const min = Math.min(red, green, blue);
		const max = Math.max(red, green, blue);
		const delta = max - min;
		const l = (min + max) / 2;
		// eslint-disable-next-line
		let h =	max === min	? 0	: (red === max ? (green - blue) / delta : (green === max ? 2 + (blue - red) / delta : 4 + (red - green) / delta));
		h *= 60;
		if (h < 0) h += 360;
		h = Math.min(h, 360);
		// eslint-disable-next-line no-nested-ternary
		const s = max === min ? 0 : l <= 0.5 ? delta / (max + min) : delta / (2 - max - min);
		return hsl.set(Math.round(h), Math.round(s * 100), Math.round(l * 100));
	},
	_applyDelta(color, delta, val) {
		return (val - color) / 6 / delta + 1 / 2;
	},
	hsv() {
		const red = this.color.r / 255;
		const green = this.color.g / 255;
		const blue = this.color.b / 255;
		const v = Math.max(red, green, blue);
		const delta = v - Math.min(red, green, blue);
		let h = 0;
		let s = 0;

		if (delta !== 0) {
			const rdelta = this._applyDelta(red, delta, v);
			const gdelta = this._applyDelta(green, delta, v);
			const bdelta = this._applyDelta(blue, delta, v);
			s = delta / v;
			// eslint-disable-next-line
			h = red === v ? bdelta - gdelta : (green === v ? (1/3) + rdelta - bdelta : (blue === v ? (2/3) + gdelta - rdelta : 0));
			if (h < 0) h += 1;
			else if (h > 1) h -= 1;
		}
		return hsv.set(h * 360,s * 100,v * 100);
	}
};

const colors = { cmyk, hex, hsl, hsv, rgb };
const transform = {
	_color: undefined,
	_error: undefined,
	_value: 0,
	color(val) {
		this._value = val;
		this._error = undefined;
		return this;
	},
	from(color) {
		this._color = colors[color];
		if (this._color) {
			this._color = this._color.fromStr(this._value);
			this._error = this._color.error;
		} else this._error = ERROR.VALUE;	
		return this;
	},
	to(color) {
		if (!this._error) {
			const colobj = this._color[color];
			return colobj ? colobj.bind(this._color)().toString() : ERROR.VALUE;
		}
		return this._error;
	}
};

const convertcolor = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(3)
		.mapNextArg((valTerm) => convert.toString(valTerm.value, ERROR.ARGS))
		.mapNextArg((fromTerm) => convert.toString(fromTerm.value, ERROR.ARGS))
		.mapNextArg((toTerm) => convert.toString(toTerm.value, ERROR.ARGS))
		.run((value, fromColor, toColor) => {
			toColor = toColor.toLowerCase();
			fromColor = fromColor.toLowerCase();
			if (fromColor === toColor) {
				let color = colors[fromColor];
				color = color && color.fromStr(value);
				return color ? color.toString() : ERROR.INVALID_PARAM;
			}
			return transform.color(value).from(fromColor).to(toColor);
		});

module.exports = {
	'COLOR.CONVERT': convertcolor
};
