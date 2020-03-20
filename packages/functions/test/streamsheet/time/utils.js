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
