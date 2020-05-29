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
const { EVENTS } = require('./Constants');
const Connector = require('./Connector');
const ProducerMixin = require('./ProducerMixin');

const Producer = ProducerMixin(Connector);
Producer.EVENTS = {
	...EVENTS.CONNECTOR,
	...EVENTS.PRODUCER
};

module.exports = Producer;
