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

// js dates ignore leap seconds, i.e. each day corresponds to a fixed number of milliseconds:
const MIN_IN_MS = 60 * 1000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const FRACTION_FACTOR = 10 ** 11;
// nominator covers  00:00:00 - 23.:59:59
// denominator is taken from excel TIME("23";"59";"59") result
const SECONDS_FACTOR = (86400 - 1) / 0.9999884259259;

const getFraction = (nr) => ((nr * FRACTION_FACTOR) % FRACTION_FACTOR) / FRACTION_FACTOR;
const toSeconds = (serial) => Math.round(SECONDS_FACTOR * getFraction(serial));
const toMilliseconds = (serial) => Math.round(1000 * SECONDS_FACTOR * getFraction(serial));

const hours = (serial) => Math.floor(toSeconds(serial) / 3600) % 24;
const minutes = (serial) => Math.floor(toSeconds(serial) / 60) % 60;
const seconds = (serial) => toSeconds(serial) % 60;
const milliseconds = (serial) => toMilliseconds(serial) % 1000;

const serial2date = (serial) => {
// following is based (but refined) on :
// https://stackoverflow.com/questions/16229494/converting-excel-date-serial-number-to-date-using-javascript/57184486#57184486
	
	// milliseconds since 1899-31-12T00:00:00Z, corresponds to serial 0.
	const offset = -2209075200000;
	// correct serial
	if (serial === 0) serial = 1;
	// each serial up to 60 corresponds to a valid calendar date.
	// serial 60 is 1900-02-29. This date does not exist on the calendar.
	// we choose to interpret serial 60 (as well as 61) both as 1900-03-01
	// so, if the serial is 61 or over, we have to subtract 1.
	// serial must be at least 1
	else if (serial > 60) serial -= 1;
	return new Date(offset + Math.round(serial * DAY_IN_MS));
};

const year = (serial) => serial2date(serial).getFullYear();
const month = (serial) => serial2date(serial).getMonth() + 1;
const day = (serial) => serial2date(serial).getDate();
const weekday = (serial) => {
	const wday = serial2date(serial).getDay();
	if (serial > 60) {
		return wday + 1;
	}
	return wday < 1 || serial < 1 ? 7 : wday;
};
  
const serial2ms = (serial) => serial2date(serial).getTime();

const ms2serial = (ms) => {
	const serial = ms / DAY_IN_MS + 25569;
	return serial > 61 ? serial : serial - 1;
};
const date2serial = (date) => ms2serial(date.getTime());
const dateLocal2serial = (date) => ms2serial(date.getTime() - (date.getTimezoneOffset() * MIN_IN_MS));
const now = () => dateLocal2serial(new Date());

module.exports = {
	// returns serial number representing current local(!) time
	now,
	hours,
	milliseconds,
	minutes,
	seconds,
	year,
	month,
	day,
	weekday,
	// converts given JS Date object to serial number (in UTC)
	date2serial,
	// converts given local date, i.e. including timezone offset, to serial number (in UTC)
	dateLocal2serial,
	// converts given milliseconds to serial number
	ms2serial,
	// converts given serial number to JS Date object
	serial2date,
	// converts given serial number to seconds
	serial2ms,
	// converts the time part of given serial number to milliseconds
	time2ms: toMilliseconds,
	// converts the time part of given serial number to seconds
	time2seconds: toSeconds
};
