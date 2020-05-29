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
const sdk = require('@cedalo/sdk-streams');

module.exports = class SmtpProviderConfiguration extends sdk.ProviderConfiguration {
	constructor() {
		super({
			name: 'SMTP Provider'
		});
		this.canConsume = false;
		this.addConnectorDefinition({
			id: 'host',
			label: 'Host'
		});
		this.addConnectorDefinition({
			id: 'port',
			label: 'Port',
			defaultValue: 587
		});
		this.addConnectorDefinition({
			id: 'security',
			label: 'Security',
			defaultValue: 'starttls',
			type: sdk.ProviderConfiguration.FIELDTYPES.SELECT,
			options: [{
				label: {
					en: 'None',
					de: 'Keine'
				},
				value: 'none'
			},
			{
				label: 'STARTTLS',
				value: 'starttls'
			},
			{
				label: 'SSL/TLS',
				value: 'tls'
			}]
		});


		this.addProducerDefinition({
			id: 'username',
			label: {
				en: 'User Name',
				de: 'Benutzername'
			}
		});
		this.addProducerDefinition({
			id: 'password',
			label: {
				en: 'Password',
				de: 'Kennwort'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.PASSWORD
		});

		this.addProducerDefinition({
			id: 'from',
			label: {
				en: 'Sender',
				de: 'Sender'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXT
		});

		this.addFunctionDefinition({
			name: 'MAIL.SEND',
			displayName: true,
			baseFunction: 'produce',
			parameters: [
				{
					id: 'message',
					label: {
						en: 'Text',
						de: 'Text'
					},
					description: '',
					type: {
						name: 'string'
					},
					defaultValue: ''
				},
				{
					id: 'subject',
					label: {
						en: 'Subject',
						de: 'Betreff'
					},
					description: '',
					type: {
						name: 'string'
					},
					defaultValue: ''
				},
				{
					id: 'to',
					label: {
						en: 'TO',
						de: 'TO'
					},
					description: '',
					type: {
						name: 'list',
						type: {
							name: 'string'
						},
						min: 1
					}
				},
				{
					id: 'cc',
					label: {
						en: 'CC',
						de: 'CC'
					},
					description: '',
					type: {
						name: 'list',
						type: {
							name: 'string'
						}
					},
					optional: true
				},
				{
					id: 'bcc',
					label: {
						en: 'BCC',
						de: 'BCC'
					},
					description: '',
					type: {
						name: 'list',
						type: {
							name: 'string'
						}
					},
					optional: true
				},
				{
					id: 'attachments',
					label: {
						en: 'Attachments',
						de: 'Anhänge'
					},
					description: '',
					type: {
						name: 'list',
						type: {
							name: 'json',
							fields: [
								{
									id: 'filename',
									label: {
										en: 'Filename',
										de: 'Dateiname'
									},
									type: {
										name: 'string'
									},
									description: ''
								},
								{
									id: 'content',
									label: {
										en: 'Content',
										de: 'Inhalt'
									},
									type: {
										name: 'string'
									},
									description: ''
								},
								{
									id: 'encoding',
									label: {
										en: 'Encoding',
										de: 'Encoding'
									},
									type: {
										name: 'string'
									},
									description: '',
									defaultValue: 'utf-8'
								},
								{
									id: 'contentType',
									label: {
										en: 'Content-Type',
										de: 'Content-Type'
									},
									type: {
										name: 'string'
									},
									description: '',
									optional: true
								}
							]
						}
					},
					optional: true
				}
			]
		});

		// this.addProducerDefinition({
		// 	id: 'to',
		// 	label: {
		// 		en: 'Recipient(s)',
		// 		de: 'Recipient(s)'
		// 	},
		// 	type: sdk.ProviderConfiguration.FIELDTYPES.TEXTLIST
		// });

		// this.addProducerDefinition({
		// 	id: 'cc',
		// 	label: {
		// 		en: 'cc(s)',
		// 		de: 'cc(s)'
		// 	},
		// 	type: sdk.ProviderConfiguration.FIELDTYPES.TEXTLIST
		// });

		// this.addProducerDefinition({
		// 	id: 'bcc',
		// 	label: {
		// 		en: 'bcc(s)',
		// 		de: 'bcc(s)'
		// 	},
		// 	type: sdk.ProviderConfiguration.FIELDTYPES.TEXTLIST
		// });

		// this.addProducerDefinition({
		// 	id: 'subject',
		// 	label: {
		// 		en: 'Subject',
		// 		de: 'Thema'
		// 	},
		// 	type: sdk.ProviderConfiguration.FIELDTYPES.TEXT
		// });

		// this.addProducerDefinition({
		// 	id: 'text',
		// 	label: {
		// 		en: 'Message',
		// 		de: 'Message'
		// 	},
		// 	type: sdk.ProviderConfiguration.FIELDTYPES.MULTILINETEXT
		// });
	}
};
