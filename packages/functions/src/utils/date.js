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
const MIN_IN_SEC = 60;
const HOUR_IN_SEC = 60 * MIN_IN_SEC;
const DAY_IN_SEC = 24 * HOUR_IN_SEC;
const DAY_IN_MS = 1000 * DAY_IN_SEC;

const TZ_OFFSET_IN_MS = new Date().getTimezoneOffset() * 60000;


// NOTE: new Date() automatically adds local timezone offset!!
// const LOCAL_TIMEZONE_OFFSET = new Date().getTimezoneOffset() * MIN_IN_MS;

// milliseconds since unix epoche
// const MS_SINCE_EPOCHE = 25567 * DAY_IN_MS; // Math.abs(Date.UTC(1900, 1, 1));


// returns Date based on local timezone!! To get the UTC values use corresponding methods, e.g. getUTCMonth...
const serial2date = (serial) => {
	const date = Math.floor(serial - 25569) * DAY_IN_MS; // 25567 + 2;
	const time = Math.floor(DAY_IN_MS * (serial - Math.floor(serial) + 0.0000000001));
	return new Date(date + time);
	// return new Date(date + time + LOCAL_TIMEZONE_OFFSET);
};

const ms2serial = (ms) => {
	const date = Math.floor(ms / DAY_IN_MS) + 25569; // 25567 + 2;
	const time = (ms % DAY_IN_MS) / DAY_IN_MS;
	return date + time;
};

const serial2ms = serial => serial2date(serial).getTime();
// const serial2ms = serial => serial2date(serial).getTime() - LOCAL_TIMEZONE_OFFSET;

const time2serial = ms => ms2serial(ms) - 25569; // 25567 + 2;

const localNow = () => Date.now() - TZ_OFFSET_IN_MS;

module.exports = {
	localNow,
	ms2serial,
	serial2date,
	serial2ms,
	time2serial
};
