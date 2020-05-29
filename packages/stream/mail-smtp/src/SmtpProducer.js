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
const { ProducerMixin, Connector } = require('@cedalo/sdk-streams');
const SmtpConnector = require('./SmtpConnector');

module.exports = class SmtpProducer extends ProducerMixin(SmtpConnector) {

	constructor(config) {
		super({ ...config, type: Connector.TYPE.PRODUCER });
	}

	async initialize() {
		this.currentConfig = JSON.parse(JSON.stringify(this.config));
	}

	async produce(config) {
		const { to, cc, bcc, subject, message, attachments } = config;
		const from = this.currentConfig.from;
		const smtpMessage = {
			from,
			to,
			cc,
			bcc,
			subject,
			text: message
		};
		if (Array.isArray(attachments)) {
			smtpMessage.attachments =
				attachments.map(a => (
					{
						filename: a.filename,
						content: a.content,
						encoding: a.encoding || 'utf-8',
						contentType: a.contentType
					}));
		}
		this.logger.info(`Sending email as ${from} to: ${to} cc: ${cc}, bcc: ${bcc} with subject '${subject}'`);
		try {
			this._smtp.send(smtpMessage);
		} catch (e) {
			this.handleError(e);
		}
	}

};
