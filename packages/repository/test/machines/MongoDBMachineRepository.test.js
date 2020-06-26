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

const IdGenerator = require('@cedalo/id-generator');
const { CODES } = require('@cedalo/error-codes');
const { MongoDBMachineRepository } = require('../..');

const TEST_COLLECTION = 'test_collection_machines';
const REPO = new MongoDBMachineRepository({ collection: TEST_COLLECTION });

const dummyMachine = (id = IdGenerator.generate(), isTemplate = false) => ({
	id,
	state: 'stopped',
	streamsheets: [],
	isTemplate
});

// jest will wait for returned promise!!
beforeAll(() => REPO.connect());
// create TEST_COLLECTION...
beforeEach(() => REPO.db.createCollection(TEST_COLLECTION));
// drop TEST_COLLECTION...
afterEach(() => REPO.db
	.dropCollection(TEST_COLLECTION)
	.catch(err => console.error('Ignore drop collection error! Usually it occurs if collection does not exist.', err)));


describe('@cedalo/repository#MongoDBMachineRepository', () => {
	it('should reject connect if host is not available', () => {
		const repo = new MongoDBMachineRepository({ MONGO_HOST: 'unknown-host' });
		expect.assertions(1);
		return repo.connect().catch(err => expect(err).toBeDefined());
	});
	it('should save a machine definition', () => {
		const machine = dummyMachine();
		expect.assertions(1);
		return REPO.saveMachine(machine).then(result => expect(result.insertedCount).toBe(1));
	});
	it('should save multiple machine definitions', () => {
		const machine1 = dummyMachine();
		const machine2 = dummyMachine('test');
		expect.assertions(4);
		return REPO.saveMachines([machine1, machine2])
			.then((result) => {
				expect(result.insertedCount).toBe(2);
				const insertedIdValues = Object.values(result.insertedIds);
				expect(insertedIdValues.length).toBe(2);
				expect(insertedIdValues.includes(machine1.id)).toBeTruthy();
				expect(insertedIdValues.includes(machine2.id)).toBeTruthy();
			});
	});
	it('should reject to save same machine twice', () => {
		const machine = dummyMachine();
		expect.assertions(1);
		return REPO.saveMachine(machine)
			.then(() => REPO.saveMachine(machine))
			.catch(err => expect(err).toBeDefined());
	});
	it('should reject save for wrong machine definition', () => {
		expect.assertions(1);
		return REPO.saveMachine(undefined).catch(err => expect(err).toBeDefined());
	});
	it('should reject loading unknown machine', () => {
		expect.assertions(1);
		return REPO.findMachine('unknown')
			.catch(err => expect(err.code).toBe(CODES.MACHINE_NOT_FOUND));
	});
	it('should load added machine', () => {
		const machine = dummyMachine();
		expect.assertions(1);
		return REPO.saveMachine(machine)
			.then(() => REPO.findMachine(machine.id))
			.then(m => expect(m.id).toBe(machine.id));
	});
	it('should remove _id property from loaded machine', () => {
		const machine = dummyMachine();
		expect.assertions(1);
		return REPO.saveMachine(machine)
			.then(() => REPO.findMachine(machine.id))
			.then(m => expect(m._id).toBeUndefined());
	});
	it('should load all machine definitions', (done) => {
		const machine1 = dummyMachine();
		const machine2 = dummyMachine('test');
		return REPO.saveMachines([machine1, machine2])
			.then(() => REPO.getMachines())
			.then((machines) => {
				const loaded = machines.reduce((map, m) => map.set(m.id, m), new Map());
				expect(machines.length).toBe(2);
				expect(loaded.get(machine1.id)).toBeDefined();
				expect(loaded.get(machine2.id)).toBeDefined();
				expect(loaded.get(machine1.id)._id).toBeUndefined();
				expect(loaded.get(machine2.id)._id).toBeUndefined();
				done();
			});
	});
	it('should return empty array for loading machine definitions on empty collection', () => {
		expect.assertions(1);
		return REPO.getMachines().then(machines => expect(machines.length).toBe(0));
	});
	it('should delete a known machine', () => {
		const machine = dummyMachine();
		expect.assertions(2);
		return REPO.saveMachine(machine)
			.then(() => REPO.deleteMachine(machine.id))
			.then(res => expect(res).toBeTruthy())
			.then(() => REPO.count())
			.then(count => expect(count).toBe(0));
	});
	it('should delete all known machines', () => {
		expect.assertions(2);
		return REPO.saveMachines([dummyMachine('test1'), dummyMachine('test2'), dummyMachine('test3')])
			.then(() => REPO.deleteAllMachines())
			.then(res => expect(res).toBeTruthy())
			.then(() => REPO.count())
			.then(count => expect(count).toBe(0));
	});
	it('should support update machine', () => {
		const machine = dummyMachine();
		machine.streamsheets.push({ name: 'T1' });
		expect.assertions(6);
		return REPO.saveMachine(machine)
			.then(() => {
				machine.streamsheets.push({ name: 'T2' });
				return REPO.updateMachine(machine.id, machine);
			})
			.then(res => expect(res).toBeTruthy())
			.then(() => REPO.findMachine(machine.id))
			.then((loadedMachine) => {
				// result contains our sheets structure...
				expect(loadedMachine).toBeDefined();
				expect(loadedMachine.streamsheets).toBeDefined();
				expect(loadedMachine.streamsheets.length).toBe(2);
				expect(loadedMachine.streamsheets[0].name).toBe('T1');
				expect(loadedMachine.streamsheets[1].name).toBe('T2');
			});
	});
	it('should update the state of a machine', (done) => {
		const machine = dummyMachine('machine12345678');
		const newState = 'running';
		expect.assertions(4);
		return REPO.saveMachine(machine)
			.then(() => REPO.findMachine(machine.id))
			.then((machineFound) => {
				expect(machineFound).toBeDefined();
				expect(machineFound.state).toBe('stopped');
			})
			.then(() => REPO.updateMachineState(machine.id, newState))
			.then(() => REPO.findMachine(machine.id))
			.then((machineFound) => {
				expect(machineFound).toBeDefined();
				expect(machineFound.state).toBe(newState);
			})
			.then(() => REPO.deleteMachine(machine.id))
			.then(() => done());
	});
	it('should update a streamsheet streams', () => {
		const machine = dummyMachine();
		machine.streamsheets = [
			{
				id: 'tr1',
				inbox: {
					streams: []
				},
				sheet: {}
			}
		];
		expect.assertions(1);
		return REPO.saveMachine(machine)
			.then(() => {
				const newMachine = {
					...machine,
					streamsheets: machine.streamsheets = [
						{
							id: 'tr1',
							inbox: {
								streams: [{ name: '1' }, { name: '2' }]
							},
							sheet: {}
						}
					]
				};
				return REPO.updateStreamSheetSettings('tr1', newMachine);
			})
			.then(() => REPO.findMachine(machine.id))
			.then((m) => {
				console.log(m);
				return expect(m.streamsheets.length).toBe(1);
			});
	});
});
