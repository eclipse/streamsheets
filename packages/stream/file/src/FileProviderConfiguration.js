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
const { ProviderConfiguration } = require('@cedalo/sdk-streams');

const encodingString = process.env.FILE_STREAM_ENCODINGS || '';
const encodings = encodingString.split(',');
const defaultRoot = process.env.FILE_STREAM_DEFAULT_ROOT || '';

module.exports = class FileProviderConfiguration extends ProviderConfiguration {
	constructor() {
		super({
			name: 'File Provider'
		});
		this.canConsume = false;
		// this.addConnectorDefinition({
		// 	id: 'protocol',
		// 	label: {
		// 		en: 'Protocol',
		// 		de: 'Protokoll'
		// 	},
		// 	type: ProviderConfiguration.FIELDTYPES.SELECT,
		// 	options: [
		// 		{
		// 			label: {
		// 				en: 'Local folder',
		// 				de: 'Lokales Verzeichnis'
		// 			},
		// 			value: 'local'
		// 		},
		// 		{
		// 			label: 'SFTP',
		// 			value: 'sftp'
		// 		},
		// 		{
		// 			label: 'FTP',
		// 			value: 'ftp'
		// 		}
		// 	],
		// 	defaultValue: 'local'
		// });

		this.addConnectorDefinition({
			id: 'format',
			label: {
				en: 'File Data Format',
				de: 'Dateiformat'
			},
			type: ProviderConfiguration.FIELDTYPES.SELECT,
			options: [
				{
					label: {
						en: 'Simple text',
						de: 'Text'
					},
					value: 'txt'
				},
				{
					label: 'CSV (comma)',
					value: 'CSV'
				}
			],
			defaultValue: 'txt'
		});

		// this.addConnectorDefinition({
		// 	id: 'host',
		// 	label: 'Host',
		// 	dependsOnPath: 'protocol',
		// 	dependsOnValue: ['sftp', 'ftp']
		// });

		// this.addConnectorDefinition({
		// 	id: 'port',
		// 	label: 'Port',
		// 	dependsOnPath: 'protocol',
		// 	dependsOnValue: ['sftp', 'ftp']
		// });

		// this.addConnectorDefinition({
		// 	id: 'username',
		// 	label: {
		// 		en: 'User Name',
		// 		de: 'Benutzername'
		// 	},
		// 	dependsOnPath: 'protocol',
		// 	dependsOnValue: ['sftp', 'ftp']
		// });

		// this.addConnectorDefinition({
		// 	id: 'password',
		// 	label: {
		// 		en: 'Password',
		// 		de: 'Kennwort'
		// 	},
		// 	type: ProviderConfiguration.FIELDTYPES.PASSWORD,
		// 	dependsOnPath: 'protocol',
		// 	dependsOnValue: ['sftp', 'ftp']
		// });

		this.addConnectorDefinition({
			id: 'rootDir',
			label: {
				en: 'Root Directory',
				de: 'Wurzelverzeichnis'
			},
			defaultValue: defaultRoot
		});

		this.addConnectorDefinition({
			id: 'encoding',
			label: 'Encoding',
			type: ProviderConfiguration.FIELDTYPES.SELECT,
			options: [
				{
					label: 'UTF-8',
					value: 'utf-8'
				},
				...encodings.map((encoding) => ({
					label: encoding,
					value: encoding
				}))
			],
			defaultValue: 'utf-8'
		});

		this.addFunctionDefinition({
			name: 'FILE.WRITE',
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
						name: 'list',
						type: {
							name: 'list',
							type: {
								name: 'string'
							}
						}
					}
				},
				{
					id: 'filename',
					label: {
						en: 'Filename',
						de: 'Dateiname'
					},
					description: '',
					type: {
						name: 'string'
					}
				},
				{
					id: 'directory',
					label: {
						en: 'Directory',
						de: 'Verzeichnis'
					},
					description: '',
					type: {
						name: 'string'
					},
					defaultValue: ''
				},
				{
					id: 'mode',
					label: {
						en: 'Mode',
						de: 'Modus'
					},
					description: '',
					type: {
						name: 'enum',
						values: ['create', 'append']
					},
					defaultValue: 'append'
				},
				{
					id: 'separator',
					label: {
						en: 'Separator',
						de: 'Trennzeichen'
					},
					type: {
						name: 'string'
					},
					defaultValue: ';'
				}
			]
		});
	}
};
