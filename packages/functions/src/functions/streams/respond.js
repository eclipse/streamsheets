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
const {
	sheet: { messageFromBoxOrValue },
	terms: { getRequestIdFromTerm },
	validation: { ensure }
} = require('../../utils');
const { Message, Streams } = require('@cedalo/machine-core');


const respondinternal = (s, ...t) =>
	ensure(s, t)
		.withSheet()
		.withArgs(3, ['streamTerm', 'message', 'internal'])
		.isProcessing()
		.withConsumer()
		.with(({ sheet, internal: { requestId } }) => getRequestIdFromTerm(requestId, sheet))
		.run(({ streamId, message }, requestId) => {
			Streams.respond(streamId, { message: new Message(message), requestId });
			return true;
		});

// =RESPOND(B7,"REST Alexa Stream",C4)
const respond = (s, ...t) =>
	ensure(s, t)
		.withSheet()
		.withArgs(3, ['streamTerm', 'requestIdTerm', 'messageTerm'])
		.isProcessing()
		.withMachine()
		.with(({ machine, sheet, messageTerm }) => messageFromBoxOrValue(machine, sheet, messageTerm))
		.run(({ streamTerm, requestIdTerm }, message) =>
			respondinternal(s, streamTerm, message, { requestId: requestIdTerm })
		);

module.exports = { RESPOND: respond, respondinternal };
