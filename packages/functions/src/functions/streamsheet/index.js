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
const colors = require('./colors');
const counters = require('./counters');
const detectchange = require('./detectchange');
const loop = require('./loop');
const values = require('./values');
const ARRAY = require('./array');
const CALC = require('./calc');
const DELETE = require('./delete');
const DELETECELLS = require('./deletecells');
const DICTIONARY = require('./dictionary');
const EXECUTE = require('./execute');
const FEEDINBOX = require('./feedinbox');
const GOTO = require('./goto');
const INBOX = require('./inbox');
const INBOXDATA = require('./inboxdata');
const INBOXJSON = require('./inboxjson');
const INBOXMETADATA = require('./inboxmetadata');
const JSON = require('./json');
const KAFKACOMMAND = require('./kafkacommand');
const KAFKAQUERY = require('./kafkaquery');
const OUTBOX = require('./outbox');
const OUTBOXDATA = require('./outboxdata');
const OUTBOXJSON = require('./outboxjson');
const PRODUCE = require('./produce');
const READ = require('./read');
const REFRESH = require('./refresh');
const { requestinternal, REQUEST, REQUESTINFO } = require('./request');
const { RESPOND } = require('./respond');
const RETURN = require('./return');
const SELECT = require('./select');
const SETCYCLETIME = require('./setcycletime');
const SETPHASE = require('./setphase');
const SUBTREE = require('./subtree');
const TRIGGERSTEP = require('./triggerstep');
const WRITE = require('./write');

module.exports = {
	help,
	functions: {
		...colors,
		...counters,
		...detectchange,
		...loop,
		...values,
		requestinternal,
		ARRAY,
		CALC,
		DELETE,
		DELETECELLS,
		DICTIONARY,
		EXECUTE,
		FEEDINBOX,
		GOTO,
		INBOX,
		INBOXDATA,
		INBOXJSON,
		INBOXMETADATA,
		JSON,
		// KAFKA HERE???
		KAFKACOMMAND,
		KAFKAQUERY,
		OUTBOX,
		OUTBOXDATA,
		OUTBOXJSON,
		PRODUCE,
		READ,
		REFRESH,
		REQUEST,
		REQUESTINFO,
		RESPOND,
		RETURN,
		SELECT,
		SETCYCLETIME,
		SETPHASE,
		SUBTREE,
		TRIGGERSTEP,
		WRITE
	}
};
