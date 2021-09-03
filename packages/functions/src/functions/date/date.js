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
const {
	convert,
	serialnumber: {
		now,
		year,
		month,
		day,
		weekday,
		hours,
		minutes,
		seconds,
		milliseconds,
		ms2serial,
		serial2date
	}
} = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { locale } = require('@cedalo/machine-core');
const {
	sheet: { getLocale },
	runFunction,
	values: { roundNumber }
} = require('../../utils');

const ERROR = FunctionErrors.code;
const SEC_MS = 1000;
const MIN_MS = 60 * SEC_MS;
const HOUR_MS = 60 * MIN_MS;
const timeregex = new RegExp(/(\d\d?):(\d\d?):?(\d?\d?)\s*(am|pm)?/, 'i');
// seems sign is not supported by Date.parse()
// const isoregex = /^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2}):?(\d{0,2}):?(\d{0,2})\.?(\d{0,3})Z$/;
const isoregex = /^(\d{4})-(\d{1,2})-(\d{1,2})T(\d{1,2})(:\d{0,2})?(:\d{0,2})?(\.\d{0,3})?Z$/;

const padZero = (nr) => (str) => str.padStart(nr, '0');
const insZero = (nr) => (str = '') => str.substring(1).padStart(nr, '0');
const padZero2 = padZero(2);
const insZero2 = insZero(2);
const insZero3 = insZero(3);
const isoFormat = (match, YYYY, MM, DD, hh, mm, ss, ms /* , offset, string */) => {
	if ((ms != null && ss == null) || (ss != null && mm == null)) return undefined;
	return `${YYYY}-${padZero2(MM)}-${padZero2(DD)}T${padZero2(hh)}:${insZero2(mm)}:${insZero2(ss)}.${insZero3(ms)}Z`;
};
const validateISOFormat = (str) => (isoregex.test(str) ? str.replace(isoregex, isoFormat) : ERROR.VALUE);

const timeToSerial = (hrs = 0, mins = 0, secs = 0) => {
	const ms = (hrs * HOUR_MS) + (mins * MIN_MS) + (secs * SEC_MS);
	return roundNumber(ms2serial(ms) - 25569, 8);
};
const parseTimeStr = (str) => {
	const timearr = timeregex.exec(str);
	if (timearr) {
		let hrs = Number(timearr[1]);
		const mins = Number(timearr[2]);
		const secs = Number(timearr[3]);
		const pm = timearr[4];
		if (pm != null && pm.toLowerCase() === 'pm') {
			hrs += 12;
		}
		return timeToSerial(hrs, mins, secs);
	}
	return ERROR.VALUE;
};

// DL-784: check against german-like date format, e.g. 01.08.2018... more may supported...
// const convertDateFormat = (str) => {
// 	const parts = str.split('.');
// 	return parts.length > 2 ? `${parts[1]}/${parts[0]}/${parts[2]}` : str;
// };

const date = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(3)
		.mapNextArg(y => convert.toNumber(y.value, ERROR.VALUE))
		.mapNextArg(m => convert.toNumber(m.value, ERROR.VALUE))
		.mapNextArg(d => convert.toNumber(d.value, ERROR.VALUE))
		.run((y, m, d) => Math.round(ms2serial(Date.parse(`${y}-${m}-${d}`))));

const datevalue = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((datestr) => {
			const value = datestr.value;
			return FunctionErrors.isError(value) ? value : convert.toString(value, ERROR.VALUE);
		})
		.run((datestr) => {
			const localizer = locale.use({ locale: getLocale(sheet) });
			return Math.round(ms2serial(localizer.parse(datestr)));
		});

const time = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(3)
		.mapNextArg(hrs => convert.toNumber(hrs.value, ERROR.VALUE))
		.mapNextArg(mins => convert.toNumber(mins.value, ERROR.VALUE))
		.mapNextArg(secs => convert.toNumber(secs.value, ERROR.VALUE))
		.run((hrs, mins, secs) => timeToSerial(hrs, mins, secs));

const timevalue = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(timestr => convert.toString(timestr.value) || ERROR.VALUE)
		.run(timestr => parseTimeStr(timestr));

const jsontime2excel = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((str) => validateISOFormat(convert.toString(str.value)))
		.run((str) => {
			const ms = Date.parse(str);
			return !Number.isNaN(ms) ? ms2serial(ms) : ERROR.VALUE;
		});

const excel2jsontime = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((serial) => convert.toNumber(serial.value, ERROR.VALUE))
		.run((serial) => serial2date(serial).toJSON());

const serialTo = (fn, maxArgs) => (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(maxArgs)
		.mapNextArg((serial) => convert.toNumber(serial.value, ERROR.VALUE))
		.mapNextArg((roundIt) => (roundIt ? convert.toBoolean(roundIt.value, ERROR.VALUE) : true))
		.run((serial, roundIt) => fn(serial, !roundIt));

const serialNow = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(0)
		.run(() => now());

module.exports = {
	DATE: date,
	DATEVALUE: datevalue,
	EXCEL2JSONTIME: excel2jsontime,
	JSONTIME2EXCEL: jsontime2excel,
	TIME: time,
	TIMEVALUE: timevalue,
	NOW: serialNow,
	YEAR: serialTo(year, 2),
	MONTH: serialTo(month, 2),
	DAY: serialTo(day, 2),
	WEEKDAY: serialTo(weekday, 2),
	HOUR: serialTo(hours, 2),
	MINUTE: serialTo(minutes, 2),
	SECOND: serialTo(seconds, 2),
	MILLISECOND: serialTo(milliseconds, 1)
};
