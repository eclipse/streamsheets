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

module.exports = class MqttProviderConfiguration extends sdk.ProviderConfiguration {
	constructor() {
		super({
			name: 'MQTT Provider'
		});
		this.addConnectorDefinition({
			id: 'protocolVersion',
			label: 'Protocol Version',
			type: sdk.ProviderConfiguration.FIELDTYPES.SELECT_NUM,
			options: [
				{
					label: "MQTT v5.0",
					value: 5
				},
				{
					label: "MQTT v3.1.1",
					value: 4
				}
			],
			defaultValue: 4,
			advanced: true
		});
		this.addConnectorDefinition({
			id: 'url',
			label: 'URL',
			defaultValue: 'mqtt://localhost',
			help: 'mqtt://, mqtts://, tcp://,tls://, ws://, wss://'
		});
		this.addConnectorDefinition({
			id: 'userPropertiesConnect',
			label: {
				en: 'User Properties (connect)',
				de: 'User Properties (connect)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.MULTITEXTFIELDPAIRS,
			advanced: true,
			dependsOnPath: 'protocolVersion',
			dependsOnValue: [5],
			defaultValue: undefined
		});
		this.addConsumerDefinition({
			id: 'fixedClientId',
			label: {
				en: 'Static Client Id',
				de: 'Statische Client Id'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.CHECKBOX,
			defaultValue: false
		});
		this.addConsumerDefinition({
			id: 'clientId',
			label: {
				en: 'Client Id',
				de: 'Client Id'
			},
			help: {
				en: 'The Client Id is used for identification of the client by the broker. Identical Client Ids can lead to unforeseeable effects on the broker and the system!',
				de: 'Die Client Id wird vom Broker zur Identifizierung des Clients verwendet. Identische Client Ids können zu unvorhersehbaren Auswirkungen auf den Broker und das System führen!'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.RANDOM_STRING,
			dependsOnPath: 'fixedClientId',
			dependsOnValue: [true],
			defaultValue: undefined
		});

		this.addProducerDefinition({
			id: 'fixedClientId',
			label: {
				en: 'Static Client Id',
				de: 'Statische Client Id'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.CHECKBOX,
			defaultValue: false
		});
		this.addProducerDefinition({
			id: 'clientId',
			label: {
				en: 'Client Id',
				de: 'Client Id'
			},
			help: {
				en: 'The Client Id is used for identification of the client by the broker. Identical Client Ids can lead to unforeseeable effects on the broker and the system!',
				de: 'Die Client Id wird vom Broker zur Identifizierung des Clients verwendet. Identische Client Ids können zu unvorhersehbaren Auswirkungen auf den Broker und das System führen!'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.RANDOM_STRING,
			dependsOnPath: 'fixedClientId',
			dependsOnValue: [true],
			defaultValue: undefined
		});

		this.addConsumerDefinition({
			id: 'clean',
			label: {
				en: 'Clean',
				de: 'Clean'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.CHECKBOX,
			defaultValue: true,
		});

		this.addProducerDefinition({
			id: 'clean',
			label: {
				en: 'Clean',
				de: 'Clean'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.CHECKBOX,
			defaultValue: true,
		});

		this.addConsumerDefinition({
			id: 'userPropertiesSubscribe',
			label: {
				en: 'User Properties (subscribe)',
				de: 'User Properties (subscribe)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.MULTITEXTFIELDPAIRS,
			dependsOnPath: 'protocolVersion',
			dependsOnValue: [5],
			advanced: true,
		});
		this.addConnectorDefinition({
			id: 'userName',
			label: {
				en: 'User Name',
				de: 'Benutzername'
			}
		});
		this.addConnectorDefinition({
			id: 'password',
			label: {
				en: 'Password',
				de: 'Kennwort'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.PASSWORD
		});
		this.addConnectorDefinition({
			id: 'certPath',
			label: {
				en: 'Client certificate',
				de: 'Client Zertifikat (Datei)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.FILESECRET,
			advanced: true
		});
		this.addConnectorDefinition({
			id: 'keyPath',
			label: {
				en: 'Private key file associated with the client certificate',
				de: 'Privater Schlüssel für das Client Zertifikat (Datei)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.FILESECRET,
			advanced: true
		});
		this.addConnectorDefinition({
			id: 'caCert',
			label: {
				en: 'CA certificate file',
				de: 'CA Zertifikat (Datei)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.FILESECRET,
			advanced: true
		});
		this.addConnectorDefinition({
			id: 'baseTopic',
			label: {
				en: 'Base Topic',
				de: 'Basistopic'
			},
			defaultValue: ''
		});
		this.addConnectorDefinition({
			id: 'retain',
			label: {
				en: 'Retain Message',
				de: 'Nachricht behalten'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.CHECKBOX,
			defaultValue: false,
			advanced: true
		});
		this.addConnectorDefinition({
			id: 'qos',
			label: 'QoS',
			type: sdk.ProviderConfiguration.FIELDTYPES.SELECT_NUM,
			options: [
				{
					label: {
						en: 'At most once (0)',
						de: 'Höchstens einmal (0)'
					},
					value: 0
				},
				{
					label: {
						en: 'At least once (1)',
						de: 'Mindestens einmal (0)'
					},
					value: 1
				},
				{
					label: {
						en: 'Exactly once (2)',
						de: 'Genau einmal (2)'
					},
					value: 2
				}
			],
			defaultValue: 0,
			advanced: true
		});

		this.addConsumerDefinition({
			id: 'topics',
			label: {
				en: 'MQTT Topics (extending base topic)',
				de: 'MQTT Topics (erweitert das Basistopic)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXTLIST
		});

		this.addProducerDefinition({
			id: 'pubTopic',
			label: {
				en: 'Topic',
				de: 'Topic'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.TEXT
		});

		this.addProducerDefinition({
			id: 'userPropertiesProduce',
			label: {
				en: 'User Properties (produce)',
				de: 'User Properties (produce)'
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.MULTITEXTFIELDPAIRS,
			dependsOnPath: 'protocolVersion',
			dependsOnValue: [5],
			advanced: true,
		});

		const functionDefinition = {
			name: 'MQTT.PUBLISH',
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
						name: 'mqtt_topic',
						context: 'publish'
					}
				},
				{
					id: 'qos',
					label: {
						en: 'QualityOfService',
						de: 'QualityOfService'
					},
					description: '',
					type: {
						name: 'integer',
						min: 0,
						max: 2
					},
					optional: true
				},
				{
					id: 'userProperties',
					label: {
						en: 'User Properties',
						de: 'User Properties'
					},
					description: '',
					type: {
						name: 'union',
						types: [
							{ name: 'json' },
							{ name: 'number' },
							{ name: 'string' }
						]
					},
					optional: true
				}
			]
		};

		this.addFunctionDefinition(functionDefinition);
		// Deprecated, kept in case old machines are loaded
		this.addFunctionDefinition(
			Object.assign({}, functionDefinition, {
				name: 'PUBLISH',
				displayName: true,
				deprecated: true
			})
		);
	}
};
