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
const crypto = require('./crypto');
const database = require('./database');
const date = require('./date');
const drawing = require('./drawing');
const engineering = require('./engineering');
const http = require('./http');
const info = require('./info');
const logical = require('./logical');
const lookup = require('./lookup');
const math = require('./math');
// const olap = require('./olap');
const parse = require('./parse');
const stack = require('./stack');
const statistical = require('./statistical');
const streamsheet = require('./streamsheet');
const streams = require('./streams');
const text = require('./text');
const timeseries = require('./timeseries');
const url = require('./url');

module.exports = {
	...crypto.functions,
	...database.functions,
	...date.functions,
	...drawing.functions,
	...engineering.functions,
	...http.functions,
	...info.functions,
	...logical.functions,
	...lookup.functions,
	...math.functions,
	// ...olap.functions,
	...parse.functions,
	...stack.functions,
	...statistical.functions,
	...streamsheet.functions,
	...streams.functions,
	...text.functions,
	...timeseries.functions,
	...url.functions
};
