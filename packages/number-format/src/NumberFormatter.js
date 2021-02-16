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
/* eslint-disable no-bitwise */
/*
	Apache SheetJS
	Copyright [2013-present] The Apache Software Foundation

	ssf.js (C) 2013-present SheetJS -- http://sheetjs.com

	This product includes software developed at
	The Apache Software Foundation (http://www.apache.org/).
*/
const { serialnumber: { time2seconds } } = require('@cedalo/commons');
const Localizer = require('./Localizer');


const NumberFormatter = class NumberFormatter {
	// Sets culture to localize strings for every
	// formatting call.
	static setCulture(culture) {
		Localizer.init(culture);
		const daysOfWeek = Localizer.getDaysOfWeek();
		// eslint-disable-next-line
		SSF.setDays(daysOfWeek);
		const monthsOfYear = Localizer.getMonthsOfYear();
		// eslint-disable-next-line
		SSF.setMonths(monthsOfYear);
	}

	static getCulture() {
		return Localizer.getCulture();
	}

	static getDecimalSeparator() {
		return Localizer.getDecimalSeparator(this.getCulture());
	}

	static getThousandSeparator() {
		return Localizer.getThousandSeparator(this.getCulture());
	}

	// Transforms number value by applying format.
	// Also, sets culture to localize string for single
	// formatting call.
	static formatNumber(fmt, number, type, culture) {
		// sets specified culture exclusively for this formatting
		const replacedCulture = this.getCulture();
		if (culture && culture !== replacedCulture) {
			this.setCulture(culture);
		}

		// formatting
		const opts = {};
		// eslint-disable-next-line
		let result = SSF.format(fmt, number, opts);
		if (type !== 'date' && type !== 'time') {
			result = Localizer.getLocalizedNumber(result);
		}

		const resultObj = { formattedValue: result, value: number, color: null };
		if (opts.output) {
			if (opts.output.color) {
				resultObj.color = opts.output.color;
			}
		}

		// resets culture to previous one
		if (replacedCulture && replacedCulture !== this.getCulture()) {
			this.setCulture(replacedCulture);
		}
		return resultObj;
	}

	static isNumberFormat(fmt) {
		if (fmt) {
			const regexDecimalFmt = /([0-9]*\.[0-9]+)/;
			if (fmt.indexOf('#') !== -1 || fmt.match(regexDecimalFmt)) {
				return true;
			}
		}
		return false;
	}
};

module.exports = NumberFormatter;

/* jshint -W041 */
const SSF = {};

function _strrev(x /* :string */) /* :string */ {
	let o = '';
	let i = x.length - 1;
	while (i >= 0) {
		o += x.charAt(i);
		i -= 1;
	}
	return o;
}
function fill(c /* :string */, l /* :number */) /* :string */ {
	let o = '';
	while (o.length < l) o += c;
	return o;
}
function pad0(v /* :any */, d /* :number */) /* :string */ {
	const t = `${v}`;
	return t.length >= d ? t : fill('0', d - t.length) + t;
}
function pad_(v /* :any */, d /* :number */) /* :string */ {
	const t = `${v}`;
	return t.length >= d ? t : fill(' ', d - t.length) + t;
}
function rpad_(v /* :any */, d /* :number */) /* :string */ {
	const t = `${v}`;
	return t.length >= d ? t : t + fill(' ', d - t.length);
}
function pad0r1(v /* :any */, d /* :number */) /* :string */ {
	const t = `${Math.round(v)}`;
	return t.length >= d ? t : fill('0', d - t.length) + t;
}
function pad0r2(v /* :any */, d /* :number */) /* :string */ {
	const t = `${v}`;
	return t.length >= d ? t : fill('0', d - t.length) + t;
}

const p2Exp32 = 2 ** 32;
function pad0r(v /* :any */, d /* :number */) /* :string */ {
	if (v > p2Exp32 || v < -p2Exp32) return pad0r1(v, d);
	const i = Math.round(v);
	return pad0r2(i, d);
}

function isgeneral(s /* :string */, i /* :?number */) /* :boolean */ {
	i = i || 0;
	return (
		s.length >= 7 + i &&
		(s.charCodeAt(i) | 32) === 103 && // eslint-disable-line no-bitwise
		(s.charCodeAt(i + 1) | 32) === 101 && // eslint-disable-line no-bitwise
		(s.charCodeAt(i + 2) | 32) === 110 && // eslint-disable-line no-bitwise
		(s.charCodeAt(i + 3) | 32) === 101 && // eslint-disable-line no-bitwise
		(s.charCodeAt(i + 4) | 32) === 114 && // eslint-disable-line no-bitwise
		(s.charCodeAt(i + 5) | 32) === 97 && // eslint-disable-line no-bitwise
		(s.charCodeAt(i + 6) | 32) === 108
	);
}
/* ::
type SSF_write_num = {(type:string, fmt:string, val:number):string};
*/
let days /* :Array<Array<string>> */ = [
	['Sun', 'Sunday'],
	['Mon', 'Monday'],
	['Tue', 'Tuesday'],
	['Wed', 'Wednesday'],
	['Thu', 'Thursday'],
	['Fri', 'Friday'],
	['Sat', 'Saturday']
];
let months /* :Array<Array<string>> */ = [
	['J', 'Jan', 'January'],
	['F', 'Feb', 'February'],
	['M', 'Mar', 'March'],
	['A', 'Apr', 'April'],
	['M', 'May', 'May'],
	['J', 'Jun', 'June'],
	['J', 'Jul', 'July'],
	['A', 'Aug', 'August'],
	['S', 'Sep', 'September'],
	['O', 'Oct', 'October'],
	['N', 'Nov', 'November'],
	['D', 'Dec', 'December']
];

function setDays(daysOfWeek) {
	days = daysOfWeek;
}
SSF.setDays = setDays;

function setMonths(monthsOfYear) {
	months = monthsOfYear;
}
SSF.setMonths = setMonths;

function initTable(t /* :any */) {
	t[0] = 'General';
	t[1] = '0';
	t[2] = '0.00';
	t[3] = '#,##0';
	t[4] = '#,##0.00';
	t[9] = '0%';
	t[10] = '0.00%';
	t[11] = '0.00E+00';
	t[12] = '# ?/?';
	t[13] = '# ??/??';
	t[14] = 'm/d/yy';
	t[15] = 'd-mmm-yy';
	t[16] = 'd-mmm';
	t[17] = 'mmm-yy';
	t[18] = 'h:mm AM/PM';
	t[19] = 'h:mm:ss AM/PM';
	t[20] = 'h:mm';
	t[21] = 'h:mm:ss';
	t[22] = 'm/d/yy h:mm';
	t[37] = '#,##0 ;(#,##0)';
	t[38] = '#,##0 ;[Red](#,##0)';
	t[39] = '#,##0.00;(#,##0.00)';
	t[40] = '#,##0.00;[Red](#,##0.00)';
	t[45] = 'mm:ss';
	t[46] = '[h]:mm:ss';
	t[47] = 'mmss.0';
	t[48] = '##0.0E+0';
	t[49] = '@';
	t[56] = '"上午/下午 "hh"時"mm"分"ss"秒 "';
	t[65535] = 'General';
}

const colors = {
	'[Black]': '#000000',
	'[Blue]': '#0000ff',
	'[Cyan]': '#00ffff',
	'[Green]': '#00ff00',
	'[Magenta]': '#ff00ff',
	'[Red]': '#ff0000',
	'[White]': '#ffffff',
	'[Yellow]': '#ffff00'
};

function _getColor(colorKey) {
	const color = colors[colorKey];
	if (color) {
		return color;
	}
	return null;
}

const tableFmt = {};
initTable(tableFmt);
function frac(x /* :number */, D /* :number */, mixed /* :?boolean */) /* :Array<number> */ {
	const sgn = x < 0 ? -1 : 1;
	let B = x * sgn;
	let P_2 = 0;
	let P_1 = 1;
	let P = 0;
	let Q_2 = 1;
	let Q_1 = 0;
	let Q = 0;
	let A = Math.floor(B);
	while (Q_1 < D) {
		A = Math.floor(B);
		P = A * P_1 + P_2;
		Q = A * Q_1 + Q_2;
		if (B - A < 0.00000005) break;
		B = 1 / (B - A);
		P_2 = P_1;
		P_1 = P;
		Q_2 = Q_1;
		Q_1 = Q;
	}
	if (Q > D) {
		if (Q_1 > D) {
			Q = Q_2;
			P = P_2;
		} else {
			Q = Q_1;
			P = P_1;
		}
	}
	if (!mixed) return [0, sgn * P, Q];
	const q = Math.floor((sgn * P) / Q);
	return [q, sgn * P - q * Q, Q];
}
function fixHijri(/* ::date, o */) {
	return 0;
}

function parseDateCode(v /* :number */, opts /* :?any */, b2 /* :?boolean */) {
	if (v > 2958465 || v < 0) return null;
	let date = v | 0; // eslint-disable-line no-bitwise
	// let time = Math.floor(86400 * (v - date + 0.0000001));
	let time = time2seconds(v);
	let dow = 0;
	let dout = [];
	const out = {
		D: date,
		T: time,
		u: 86400 * (v - date) - time,
		y: 0,
		m: 0,
		d: 0,
		H: 0,
		M: 0,
		S: 0,
		q: 0
	};
	if (Math.abs(out.u) < 1e-6) out.u = 0;
	if (opts && opts.date1904) date += 1462;
	if (out.u > 0.9999) {
		out.u = 0;
		time += 1;
		if (time === 86400) {
			out.T = 0;
			time = 0;
			date += 1;
			out.D += 1;
		}
	}
	if (date === 60) {
		dout = b2 ? [1317, 10, 29] : [1900, 2, 29];
		dow = 3;
	} else if (date === 0) {
		dout = b2 ? [1317, 8, 29] : [1900, 1, 0];
		dow = 6;
	} else {
		if (date > 60) date -= 1;
		/* 1 = Jan 1 1900 in Gregorian */
		const d = new Date(1900, 0, 1);
		d.setDate(d.getDate() + date - 1);
		dout = [d.getFullYear(), d.getMonth() + 1, d.getDate()];
		dow = d.getDay();
		if (date < 60) dow = (dow + 6) % 7;
		if (b2) dow = fixHijri(/* d, dout */);
	}
	out.y = dout[0];
	out.m = dout[1];
	out.d = dout[2];
	out.S = time % 60;
	time = Math.floor(time / 60);
	out.M = time % 60;
	time = Math.floor(time / 60) % 24;
	out.H = time;
	out.q = dow;
	return out;
}
SSF.parse_date_code = parseDateCode;
const basedate = new Date(1899, 11, 31, 0, 0, 0);
const dnthresh = basedate.getTime();
const base1904 = new Date(1900, 2, 1, 0, 0, 0);
function datenumLocal(v /* :Date */, date1904 /* :?boolean */) /* :number */ {
	let epoch = v.getTime();
	if (date1904) epoch -= 1461 * 24 * 60 * 60 * 1000;
	else if (v >= base1904) epoch += 24 * 60 * 60 * 1000;
	return (
		(epoch - (dnthresh + (v.getTimezoneOffset() - basedate.getTimezoneOffset()) * 60000)) / (24 * 60 * 60 * 1000)
	);
}
function generalFmtInt(v /* :number */) /* :string */ {
	return v.toString(10);
}
SSF._general_int = generalFmtInt;
const generalFmtNum = (() => {
	const gnr1 = /\.(\d*[1-9])0+$/;
	const gnr2 = /\.0*$/;
	const gnr4 = /\.(\d*[1-9])0+/;
	const gnr5 = /\.0*[Ee]/;
	const gnr6 = /(E[+-])(\d)$/;
	function gfn5(o) {
		return o.indexOf('.') > -1 ? o.replace(gnr2, '').replace(gnr1, '.$1') : o;
	}
	function gfn2(v) {
		const w = v < 0 ? 12 : 11;
		let o = gfn5(v.toFixed(12));
		if (o.length <= w) return o;
		o = v.toPrecision(10);
		if (o.length <= w) return o;
		return v.toExponential(5);
	}
	function gfn3(v) {
		let o = v.toFixed(11).replace(gnr1, '.$1');
		if (o.length > (v < 0 ? 12 : 11)) o = v.toPrecision(6);
		return o;
	}
	function gfn4(o) {
		for (let i = 0; i !== o.length; i += 1) {
			if ((o.charCodeAt(i) | 0x20) === 101) {
				// eslint-disable-line no-bitwise
				return o
					.replace(gnr4, '.$1')
					.replace(gnr5, 'E')
					.replace('e', 'E')
					.replace(gnr6, '$10$2');
			}
		}
		return o;
	}
	return function generalFmtNumRet(v /* :number */) /* :string */ {
		const V = Math.floor(Math.log(Math.abs(v)) * Math.LOG10E);
		let o;
		if (V >= -4 && V <= -1) o = v.toPrecision(10 + V);
		else if (Math.abs(V) <= 9) o = gfn2(v);
		else if (V === 10) o = v.toFixed(10).substr(0, 12);
		else o = gfn3(v);
		return gfn5(gfn4(o));
	};
})();
SSF._general_num = generalFmtNum;

function generalFmt(v /* :any */, opts /* :any */) {
	switch (typeof v) {
		case 'string':
			return v;
		case 'boolean':
			return v ? 'TRUE' : 'FALSE';
		case 'number':
			return (v | 0) === v ? generalFmtInt(v) : generalFmtNum(v); // eslint-disable-line no-bitwise
		case 'undefined':
			return '';
		case 'object':
			if (v == null) return '';
			if (v instanceof Date) {
				return format(14, datenumLocal(v, opts && opts.date1904), opts); // eslint-disable-line no-use-before-define
			}
			break;
		default:
			throw new Error(`unsupported value in General format: ${v}`);
	}
	throw new Error(`unsupported value in General format: ${v}`);
}
SSF._general = generalFmt;
/* jshint -W086 */
function writeDate(type /* :number */, fmt /* :string */, val, ss0 /* :?number */) /* :string */ {
	let o = '';
	let ss = 0;
	let tt = 0;
	let { y } = val;
	let out;
	let outl = 0;
	switch (type) {
		case 98 /* 'b' buddhist year */:
			y = val.y + 543;
		/* falls through */
		case 121 /* 'y' year */:
			switch (fmt.length) {
				case 1:
				case 2:
					out = y % 100;
					outl = 2;
					break;
				default:
					out = y % 10000;
					outl = 4;
					break;
			}
			break;
		case 109 /* 'm' month */:
			switch (fmt.length) {
				case 1:
				case 2:
					out = val.m;
					outl = fmt.length;
					break;
				case 3:
					return months[val.m - 1][1];
				case 5:
					return months[val.m - 1][0];
				default:
					return months[val.m - 1][2];
			}
			break;
		case 100 /* 'd' day */:
			switch (fmt.length) {
				case 1:
				case 2:
					out = val.d;
					outl = fmt.length;
					break;
				case 3:
					return days[val.q][0];
				default:
					return days[val.q][1];
			}
			break;
		case 104 /* 'h' 12-hour */:
			switch (fmt.length) {
				case 1:
				case 2:
					out = 1 + ((val.H + 11) % 12);
					outl = fmt.length;
					break;
				default:
					throw new Error(`bad hour format: ${fmt}`);
			}
			break;
		case 72 /* 'H' 24-hour */:
			switch (fmt.length) {
				case 1:
				case 2:
					out = val.H;
					outl = fmt.length;
					break;
				default:
					throw new Error(`bad hour format: ${fmt}`);
			}
			break;
		case 77 /* 'M' minutes */:
			switch (fmt.length) {
				case 1:
				case 2:
					out = val.M;
					outl = fmt.length;
					break;
				default:
					throw new Error(`bad minute format: ${fmt}`);
			}
			break;
		case 115 /* 's' seconds */:
			if (fmt !== 's' && fmt !== 'ss' && fmt !== '.0' && fmt !== '.00' && fmt !== '.000') {
				throw new Error(`bad second format: ${fmt}`);
			}
			if (val.u === 0 && (fmt === 's' || fmt === 'ss')) return pad0(val.S, fmt.length);
			/* ::if(!ss0) ss0 = 0; */
			if (ss0 >= 2) tt = ss0 === 3 ? 1000 : 100;
			else tt = ss0 === 1 ? 10 : 1;
			ss = Math.round(tt * (val.S + val.u));
			if (ss >= 60 * tt) ss = 0;
			if (fmt === 's') return ss === 0 ? '0' : `${ss / tt}`;
			o = pad0(ss, 2 + ss0);
			if (fmt === 'ss') return o.substr(0, 2);
			return `.${o.substr(2, fmt.length - 1)}`;
		case 90 /* 'Z' absolute time */:
			switch (fmt) {
				case '[h]':
				case '[hh]':
					out = val.D * 24 + val.H;
					break;
				case '[m]':
				case '[mm]':
					out = (val.D * 24 + val.H) * 60 + val.M;
					break;
				case '[s]':
				case '[ss]':
					out = ((val.D * 24 + val.H) * 60 + val.M) * 60 + Math.round(val.S + val.u);
					break;
				default:
					throw new Error(`bad abstime format: ${fmt}`);
			}
			outl = fmt.length === 3 ? 1 : 2;
			break;
		case 101 /* 'e' era */:
			out = y;
			outl = 1;
			break;
		default:
			if (outl > 0) {
				return pad0(out, outl);
			}
			return '';
	}
	if (outl > 0) {
		return pad0(out, outl);
	}
	return '';
}
/* jshint +W086 */
function commaify(s /* :string */) /* :string */ {
	const w = 3;
	if (s.length <= w) return s;
	let j = s.length % w;
	let o = s.substr(0, j);
	// const thSep = NumberFormatter.getThousandSeparator();
	for (; j !== s.length; j += w) o += (o.length > 0 ? ',' : '') + s.substr(j, w);
	return o;
}
const writeNum /* :SSF_write_num */ = (() => {
	const pct1 = /%/g;
	function writeNumPct(type /* :string */, fmt /* :string */, val /* :number */) /* :string */ {
		const sfmt = fmt.replace(pct1, '');
		const mul = fmt.length - sfmt.length;
		return writeNum(type, sfmt, val * 10 ** (2 * mul)) + fill('%', mul);
	}
	function writeNumCm(type /* :string */, fmt /* :string */, val /* :number */) /* :string */ {
		let idx = fmt.length - 1;
		while (fmt.charCodeAt(idx - 1) === 44) idx -= 1;
		return writeNum(type, fmt.substr(0, idx), val / 10 ** (3 * (fmt.length - idx)));
	}
	function writeNumExp(fmt /* :string */, val /* :number */) /* :string */ {
		let o; /* :string */
		const idx = fmt.indexOf('E') - fmt.indexOf('.') - 1;
		if (fmt.match(/^#+0.0E\+0$/)) {
			if (val === 0) return '0.0E+0';
			if (val < 0) return `-.${writeNumExp(fmt, -val)}`;
			let period = fmt.indexOf('.');
			if (period === -1) period = fmt.indexOf('E');
			let ee = Math.floor(Math.log(val) * Math.LOG10E) % period;
			if (ee < 0) ee += period;
			o = (val / 10 ** ee).toPrecision(idx + 1 + ((period + ee) % period));
			if (o.indexOf('e') === -1) {
				const fakee = Math.floor(Math.log(val) * Math.LOG10E);
				if (o.indexOf('.') === -1) o = `${o.charAt(0)}.${o.substr(1)}E+${fakee - (o.length + ee)}`;
				else o += `E+${fakee - ee}`;
				while (o.substr(0, 2) === '0.') {
					o = `${o.charAt(0)}${o.substr(2, period)}.${o.substr(2 + period)}`;
					o = o.replace(/^0+([1-9])/, '$1').replace(/^0+\./, '0.');
				}
				o = o.replace(/\+-/, '-');
			}
			const callback = function m($$, $1, $2, $3) {
				return `${$1}${$2}${$3.substr(0, (period + ee) % period)}.${$3.substr(ee)}E`;
			};
			o = o.replace(/^([+-]?)(\d*)\.(\d*)[Ee]/, callback);
		} else o = val.toExponential(idx);
		if (fmt.match(/E\+00$/) && o.match(/e[+-]\d$/)) o = `${o.substr(0, o.length - 1)}0${o.charAt(o.length - 1)}`;
		if (fmt.match(/E-/) && o.match(/e\+/)) o = o.replace(/e\+/, 'e');
		return o.replace('e', 'E');
	}
	const frac1 = /# (\?+)( ?)\/( ?)(\d+)/;
	function writeNumF1(r /* :Array<string> */, aval /* :number */, sign /* :string */) /* :string */ {
		const den = parseInt(r[4], 10);
		const rr = Math.round(aval * den);
		const base = Math.floor(rr / den);
		const myn = rr - base * den;
		const myd = den;
		const firstPart = sign + (base === 0 ? '' : `${base}`);
		const secondPart =
			myn === 0
				? fill(' ', r[1].length + 1 + r[4].length)
				: `${pad_(myn, r[1].length) + r[2]}/${r[3] + pad0(myd, r[4].length)}`;
		return `${firstPart} ${secondPart}`;
	}
	function writeNumF2(r /* :Array<string> */, aval /* :number */, sign /* :string */) /* :string */ {
		return sign + (aval === 0 ? '' : `${aval}`) + fill(' ', r[1].length + 2 + r[4].length);
	}
	const dec1 = /^#*0*\.([0#]+)/;
	const closeparen = /\).*[0#]/;
	const phone = /\(###\) ###\\?-####/;
	function hashq(str /* :string */) /* :string */ {
		let o = '';
		let cc;
		for (let i = 0; i !== str.length; i += 1) {
			switch ((cc = str.charCodeAt(i))) {
				case 35:
					break;
				case 63:
					o += ' ';
					break;
				case 48:
					o += '0';
					break;
				default:
					o += String.fromCharCode(cc);
			}
		}
		return o;
	}
	function rnd(val /* :number */, d /* :number */) /* :string */ {
		const dd = 10 ** d;
		return `${Math.round(val * dd) / dd}`;
	}
	function dec(val /* :number */, d /* :number */) /* :number */ {
		if (d < `${Math.round((val - Math.floor(val)) * 10 ** d)}`.length) {
			return 0;
		}
		return Math.round((val - Math.floor(val)) * 10 ** d);
	}
	function carry(val /* :number */, d /* :number */) /* :number */ {
		if (d < `${Math.round((val - Math.floor(val)) * 10 ** d)}`.length) {
			return 1;
		}
		return 0;
	}
	function flr(val /* :number */) /* :string */ {
		if (val < 2147483647 && val > -2147483648) {
			return `${val >= 0 ? val | 0 : (val - 1) | 0}`; // eslint-disable-line no-bitwise
		}
		return `${Math.floor(val)}`;
	}
	function writeNumFlt(type /* :string */, fmt /* :string */, val /* :number */) /* :string */ {
		if (type.charCodeAt(0) === 40 && !fmt.match(closeparen)) {
			const ffmt = fmt
				.replace(/\( */, '')
				.replace(/ \)/, '')
				.replace(/\)/, '');
			if (val >= 0) return writeNumFlt('n', ffmt, val);
			return `(${writeNumFlt('n', ffmt, -val)})`;
		}
		if (fmt.charCodeAt(fmt.length - 1) === 44) return writeNumCm(type, fmt, val);
		if (fmt.indexOf('%') !== -1) return writeNumPct(type, fmt, val);
		if (fmt.indexOf('E') !== -1) return writeNumExp(fmt, val);
		if (fmt.charCodeAt(0) === 36) return `$${writeNumFlt(type, fmt.substr(fmt.charAt(1) === ' ' ? 2 : 1), val)}`;
		let o;
		let r; /* :?Array<string> */
		let ri;
		let ff;
		const aval = Math.abs(val);
		const sign = val < 0 ? '-' : '';
		if (fmt.match(/^00+$/)) return sign + pad0r(aval, fmt.length);
		if (fmt.match(/^[#?]+$/)) {
			o = pad0r(val, 0);
			if (o === '0') o = '';
			return o.length > fmt.length ? o : hashq(fmt.substr(0, fmt.length - o.length)) + o;
		}
		r = fmt.match(frac1);
		if (r) return writeNumF1(r, aval, sign);
		if (fmt.match(/^#+0+$/)) return sign + pad0r(aval, fmt.length - fmt.indexOf('0'));
		r = fmt.match(dec1);
		if (r) {
			const callback = function m($$, $1) {
				return `.${$1}${fill('0', hashq(r[1]).length - $1.length)}`;
			};
			o = rnd(val, r[1].length)
				.replace(/^([^.]+)$/, `$1.${hashq(r[1])}`)
				.replace(/\.$/, `.${hashq(r[1])}`)
				.replace(/\.(\d*)$/, callback);
			return fmt.indexOf('0.') !== -1 ? o : o.replace(/^0\./, '.');
		}
		fmt = fmt.replace(/^#+([0.])/, '$1');
		r = fmt.match(/^(0*)\.(#*)$/);
		if (r) {
			return (
				sign +
				rnd(aval, r[2].length)
					.replace(/\.(\d*[1-9])0*$/, '.$1')
					.replace(/^(-?\d*)$/, '$1.')
					.replace(/^0\./, r[1].length ? '0.' : '.')
			);
		}
		r = fmt.match(/^#{1,3},##0(\.?)$/);
		if (r) return sign + commaify(pad0r(aval, 0));
		r = fmt.match(/^#,##0\.([#0]*0)$/);
		if (r) {
			const commaifyArg = `${Math.floor(val) + carry(val, r[1].length)}`;
			// const commaSep = NumberFormatter.getDecimalSeparator();
			const pos = `${commaify(commaifyArg)}.${pad0(dec(val, r[1].length), r[1].length)}`;
			return val < 0 ? `-${writeNumFlt(type, fmt, -val)}` : pos;
		}
		r = fmt.match(/^#,#*,#0/);
		if (r) return writeNumFlt(type, fmt.replace(/^#,#*,/, ''), val);
		r = fmt.match(/^([0#]+)(\\?-([0#]+))+$/);
		if (r) {
			o = _strrev(writeNumFlt(type, fmt.replace(/[\\-]/g, ''), val));
			ri = 0;
			const callback = function m(x) {
				if (ri < o.length) {
					const char = o.charAt(ri);
					ri += 1;
					return char;
				}
				return x === '0' ? '0' : '';
			};
			return _strrev(_strrev(fmt.replace(/\\/g, '')).replace(/[0#]/g, callback));
		}
		if (fmt.match(phone)) {
			o = writeNumFlt(type, '##########', val);
			return `(${o.substr(0, 3)}) ${o.substr(3, 3)}-${o.substr(6)}`;
		}
		let oa = '';
		r = fmt.match(/^([#0?]+)( ?)\/( ?)([#0?]+)/);
		if (r) {
			ri = Math.min(r[4].length, 7);
			ff = frac(aval, 10 ** ri - 1, false);
			o = `${sign}`;
			oa = writeNum('n', r[1], ff[1]);
			if (oa.charAt(oa.length - 1) === ' ') oa = `${oa.substr(0, oa.length - 1)}0`;
			o += `${oa}${r[2]}/${r[3]}`;
			oa = rpad_(ff[2], ri);
			if (oa.length < r[4].length) oa = hashq(r[4].substr(r[4].length - oa.length)) + oa;
			o += oa;
			return o;
		}
		r = fmt.match(/^# ([#0?]+)( ?)\/( ?)([#0?]+)/);
		if (r) {
			ri = Math.min(Math.max(r[1].length, r[4].length), 7);
			ff = frac(aval, 10 ** ri - 1, true);
			const firstPart = `${sign}${ff[0] || (ff[1] ? '' : '0')}`; // + ' ' +
			const secondPart = ff[1]
				? `${pad_(ff[1], ri)}${r[2]}/${r[3]}${rpad_(ff[2], ri)}`
				: fill(' ', 2 * ri + 1 + r[2].length + r[3].length);
			return `${firstPart} ${secondPart}`;
		}
		r = fmt.match(/^[#0?]+$/);
		if (r) {
			o = pad0r(val, 0);
			if (fmt.length <= o.length) return o;
			return hashq(fmt.substr(0, fmt.length - o.length)) + o;
		}
		r = fmt.match(/^([#0?]+)\.([#0]+)$/);
		if (r) {
			o = `${val.toFixed(Math.min(r[2].length, 10)).replace(/([^0])0+$/, '$1')}`;
			ri = o.indexOf('.');
			const lres = fmt.indexOf('.') - ri;
			const rres = fmt.length - o.length - lres;
			return hashq(fmt.substr(0, lres) + o + fmt.substr(fmt.length - rres));
		}
		r = fmt.match(/^00,000\.([#0]*0)$/);
		if (r) {
			ri = dec(val, r[1].length);
			const callback = function m($$) {
				return `00,${$$.length < 3 ? pad0(0, 3 - $$.length) : ''}${$$}`;
			};
			const pos = commaify(flr(val))
				.replace(/^\d,\d{3}$/, '0$&')
				.replace(/^\d*$/, callback);
			return val < 0 ? `-${writeNumFlt(type, fmt, -val)}` : `${pos}.${pad0(ri, r[1].length)}`;
		}
		switch (fmt) {
			case '###,##0.00':
				return writeNumFlt(type, '#,##0.00', val);
			case '###,###':
			case '##,###':
			case '#,###': {
				const x = commaify(pad0r(aval, 0));
				return x !== '0' ? sign + x : '';
			}
			case '###,###.00':
				return writeNumFlt(type, '###,##0.00', val).replace(/^0\./, '.');
			case '#,###.00':
				return writeNumFlt(type, '#,##0.00', val).replace(/^0\./, '.');
			default:
		}
		throw new Error(`unsupported format | ${fmt} |`);
	}
	function writeNumCm2(type /* :string */, fmt /* :string */, val /* :number */) /* :string */ {
		let idx = fmt.length - 1;
		while (fmt.charCodeAt(idx - 1) === 44) idx -= 1;
		return writeNum(type, fmt.substr(0, idx), val / 10 ** (3 * (fmt.length - idx)));
	}
	function writeNumPct2(type /* :string */, fmt /* :string */, val /* :number */) /* :string */ {
		const sfmt = fmt.replace(pct1, '');
		const mul = fmt.length - sfmt.length;
		return writeNum(type, sfmt, val * 10 ** (2 * mul)) + fill('%', mul);
	}
	function writeNumExp2(fmt /* :string */, val /* :number */) /* :string */ {
		let o; /* :string */
		const idx = fmt.indexOf('E') - fmt.indexOf('.') - 1;
		if (fmt.match(/^#+0.0E\+0$/)) {
			if (val === 0) return '0.0E+0';
			if (val < 0) return `-${writeNumExp2(fmt, -val)}`;
			let period = fmt.indexOf('.');
			if (period === -1) period = fmt.indexOf('E');
			let ee = Math.floor(Math.log(val) * Math.LOG10E) % period;
			if (ee < 0) ee += period;
			o = (val / 10 ** ee).toPrecision(idx + 1 + ((period + ee) % period));
			if (!o.match(/[Ee]/)) {
				const fakee = Math.floor(Math.log(val) * Math.LOG10E);
				if (o.indexOf('.') === -1) o = `${o.charAt(0)}.${o.substr(1)}E+${fakee - o.length + ee}`;
				else o += `E+${fakee - ee}`;
				o = o.replace(/\+-/, '-');
			}
			const callback = function m($$, $1, $2, $3) {
				return `${$1}${$2}${$3.substr(0, (period + ee) % period)}.${$3.substr(ee)}E`;
			};
			o = o.replace(/^([+-]?)(\d*)\.(\d*)[Ee]/, callback);
		} else o = val.toExponential(idx);
		if (fmt.match(/E\+00$/) && o.match(/e[+-]\d$/)) o = `${o.substr(0, o.length - 1)}0${o.charAt(o.length - 1)}`;
		if (fmt.match(/E-/) && o.match(/e\+/)) o = o.replace(/e\+/, 'e');
		return o.replace('e', 'E');
	}
	function writeNumInt(type /* :string */, fmt /* :string */, val /* :number */) /* :string */ {
		if (type.charCodeAt(0) === 40 && !fmt.match(closeparen)) {
			const ffmt = fmt
				.replace(/\( */, '')
				.replace(/ \)/, '')
				.replace(/\)/, '');
			if (val >= 0) return writeNumInt('n', ffmt, val);
			return `(${writeNumInt('n', ffmt, -val)})`;
		}
		if (fmt.charCodeAt(fmt.length - 1) === 44) return writeNumCm2(type, fmt, val);
		if (fmt.indexOf('%') !== -1) return writeNumPct2(type, fmt, val);
		if (fmt.indexOf('E') !== -1) return writeNumExp2(fmt, val);
		if (fmt.charCodeAt(0) === 36) return `$${writeNumInt(type, fmt.substr(fmt.charAt(1) === ' ' ? 2 : 1), val)}`;
		let o;
		let r; /* :?Array<string> */
		let ri;
		let ff;
		const aval = Math.abs(val);
		const sign = val < 0 ? '-' : '';
		if (fmt.match(/^00+$/)) return sign + pad0(aval, fmt.length);
		if (fmt.match(/^[#?]+$/)) {
			o = `${val}`;
			if (val === 0) o = '';
			return o.length > fmt.length ? o : hashq(fmt.substr(0, fmt.length - o.length)) + o;
		}
		r = fmt.match(frac1);
		if (r) return writeNumF2(r, aval, sign);
		if (fmt.match(/^#+0+$/)) return sign + pad0(aval, fmt.length - fmt.indexOf('0'));
		r = fmt.match(dec1);
		if (r) {
			/* :: if(!Array.isArray(r)) throw new Error("unreachable"); */
			o = `${val}`.replace(/^([^.]+)$/, `$1.${hashq(r[1])}`).replace(/\.$/, `.${hashq(r[1])}`);
			const callback = function m($$, $1) {
				/* :: if(!Array.isArray(r)) throw new Error("unreachable"); */
				return `.${$1}${fill('0', hashq(r[1]).length - $1.length)}`;
			};
			o = o.replace(/\.(\d*)$/, callback);
			return fmt.indexOf('0.') !== -1 ? o : o.replace(/^0\./, '.');
		}
		fmt = fmt.replace(/^#+([0.])/, '$1');
		r = fmt.match(/^(0*)\.(#*)$/);
		if (r) {
			return (
				sign +
				`${aval}`
					.replace(/\.(\d*[1-9])0*$/, '.$1')
					.replace(/^(-?\d*)$/, '$1.')
					.replace(/^0\./, r[1].length ? '0.' : '.')
			);
		}
		r = fmt.match(/^#{1,3},##0(\.?)$/);
		if (r) return sign + commaify(`${aval}`);
		r = fmt.match(/^#,##0\.([#0]*0)$/);
		if (r) {
			const commaifyResult = commaify(`${val}`);
			return val < 0 ? `-${writeNumInt(type, fmt, -val)}` : `${commaifyResult}.${fill('0', r[1].length)}`;
		}
		r = fmt.match(/^#,#*,#0/);
		if (r) return writeNumInt(type, fmt.replace(/^#,#*,/, ''), val);
		r = fmt.match(/^([0#]+)(\\?-([0#]+))+$/);
		if (r) {
			o = _strrev(writeNumInt(type, fmt.replace(/[\\-]/g, ''), val));
			ri = 0;
			const callback = function m(x) {
				if (ri < o.length) {
					const char = o.charAt(ri);
					ri += 1;
					return char;
				}
				return x === '0' ? '0' : '';
			};
			return _strrev(_strrev(fmt.replace(/\\/g, '')).replace(/[0#]/g, callback));
		}
		if (fmt.match(phone)) {
			o = writeNumInt(type, '##########', val);
			return `(${o.substr(0, 3)}) ${o.substr(3, 3)}-${o.substr(6)}`;
		}
		let oa = '';
		r = fmt.match(/^([#0?]+)( ?)\/( ?)([#0?]+)/);
		if (r) {
			ri = Math.min(r[4].length, 7);
			ff = frac(aval, 10 ** ri - 1, false);
			o = `${sign}`;
			oa = writeNum('n', r[1], ff[1]);
			if (oa.charAt(oa.length - 1) === ' ') oa = `${oa.substr(0, oa.length - 1)}0`;
			o += `${oa}${r[2]}/${r[3]}`;
			oa = rpad_(ff[2], ri);
			if (oa.length < r[4].length) oa = hashq(r[4].substr(r[4].length - oa.length)) + oa;
			o += oa;
			return o;
		}
		r = fmt.match(/^# ([#0?]+)( ?)\/( ?)([#0?]+)/);
		if (r) {
			ri = Math.min(Math.max(r[1].length, r[4].length), 7);
			ff = frac(aval, 10 ** ri - 1, true);
			const firstPart = sign + (ff[0] || (ff[1] ? '' : '0'));
			const secondPart = ff[1]
				? `${pad_(ff[1], ri)}${r[2]}/${r[3]}${rpad_(ff[2], ri)}`
				: fill(' ', 2 * ri + 1 + r[2].length + r[3].length);
			return `${firstPart} ${secondPart}`;
		}
		r = fmt.match(/^[#0?]+$/);
		if (r) {
			o = `${val}`;
			if (fmt.length <= o.length) return o;
			return hashq(fmt.substr(0, fmt.length - o.length)) + o;
		}
		r = fmt.match(/^([#0]+)\.([#0]+)$/);
		if (r) {
			o = `${val.toFixed(Math.min(r[2].length, 10)).replace(/([^0])0+$/, '$1')}`;
			ri = o.indexOf('.');
			const lres = fmt.indexOf('.') - ri;
			const rres = fmt.length - o.length - lres;
			return hashq(fmt.substr(0, lres) + o + fmt.substr(fmt.length - rres));
		}
		r = fmt.match(/^00,000\.([#0]*0)$/);
		if (r) {
			const callback = function m($$) {
				return `00,${$$.length < 3 ? pad0(0, 3 - $$.length) : ''}${$$}`;
			};
			const pos = commaify(`${val}`)
				.replace(/^\d,\d{3}$/, '0$&')
				.replace(/^\d*$/, callback);
			return val < 0 ? `-${writeNumInt(type, fmt, -val)}` : `${pos}.${pad0(0, r[1].length)}`;
		}
		switch (fmt) {
			case '###,###':
			case '##,###':
			case '#,###': {
				const x = commaify(`${aval}`);
				return x !== '0' ? sign + x : '';
			}
			default:
				if (fmt.match(/\.[0#?]*$/)) {
					return (
						writeNumInt(type, fmt.slice(0, fmt.lastIndexOf('.')), val) +
						hashq(fmt.slice(fmt.lastIndexOf('.')))
					);
				}
		}
		throw new Error(`unsupported format | ${fmt} |`);
	}
	return function writeNumRet(type /* :string */, fmt /* :string */, val /* :number */) /* :string */ {
		// eslint-disable-next-line no-bitwise
		return (val | 0) === val ? writeNumInt(type, fmt, val) : writeNumFlt(type, fmt, val);
	};
})();
function splitFmt(fmt /* :string */) /* :Array<string> */ {
	const out = []; /* :Array<string> */
	let inStr = false;
	let j = 0;
	for (let i = 0; i < fmt.length; i += 1) {
		switch (fmt.charCodeAt(i)) {
			case 34 /* '"' */:
				inStr = !inStr;
				break;
			case 95:
			case 42:
			case 92 /* '_' '*' '\\' */:
				i += 1;
				break;
			case 59 /* ';' */:
				out[out.length] = fmt.substr(j, i - j);
				j = i + 1;
				break;
			default:
		}
	}
	out[out.length] = fmt.substr(j);
	if (inStr === true) {
		throw new Error(`Format | ${fmt} | unterminated string `);
	}
	return out;
}
SSF._split = splitFmt;
const abstime = /\[[HhMmSs]*\]/;
function fmtIsDate(fmt /* :string */) /* :boolean */ {
	let i = 0;
	let c = '';
	let o = '';
	while (i < fmt.length) {
		switch ((c = fmt.charAt(i))) {
			case 'G':
				if (isgeneral(fmt, i)) i += 6;
				i += 1;
				break;
			case '"':
				i += 1;
				for (; fmt.charCodeAt(i) !== 34 && i < fmt.length; i += 1) {
					i += 1;
				}
				i += 1;
				break;
			case '\\':
				i += 2;
				break;
			case '_':
				i += 2;
				break;
			case '@':
				i += 1;
				break;
			case 'B':
			case 'b':
				i += 1;
				if (fmt.charAt(i) === '1' || fmt.charAt(i + 1) === '2') return true;
			/* falls through */
			case 'M':
			case 'D':
			case 'Y':
			case 'H':
			case 'S':
			case 'E':
			/* falls through */
			case 'm':
			case 'd':
			case 'y':
			case 'h':
			case 's':
			case 'e':
			case 'g':
				return true;
			case 'A':
			case 'a':
				if (fmt.substr(i, 3).toUpperCase() === 'A/P') return true;
				if (fmt.substr(i, 5).toUpperCase() === 'AM/PM') return true;
				i += 1;
				break;
			case '[':
				o = c;
				i += 1;
				while (fmt.charAt(i) !== ']' && i < fmt.length) {
					o += fmt.charAt(i);
					i += 1;
				}
				if (o.match(abstime)) return true;
				break;
			case '.':
			/* falls through */
			case '0':
			case '#': {
				let j = i;
				i += 1;
				c = fmt.charAt(i);
				while (
					j < fmt.length &&
					('0#?.,E+-%'.indexOf(c) > -1 ||
						(c === '\\' && fmt.charAt(j + 1) === '-' && '0#'.indexOf(fmt.charAt(j + 2)) > -1))
				) {
					j += 1;
					i += 1;
				}
				break;
			}
			case '?':
				i += 1;
				while (fmt.charAt(i) === c) {
					/* empty */
				}
				break;
			case '*':
				i += 1;
				if (fmt.charAt(i) === ' ' || fmt.charAt(i) === '*') i += 1;
				break;
			case '(':
			case ')':
				i += 1;
				break;
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9': {
				const j = i;
				i += 1;
				while (j < fmt.length && '0123456789'.indexOf(fmt.charAt(i)) > -1) {
					/* empty */
				}
				break;
			}
			case ' ':
				i += 1;
				break;
			default:
				i += 1;
				break;
		}
	}
	return false;
}
SSF.is_date = fmtIsDate;
function evalFmt(fmt /* :string */, v /* :any */, opts /* :any */, flen /* :number */) {
	const out = [];
	let o = '';
	let i = 0;
	let c = '';
	let lst = 't';
	let dt;
	let j;
	let cc;
	let hr = 'H';
	/* Tokenize */
	while (i < fmt.length) {
		switch ((c = fmt.charAt(i))) {
			case 'G' /* General */:
				if (!isgeneral(fmt, i)) throw new Error(`unrecognized character ${c} in ${fmt}`);
				out[out.length] = { t: 'G', v: 'General' };
				i += 7;
				break;
			case '"' /* Literal text */:
				i += 1;
				cc = fmt.charCodeAt(i);
				for (o = ''; cc !== 34 && i < fmt.length; ) {
					o += String.fromCharCode(cc);
					i += 1;
					cc = fmt.charCodeAt(i);
				}
				out[out.length] = { t: 't', v: o };
				i += 1;
				break;
			case '\\': {
				i += 1;
				const w = fmt.charAt(i);
				const t = w === '(' || w === ')' ? w : 't';
				out[out.length] = { t, v: w };
				i += 1;
				break;
			}
			case '_':
				out[out.length] = { t: 't', v: ' ' };
				i += 2;
				break;
			case '@' /* Text Placeholder */:
				out[out.length] = { t: 'T', v };
				i += 1;
				break;
			case 'B':
			case 'b':
				if (fmt.charAt(i + 1) === '1' || fmt.charAt(i + 1) === '2') {
					if (dt == null) {
						dt = parseDateCode(v, opts, fmt.charAt(i + 1) === '2');
						if (dt == null) return '';
					}
					out[out.length] = { t: 'X', v: fmt.substr(i, 2) };
					lst = c;
					i += 2;
					break;
				}
			/* falls through */
			case 'M':
			case 'D':
			case 'Y':
			case 'H':
			case 'S':
			case 'E':
				c = c.toLowerCase();
			/* falls through */
			case 'm':
			case 'd':
			case 'y':
			case 'h':
			case 's':
			case 'e':
			case 'g':
				if (v < 0) return '';
				if (dt == null) {
					dt = parseDateCode(v, opts);
					if (dt == null) return '';
				}
				o = c;
				i += 1;
				while (i < fmt.length && fmt.charAt(i).toLowerCase() === c) {
					o += c;
					i += 1;
				}
				if (c === 'm' && lst.toLowerCase() === 'h') c = 'M';
				if (c === 'h') c = hr;
				out[out.length] = { t: c, v: o };
				lst = c;
				break;
			case 'A':
			case 'a': {
				const q = { t: c, v: c };
				if (dt == null) dt = parseDateCode(v, opts);
				if (fmt.substr(i, 3).toUpperCase() === 'A/P') {
					if (dt != null) q.v = dt.H >= 12 ? 'P' : 'A';
					q.t = 'T';
					hr = 'h';
					i += 3;
				} else if (fmt.substr(i, 5).toUpperCase() === 'AM/PM') {
					if (dt != null) q.v = dt.H >= 12 ? 'PM' : 'AM';
					q.t = 'T';
					i += 5;
					hr = 'h';
				} else {
					q.t = 't';
					i += 1;
				}
				if (dt == null && q.t === 'T') return '';
				out[out.length] = q;
				lst = c;
				break;
			}
			case '[': {
				o = c;
				j = i;
				i += 1;
				while (fmt.charAt(j) !== ']' && i < fmt.length) {
					o += fmt.charAt(i);
					j = i;
					i += 1;
				}
				if (o.slice(-1) !== ']') throw new Error(`unterminated [ block: | ${o} |`);
				const colorValue = _getColor(o);
				if (colorValue) opts.output = { color: colorValue };
				if (o.match(abstime)) {
					if (dt == null) {
						dt = parseDateCode(v, opts);
						if (dt == null) return '';
					}
					out[out.length] = { t: 'Z', v: o.toLowerCase() };
					lst = o.charAt(1);
				} else if (o.indexOf('$') > -1) {
					o = (o.match(/\$([^-[\]]*)/) || [])[1] || '$';
					if (!fmtIsDate(fmt)) out[out.length] = { t: 't', v: o };
				}
				break;
			}
			/* Numbers */
			case '.':
				if (dt != null) {
					i += 1;
					o = c;
					c = fmt.charAt(i);
					while (i < fmt.length && c === '0') {
						o += c;
						i += 1;
						c = fmt.charAt(i);
					}
					out[out.length] = { t: 's', v: o };
					break;
				}
			/* falls through */
			case '0':
			case '#':
				i += 1;
				o = c;
				c = fmt.charAt(i);
				while (
					(i < fmt.length && '0#?.,E+-%'.indexOf(c) > -1) ||
					(c === '\\' &&
						fmt.charAt(i + 1) === '-' &&
						i < fmt.length - 2 &&
						'0#'.indexOf(fmt.charAt(i + 2)) > -1)
				) {
					o += c;
					i += 1;
					c = fmt.charAt(i);
				}
				out[out.length] = { t: 'n', v: o };
				break;
			case '?':
				o = c;
				i += 1;
				while (fmt.charAt(i) === c) {
					o += c;
					i += 1;
				}
				out[out.length] = { t: c, v: o };
				lst = c;
				break;
			case '*':
				i += 1;
				if (fmt.charAt(i) === ' ' || fmt.charAt(i) === '*') {
					i += 1;
				}
				break;
			case '(':
			case ')':
				out[out.length] = { t: flen === 1 ? 't' : c, v: c };
				i += 1;
				break;
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
				o = c;
				j = i;
				i += 1;
				while (j < fmt.length && '0123456789'.indexOf(fmt.charAt(i)) > -1) {
					o += fmt.charAt(i);
					j = i;
					i += 1;
				}
				out[out.length] = { t: 'D', v: o };
				break;
			case ' ':
				out[out.length] = { t: c, v: c };
				i += 1;
				break;
			default:
				if (",$£-+/():!^&'~{}<>=€acfijklopqrtuvwxzP".indexOf(c) === -1) {
					throw new Error(`unrecognized character ${c} in ${fmt}`);
				}
				out[out.length] = { t: 't', v: c };
				i += 1;
				break;
		}
	}
	let bt = 0;
	let ss0 = 0;
	let ssm;
	for (i = out.length - 1, lst = 't'; i >= 0; i -= 1) {
		switch (out[i].t) {
			case 'h':
			case 'H':
				out[i].t = hr;
				lst = 'h';
				if (bt < 1) bt = 1;
				break;
			case 's':
				ssm = out[i].v.match(/\.0+$/);
				if (ssm) ss0 = Math.max(ss0, ssm[0].length - 1);
				if (bt < 3) bt = 3;
			/* falls through */
			case 'd':
			case 'y':
			case 'M':
			case 'e':
				lst = out[i].t;
				break;
			case 'm':
				if (lst === 's') {
					out[i].t = 'M';
					if (bt < 2) bt = 2;
				}
				break;
			case 'X' /* if(out[i].v === "B2"); */:
				break;
			case 'Z':
				if (bt < 1 && out[i].v.match(/[Hh]/)) bt = 1;
				if (bt < 2 && out[i].v.match(/[Mm]/)) bt = 2;
				if (bt < 3 && out[i].v.match(/[Ss]/)) bt = 3;
				break;
			default:
		}
	}
	switch (bt) {
		case 0:
			break;
		case 1:
			/* ::if(!dt) break; */
			if (dt.u >= 0.5) {
				dt.u = 0;
				dt.S += 1;
			}
			if (dt.S >= 60) {
				dt.S = 0;
				dt.M += 1;
			}
			if (dt.M >= 60) {
				dt.M = 0;
				dt.H += 1;
			}
			break;
		case 2:
			/* ::if(!dt) break; */
			if (dt.u >= 0.5) {
				dt.u = 0;
				dt.S += 1;
			}
			if (dt.S >= 60) {
				dt.S = 0;
				dt.M += 1;
			}
			break;
		default:
	}
	/* replace fields */
	let nstr = '';
	let jj;
	for (i = 0; i < out.length; i += 1) {
		switch (out[i].t) {
			case 't':
			case 'T':
			case ' ':
			case 'D':
				break;
			case 'X':
				out[i].v = '';
				out[i].t = ';';
				break;
			case 'd':
			case 'm':
			case 'y':
			case 'h':
			case 'H':
			case 'M':
			case 's':
			case 'e':
			case 'b':
			case 'Z':
				/* ::if(!dt) throw "unreachable"; */
				out[i].v = writeDate(out[i].t.charCodeAt(0), out[i].v, dt, ss0);
				out[i].t = 't';
				break;
			case 'n':
			case '(':
			case '?':
				jj = i + 1;
				if (out[jj] != null) {
					c = out[jj].t;
				}
				while (
					out[jj] != null &&
					(c === '?' ||
						c === 'D' ||
						((c === ' ' || c === 't') &&
							out[jj + 1] != null &&
							(out[jj + 1].t === '?' || (out[jj + 1].t === 't' && out[jj + 1].v === '/'))) ||
						(out[i].t === '(' && (c === ' ' || c === 'n' || c === ')')) ||
						(c === 't' &&
							(out[jj].v === '/' || (out[jj].v === ' ' && out[jj + 1] != null && out[jj + 1].t === '?'))))
				) {
					out[i].v += out[jj].v;
					out[jj] = { v: '', t: ';' };
					jj += 1;
					if (out[jj] != null) {
						c = out[jj].t;
					}
				}
				nstr += out[i].v;
				i = jj - 1;
				break;
			case 'G':
				out[i].t = 't';
				out[i].v = generalFmt(v, opts);
				break;
			default:
		}
	}
	let vv = '';
	let myv;
	let ostr;
	if (nstr.length > 0) {
		if (nstr.charCodeAt(0) === 40) {
			/* '(' */ myv = v < 0 && nstr.charCodeAt(0) === 45 ? -v : v;
			ostr = writeNum('(', nstr, myv);
		} else {
			myv = v < 0 && flen > 1 ? -v : v;
			ostr = writeNum('n', nstr, myv);
			if (myv < 0 && out[0] && out[0].t === 't') {
				ostr = ostr.substr(1);
				out[0].v = `-${out[0].v}`;
			}
		}
		jj = ostr.length - 1;
		let decpt = out.length;
		// const commaSep = NumberFormatter.getDecimalSeparator();
		for (i = 0; i < out.length; i += 1) {
			if (out[i] != null && out[i].t !== 't' && out[i].v.indexOf('.') > -1) {
				decpt = i;
				break;
			}
		}
		let lasti = out.length;
		if (decpt === out.length && ostr.indexOf('E') === -1) {
			for (i = out.length - 1; i >= 0; i -= 1) {
				if (!(out[i] == null || 'n?('.indexOf(out[i].t) === -1)) {
					if (jj >= out[i].v.length - 1) {
						jj -= out[i].v.length;
						out[i].v = ostr.substr(jj + 1, out[i].v.length);
					} else if (jj < 0) {
						out[i].v = '';
					} else {
						out[i].v = ostr.substr(0, jj + 1);
						jj = -1;
					}
					out[i].t = 't';
					lasti = i;
				}
			}
			if (jj >= 0 && lasti < out.length) out[lasti].v = ostr.substr(0, jj + 1) + out[lasti].v;
		} else if (decpt !== out.length && ostr.indexOf('E') === -1) {
			jj = ostr.indexOf('.') - 1;
			for (i = decpt; i >= 0; i -= 1) {
				if (!(out[i] == null || 'n?('.indexOf(out[i].t) === -1)) {
					j = out[i].v.indexOf('.') > -1 && i === decpt ? out[i].v.indexOf('.') - 1 : out[i].v.length - 1;
					vv = out[i].v.substr(j + 1);
					for (; j >= 0; j -= 1) {
						if (jj >= 0 && (out[i].v.charAt(j) === '0' || out[i].v.charAt(j) === '#')) {
							vv = ostr.charAt(jj) + vv;
							jj -= 1;
						}
					}
					out[i].v = vv;
					out[i].t = 't';
					lasti = i;
				}
			}
			if (jj >= 0 && lasti < out.length) out[lasti].v = ostr.substr(0, jj + 1) + out[lasti].v;
			jj = ostr.indexOf('.') + 1;
			for (i = decpt; i < out.length; i += 1) {
				if (!(out[i] == null || ('n?('.indexOf(out[i].t) === -1 && i !== decpt))) {
					j = out[i].v.indexOf('.') > -1 && i === decpt ? out[i].v.indexOf('.') + 1 : 0;
					vv = out[i].v.substr(0, j);
					for (; j < out[i].v.length; j += 1) {
						if (jj < ostr.length) {
							vv += ostr.charAt(jj);
							jj += 1;
						}
					}
					out[i].v = vv;
					out[i].t = 't';
					lasti = i;
				}
			}
		}
	}
	for (i = 0; i < out.length; i += 1) {
		if (out[i] != null && 'n(?'.indexOf(out[i].t) > -1) {
			myv = flen > 1 && v < 0 && i > 0 && out[i - 1].v === '-' ? -v : v;
			out[i].v = writeNum(out[i].t, out[i].v, myv);
			out[i].t = 't';
		}
	}
	let retval = '';
	for (i = 0; i !== out.length; i += 1) if (out[i] != null) retval += out[i].v;
	return retval;
}
SSF._eval = evalFmt;
const cfregex = /\[[=<>]/;
const cfregex2 = /\[([=<>]*)(-?\d+\.?\d*)\]/;
function chkcond(v, rr) {
	if (rr == null) return false;
	const thresh = parseFloat(rr[2]);
	switch (rr[1]) {
		case '=':
			if (v === thresh) return true;
			break;
		case '>':
			if (v > thresh) return true;
			break;
		case '<':
			if (v < thresh) return true;
			break;
		case '<>':
			if (v !== thresh) return true;
			break;
		case '>=':
			if (v >= thresh) return true;
			break;
		case '<=':
			if (v <= thresh) return true;
			break;
		default:
	}
	return false;
}
function chooseFmt(f /* :string */, v /* :any */) {
	let fmt = splitFmt(f);
	let l = fmt.length;
	const lat = fmt[l - 1].indexOf('@');
	if (l < 4 && lat > -1) l -= 1;
	if (fmt.length > 4) throw new Error(`cannot find right format for | ${fmt.join('|')} |`);
	if (typeof v !== 'number') return [4, fmt.length === 4 || lat > -1 ? fmt[fmt.length - 1] : '@'];
	switch (fmt.length) {
		case 1:
			fmt = lat > -1 ? ['General', 'General', 'General', fmt[0]] : [fmt[0], fmt[0], fmt[0], '@'];
			break;
		case 2:
			fmt = lat > -1 ? [fmt[0], fmt[0], fmt[0], fmt[1]] : [fmt[0], fmt[1], fmt[0], '@'];
			break;
		case 3:
			fmt = lat > -1 ? [fmt[0], fmt[1], fmt[0], fmt[2]] : [fmt[0], fmt[1], fmt[2], '@'];
			break;
		case 4:
			break;
		default:
	}
	const neg = v < 0 ? fmt[1] : fmt[2];
	const ff = v > 0 ? fmt[0] : neg;
	if (fmt[0].indexOf('[') === -1 && fmt[1].indexOf('[') === -1) return [l, ff];
	if (fmt[0].match(cfregex) != null || fmt[1].match(cfregex) != null) {
		const m1 = fmt[0].match(cfregex2);
		const m2 = fmt[1].match(cfregex2);
		const falseVal = chkcond(v, m2) ? [l, fmt[1]] : [l, fmt[m1 != null && m2 != null ? 2 : 1]];
		return chkcond(v, m1) ? [l, fmt[0]] : falseVal;
	}
	return [l, ff];
}
function format(fmt /* :string|number */, v /* :any */, o /* :?any */) {
	if (o == null) o = {};
	let sfmt = '';
	switch (typeof fmt) {
		case 'string':
			if (fmt === 'm/d/yy' && o.dateNF) sfmt = o.dateNF;
			else sfmt = fmt;
			break;
		case 'number':
			if (fmt === 14 && o.dateNF) sfmt = o.dateNF;
			else sfmt = (o.table != null ? (o.table /* :any */) : tableFmt)[fmt];
			break;
		default:
	}
	if (isgeneral(sfmt, 0)) return generalFmt(v, o);
	if (v instanceof Date) v = datenumLocal(v, o.date1904);
	const f = chooseFmt(sfmt, v);
	if (isgeneral(f[1])) return generalFmt(v, o);
	if (v === true) v = 'TRUE';
	else if (v === false) v = 'FALSE';
	else if (v === '' || v == null) return '';
	return evalFmt(f[1], v, o, f[0]);
}
SSF.format = format;
function loadEntry(fmt /* :string */, idx /* :?number */) /* :number */ {
	if (typeof idx !== 'number') {
		idx = +idx || -1;
		/* ::if(typeof idx != 'number') return 0x188; */
		for (let i = 0; i < 0x0188; i += 1) {
			/* ::if(typeof idx != 'number') return 0x188; */
			if (tableFmt[i] !== undefined) {
				if (tableFmt[i] === fmt) {
					idx = i;
					break;
				}
			} else if (idx < 0) {
				idx = i;
			}
		}
		/* ::if(typeof idx != 'number') return 0x188; */
		if (idx < 0) idx = 0x187;
	}
	/* ::if(typeof idx != 'number') return 0x188; */
	tableFmt[idx] = fmt;
	return idx;
}
SSF.load = loadEntry;
SSF._table = tableFmt;
SSF.get_table = function getTable() /* :SSFTable */ {
	return tableFmt;
};
SSF.load_table = function loadTable(tbl /* :SSFTable */) /* :void */ {
	for (let i = 0; i !== 0x0188; i += 1) {
		if (tbl[i] !== undefined) loadEntry(tbl[i], i);
	}
};
SSF.init_table = initTable;
