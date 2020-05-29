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
const KafkaFunctions = require('./KafkaFunctions');

// TODO: add schema field and button. On press sends schema once to registry and then save reference in config

module.exports = class KafkaProviderConfiguration extends sdk.ProviderConfiguration {
	constructor() {
		super({
			name: 'Kafka Provider'
		});
		/*
		this.addConnectorDefinition({
			id: 'mode',
			label: {
				en: 'Connection Mode',
				de: 'Verbindungsart'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.SELECT,
			options: [
				{
					label: {
						en: 'Kafka only',
						de: 'Nur Kafka'
					},
					value: 'kafka'
				},
				{
					label: 'KSQL',
					value: 'ksql'
				}
			],
			defaultValue: 'kafka'
		});
		*/
		this.addConnectorDefinition({
			id: 'auth',
			label: {
				en: 'Authentication',
				de: 'Authentifizierung'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.SELECT,
			options: [
				{
					label: {
						en: 'None',
						de: 'Ohne'
					},
					value: 'none'
				},
				{
					label: 'TLS (SSL)',
					value: 'ssl'
				},
				{
					label: 'TLS (SSL)/ SASL',
					value: 'ssl_sasl'
				}
			],
			defaultValue: 'none'
		});

		this.addConnectorDefinition({
			id: 'authMechanism',
			label: {
				en: 'Mechanism',
				de: 'Mechanism'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.SELECT,
			options: [
				{
					label: 'plain',
					value: 'plain'
				},
				{
					label: 'scram-sha-256',
					value: 'scram-sha-256'
				},
				{
					label: 'scram-sha-512',
					value: 'scram-sha-512'
				}
			],
			defaultValue: 'plain',
			dependsOnPath: 'auth',
			dependsOnValue: ['ssl_sasl']
		});
		this.addConnectorDefinition({
			id: 'connectionString',
			label: 'Kafka URL',
			defaultValue: 'localhost:9092',
			help: '(zookeeper: e.g. localhost:2181/, kafka only: ' +
					' kafka-1.us-east-1.myapp.com:9093,kafka-2.us-east-1.myapp.com:9093)',
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXT
		});
		this.addConnectorDefinition({
			id: 'userName',
			label: {
				en: 'User Name',
				de: 'Benutzername'
			},
			dependsOnPath: 'auth',
			dependsOnValue: ['ssl_sasl']
		});
		this.addConnectorDefinition({
			id: 'password',
			label: {
				en: 'Password',
				de: 'Kennwort'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.PASSWORD,
			dependsOnPath: 'auth',
			dependsOnValue: ['ssl_sasl']
		});

		this.addConnectorDefinition({
			id: 'certPath',
			label: {
				en: 'Client certificate file',
				de: 'Client Zertifikat (Datei)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.FILESECRET,
			dependsOnPath: 'auth',
			dependsOnValue: ['ssl', 'ssl_sasl'],
			advanced: true
		});
		this.addConnectorDefinition({
			id: 'keyPath',
			label: {
				en: 'Private key file associated with the client certificate',
				de: 'Privater Schlüssel für das Client Zertifikat (Datei)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.FILESECRET,
			dependsOnPath: 'auth',
			dependsOnValue: ['ssl', 'ssl_sasl'],
			advanced: true
		});
		this.addConnectorDefinition({
			id: 'caCert',
			label: {
				en: 'CA certificate file',
				de: 'CA Zertifikat (Datei)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.FILESECRET,
			dependsOnPath: 'auth',
			dependsOnValue: ['ssl', 'ssl_sasl'],
			advanced: true
		});
		this.addConnectorDefinition({
			id: 'passphrase',
			label: {
				en: 'Pass Phrase',
				de: 'Kennwort'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXT,
			dependsOnPath: 'auth',
			dependsOnValue: ['ssl', 'ssl_sasl'],
			advanced: true
		});


		this.addConnectorDefinition({
			id: 'ksqlRESTUrl',
			label: {
				en: 'KSQL REST URL',
				de: 'KSQL REST URL'
			},
			defaultValue: 'localhost:9092',
			advanced: true
			// dependsOnPath: 'mode',
		//	dependsOnValue: ['ksql']
		});


		this.addConnectorDefinition({
			id: 'ksqlCommand',
			label: {
				en: 'KSQL Command',
				de: 'KSQL Command'
			},
			advanced: true
			// dependsOnPath: 'mode',
			// dependsOnValue: ['ksql']
		});
		this.addConnectorDefinition({
			id: 'ksqlCommandRun',
			label: {
				en: 'Execute Command',
				de: 'Execute Command'
			},
			// dependsOnPath: 'mode',
			// dependsOnValue: ['ksql'],
			type: sdk.ProviderConfiguration.FIELDTYPES.BUTTON,
			advanced: true
		});
		this.addConnectorDefinition({
			id: 'connectTimeout',
			label: {
				en: 'Connect Timeout',
				de: 'Verbindung Timeout'
			},
			defaultValue: 10000,
			type: sdk.ProviderConfiguration.FIELDTYPES.POSINT,
			advanced: true
		});
		this.addConsumerDefinition({
			id: 'clientId',
			label: {
				en: 'Client Id (e.g. kafka-node-client)',
				de: 'Client Id (z.B. kafka-node-client)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.RANDOM_STRING,
			defaultValue: undefined
		});

		this.addProducerDefinition({
			id: 'clientId',
			label: {
				en: 'Client Id (e.g. kafka-node-client)',
				de: 'Client Id (z.B. kafka-node-client)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXT
		});

		this.addConsumerDefinition({
			id: 'groupId',
			label: {
				en: 'Group Id',
				de: 'Group Id'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXT
		});

		this.addConsumerDefinition({
			id: 'topics',
			label: {
				en: 'Kafka Topics (note: no /)',
				de: 'Kafka Topics (Achtung: keine /)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXTLIST
		//	dependsOnPath: 'mode',
		//	dependsOnValue: ['kafka']
		});
/*
		this.addConsumerDefinition({
			id: 'offset',
			label: {
				en: 'Offset to set',
				de: 'Offset to set',
			}
		});
		this.addConsumerDefinition({
			id: 'setOffsetCommandRun',
			label: {
				en: 'Set Offset',
				de: 'Set Offset'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.BUTTON
		});
*/
		this.addConsumerDefinition({
			id: 'ksqlQuery',
			label: 'Query',
		//	dependsOnPath: 'connector.mode',
		//	dependsOnValue: ['ksql'],
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXT,
			advanced: true
		});

		this.addProducerDefinition({
			id: 'topic',
			label: 'Topic',
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXT
		});

		this.addFunctionDefinition({
			name: 'KAFKA.PUBLISH',
			displayName: true,
			baseFunction: 'produce',
			parameters: [
				{
					id: 'message',
					label: {
						en: 'Message',
						de: 'Nachricht'
					},
					description: '',
					type: {
						name: 'union',
						types: [
							{ name: 'json' },
							{ name: 'number' },
							{ name: 'string' }
						]
					}
				},
				{
					id: 'topic',
					label: {
						en: 'Topic',
						de: 'Topic'
					},
					description: '',
					type: {
						name: 'string'
					}
				},
				{
					id: 'key',
					label: {
						en: 'Key',
						de: 'Key'
					},
					type: {
						name: 'string'
					},
					optional: true
				}
			]
		});

		this.addFunctionDefinition(this.requestFunction((target, resultKeys, timeout) => ({
			name: KafkaFunctions.QUERY,
			displayName: true,
			baseFunction: 'request',
			parameters: [
				{
					id: 'query',
					label: {
						en: 'Query',
						de: 'Query'
					},
					description: '',
					type: {
						name: 'string'
					}
				},
				target,
				// resultKeys,
				timeout
			]
		})));

		this.addFunctionDefinition(this.requestFunction((target, resultKeys, timeout) => ({
			name: KafkaFunctions.COMMAND,
			displayName: true,
			baseFunction: 'request',
			parameters: [
				{
					id: 'ksqlCommand',
					label: {
						en: 'Command',
						de: 'Command'
					},
					description: '',
					type: {
						name: 'string'
					}
				},
				target,
				timeout
			]
		})));
	}
};
