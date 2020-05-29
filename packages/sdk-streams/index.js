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
const { EVENTS } = require('./src/Constants');
const Provider = require('./src/Provider');
const Connector = require('./src/Connector');
const ConsumerMixin = require('./src/ConsumerMixin');
const Consumer = require('./src/Consumer');
const ProducerMixin = require('./src/ProducerMixin');
const Producer = require('./src/Producer');
const Field = require('./src/configurations/Field');
const ProviderConfiguration = require('./src/configurations/ProviderConfiguration');
const ConnectorConfiguration = require('./src/configurations/ConnectorConfiguration');
const ConsumerConfiguration = require('./src/configurations/ConsumerConfiguration');
const ProducerConfiguration = require('./src/configurations/ProducerConfiguration');
const Message = require('./src/helpers/Message');
const StreamMonitor = require('./src/StreamMonitor');
const RequestResponse = require('./src/helpers/RequestResponse');
const TestHelper = require('./src/helpers/TestHelper');

const getConfigurationClass = (config) => {
	switch (config.className || config._className) {
		case ProviderConfiguration.name:
			return ProviderConfiguration;
		case ConnectorConfiguration.name:
			return ConnectorConfiguration;
		case ConsumerConfiguration.name:
			return ConsumerConfiguration;
		case ProducerConfiguration.name:
			return ProducerConfiguration;
		default:
			return null;
	}
};

module.exports = {
	Events: EVENTS,
	Provider,
	Connector,
	ConsumerMixin,
	Consumer,
	ProducerMixin,
	Producer,
	ProviderConfiguration,
	ConsumerConfiguration,
	ProducerConfiguration,
	ConnectorConfiguration,
	Field,
	Message,
	StreamMonitor,
	TestHelper,
	getConfigurationClass,
	RequestResponse,
};
