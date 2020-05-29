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
const SMTPServer = require('smtp-server').SMTPServer;
const parser = require('mailparser').simpleParser;

const received = [];
const errors = [];
let onMessageCallback = () => { };
let resolveWait = () => { };

const server = new SMTPServer({
	onAuth(auth, session, callback) {
		if (auth.username === 'invalid' || auth.password === 'invalid') {
			callback(new Error('Invalid username or password'));
		}
		callback(null, { user: auth.username });
	},
	async onData(stream, session, callback) {
		const parsed = await parser(stream);
		// Weird new line at end of text
		parsed.text = parsed.text.trim();
		received.push(parsed);
		if (onMessageCallback) {
			onMessageCallback(parsed);
		}
		resolveWait();
		callback();
	}
});

server.on('error', (err) => {
	errors.push(err);
});

const run = (onMessage) => {
	onMessageCallback = onMessage;
	server.listen(587, '127.0.0.1');
};

const wait = async () =>
	new Promise((resolve) => {
		resolveWait = resolve;
	});

const getMail = index => received[index];
const getError = index => errors[index];

const reset = () => {
	received.length = 0;
	errors.length = 0;
};

module.exports = { run, getMail, reset, getError, wait };

