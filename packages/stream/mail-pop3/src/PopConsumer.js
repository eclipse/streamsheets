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
const { ConsumerMixin, Connector } = require('@cedalo/sdk-streams');
const PopConnector = require('./PopConnector');
const parse = require('mailparser').simpleParser;

const MAX_ATTACHMENT_SIZE = 6500;
const POLL_INTERVAL_DEFAULT_SECONDS = 60 * 5;

module.exports = class PopConsumer extends ConsumerMixin(PopConnector) {

	constructor(config) {
		super({ ...config, type: Connector.TYPE.FEEDER });
		this._pollInterval = null;
	}

	async initialize() {
		this.currentConfig = JSON.parse(JSON.stringify(this.config));
		const configurePollInterval = this.currentConfig.connector.pollInterval;
		let pollIntervalSeconds = parseInt(configurePollInterval, 10);
		if (isNaN(pollIntervalSeconds)) {
			this.handleError(
				`Invalid poll interval ${configurePollInterval}.
				Using default instead: ${POLL_INTERVAL_DEFAULT_SECONDS}`
			);
			pollIntervalSeconds = POLL_INTERVAL_DEFAULT_SECONDS;
		}
		this.logger.debug(`POP3 Poll interval: ${pollIntervalSeconds}`);
		if (this._pop3) {
			await this._pop3Poll();
			this._pollInterval = setInterval(() => this._pop3Poll(), pollIntervalSeconds * 1000);
		}
	}

	async dispose() {
		await super.dispose();
		if (this._pollInterval) {
			clearInterval(this._pollInterval);
			this._pollInterval = null;
		}
	}

	async _pop3Poll() {
		try {
			const msgCount = await this._pop3.count();
			this.logger.info(`Fetching ${msgCount} messages from mail server`);
			for (let i = 1; i <= msgCount; i += 1) {
				/* eslint-disable no-await-in-loop */
				const rawMessage = await this._pop3.retrieve(i);
				const message = await this._transformMessage(rawMessage);
				this.logger.debug(
					`Fetched message. From '${message.Content.FROM}' to '${message.Content.TO}'
					with subject '${message.Content.Subject}`
				);
				this.onMessage(this.currentConfig.username, message);
				await this._pop3.delete_(i);
				/* eslint-enable no-await-in-loop */
			}
			await this._pop3.quit();
		} catch (e) {
			this.handleError(e);
		}
	}

	async _transformMessage(rawMessage) {
		const parsedMessage = await parse(rawMessage);
		const attachments = parsedMessage.attachments.map((a) => {
			const msgAttachment = { Filename: a.filename, Type: a.contentType };
			// Make configurable
			if (a.size < MAX_ATTACHMENT_SIZE) {
				msgAttachment.Content = a.content.toString('base64');
			} else {
				msgAttachment.Content = 'File size limit exceeded';
			}
			return msgAttachment;
		});
		// Replace new lines with spaces. Sheet can not handle new lines properly
		const text = parsedMessage.text ? parsedMessage.text.replace(/\n/g, ' ') : parsedMessage.text;

		const message = {
			Content: {
				FROM: parsedMessage.from ? parsedMessage.from.text : '',
				TO: parsedMessage.to ? parsedMessage.to.text.split(',').map(s => s.trim()) : [],
				CC: parsedMessage.cc ? parsedMessage.cc.text.split(',').map(s => s.trim()) : [],
				Subject: parsedMessage.subject ? parsedMessage.subject : '',
				Plaintext: text,
				Attachments: attachments
			}
		};
		return message;
	}

};
