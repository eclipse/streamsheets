const { GraphServerMessagingProtocol } = require('@cedalo/protocols');
const { EventMessage } = require('@cedalo/messages');

module.exports = class GraphServiceEventMessageFactory {

	static createBaseEventMessage({ graphId, data, type, options }) {
		return new EventMessage({
			graphId,
			data,
			type,
			options
		});
	}

	static createCommandEventMessage(graphId, data, options) {
		return GraphServiceEventMessageFactory.createBaseEventMessage({
			graphId,
			data,
			type: GraphServerMessagingProtocol.EVENTS.COMMAND_EVENT,
			options
		});
	}

	static createSelectionEventMessage(graphId, data) {
		return GraphServiceEventMessageFactory.createBaseEventMessage({
			graphId,
			data,
			type: GraphServerMessagingProtocol.EVENTS.SELECTION_EVENT
		});
	}

};
