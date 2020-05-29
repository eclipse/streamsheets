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
const { GraphServerMessagingProtocol } = require('@cedalo/protocols');
const EventMessage = require('../core/EventMessage');

module.exports = class GraphServiceEventMessageFactory {

	static createBaseEventMessage({graphId, data, type}) {
		return new EventMessage({
			graphId,
			data,
			type
		});
	}

	static createCommandEventMessage(graphId, data) {
		return GraphServiceEventMessageFactory.createBaseEventMessage({
			graphId,
			data,
			type: GraphServerMessagingProtocol.EVENTS.COMMAND_EVENT
		});
	}

	static createSelectionEventMessage(graphId, data) {
		return GraphServiceEventMessageFactory.createBaseEventMessage({
			graphId,
			data,
			type: GraphServerMessagingProtocol.EVENTS.SELECTION_EVENT
		});
	}

}
