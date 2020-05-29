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
const PopProvider = require('./src/PopProvider');
const PopProviderConfiguration = require('./src/PopProviderConfiguration');
const PopConsumer = require('./src/PopConsumer');
const PopConsumerConfiguration = require('./src/PopConsumerConfiguration');

module.exports = {
	Provider: PopProvider,
	PopConsumer,
	PopConsumerConfiguration,
	PopProviderConfiguration
};
