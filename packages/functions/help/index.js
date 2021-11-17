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
const chart = require('./chart/help');
const crypto = require('./crypto/help');
const date = require('./date/help');
const databases = require('./databases/help');
const dataformats = require('./dataformats/help');
const engineering = require('./engineering/help');
const events = require('./events/help');
const http = require('./http/help');
const info = require('./info/help');
const logical = require('./logical/help');
const lookup = require('./lookup/help');
const math = require('./math/help');
const shape = require('./shape/help');
const stack = require('./stack/help');
const statistical = require('./statistical/help');
const streams = require('./streams/help');
const streamsheet = require('./streamsheet/help');
const text = require('./text/help');
const timeseries = require('./timeseries/help');

// const olap = require('../src/functions/olap/help');

module.exports = {
	chart,
	crypto,
	databases,
	dataformats,
	date,
	events,
	engineering,
	http,
	info,
	shape,
	logical,
	lookup,
	math,
	// olap,
	stack,
	statistical,
	streams,
	streamsheet,
	text,
	timeseries,
};
