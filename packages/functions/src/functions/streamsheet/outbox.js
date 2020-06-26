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
const { runFunction } = require('../../utils');


// terms can be "", or "*", or "msg-id"
const outbox = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.mapNextArg((messageId) => (messageId ? messageId.value : ''))
		.run((messageId) => `[${messageId}]`);


module.exports = outbox;
