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
const { sleep } = require('@cedalo/commons');
const { Machine, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');

const newMachine = ({ cycletime = 1000 } = {}) => {
	const machine = new Machine();
	machine.cycletime = cycletime;
	machine.removeAllStreamSheets();
	machine.addStreamSheet(
		new StreamSheet({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.MACHINE_START, repeat: 'endless' } })
	);
	return machine;
};
const newSheet = () => {
	const machine = newMachine({ cycletime: 1000 });
	return machine.getStreamSheetByName('T1').sheet;
};

const runMachine = async (machine, period) => {
	await machine.start();
	await sleep(period);
	await machine.stop();
};
const runMachinePause = async (machine, period) => {
	await machine.start();
	await sleep(period);
	await machine.pause();
};

module.exports = {
	newMachine,
	newSheet,
	runMachine,
	runMachinePause
};
