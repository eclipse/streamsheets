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
'use strict';

const { logger } = require('@cedalo/logger');
const { Topics } = require('@cedalo/protocols');
const EventFactory = require('../messages/GraphServiceEventMessageFactory');

module.exports = class GraphMonitor {

	constructor(messagingClient) {
		this.messagingClient = messagingClient;
		this.graphWrapper = undefined;
		this.onGraphUpdate = this.onGraphUpdate.bind(this);
		this.onSelection = this.onSelection.bind(this);
	}

	subscribe(graphWrapper) {
		this.graphWrapper = graphWrapper;
		this.graphWrapper.on('update', this.onGraphUpdate);
		this.graphWrapper.on('selection', this.onSelection);
	}

	unsubscribe() {
		this.graphWrapper.off('update', this.onGraphUpdate);
		this.graphWrapper.off('selection', this.onSelection);
		this.graphWrapper = undefined;
	}

	onGraphUpdate(update) {
		const event = EventFactory.createCommandEventMessage(update.graphId, update.command, update.options);
		this.messagingClient.publish(`${Topics.SERVICES_GRAPHS_EVENTS}/${this.graphWrapper.machineId}`, event);
	}

	onSelection(selection) {
		// TODO: send graph selection
		logger.debug(`Graph with id '${selection.graphId}' has been selected.`);
		const event = EventFactory.createSelectionEventMessage(selection.graphId, selection.selection);
		this.messagingClient.publish(`${Topics.SERVICES_GRAPHS_EVENTS}/${this.graphWrapper.machineId}`, event);
	}
};
