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
const SERIAL_OFFSET_IN_MS = -2209075200000; // equals 31.12.1899 00:00:00.000 UTC which corresponds to serial 0
// const DAY_THRESHOLD = 0.999994212962962;

const FRACTION_FACTOR = 10 ** 11;
// nominator covers  00:00:00 - 23:59:59
// denominator is taken from excel TIME("23";"59";"59") result
const SECONDS_FACTOR = (86400 - 1) / 0.9999884259259;

const roundTo = (floor) => floor ? Math.floor : Math.round;
const getFraction = (nr) => ((nr * FRACTION_FACTOR) % FRACTION_FACTOR) / FRACTION_FACTOR;
const toSeconds = (serial, floor) => roundTo(floor)(SECONDS_FACTOR * getFraction(serial));
const toMilliseconds = (serial) => Math.round(1000 * SECONDS_FACTOR * getFraction(serial));
// const toMilliseconds = (serial, floor) => roundTo(floor)(1000 * SECONDS_FACTOR * getFraction(serial));

const hours = (serial, floor) => Math.floor(toSeconds(serial, floor) / 3600) % 24;
const minutes = (serial, floor) => Math.floor(toSeconds(serial, floor) / 60) % 60;
const seconds = (serial, floor) => toSeconds(serial, floor) % 60;
const milliseconds = (serial) => toMilliseconds(serial) % 1000;

const asMillis = (serial) => {
	if (serial === 0) serial = 1;
	else if (serial > 60) serial -= 1;
	return SERIAL_OFFSET_IN_MS + serial * DAY_IN_MS;
};

const serial2RoundedDate = (serial, floor) => {
	const ms = Math.trunc(asMillis(serial));
	const roundedMillis = roundTo(floor)(ms / 1000) * 1000;
	return new Date(roundedMillis);
};
// excel rounds day, month and year!
const year = (serial, floor) => serial2RoundedDate(serial, floor).getUTCFullYear();
const month = (serial, floor) => serial2RoundedDate(serial, floor).getUTCMonth() + 1;
const day = (serial, floor) => serial2RoundedDate(serial, floor).getUTCDate();
const weekday = (serial, floor) => {
	const wday = serial2RoundedDate(serial, floor).getUTCDay();
	if (serial > 60) {
		return wday + 1;
	}
	return wday < 1 || serial < 1 ? 7 : wday;
};

const serial2ms = (serial) => Math.round(asMillis(serial));
const serial2date = (serial) => new Date(serial2ms(serial));

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
