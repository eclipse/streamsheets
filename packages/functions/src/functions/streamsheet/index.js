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
const help = require('./help');
const await_ = require('./await');
const colors = require('./colors');
const counters = require('./counters');
const detectchange = require('./detectchange');
const outboxdata = require('./outboxdata');
const outboxgetids = require('./outboxgetids');
const loop = require('./loop');
const table = require('./table');
const values = require('./values');
const ARRAY = require('./array');
const CALC = require('./calc');
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
const KAFKACOMMAND = require('./kafkacommand');
const KAFKAQUERY = require('./kafkaquery');
const OUTBOX = require('./outbox');
// const OUTBOXDATA = require('./outboxdata');
const OUTBOXJSON = require('./outboxjson');
const PRODUCE = require('./produce');
const RANGE = require('./range');
const READ = require('./read');
const REFRESH = require('./refresh');
const { requestinternal, REQUEST, REQUESTINFO } = require('./request');
const { RESPOND } = require('./respond');
const RETURN = require('./return');
const SELECT = require('./select');
const SETCYCLETIME = require('./setcycletime');
const SETPHASE = require('./setphase');
const SLEEP = require('./sleep');
const SUBTREE = require('./subtree');
const TRIGGERSTEP = require('./triggerstep');
const WRITE = require('./write');

module.exports = {
	help,
	functions: {
		...await_,
		...colors,
		...counters,
		...detectchange,
		...loop,
		...outboxdata,
		...table,
		...values,
		requestinternal,
		ARRAY,
		CALC,
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
		'JSON.VALUE': JSONVALUE,
		// KAFKA HERE???
		KAFKACOMMAND,
		KAFKAQUERY,
		OUTBOX,
		// OUTBOXDATA,
		'OUTBOX.GETIDS': outboxgetids,
		OUTBOXJSON,
		PRODUCE,
		RANGE,
		READ,
		REFRESH,
		REQUEST,
		REQUESTINFO,
		RESPOND,
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
