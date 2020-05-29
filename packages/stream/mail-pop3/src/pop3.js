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
const pop3 = require('./poplib-wrapper');

const create = async (config) => {
	const state = {};
	const { username, password } = config;
	const { host, port, security, allowSelfSigned = false } = config.connector;
	const client = pop3(port, host, {
		enabletls: security,
		tlserrs: allowSelfSigned
	});

	const connect = async () => {
		try {
			const connection = await client.connect();
			await connection.login(username, password);
			// eslint-disable-next-line no-console
			connection.on('error', (e) => { console.error(e); });
			state.connection = connection;
			return connection;
		} catch (e) {
			throw new Error(`Failed to connect to POP3 server ${host}:${port}. ${e}`);
		}
	};

	const count = async () => {
		const connection = state.connection || await connect();
		return connection.list();
	};

	const retrieve = async (index) => {
		const connection = state.connection || await connect();
		return connection.retr(index);
	};

	const delete_ = async (index) => {
		const connection = state.connection || await connect();
		return connection.dele(index);
	};

	const dispose = async () => {
		if (state.connection) {
			await state.connection.quit();
			state.connection = null;
		}
	};

	// const transaction = async (f) => {
	// 	await f({ count, retrieve, delete_ });
	// 	await dispose();
	// };

	await connect();

	return { count, retrieve, delete_, dispose, quit: dispose };
};

module.exports = { create };
