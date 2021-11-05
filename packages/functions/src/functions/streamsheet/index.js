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
const await_ = require('./await');
const colors = require('./colors');
const counters = require('./counters');
const detectchange = require('./detectchange');
const jsontorange = require('./jsonrange');
const outboxdata = require('./outboxdata');
const outboxgetids = require('./outboxgetids');
const loop = require('./loop');
const table = require('./table');
const values = require('./values');
const ARRAY = require('./array');
const CALC = require('./calc');
const CLEARCELLS = require('./clearcells');
const CONTINUE = require('./continueAt');
const DELETE = require('./delete');
const DELETECELLS = require('./deletecells');
const DICTIONARY = require('./dictionary');
const EXECUTE = require('./execute');
const FEEDINBOX = require('./feedinbox');
const INBOX = require('./inbox');
const INBOXDATA = require('./inboxdata');
const INBOXJSON = require('./inboxjson');
const INBOXMETADATA = require('./inboxmetadata');
const JSON = require('./json');
const JSONVALUE = require('./jsonvalue');
const OUTBOX = require('./outbox');
// const OUTBOXDATA = require('./outboxdata');
const OUTBOXJSON = require('./outboxjson');
const RANGE = require('./range');
const READ = require('./read');
const REFRESH = require('./refresh');
const RETURN = require('./return');
const SELECT = require('./select');
const SETCYCLETIME = require('./setcycletime');
const SETPHASE = require('./setphase');
const SLEEP = require('./sleep');
const SUBTREE = require('./subtree');
const TRIGGERSTEP = require('./triggerstep');
const WRITE = require('./write');

module.exports = {
	functions: {
		...await_,
		...colors,
		...counters,
		...detectchange,
		...loop,
		...outboxdata,
		...table,
		...values,
		ARRAY,
		CALC,
		CLEARCELLS,
		CONTINUE,
		DELETE,
		DELETECELLS,
		DICTIONARY,
		EXECUTE,
		FEEDINBOX,
		GOTO: CONTINUE, // DEPRECATED!! => replaced by CONTINUE
		INBOX,
		INBOXDATA,
		INBOXJSON,
		INBOXMETADATA,
		JSON,
		'JSON.RANGE': jsontorange,
		'JSON.VALUE': JSONVALUE,
		OUTBOX,
		// OUTBOXDATA,
		'OUTBOX.GETIDS': outboxgetids,
		OUTBOXJSON,
		RANGE,
		READ,
		REFRESH,
		RETURN,
		SELECT,
		SETCYCLETIME,
		SETPHASE,
		SLEEP,
		SUBTREE,
		TRIGGERSTEP,
		WRITE
	}
};
