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
const StreamMessagingClient = require('../../src/streams/StreamMessagingClient');
const { Machine, Streams } = require('../..');

jest.mock('../../src/streams/StreamMessagingClient');

const descriptor1 = {
	id: 'id1',
	type: 'consumer',
	name: 'Stream1',
	timestamp: 100
};

const descriptor2 = {
	id: 'id2',
	type: 'consumer',
	name: 'Stream2',
	timestamp: 100
};

const copy = (object) => JSON.parse(JSON.stringify(object));

const prefix = (name) => `|${name}`;
describe('Streams', () => {
	it('should register a new stream by adding it to the named cells of the machine', () => {
		const machine = new Machine();
		Streams.registerSource(descriptor1, machine);
		const dsName = prefix(descriptor1.name);
		expect(machine.namedCells.get(dsName)).toBeDefined();
		expect(machine.namedCells.get(dsName).value.id).toBe(descriptor1.id);
		expect(StreamMessagingClient.subscribe).lastCalledWith(Streams.topics(descriptor1.id).response);
	});

	it('should register an existing stream by updating it in the named cells of the machine', () => {
		const machine = new Machine();
		Streams.registerSource(descriptor1, machine);
		const ds1Copy = copy(descriptor1);
		ds1Copy.name = 'NewName';
		ds1Copy.timestamp = descriptor1.timestamp + 1;

		Streams.registerSource(ds1Copy, machine);

		const newName = prefix(ds1Copy.name);
		expect(machine.namedCells.get(newName)).toBeDefined();
		expect(machine.namedCells.get(newName).value.id).toBe(descriptor1.id);
		expect(StreamMessagingClient.subscribe).lastCalledWith(Streams.topics(ds1Copy.id).response);

		// Should find nothing using old name
		const oldName = prefix(descriptor1.name);
		expect(machine.namedCells.get(oldName)).toBeUndefined();
	});

	it('should unregister an existing stream and remove it from the named cells of the machine', () => {
		const machine = new Machine();
		Streams.registerSource(descriptor1, machine);
		Streams.unregisterSource(descriptor1, machine);
		const dsName = prefix(descriptor1.name);
		expect(machine.namedCells.get(dsName)).toBeUndefined();
		expect(StreamMessagingClient.unsubscribe).lastCalledWith(Streams.topics(descriptor1.id).response);
	});

	it('should unsubscribe all streams on dispose', () => {
		const machine = new Machine();
		Streams.registerSource(descriptor1, machine);
		Streams.registerSource(descriptor2, machine);
		StreamMessagingClient.unsubscribe.mockClear();
		Streams.dispose(machine);
		expect(StreamMessagingClient.unsubscribe.mock.calls.length).toBe(2);
	});

	it('should prune old streams', () => {
		const machine = new Machine();
		Streams.registerSource(descriptor1, machine);
		Streams.registerSource(descriptor2, machine);
		const currentIds = [descriptor2.id];

		Streams.prune(currentIds, 200, machine);

		expect(machine.namedCells.get(prefix(descriptor1.name))).toBeUndefined();
		expect(machine.namedCells.get(prefix(descriptor2.name))).toBeDefined();
		expect(StreamMessagingClient.unsubscribe).lastCalledWith(Streams.topics(descriptor1.id).response);
	});
});
