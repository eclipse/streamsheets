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
const url = require('url');
const MqttConsumer = require('./MqttConsumer');
const MqttProducer = require('./MqttProducer');
const MqttProviderConfiguration = require('./MqttProviderConfiguration');

module.exports = class MqttProvider extends sdk.Provider {
	constructor() {
		super(new MqttProviderConfiguration());
	}

	get Consumer() {
		return MqttConsumer;
	}

	get Producer() {
		return MqttProducer;
	}

	validateConsumer(config) {
		const fieldErrors = {};

		// config.topics					do topic validation
		// config.userPropertiesSubscribe
		// config.fixedClientId 			boolean (false)
		// config.clientId					required if fixedClientId = true
		// clean 							boolean (true)

		return {
			valid: Object.keys(fieldErrors).length === 0,
			fieldErrors,
			config
		};
	}

	validateProducer(config) {
		const fieldErrors = {};

		// config.pubTopic					not used currenlty
		// config.userPropertiesProduce
		// config.fixedClientId 			boolean (false)
		// config.clientId					required if fixedClientId = true
		// clean 							boolean (true)

		return {
			valid: Object.keys(fieldErrors).length === 0,
			fieldErrors,
			config
		};
	}

	validateConnector(config) {
		const copy = JSON.parse(JSON.stringify(config));
		const fieldErrors = {};
		const validProtocolVersions = [4, 5];
		if (!validProtocolVersions.includes(config.protocolVersion)) {
			fieldErrors.protocolVersion = `Invalid protocol version: ${
				config.protocolVersion
			}. Allowed values: ${validProtocolVersions.join(', ')}`;
		}

		const validQoS = [0, 1, 2];
		if (!validQoS.includes(copy.qos)) {
			fieldErrors.qos = `Invalid QoS: ${copy.qos}. Allowed values: ${validQoS.join(', ')}`;
		}

		const validProtocols = ['mqtt:', 'mqtts:', 'tcp:', 'tls:', 'ws:', 'wss:'];
		let parsedUrl = url.parse(copy.url);
		if (!parsedUrl.slashes) {
			copy.url = `mqtt://${copy.url}`;
		}
		parsedUrl = new url.URL(copy.url);
		if (!validProtocols.includes(parsedUrl.protocol)) {
			fieldErrors.url = `Invalid protocol: ${parsedUrl.protocol}. Allowed values: ${validProtocols.join(', ')}`;
		}
		if (!parsedUrl.port) {
			parsedUrl.port = '1883';
		}
		copy.url = parsedUrl.toString();

		if (typeof copy.retain !== 'boolean') {
			fieldErrors.retain = `Invalid retain value: ${copy.retain}. Allowed values: 'true', 'false'`;
		}

		// Currently not validate:
		// copy.userName
		// copy.password
		// copy.baseTopic
		// copy.certPath
		// copy.keyPath
		// copy.caCert
		// copy.userPropertiesConnect
		return {
			valid: Object.keys(fieldErrors).length === 0,
			fieldErrors,
			config: copy
		};
	}
};
