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
/* eslint no-unused-vars: "off" */

/**
 * An abstract class representing a repository to access machines.
 *
 * @class AbstractMachineRepository
 * @public
 */
module.exports = class AbstractMachineRepository {
	/**
	 * A method to get all the machines stored in the repository.
	 *
	 * @method getMachines
	 * @public
	 * @return {Promise} An array of all the machines.
	 */
	getMachines() {
		return new Promise((resolve, reject) => {
			reject(new Error('Method not implemented: getMachines()'));
		});
	}

	/**
	 * A method to save a new machine into the repository.
	 *
	 * @method saveMachine
	 * @param {Machine} machine - The machine to save.
	 * @public
	 * @return {Promise} An array of all the machines.
	 */
	saveMachine(machine) {
		return new Promise((resolve, reject) => {
			reject(new Error('Method not implemented: saveMachine()'));
		});
	}

	/**
	 * A method to find a machine from the repository by its id.
	 *
	 * @method findMachine
	 * @param {String} id - The id of the machine.
	 * @public
	 * @return {Promise} The machine with the given id.
	 */
	findMachine(id) {
		return new Promise((resolve, reject) => {
			reject(new Error('Method not implemented: findMachine()'));
		});
	}

	/**
	 * A method to update a machine in the repository.
	 *
	 * @method updateMachine
	 * @param {Machine} machine - The machine to update.
	 * @public
	 * @return {Promise} The updated machine.
	 */
	updateMachine(machine) {
		return new Promise((resolve, reject) => {
			reject(new Error('Method not implemented: updateMachine()'));
		});
	}

	/**
	 * A method to delete a machine in the repository.
	 *
	 * @method updateMachine
	 * @param {Machine} machine - The machine to delete.
	 * @public
	 * @return {Promise} The deleted machine.
	 */
	deleteMachine(machineId) {
		return new Promise((resolve, reject) => {
			reject(new Error('Method not implemented: deleteMachine()'));
		});
	}

	deleteAll() {
		return new Promise((resolve, reject) => {
			reject(new Error('Method not implemented: deleteAll()'));
		});
	}
};
