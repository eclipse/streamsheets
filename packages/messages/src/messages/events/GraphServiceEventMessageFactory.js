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
