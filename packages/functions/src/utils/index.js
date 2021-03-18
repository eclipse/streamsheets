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
const aggregations = require('./aggregations');
const AsyncRequest = require('./AsyncRequest');
const calculate = require('./calculate');
const criteria = require('./criteria');
const Criterion = require('./Criterion');
const arrayspread = require('./arrayspread');
const date = require('./date');
// const excel = require('./excel');
const jsonflatten = require('./jsonflatten');
const jsonbuilder = require('./jsonbuilder');
const messages = require('./messages');
const runFunction = require('./runner');
const sheet = require('./sheet');
const httprequest = require('./httprequest');
const terms = require('./terms');
// const types = require('./types'); // <-- causes circular reference!!
const validation = require('./validation');
const values = require('./values');
const wildcards = require('./wildcards');

module.exports = {
	aggregations,
	arrayspread,
	AsyncRequest,
	calculate,
	criteria,
	Criterion,
	date,
	// excel,
	jsonflatten,
	jsonbuilder,
	messages,
	runFunction,
	sheet,
	httprequest,
	terms,
	// types,
	validation,
	values,
	wildcards
};
