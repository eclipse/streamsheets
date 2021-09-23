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
const crypto = require('../src/functions/crypto/help');
const database = require('../src/functions/database/help');
const date = require('../src/functions/date/help');
const shape = require('../src/functions/drawing/help');
const engineering = require('../src/functions/engineering/help');
const http = require('../src/functions/http/help');
const info = require('../src/functions/info/help');
const logical = require('../src/functions/logical/help');
const lookup = require('../src/functions/lookup/help');
const math = require('../src/functions/math/help');
// const olap = require('../src/functions/olap/help');
const parse = require('../src/functions/parse/help');
const stack = require('../src/functions/stack/help');
const statistical = require('../src/functions/statistical/help');
const streams = require('../src/functions/streams/help');
const streamsheet = require('../src/functions/streamsheet/help');
const text = require('../src/functions/text/help');
const timeseries = require('../src/functions/timeseries/help');
const url = require('../src/functions/url/help');

module.exports = {
	crypto,
	database,
	date,
	shape,
	engineering,
	http,
	info,
	logical,
	lookup,
	math,
	// olap,
	parse,
	stack,
	statistical,
	streams,
	streamsheet,
	text,
	timeseries,
	url
};
