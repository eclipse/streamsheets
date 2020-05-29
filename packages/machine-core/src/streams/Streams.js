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
const StreamMessagingClient = require('./StreamMessagingClient');
const Cell = require('../machine/Cell');
const { updateNamedCellRefs } = require('../ipc/utils');
const { Topics } = require('@cedalo/protocols');
const logger = require('../logger').create({ name: 'Streams' });


const topics = (id) => ({
	publish: `${Topics.SERVICES_STREAMS_INPUT}/${id}/action/publish`,
	request: `${Topics.SERVICES_STREAMS_INPUT}/${id}/action/request`,
	respond: `${Topics.SERVICES_STREAMS_INPUT}/${id}/action/respond`,
	response: `${Topics.SERVICES_STREAMS_EVENTS}/${id}/response`
});

const toJSON = (message) => (message.toJSON ? message.toJSON() : message);

const prefix = (name) => `|${name}`;

const findExistingById = (namedCells, id) =>
	namedCells
		.getDescriptorsAsList()
		.filter((cellDescr) => cellDescr.value && !!cellDescr.value.type)
		.find((cellDescr) => cellDescr.value.id === id);

const dispose = (machine) =>
	machine.namedCells
		.getDescriptorsAsList()
		.filter((descr) => descr.value && !!descr.value.type)
		.forEach((descr) => StreamMessagingClient.unsubscribe(topics(descr.value.id).response));

const registerSource = (streamDescriptor, machine) => {
	const existing = findExistingById(machine.namedCells, streamDescriptor.id);

	if (existing) {
		const existingTimestamp = existing.value.timestamp || 0;
		if (existingTimestamp < streamDescriptor.timestamp) {
			const oldName = prefix(existing.value.name);
			const newName = prefix(streamDescriptor.name);
			machine.namedCells.update(oldName, newName, new Cell(streamDescriptor));
			if (oldName !== newName) {
				updateNamedCellRefs(machine, oldName, newName);
			}
		}
	} else {
		machine.namedCells.set(prefix(streamDescriptor.name), new Cell(streamDescriptor));
	}
	StreamMessagingClient.subscribe(topics(streamDescriptor.id).response);
};

const unregisterSource = (descriptor, machine) => {
	const existing = findExistingById(machine.namedCells, descriptor.id);
	if (existing) {
		machine.namedCells.set(existing.name, null);
		StreamMessagingClient.unsubscribe(topics(descriptor.id).response);
	}
};
/**
 * Remove all stream refs of streams that
 * - were not present on machine start
 * - or have not been added since machine start
 */
const prune = (currentIds, startTime, machine) =>
	machine.namedCells
		.getDescriptorsAsList()
		.filter((descriptor) => descriptor.name.startsWith('|'))
		.filter((descriptor) => {
			if(!descriptor.value.id){
				return true;
			}
			if(currentIds.includes(descriptor.value.id)){
				return false;
			}
			const timestamp = descriptor.value.timestamp || 0;
			return timestamp < startTime;
		})
		.forEach((descriptor) => {
			logger.info(`Pruning stream: ${descriptor.value.id}-${descriptor.name}`);
			if(!descriptor.value.id){
				machine.namedCells.set(descriptor.name, null);
			} else {
				unregisterSource(descriptor.value, machine)
			}
		});

const publish = (streamId, message) => {
	message.streamId = streamId;
	StreamMessagingClient.publish(topics(streamId).publish, message);
};

const respond = (streamId, message) => {
	message.streamId = streamId;
	StreamMessagingClient.publish(topics(streamId).respond, message);
};

const request = (streamId, message, timeout) => {
	// if passed message is of object type, e.g. our Message, transform it to json object...
	const jsonmsg = toJSON(message);
	jsonmsg.streamId = streamId;
	return StreamMessagingClient.request(topics(streamId).request, jsonmsg, timeout);
};

module.exports = {
	dispose,
	registerSource,
	unregisterSource,
	publish,
	respond,
	request,
	prune,
	topics
};
