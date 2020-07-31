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
		const fieldUpdates = {};

		// config.topics					do topic validation
		// config.userPropertiesSubscribe
		// config.fixedClientId 			boolean (false)
		// config.clientId					required if fixedClientId = true
		// clean 							boolean (true)

		return {
			valid: Object.keys(fieldErrors).length === 0,
			fieldErrors,
			fieldUpdates
		};
	}

	validateProducer(config) {
		const fieldErrors = {};
		const fieldUpdates = {};

		// config.pubTopic					not used currenlty
		// config.userPropertiesProduce
		// config.fixedClientId 			boolean (false)
		// config.clientId					required if fixedClientId = true
		// clean 							boolean (true)

		return {
			valid: Object.keys(fieldErrors).length === 0,
			fieldErrors,
			fieldUpdates
		};
	}

	validateConnector(config) {
		const fieldUpdates = {};
		const fieldErrors = {};
		const validProtocolVersions = [4, 5];
		if (!validProtocolVersions.includes(config.protocolVersion)) {
			fieldErrors.protocolVersion = `Invalid protocol version: ${
				config.protocolVersion
			}. Allowed values: ${validProtocolVersions.join(', ')}`;
		}

		const validQoS = [0, 1, 2];
		if (!validQoS.includes(config.qos)) {
			fieldErrors.qos = `Invalid QoS: ${config.qos}. Allowed values: ${validQoS.join(', ')}`;
		}

		const validProtocols = ['mqtt:', 'mqtts:', 'tcp:', 'tls:', 'ws:', 'wss:'];
		let parsedUrl = url.parse(config.url);
		let currentUrl = config.url;
		if (!parsedUrl.slashes) {
			currentUrl = `mqtt://${currentUrl}`;
		}
		parsedUrl = new url.URL(currentUrl);
		if (!validProtocols.includes(parsedUrl.protocol)) {
			fieldErrors.url = `Invalid protocol: ${parsedUrl.protocol}. Allowed values: ${validProtocols.join(', ')}`;
		}
		if (!parsedUrl.port) {
			parsedUrl.port = '1883';
		}
		currentUrl = parsedUrl.toString();
		if (currentUrl !== config.url) {
			fieldUpdates.url = currentUrl;
		}

		if (typeof config.retain !== 'boolean') {
			fieldErrors.retain = `Invalid retain value: ${config.retain}. Allowed values: 'true', 'false'`;
		}

		// Currently not validate:
		// config.userName
		// config.password
		// config.baseTopic
		// config.certPath
		// config.keyPath
		// config.caCert
		// config.userPropertiesConnect
		return {
			valid: Object.keys(fieldErrors).length === 0,
			fieldErrors,
			fieldUpdates
		};
	}
};
