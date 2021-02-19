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
const { Message } = require('@cedalo/machine-core');

const addParseResultToInbox = async (context, inbox, parseResult, error) => {
	if (error) {
		const errorMessage = new Message(error);
		errorMessage.metadata.label = `Error: ${context.term.name}`;
		inbox.put(errorMessage);
	} else {
		const messageContent = parseResult;
		const messageLabel = `${context.term.name}`;
		const message = new Message(messageContent);
		message.metadata.label = messageLabel;
		inbox.put(message);		
	}
}

module.exports = {
	addParseResultToInbox
}