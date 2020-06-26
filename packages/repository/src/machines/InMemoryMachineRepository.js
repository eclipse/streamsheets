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

const AbstractMachineRepository = require('./AbstractMachineRepository');
const { MACHINES } = require('./../DummyData');

/**
 * An machine repository which stores the machines in memory.
 *
 * @class InMemoryMachineRepository
 * @extends AbstractMachineRepository
 * @public
 */
module.exports = class InMemoryMachineRepository extends AbstractMachineRepository {
	getMachines() {
		return new Promise((resolve) => {
			resolve(MACHINES);
		});
	}
	saveMachine(machine) {
		return new Promise((resolve) => {
			MACHINES.push(machine);
			resolve(machine);
		});
	}
	findMachine(id) {
		return new Promise((resolve) => {
			const machines = MACHINES.filter(machine => machine.id === id)[0];
			resolve(machines);
		});
	}
};
