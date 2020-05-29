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
const { TestHelper } = require('@cedalo/sdk-streams');
const testServer = require('./smtpserver/server');
const streamModule = require('..');

testServer.run();

const connectorConfig = {
	host: 'localhost',
	port: 587,
	security: false,
	allowSelfSigned: true
};
const PRODUCER_CONFIG = {
	className: 'ProducerConfiguration',
	connector: connectorConfig,
	from: 'user1@example.com',
	username: 'test',
	password: 'test'
};

const exampleMessage = () => {
	const message = {
		to: 'user2@example.com',
		cc: 'user3@example.com',
		message: 'A message',
		subject: 'The subject',
		attachments: [{ filename: 'test.txt', content: 'A simple string' }]
	};
	return Object.assign({}, message);
};

const setupProducer = async () =>
	TestHelper.createConnectorAndConnect(streamModule, PRODUCER_CONFIG);

describe('SmtpProducer', () => {
	it('Should be able to publish an email', async (done) => {
		testServer.reset();
		// const feeder = await setupStream({ connector: { pop3Host: null } });
		const message = exampleMessage();
		const producer = await setupProducer();
		producer._produce(message);
		await testServer.wait();
		const received = testServer.getMail(0);
		expect(received.to.text).toBe(message.to);
		expect(received.from.text).toBe(PRODUCER_CONFIG.from);
		expect(received.subject).toBe(message.subject);
		expect(received.text).toBe(message.message);
		expect(received.cc.text).toBe(message.cc);
		expect(received.attachments[0].filename).toBe(
			message.attachments[0].filename
		);
		expect(received.attachments[0].content.toString()).toBe(
			message.attachments[0].content
		);

		done();
	});
});
