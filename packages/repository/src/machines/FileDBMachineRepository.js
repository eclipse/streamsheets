'use strict';

const AbstractMachineRepository = require('./AbstractMachineRepository');
const { mix } = require('mixwith');
const FileDBMixin = require('./../filedb/FileDBMixin');

/**
 * An machine repository which stores the machines in a local JSON file.
 *
 * @class FileDBMachineRepository
 * @extends AbstractMachineRepository
 * @public
 */
module.exports = class FileDBMachineRepository extends mix(AbstractMachineRepository).with(FileDBMixin) {
	constructor({ dbFile }) {
		super({ dbFile });
	}

	getMachines() {
		return new Promise((resolve) => {
			resolve(this.db.get('machines').value());
		});
	}

	saveMachine(machine) {
		return new Promise((resolve) => {
			this.db.get('machines').push(machine).value();
			resolve(machine);
		});
	}

	findMachine(id) {
		return new Promise((resolve) => {
			const machine = this.db.get('machines')
				.find({ id })
				.value();
			resolve(machine);
		});
	}

	updateMachine(updatedMachine) {
		return new Promise((resolve) => {
			const machine = this.db.get('machines')
				.find({ id: updatedMachine.id })
				.assign(updatedMachine)
				.value();
			resolve(machine);
		});
	}
};
