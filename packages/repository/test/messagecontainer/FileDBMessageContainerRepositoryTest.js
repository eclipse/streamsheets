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
'use strict';

const assert = require('assert');
const { FileDBMessageContainerRepository } = require('../..');
// const { Inbox } = require('@cedalo/machine-core');
const fs = require('fs-extra');
const path = require('path');

const DB_FILE_PATH = path.join(__dirname, 'messagecontainer.json');
let messageContainerRepository = null;

describe('machineserver-repository#FileDBMessageContainerRepositoryTest', () => {
	beforeAll((done) => {
		console.log(path.join(__dirname, 'messagecontainer-default.json'));
		fs.copy(
			path.join(__dirname, 'messagecontainer-default.json'),
			DB_FILE_PATH,
			() => {
				messageContainerRepository = new FileDBMessageContainerRepository({ dbFile: DB_FILE_PATH });
				done();
			});
	});
	afterAll((done) => {
		fs.remove(
			DB_FILE_PATH,
			done
		);
	});
	it('should get a list of all message containers', (done) => {
		messageContainerRepository.getMessageContainers().then((messagecontainers) => {
			assert(Array.isArray(messagecontainers));
			done();
		});
	});
	it.skip('should save a message container', (/* done */) => {
		// let numberOfMessageContainers = 0;
		// messageContainerRepository.getMessageContainers()
		// 	.then((messageContainers) => {
		// 		numberOfMessageContainers = messageContainers.length;
		// 		const testMessageContainer = new MessageContainer({
		// 			id: `example-messagecontainer-${numberOfMessageContainers + 1}`,
		// 			name: `Example Message Container ${numberOfMessageContainers + 1}`
		// 		});
		// 		messageContainerRepository.saveMessageContainer(testMessageContainer).then(() => {
		// 			messageContainerRepository.getMessageContainers().then((messageContainersResp) => {
		// 				assert.equal(messageContainersResp.length, numberOfMessageContainers + 1);
		// 				done();
		// 			});
		// 		});
		// 	});
	});
	it.skip('should update a message container', (/* done */) => {
		// const id = 'example-messagecontainer-1';
		// messageContainerRepository.findMessageContainer(id)
		// 	.then((messageContainer) => {
		// 		assert.equal(messageContainer.name, 'Example Message Container 1');
		// 		messageContainer.name = 'Updated Example Message Container 1';
		// 		messageContainerRepository.updateMessageContainer(messageContainer)
		// 			.then(() => {
		// 				messageContainerRepository.findMessageContainer(id).then((newMessageContainer) => {
		// 					assert.equal(newMessageContainer.name, 'Updated Example Message Container 1');
		// 					done();
		// 				});
		// 			});
		// 	});
	});
	it('should save and find a message container', (done) => {
		const id = 'example-messagecontainer-1';
		messageContainerRepository.findMessageContainer(id).then((mesageContainer) => {
			assert.equal(mesageContainer.id, id);
			done();
		});
	});
});
