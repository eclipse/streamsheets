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

const { Cell, Message } = require('@cedalo/machine-core');
const { Term } = require('@cedalo/parser');
const { parse } = require('@cedalo/parsers');

const disableSheetUpdate = (sheet) => {
	const sheetOnUpdate = sheet.onUpdate;
	sheet.onUpdate = null;
	return sheetOnUpdate;
};
const enableSheetUpdate = (sheet, sheetOnUpdate) => {
	const machine = sheet.machine;
	if (sheetOnUpdate) {
		sheet.onUpdate = sheetOnUpdate;
	}
	if (machine && machine.state !== State.RUNNING) {
		sheet._notifyUpdate();
	}
};

const putKeyValuesToRange = (range, data) => {
	const sheet = range.sheet;
	const entries = Object.entries(data);
	let rowidx = 0;
	let colidx = -1;
	let newCell = null;
	let value = null;
	const onSheetUpdate = disableSheetUpdate(sheet);
	range.iterate((cell, index, nextcol) => {
		if (nextcol) {
			rowidx = 0;
			colidx += 1;
		}
		// fix colidx might be larger than available entries (DL-3764)
		if (colidx < entries.length) {
			const [key, values] = entries[colidx];
			if (rowidx === 0) value = key;
			else if (Array.isArray(values)) value = values[rowidx - 1];
			else if (rowidx === 1) value = values;
			else value = null;
			if (value != null) newCell = new Cell(value, Term.fromValue(value));
		}
		sheet.setCellAt(index, newCell);
		rowidx += 1;
		newCell = null;
	});
	enableSheetUpdate(sheet, onSheetUpdate);
};

const addHTTPResponseToInbox = async (response, context, error, parseResponseBody) => {
	const inbox = context.term.scope.streamsheet.inbox;
	if (error) {
		const errorMessage = new Message(error);
		message.metadata.label = `Error: ${context.term.name}`;
		inbox.put(errorMessage);
	} else {
		let messageContent = response.data;
		let messageLabel = `${context.term.name}`;
		if (parseResponseBody) {
			// TODO: move parsing out of this function
			const mimeType = response.headers['content-type'];
			try {
				// try to parse content using the predefined parsers
				messageContent = await parse(response.data, mimeType);
				messageLabel += ` [${messageContent.extension}]`;
			} catch (error) {
				// ignore parser error
			}
		}
		const message = new Message(messageContent);
		message.metadata.transportDetails = {
			headers: response.headers,
			status: response.status,
			statusText: response.statusText,
			request: {
				data: response.config.data,
				headers: response.config.headers,
				method: response.config.method,
				url: response.config.url
			}
		}
		message.metadata.label = messageLabel;
		inbox.put(message);		
	}
}

// TODO: should be cell not range
const addHTTPResponseToCell = (response, range) => {
	let counter = 0;
	range.iterate((cell, index) => {
		if (counter === 0) {
			sheet.setCellAt(index, new Cell(response.data[path], Term.fromValue(response.data[path])));
		} else {
			sheet.setCellAt(index, undefined);
		}
		counter++;
	});
}

const addHTTPResponseToRange = async (response, range, context, error) => {
	const mimeType = response.headers['content-type'];
	const result = await parse(response.data, mimeType);
	putKeyValuesToRange(range, result.ast);
}

module.exports = {
	addHTTPResponseToInbox,
	addHTTPResponseToCell,
	addHTTPResponseToRange
}