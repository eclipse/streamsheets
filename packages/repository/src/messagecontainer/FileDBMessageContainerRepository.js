'use strict';

const { mix } = require('mixwith');

const AbstractMessageContainerRepository = require('./AbstractMessageContainerRepository');
const FileDBMixin = require('./../filedb/FileDBMixin');

/**
 * An message receiver repository which stores the message receivers in a local JSON file.
 *
 * @class FileDBmessageContainerRepository
 * @extends AbstractmessageContainerRepository
 * @public
 */
class FileDBMessageContainerRepository extends mix(AbstractMessageContainerRepository).with(FileDBMixin) {
	constructor({ dbFile }) {
		super({ dbFile });
	}

	getMessageContainers() {
		return new Promise((resolve) => {
			resolve(this.db.get('messageContainers').value());
		});
	}

	saveMessageContainer(messageContainer) {
		return new Promise((resolve) => {
			this.db.get('messageContainers').push(messageContainer).value();
			resolve(messageContainer);
		});
	}

	findMessageContainer(id) {
		return new Promise((resolve) => {
			const messageContainer = this.db.get('messageContainers')
				.find({ id })
				.value();
			resolve(messageContainer);
		});
	}

	updateMessageContainer(updatedMessageContainer) {
		return new Promise((resolve) => {
			const messageContainer = this.db.get('messageContainers')
				.find({ id: updatedMessageContainer.id })
				.assign(updatedMessageContainer)
				.value();
			resolve(messageContainer);
		});
	}
}
module.exports = FileDBMessageContainerRepository;
