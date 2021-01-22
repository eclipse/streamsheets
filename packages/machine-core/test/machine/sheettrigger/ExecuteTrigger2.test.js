const { Machine, Message, StreamSheet, TriggerFactory } = require('../../..');
const { createCellAt, expectValue, monitorMachine, monitorStreamSheet, wait } = require('../../utils');

// jasmine.DEFAULT_TIMEOUT_INTERVAL = 60 * 60 * 1000;

const createStreamsheet = ({ name, trigger }) => {
	const streamsheet = new StreamSheet({ name });
	streamsheet.trigger = TriggerFactory.create(trigger);
	return streamsheet;
};
const setup = ({ switched = false, s1Type = TriggerFactory.TYPE.CONTINUOUSLY } = {}) => {
	const machine = new Machine();
	const s1 = createStreamsheet({ name: 'S1', trigger: { type: switched ? TriggerFactory.TYPE.EXECUTE : s1Type } });
	const s2 = createStreamsheet({ name: 'S2', trigger: { type: switched ? s1Type : TriggerFactory.TYPE.EXECUTE } });
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.addStreamSheet(s2);
	machine.cycletime = 50;
	return { machine, s1, s2 };
};
// behaviour is based on DL-1114
describe('behaviour on machine run', () => {
	describe('general execute', () => {
		test('execute sheet', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2")' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(monitorS2.stats.steps).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			await machine.start();
			await monitorS1.hasFinishedStep(2);
			await machine.stop();
			expect(monitorS2.stats.steps).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
		});
		test('execute with paused & resumed sheet', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' } });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'pause(0.1)' } });
			await machine.start();
			await monitorS2.hasFinishedStep(4);
			// await wait(50);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
		});
		test('execute with paused and never resume', async () => {
			const { machine, s1, s2 } = setup();
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2")' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'pause()' } });
			await machine.start();
			await wait(50);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			await machine.start();
			await wait(50);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
		});
		test('execute sheet in "repeat until..." mode never returns', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2")' },
				A3: { formula: 'A3+1' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await wait(30);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			// s2 run as fast as possible so it must be much greater
			expect(s2.sheet.cellAt('B1').value).toBeGreaterThan(3);
		});
		test('execute sheet in "repeat until..." mode should calculate as fast as possible if last param is true', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",1,true)' },
				A3: { formula: 'A3+1' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await wait(30);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			// s2 run as fast as possible so it must be much greater
			expect(s2.sheet.cellAt('B1').value).toBeGreaterThan(3);
		});
		test('execute sheet in "repeat until..." mode should calculate in machine cycle if last param is false', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",1,,false)' },
				A3: { formula: 'A3+1' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await wait(20);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			await machine.start();
			await wait(120);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expectValue(s2.sheet.cellAt('B1').value).toBeInRange(4, 6);
		});
		test('execute sheet in "repeat until..." mode finish on return()', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			const monitorS1 = monitorStreamSheet(s1);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2")' },
				A3: { formula: 'A3+1' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'if(B1>4,return(42),false)' } });
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			// await wait(40);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			// expect(s2.sheet.cellAt('B1').value).toBeGreaterThan(4);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			expect(s2.sheet.cellAt('B2').value).toBe(42);
		});
		test('executed sheet in "repeat until..." mode should not resume if machine is halted', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2")' },
				A3: { formula: 'A3+1' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'pause(0.01)' } });
			await machine.start();
			await wait(5); // needed to start executing S2
			await machine.pause();
			await wait(50);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			await machine.start();
			await wait(50);
			await machine.stop();
			const b1Value = s2.sheet.cellAt('B1').value;
			expect(b1Value).toBeGreaterThan(3);
			await wait(50);
			expect(s2.sheet.cellAt('B1').value).toBe(b1Value);
		});
		test('caller of executed sheet should not resume if machine is halted', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS2 = monitorStreamSheet(s2);
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2")' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'pause(0.05)' } });
			await machine.start();
			await wait(10);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			await machine.start();
			await monitorS2.hasFinishedStep(3);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('A3').value).toBe(4);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
		});
		test('execute sheet is not run after machine resume', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' } });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await wait(10);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			await machine.start();
			await wait(10);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			await machine.start();
			await wait(10);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
		});
		test('execute sheet in "repeat until..." mode after start/pause/start/stop/start/stop', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' } });
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'if(B1>3,return(42),false)' } });
			await machine.start();
			await wait(10);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			expect(s2.sheet.cellAt('B2').value).toBe(42);
			await machine.start();
			await wait(10);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			expect(s2.sheet.cellAt('B2').value).toBe(42);
			await machine.start();
			await wait(10);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			expect(s2.sheet.cellAt('B2').value).toBe(42);
		});
		test('execute sheet in "repeat until..." return() mode and switched sheets order', async () => {
			// HAVE TO REVIEW & FIX
			const { machine, s1, s2 } = setup({ switched: true });
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'if(mod(A1,3)=0,return(),false)' }, s1.sheet);
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			createCellAt('B2', { formula: 'execute("S1")' }, s2.sheet);
			createCellAt('B3', { formula: 'B3+1' }, s2.sheet);
			await machine.start();
			await wait(70);
			await machine.stop();
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s2.sheet.cellAt('B3').value).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(6);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
		});
	});
	describe('general repeat behaviour', () => {
		test('repeated execute sheet', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS1 = monitorStreamSheet(s1);
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2", 4)' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
		});
		test('repeated execute and pause function', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",4)' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'pause(0.01)' } });
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			// once again with longer pause and stop before it could resume:
			createCellAt('B2', { formula: 'pause(0.1)' }, s2.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			await machine.start();
			await monitorS2.hasFinishedStep(6);
			// await wait(500);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(7);
		});
		test('do not repeat executed sheet if it is in "repeat until..." mode', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",4)' },
				A3: { formula: 'A3+1' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await wait(20);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBeGreaterThan(3);
			expect(s2.stats.steps).toBe(1);
			expect(s2.stats.executesteps).toBe(1);
			await machine.stop();
		});
		test('if no pace is specified repeated execute sheet is done in machine cycle', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			machine.cycletime = 1000;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2", 4)' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			// repeat is done in machine cycle, so only 1 trigger
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
		});
		test('if no pace is specified "repeat until..." is done as fast as possible', async () =>{
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			machine.cycletime = 300;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",4)' },
				A3: { formula: 'A3+1' }
			});
			s2.trigger.update({ repeat: 'endless'});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'if(mod(B1,5)=0,return(42),false)' } });
			await machine.start();
			await wait(30);
			await machine.pause();
			// stopped before repeats done
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			expect(s2.sheet.cellAt('B2').value).toBe(42);
			expect(s2.stats.executesteps).toBe(1);
			await machine.stop();
		});
		test('if pace parameter is false repeat execute is done in machine cycle', async () =>{
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			machine.cycletime = 1000;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",4,,false)' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			// repeat is done in machine cycle, so only 1 trigger
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
		});
		test('if pace parameter is false "repeat until..." are done in machine cycle', async () =>{
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			machine.cycletime = 1000;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",4,,false)' },
				A3: { formula: 'A3+1' }
			});
			s2.trigger.update({ repeat: 'endless'});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'if(mod(B1,5)=0,return(42),false)' } });
			await machine.start();
			await wait(50);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			// repeat is done in machine cycle, so only 1 trigger
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(false);
			expect(s2.stats.repeatsteps).toBe(1);
			expect(s2.stats.executesteps).toBe(1);
			await machine.stop();
			// start again with faster machine cycle...
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",3,,false)' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'if(mod(B1,3)=0,return(42),false)' } });
			await machine.start();
			await wait(200);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(9);
			expect(s2.sheet.cellAt('B2').value).toBe(42);
			expect(s2.stats.repeatsteps).toBe(3);
			expect(s2.stats.executesteps).toBe(3);
			await machine.stop();
		});
		test('if pace parameter is true repeat execute is done as fast as possible', async () =>{
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			machine.cycletime = 1000;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",4,,true)' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await wait(50);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			expect(s2.stats.repeatsteps).toBe(0);
			expect(s2.stats.executesteps).toBe(4);
			await machine.stop();
		});
		test('if pace parameter is true "repeat until..." is done as fast as possible', async () =>{
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			machine.cycletime = 1000;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",4,,true)' },
				A3: { formula: 'A3+1' }
			});
			s2.trigger.update({ repeat: 'endless'});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'if(mod(B1,5)=0,return(42),false)' } });
			await machine.start();
			await wait(50);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(20);
			expect(s2.sheet.cellAt('B2').value).toBe(42);
			expect(s2.stats.repeatsteps).toBe(5);
			expect(s2.stats.executesteps).toBe(4);
			await machine.stop();
		});
	});
	describe('message handling', () =>{
		test('execute sheet and pass message', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",1,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await monitorS2.hasPassedStep(1);
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(monitorS2.messages.attached).toBe(1);
			expect(monitorS2.messages.detached).toBe(1);
		});
		test('execute sheet and pass message with loop', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",1,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'loopindices()' } });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.start();
			// await monitorS2.hasFinishedStep(2);
			await monitorS1.hasFinishedStep(1);
			// await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1');
			expect(monitorS2.messages.attached).toBe(1);
			expect(monitorS2.messages.detached).toBe(1);
		});
		test('execute sheet and pass message with loop is stopped by return', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS2 = monitorStreamSheet(s2);
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2: '!!!', D2: 23,
				A3: { formula: 'execute("S2",1,array(A2,B2,C2,D2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'if(B1>2,return(42),"waiting")'} });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.start();
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(s2.sheet.cellAt('B2').value).toBe(42);
			expect(monitorS2.messages.attached).toBe(1);
			expect(monitorS2.messages.detached).toBe(1);
		});
		test('repeated execute and pass message', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS2 = monitorStreamSheet(s2);
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",4,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			expect(monitorS2.messages.attached).toBe(4);
			expect(monitorS2.messages.detached).toBe(4);
		});
		test('repeated execute and pass message with loop', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS2 = monitorStreamSheet(s2);
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2:'!!!',
				A3: { formula: 'execute("S2",2,array(A2,C2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.start();
			await wait(300);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			expect(monitorS2.messages.attached).toBe(2);
			expect(monitorS2.messages.detached).toBe(2);
		});
		test('repeated execute and pass message and "repeat until..." return()', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2:'!!!',
				A3: { formula: 'execute("S2",4,array(A2,B2,C2))' },
				A4: { formula: 'A4+1' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()' },
				B3: { formula: 'if(mod(B1,2)=0,return(42),false)' }
			});
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(8);
			expect(s2.sheet.cellAt('B2').value).toBe('0,0,0,0,0,0,0');
			expect(s2.sheet.cellAt('B3').value).toBe(42);
			expect(monitorS2.messages.attached).toBe(4);
		});
		test('repeated execute and pass message with loop and "repeat until..." return()', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2: '!!!', D2: 23,
				A3: { formula: 'execute("S2",4,array(A2,B2,C2,D2),true)' },
				A4: { formula: 'A4+1' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()' },
				B3: { formula: 'if(mod(B1,3)=0,return(42),"waiting")' }
			});
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(48);
			expect(s2.sheet.cellAt('B2').value.startsWith('0,0,1,1,1,2,2,2,3,3,3')).toBeTruthy();
			expect(s2.sheet.cellAt('B3').value).toBe(42);
			expect(monitorS2.messages.attached).toBe(4);
		});
		test('repeated execute with loop and pause function', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2: '!!!',
				A3: { formula: 'execute("S2",3,array(A2,B2,C2),true)' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()' },
				B3: { formula: 'pause(0.01)' }
			});
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,2,0,1,2,0,1,2');
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(10);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,2,0,1,2,0,1,2');
		});
		test('consume message from inbox', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2")' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.pause();
			s2.inbox.put(new Message());
			s2.inbox.put(new Message());
			s2.inbox.put(new Message());
			expect(s2.inbox.size).toBe(3);
			await machine.start();
			await monitorS1.hasFinishedStep(4);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			expect(s1.sheet.cellAt('A4').value).toBe(5);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			expect(s2.inbox.size).toBe(1);
			expect(monitorS2.messages.detached).toBe(4);
		});
		test('consume message with loop from inbox', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2")' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ 
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()' } });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.pause();
			s2.inbox.put(new Message(['john','doe','!!!']));
			s2.inbox.put(new Message(['hello','world','!!!']));
			s2.inbox.put(new Message(['hy','!!!']));
			expect(s2.inbox.size).toBe(3);
			expect(monitorS2.stats.steps).toBe(0);
			await machine.start();
			await monitorS1.hasPassedStep(4);
			await machine.stop();
			expect(s2.inbox.size).toBe(1);
			expect(monitorS2.stats.steps).toBe(9);
			expect(s2.sheet.cellAt('B1').value).toBe(10);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,2,0,1,2,0,1,1');
			expect(monitorS2.messages.detached).toBe(4);
		});
		test('repeated execute and consume message from inbox', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",2,,true)' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.pause();
			s2.inbox.put(new Message());
			s2.inbox.put(new Message());
			s2.inbox.put(new Message());
			s2.inbox.put(new Message());
			expect(s2.inbox.size).toBe(4);
			await machine.start();
			await monitorS2.hasPassedStep(3);
			await machine.stop();
			expect(s2.inbox.size).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			expect(monitorS2.messages.detached).toBe(3);
		});
		test('repeated execute and consume message with loop from inbox', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",2,,true)' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ 
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()' } });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.pause();
			s2.inbox.put(new Message(['john','doe','!!!']));
			s2.inbox.put(new Message(['hello','world','!!!']));
			s2.inbox.put(new Message(['hy','!!!']));
			s2.inbox.put(new Message());
			expect(s2.inbox.size).toBe(4);
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.pause();
			expect(s2.inbox.size).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(7);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,2,0,1,2');
			expect(monitorS2.messages.detached).toBe(2);
			await machine.start();
			await monitorS1.hasFinishedStep(3);
			await machine.stop();
			expect(s2.inbox.size).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(12);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,2,0,1,2,0,1,0,0,0');
			expect(monitorS2.messages.detached).toBe(6);
		});
		test('repeated execute and consume message with loop from inbox and "repeat until..." return()', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",2,,true)' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()' },
				B3: { formula: 'if(mod(B1,2)=0,return(42),false)' }
			});
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.pause();
			s2.inbox.put(new Message(['john','doe','!!!'], '1'));
			s2.inbox.put(new Message(['hello','world','!!!'], '2'));
			s2.inbox.put(new Message(['hy','!!!'], '3'));
			s2.inbox.put(new Message([], '4'));
			expect(s2.inbox.size).toBe(4);
			expect(monitorS1.stats.steps).toBe(0);
			expect(monitorS1.stats.finishedsteps).toBe(0);
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.pause();
			expect(s2.inbox.size).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			expect(s2.sheet.cellAt('B2').value).toBe('0,0,1');
			expect(monitorS2.messages.detached).toBe(2);
			await machine.start();
			await monitorS1.hasFinishedStep(2);
			// since we are not in endless mode we return after sheet has no messages left
			expect(s2.sheet.cellAt('B2').value).toBe('0,0,1,0,1,0');
			await monitorS1.hasFinishedStep(3);
			await machine.stop();
			expect(s2.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s2.sheet.cellAt('B1').value).toBe(9);
			expect(s2.sheet.cellAt('B2').value).toBe('0,0,1,0,1,0,0,0');
			expect(monitorS2.messages.detached).toBe(6);
		});
		test('repeat execute should use passed message and not inbox ones', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",3,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			await machine.pause();
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			s2.inbox.put(new Message({}, '1'));
			s2.inbox.put(new Message({}, '2'));
			expect(s2.inbox.size).toBe(2);
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(s2.inbox.size).toBe(2);
			expect(monitorS2.messages.attached).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
		});
		test('repeated execute consumes passed message with loop element and none from inbox', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",3,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'loopindices()' } });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.pause();
			s2.inbox.put(new Message([ 3 ]));
			s2.inbox.put(new Message([4, 5, 6]));
			s2.inbox.put(new Message());
			expect(s2.inbox.size).toBe(3);
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.pause();
			// finishes repetitions
			expect(s2.stats.executesteps).toBe(3);
			expect(monitorS2.messages.attached).toBe(3);
			expect(s2.inbox.size).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,0,1,0,1');
			// once again:
			await machine.start();
			await monitorS1.hasFinishedStep(2);
			await machine.stop();
			expect(s2.stats.executesteps).toBe(3);
			expect(monitorS2.messages.attached).toBe(6);
			expect(s2.inbox.size).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A4').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,0,1,0,1,0,1,0,1,0,1');
		});
		test('reuse passed message on "repeat until..." until return()', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",1,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'if(mod(B1,2)=0,return(),false)' }
			});
			s2.trigger.update({ repeat: 'endless' });
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(monitorS2.messages.attached).toBe(1);
			expect(monitorS2.messages.detached).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			// once again
			await machine.start();
			await monitorS1.hasFinishedStep(4);
			await machine.stop();
			expect(monitorS2.messages.attached).toBe(4);
			expect(monitorS2.messages.detached).toBe(7);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			expect(s1.sheet.cellAt('A4').value).toBe(5);
			expect(s2.sheet.cellAt('B1').value).toBe(8);
		});
	});
	describe('chained execute', () => {
		test('chain of execution with several sheets on machine run', async () => {
			// CHAIN: S1 -> S3 -> S2
			const { machine, s1, s2 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const s3 = createStreamsheet({
				name: 'S3',
				trigger: { type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' }
			});
			machine.addStreamSheet(s3);
			s2.trigger.update({ repeat: 'endless' });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S3")' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'if(mod(B1,3)=0,return(),false)' }
			});
			s3.sheet.loadCells({
				C1: { formula: 'C1+1' },
				C2: { formula: 'execute("S2")' },
				C3: { formula: 'C3+1' },
				C4: { formula: 'if(mod(C3,3)=0,return(),false)' }
			})
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(6);
			expect(s3.sheet.cellAt('C1').value).toBe(3);
			expect(s3.sheet.cellAt('C3').value).toBe(3);
			// once again
			await machine.start();
			await monitorS1.hasFinishedStep(3);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('A3').value).toBe(4);
			expect(s2.sheet.cellAt('B1').value).toBe(24);
			expect(s3.sheet.cellAt('C1').value).toBe(9);
			expect(s3.sheet.cellAt('C3').value).toBe(9);
		});
		test('chained executed sheets', async()=> {
			// s1 -> executes s2 -> executes s3
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			const monitorS1 = monitorStreamSheet(s1);
			const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE } });
			machine.addStreamSheet(s3);
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' }, A3: { formula: 'A3+1' } });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'execute("S3")' }, C2: { formula: 'C2+1' } });
			s3.sheet.loadCells({ C1: { formula: 'C1+1' } });
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s2.sheet.cellAt('C2').value).toBe(2);
			expect(s3.sheet.cellAt('C1').value).toBe(2);
		});	
		test('chained execution with passed data', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			const monitorS1 = monitorStreamSheet(s1);
			const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE } });
			machine.addStreamSheet(s3);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",2,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'execute("S3", 3)' } });
			s3.sheet.loadCells({ C1: { formula: 'C1+1' } });
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(s3.sheet.cellAt('C1').value).toBe(7);
		});
		test.skip('chained execution with passed data and loop element', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			const monitorS1 = monitorStreamSheet(s1);
			const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE } });
			machine.addStreamSheet(s3);
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			s3.updateSettings({ loop: { path: '[data]', enabled: true } });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",2,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()'},
				B3: 'john', C2: 'doe',
				B4: { formula: 'execute("S3", 3, array(B2,C2))' },
				B5: { formula: 'B5+1' }
			});
			s3.sheet.loadCells({ C1: { formula: 'C1+1' }, C2: { formula: 'loopindices()' } });
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s2.sheet.cellAt('B2').value).toBe('0,1');
			expect(s3.sheet.cellAt('C2').value).toBe('0,1,0,1,0,1,0');

			// await machine.start();
			// await monitorS1.hasFinishedStep(1);
			// await machine.stop();
			// expect(s1.sheet.cellAt('A1').value).toBe(2);
			// expect(s1.sheet.cellAt('A4').value).toBe(2);
			// expect(s2.sheet.cellAt('B1').value).toBe(5);
			// expect(s2.sheet.cellAt('B4').value).toBe(5);
			// expect(s3.sheet.cellAt('C1').value).toBe(25);
		});
		test.skip('2x manual steps and then start', async() => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			const monitorS1 = monitorStreamSheet(s1);
			const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE } });
			machine.addStreamSheet(s3);
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			s3.updateSettings({ loop: { path: '[data]', enabled: true } });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",2,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: 'john', C2: 'doe',
				B3: { formula: 'execute("S3", 3, array(B2,C2))' },
				B4: { formula: 'B4+1' }
			});
			s3.sheet.loadCells({ C1: { formula: 'C1+1' }, C2: { formula: 'loopindices()' } });
			await machine.step();
			await machine.step();
			await machine.start();
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe('to be defined');
			expect(s2.sheet.cellAt('B4').value).toBe('to be defined');
			expect(s3.sheet.cellAt('C1').value).toBe('to be defined');
		});
		test.skip('chained execution with passed data in "repeat until..." mode', async () => {
			const { machine, s1, s2 } = setup();
			const s3 = new StreamSheet();
			machine.addStreamSheet(s3);
			s1.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START });
			s2.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' });
			s3.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",2,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'execute("S3", 3)' } });
			s3.sheet.loadCells({ 
				C1: { formula: 'C1+1' },
				C2: { formula: 'if(mod(C1,4)=0,return(42),"waiting")'},
				C3: { formula: 'C3+1' } });
			await machine.start();
			await wait(30);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			// expect(s1.sheet.cellAt('A4').value).toBe(2);
			// expect(s2.sheet.cellAt('B1').value).toBe(3);
			// expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s3.sheet.cellAt('C1').value).toBe(12);
			expect(s3.sheet.cellAt('C3').value).toBe(9);
		});
		test.skip('chained executed sheets with repetition', async () => {
			// s1 -> executes s2 -> executes s3
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE } });
			machine.addStreamSheet(s3);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",2)' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'execute("S3",3)' },
				C2: { formula: 'C2+1' }
			});
			s3.sheet.loadCells({ C1: { formula: 'C1+1' } });
			await machine.start();
			await wait(30);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s2.sheet.cellAt('C2').value).toBe(3);
			expect(s3.sheet.cellAt('C1').value).toBe(7);
		});
		test.skip('chained executed sheets with repetition and loop elements', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE } });
			machine.addStreamSheet(s3);
			// const monitorS2 = monitorStreamSheet(s2);
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			s3.updateSettings({ loop: { path: '[data]', enabled: true } });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2: '!!!',
				A3: { formula: 'execute("S2",2,array(A2,B2,C2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: 'john', C2: 'doe', D2: '23',
				B3: { formula: 'execute("S3",3,array(B2,C2,D2))' },
				B4: { formula: 'B4+1' }
			});
			s3.sheet.loadCells({ C1: { formula: 'C1+1' } });
			await machine.start();
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(7);
			expect(s2.sheet.cellAt('B3').value).toBe(true);
			expect(s2.sheet.cellAt('B4').value).toBe(7);
			expect(s3.sheet.cellAt('C1').value).toBe(55);
		});
		test.skip('chained executed sheets with repetition, loop elements and return()', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE } });
			machine.addStreamSheet(s3);
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			s3.updateSettings({ loop: { path: '[data]', enabled: true } });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2: '!!!',
				A3: { formula: 'execute("S2",2,array(A2,B2,C2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()' },
				B3: 'john', C2: 'doe', D2: '23',
				B4: { formula: 'execute("S3",3,array(B3,C3,D3))' },
				B5: { formula: 'if(mod(B1,2)=0,return("done"),false)' }
			});
			s3.sheet.loadCells({
				C1: { formula: 'C1+1' },
				C2: { formula: 'loopindices()' },
				C3: { formula: 'if(mod(C1,2)=0,return(42),false)' }
			});
			await machine.start();
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			expect(s2.sheet.cellAt('B2').value).toBe('0,0,1');
			expect(s2.sheet.cellAt('B5').value).toBe('done');
			expect(s3.sheet.cellAt('C1').value).toBe(18);
			expect(s3.sheet.cellAt('C2').value).toBe('0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1');
			expect(s3.sheet.cellAt('C3').value).toBe(42);
		});
		test.skip('chained executed sheets in "repeat until..." mode', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' } });
			machine.addStreamSheet(s3);
			s2.trigger.update({ repeat: 'endless' });
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' }, A3: { formula: 'A3+1' } });
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'execute("S3")' },
				B3: { formula: 'if(mod(B1,4)=0,return("done"),false)' }
			});
			s3.sheet.loadCells({ C1: { formula: 'C1+1' }, C2: { formula: 'if(mod(C1,3)=0,return(42),false)' } });
			await machine.start();
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			expect(s2.sheet.cellAt('B3').value).toBe('done');
			expect(s3.sheet.cellAt('C1').value).toBe(9);
			expect(s3.sheet.cellAt('C2').value).toBe(42);
		});
		test.skip('chained executed sheets with loop elements in "repeat until..." return() mode', async () => {
			// TODO: resume work ok trigger here...
			expect(false).toBe(true);
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' } });
			machine.addStreamSheet(s3);
			s3.updateSettings({ loop: { path: '[data]', enabled: true } });
			s2.trigger.update({ repeat: 'endless' });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2: '!!!',
				A3: { formula: 'execute("S2",1,array(A2,B2,C2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()' },
				B3: 'john', C2: 'doe', D2: '23',
				B4: { formula: 'execute("S3",1,array(B3,C3,D3))' },
				B5: { formula: 'if(mod(B1,2)=0,return("done"),false)' }
			});
			s3.sheet.loadCells({
				C1: { formula: 'C1+1' },
				C2: { formula: 'loopindices()' },
				C3: { formula: 'if(mod(C1,2)=0,return(42),false)' }
			});
			await machine.start();
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			// expect(s1.sheet.cellAt('A4').value).toBe(2);
			// expect(s2.sheet.cellAt('B1').value).toBe(4);
			// expect(s2.sheet.cellAt('B2').value).toBe('0,0,1');
			// expect(s2.sheet.cellAt('B5').value).toBe('done');
			expect(s3.sheet.cellAt('C1').value).toBe(18);
			expect(s3.sheet.cellAt('C2').value).toBe('0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1');
			expect(s3.sheet.cellAt('C3').value).toBe(42);
		});
		test.skip('chained executed sheets with repetition and loop elements in "repeat until..." return() mode', async () => {
			expect(false).toBe(true);
		});
		test.skip('one execution with passed data in "repeat until..." mode', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			s2.trigger.update({ repeat: 'endless' });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",3,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ 
				B1: { formula: 'B1+1' },
				B2: { formula: 'if(mod(B1,4)=0,return(42),"waiting")'},
				B3: { formula: 'B3+1' } });
			await machine.start();
			await wait(30);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s2.sheet.cellAt('B1').value).toBe(12);
			expect(s2.sheet.cellAt('B2').value).toBe(42);
			expect(s2.sheet.cellAt('B3').value).toBe(9);
		});
		test.skip('chained execution with passed data in "repeat until..." mode', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
			const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' } });
			machine.addStreamSheet(s3);
			s2.trigger.uppdate({ repeat: 'endless' });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",2,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'execute("S3", 3)' } });
			s3.sheet.loadCells({ 
				C1: { formula: 'C1+1' },
				C2: { formula: 'if(mod(C1,4)=0,return(42),"waiting")'},
				C3: { formula: 'C3+1' } });
			await machine.start();
			await wait(30);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			// expect(s1.sheet.cellAt('A4').value).toBe(2);
			// expect(s2.sheet.cellAt('B1').value).toBe(3);
			// expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s3.sheet.cellAt('C1').value).toBe(12);
			expect(s3.sheet.cellAt('C3').value).toBe(9);
		});
	});
});

describe('behaviour on manual steps', () => {
	describe('general behaviour', () => {
		test('execute sheet only if corresponding trigger is set', async () => {
			const { machine, s1, s2 } = setup();
			s2.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_STOP });
			createCellAt('A1', { formula: 'execute("S2")' }, s1.sheet);
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(true);
			expect(s2.sheet.cellAt('B1').value).toBe(1);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(true);
			expect(s2.sheet.cellAt('B1').value).toBe(1);
		});
		test('execute sheet', async () => {
			const { machine, s1, s2 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
			createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
			createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(2);
			await machine.step();
			expect(s2.sheet.cellAt('B2').value).toBe(3);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(4);
			expect(s2.sheet.cellAt('B2').value).toBe(4);
		});
		test('calling sheet pauses until executed sheet returns in "repeat until..."', async () => {
			const { machine, s1, s2 } = setup();
			s2.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
			createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
			createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
			createCellAt('B3', { formula: 'if(mod(B2,3)=0,return(),false)' }, s2.sheet);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(2);
			expect(s2.sheet.cellAt('B3').value).toBe(false);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(3);
			expect(s2.sheet.cellAt('B3').value).toBe(true);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(4);
			expect(s2.sheet.cellAt('B3').value).toBe(false);
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(3);
			expect(s2.sheet.cellAt('B2').value).toBe(6);
			expect(s2.sheet.cellAt('B3').value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(4);
			expect(s2.sheet.cellAt('B2').value).toBe(9);
			expect(s2.sheet.cellAt('B3').value).toBe(true);
		});
		test('calling sheet pauses until executed sheet returns in "repeat until..." and switched sheet order', async () => {
			// S2 --executes--> S1
			const { machine, s1, s2 } = setup({ switched: true });
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'if(mod(A1,3)=0,return(),false)' }, s1.sheet);
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			createCellAt('B2', { formula: 'execute("S1")' }, s2.sheet);
			createCellAt('B3', { formula: 'B3+1' }, s2.sheet);
			await machine.step();
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s2.sheet.cellAt('B3').value).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(false);
			await machine.step();
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s2.sheet.cellAt('B3').value).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			await machine.step();
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s2.sheet.cellAt('B3').value).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('A2').value).toBe(false);
			await machine.step();
			await machine.step();
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s2.sheet.cellAt('B3').value).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(6);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s2.sheet.cellAt('B3').value).toBe(4);
			expect(s1.sheet.cellAt('A1').value).toBe(9);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
		});
		test('execute endlessly in "repeat until..."', async () => {
			const { machine, s1, s2 } = setup();
			s2.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
			createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
			createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(2);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(5);
		});
		test('calling sheet resumes and stops "repeat until..." if execute() cell is replaced', async () => {
			const { machine, s1, s2 } = setup();
			s2.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: `execute("S2")` }, s1.sheet);
			createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			// replace execute cell
			createCellAt('A2', { formula: 'A2+1' }, s1.sheet);
			await machine.step();
			expect(s1.stats.steps).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A2').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.stats.steps).toBe(5);
			expect(s1.sheet.cellAt('A1').value).toBe(6);
			expect(s1.sheet.cellAt('A2').value).toBe(5);
			expect(s1.sheet.cellAt('A3').value).toBe(6);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
		});
	});
	describe('general repeat behaviour', () => {
		test('repeat execute as often as specified by repetitions parameter', async () => {
			const { machine, s1, s2 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S2",4)' }, s1.sheet);
			createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
			createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(2);
			await machine.step();
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(3);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(4);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(5);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(8);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A3').value).toBe(3);
			expect(s2.sheet.cellAt('B2').value).toBe(9);
		});
		test('never repeat execute in "repeat until..."', async () => {
			const { machine, s1, s2 } = setup();
			s2.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S2",10)' }, s1.sheet);
			createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
			createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(2);
			await machine.step();
			expect(s2.sheet.cellAt('B2').value).toBe(3);
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(5);
			expect(s2.stats.executesteps).toBe(1);
		});
		test('repeated execute goes on with next repetition on each return() in "repeat until..."', async () => {
			const { machine, s1, s2 } = setup();
			s2.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S2",3)' }, s1.sheet);
			createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
			createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
			createCellAt('B3', { formula: 'if(mod(B2,3)=0,return(),false)' }, s2.sheet);
			createCellAt('B4', { formula: 'B4+1' }, s2.sheet);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(2);
			expect(s2.sheet.cellAt('B3').value).toBe(false);
			expect(s2.sheet.cellAt('B4').value).toBe(2);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(3);
			expect(s2.sheet.cellAt('B3').value).toBe(true);
			expect(s2.sheet.cellAt('B4').value).toBe(2);
			await machine.step(); // next repetition
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(4);
			expect(s2.sheet.cellAt('B3').value).toBe(false);
			expect(s2.sheet.cellAt('B4').value).toBe(3);
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(6);
			expect(s2.sheet.cellAt('B3').value).toBe(true);
			expect(s2.sheet.cellAt('B4').value).toBe(4);
			await machine.step(); // final repetition
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(9);
			expect(s2.sheet.cellAt('B3').value).toBe(true);
			expect(s2.sheet.cellAt('B4').value).toBe(6);
		});
		test.skip('execute after start/stop machine', () => {
			expect(false).toBe(true);
		});
		test.skip('execute after start/pause machine', () => {
			expect(false).toBe(true);
		});
		test.skip('start machine after execute several steps', () => {
			expect(false).toBe(true);
		});
	});
	describe('message handling', () => {
		test('execute sheet and pass message', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",1,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(monitorS2.messages.attached).toBe(1);
			expect(monitorS2.messages.detached).toBe(1);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A4').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(monitorS2.messages.attached).toBe(2);
			expect(monitorS2.messages.detached).toBe(2);
		});
		test('executed sheet should use passed message before using inbox ones', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",1,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			s2.inbox.put(new Message({}, '1'));
			s2.inbox.put(new Message({}, '2'));
			expect(s2.inbox.size).toBe(2);
			await machine.step();
			// always use passed message => never inbox ones...
			expect(s2.inbox.size).toBe(2);
			expect(monitorS2.messages.attached).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			await machine.step();
			await machine.step();
			await machine.step();
			// always use passed message => never inbox ones...
			expect(s2.inbox.size).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			expect(s1.sheet.cellAt('A4').value).toBe(5);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
		});
		test('execute sheet and pass message with loop-element', async () => {
			const { machine, s1, s2 } = setup();
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",1,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'loopindices()' } });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.step();
			expect(s2.sheet.cellAt('B1').value).toBe('0');
			await machine.step();
			expect(s2.sheet.cellAt('B1').value).toBe('0,1');
			await machine.step();
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,0');
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A4').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,0,1');
		});
		test('repeated execute consumes a message from inbox on each repetition', async () => {
			const { machine, s1, s2 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S2", 4)' }, s1.sheet);
			createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
			s2.inbox.put(new Message());
			s2.inbox.put(new Message());
			s2.inbox.put(new Message());
			s2.inbox.put(new Message());
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			expect(s2.inbox.size).toBe(4);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			// last message is consumed but still in inbox due to client...
			expect(s2.inbox.size).toBe(4);
			await machine.step();
			expect(s2.inbox.size).toBe(3);
			await machine.step();
			expect(s2.inbox.size).toBe(2);
			await machine.step(); // resumes from repetitions
			expect(s2.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			await machine.step();
			await machine.step();
			expect(s2.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(7);
		});
		test('repeated execute always consumes passed message even if inbox is not empty', async () => {
			const { machine, s1, s2 } = setup();
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",3,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'loopindices()' } });
			s2.inbox.put(new Message({}, '1'));
			s2.inbox.put(new Message({}, '2'));
			expect(s2.inbox.size).toBe(2);
			await machine.step();
			expect(s2.inbox.size).toBe(2);
			expect(s2.inbox.peek().id).toBeDefined();
			expect(s2.stats.executesteps).toBe(1);
			await machine.step();
			expect(s2.inbox.size).toBe(2);
			expect(s2.inbox.peek().id).toBe('1');
			expect(s2.stats.executesteps).toBe(2);
			await machine.step();
			expect(s2.inbox.size).toBe(2);
			expect(s2.inbox.peek().id).toBe('1');
			expect(s2.stats.executesteps).toBe(3);
			await machine.step();
			expect(s2.inbox.size).toBe(2);
			expect(s2.inbox.peek().id).toBeDefined();
			expect(s2.stats.executesteps).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			expect(s2.sheet.cellAt('B2').value).toBe('0,0,0,0');
		});
		test('repeated execute with loop-element', async () => {
			const { machine, s1, s2 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S2", 3)' }, s1.sheet);
			createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
			s2.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
			s2.inbox.put(new Message({ loop: [{ val: 1 }, { val: 2 }, { val: 3 }] }));
			s2.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
			s2.inbox.put(new Message({ loop: [{ val: 6 }, { val: 7 }] }));
			s2.inbox.put(new Message());
			createCellAt('B1', { formula: 'loopindices()' }, s2.sheet);
			expect(s2.inbox.size).toBe(4);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe('0');
			await machine.step();
			expect(s2.sheet.cellAt('B1').value).toBe('0,1');
			await machine.step(); // ends first repeat
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,2');
			await machine.step();
			expect(s2.inbox.size).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,2,0');
			await machine.step(); // ends second repeat
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,2,0,1');
			await machine.step();
			expect(s2.inbox.size).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,2,0,1,0');
			await machine.step();	//ends last repeat
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,2,0,1,0,1');
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			await machine.step();
			expect(s2.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,2,0,1,0,1,0');
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			await machine.step();	// use last empty message and directly resume repeat
			await machine.step();	// use last empty message and directly resume repeat
			expect(s2.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,2,0,1,0,1,0,0,0');
			expect(s1.sheet.cellAt('A3').value).toBe(3);
		});
		test('repeated execute consumes passed message with loop element and none from inbox', async () => {
			const { machine, s1, s2 } = setup();
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",3,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'loopindices()' } });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			s2.inbox.put(new Message([ 3 ]));
			s2.inbox.put(new Message([4, 5, 6]));
			s2.inbox.put(new Message());
			expect(s2.inbox.size).toBe(3);
			// 2 steps to consume passed message
			await machine.step();
			await machine.step();
			expect(s2.inbox.size).toBe(3);
			expect(s2.stats.executesteps).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe('0,1');
			// 2 steps to consume passed message
			await machine.step();
			await machine.step();
			expect(s2.inbox.size).toBe(3);
			expect(s2.stats.executesteps).toBe(2);
			// expect(s2.sheet.cellAt('B1').value).toBe('0,1,0');
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,0,1');
			await machine.step();
			await machine.step();	// finishes repetitions
			expect(s2.inbox.size).toBe(3);
			expect(s2.stats.executesteps).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,0,1,0,1');
			await machine.step();
			await machine.step();
			expect(s2.inbox.size).toBe(3);
			expect(s2.stats.executesteps).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe('0,1,0,1,0,1,0,1');
		});
		test('reuse of passed message on "repeat until..." until return()', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",1,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'if(mod(B1,3)=0,return(),false)' }
			});
			s2.trigger.update({ repeat: 'endless' });
			await machine.step();
			expect(monitorS2.messages.attached).toBe(1);
			expect(monitorS2.messages.detached).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(false);
			await machine.step(); // returns from repeat...
			expect(monitorS2.messages.attached).toBe(1);
			expect(monitorS2.messages.detached).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			await machine.step();
			await machine.step();
			expect(monitorS2.messages.attached).toBe(2);
			expect(monitorS2.messages.detached).toBe(4);
			await machine.step(); // returns from repeat...
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A4').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(6);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
		});
		test('reuse of same loop element in "repeat until..." until return()', async () => {
			const { machine, s1, s2 } = setup();
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",1,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()' },
				B3: { formula: 'if(mod(B1,3)=0,return(),false)' }
			});
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			s2.trigger.update({ repeat: 'endless' });
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe('0');
			expect(s2.sheet.cellAt('B3').value).toBe(false);
			await machine.step();	// returns -> next loop element
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe('0,0');
			expect(s2.sheet.cellAt('B3').value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();	// returns -> finishes message
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(6);
			expect(s2.sheet.cellAt('B2').value).toBe('0,0,1,1,1');
			expect(s2.sheet.cellAt('B3').value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();	// returns -> next loop element
			expect(s2.sheet.cellAt('B2').value).toBe('0,0,1,1,1,0,0,0');
			await machine.step();
			await machine.step();
			await machine.step();	// returns -> finishes message
			expect(s2.sheet.cellAt('B2').value).toBe('0,0,1,1,1,0,0,0,1,1,1');
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A4').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(12);
		});
		test('repeated execute consumes same loop element in "repeat until..." until return()', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",2,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()' },
				B3: { formula: 'if(mod(B1,2)=0,return(),false)' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.step(); // returns -> next loop element
			expect(monitorS2.messages.attached).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe('0');
			expect(s2.sheet.cellAt('B3').value).toBe(true);
			await machine.step();
			await machine.step();	// returns -> finishes 1. repeat -> attach message again
			expect(s2.stats.executesteps).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,1');
			await machine.step();	// attach passed message
			expect(s2.stats.executesteps).toBe(2);
			expect(monitorS2.messages.attached).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,1,0');
			await machine.step(); // returns -> next loop element
			expect(s2.stats.executesteps).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,1,0,0');
			await machine.step();
			await machine.step();	// returns -> finishes 2. repeat -> resume S2
			expect(s2.stats.executesteps).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,1,0,0,1,1');
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A4').value).toBe(2);	
			await machine.step(); 	// from the beginning
			expect(s2.stats.executesteps).toBe(1);
			expect(monitorS2.messages.attached).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,1,0,0,1,1,0');
			expect(s2.sheet.cellAt('B3').value).toBe(false);
		});
		test('repeated execute with loop and pause function', async () => {
			const { machine, s1, s2 } = setup();
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2: '!!!',
				A3: { formula: 'execute("S2",3,array(A2,B2,C2),true)' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'loopindices()' },
				B3: { formula: 'pause(0.01)' }
			});
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.step();
			expect(s2.stats.executesteps).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe('0');
			await wait(10);
			await machine.step();
			expect(s2.sheet.cellAt('B2').value).toBe('0,1');
			await wait(10);
			await machine.step();
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,2');
			await wait(10);
			await machine.step(); // next repeat
			expect(s2.stats.executesteps).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,2,0');
		});
		test('calling sheet waits at same message on "repeat until..." until execute() returns', async () => {
			const { machine, s1, s2 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
			s1.inbox.put(new Message());
			s1.inbox.put(new Message());
			s1.inbox.put(new Message());
			s2.trigger.update({ repeat: 'endless' });
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			createCellAt('B2', { formula: 'if(mod(B1,3)=0,return(),false)' }, s2.sheet);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			await machine.step();
			expect(s1.inbox.size).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			await machine.step();
			expect(s1.inbox.size).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			await machine.step();
			await machine.step();
			expect(s1.inbox.size).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(6);
			await machine.step();
			expect(s1.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s2.sheet.cellAt('B1').value).toBe(7);
			// stay at last message:
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			expect(s2.sheet.cellAt('B1').value).toBe(12);
		});
		test('calling sheet waits at same loop-element on "repeat until..." until execute() returns', async () => {
			const { machine, s1, s2 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
			s1.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
			s1.inbox.put(new Message({ loop: [{ val: 1 }, { val: 2 }] }));
			s1.inbox.put(new Message({ loop: [{ val: 3 }] }));
			s1.inbox.put(new Message());
			s2.trigger.update({ repeat: 'endless' });
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			createCellAt('B2', { formula: 'if(mod(B1,3)=0,return(),false)' }, s2.sheet);
			await machine.step();
			expect(s1.getLoopIndex()).toBe(0);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			await machine.step();
			expect(s1.inbox.size).toBe(3);
			expect(s1.getLoopIndex()).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			await machine.step();
			await machine.step();
			await machine.step();
			// message is popped of with next step!
			expect(s1.getLoopIndex()).toBe(1);
			expect(s1.inbox.size).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(6);
			await machine.step();
			expect(s1.getLoopIndex()).toBe(0);
			expect(s1.inbox.size).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s2.sheet.cellAt('B1').value).toBe(7);
			await machine.step();
			await machine.step();
			// message is popped of with next step!
			expect(s1.getLoopIndex()).toBe(0);
			expect(s1.inbox.size).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s2.sheet.cellAt('B1').value).toBe(9);
			await machine.step();
			expect(s1.getLoopIndex()).toBe(0);
			expect(s1.inbox.size).toBe(1);
			await machine.step();
			await machine.step();
			expect(s1.getLoopIndex()).toBe(0);
			expect(s1.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			expect(s2.sheet.cellAt('B1').value).toBe(12);
			// stay at last message:
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.getLoopIndex()).toBe(0);
			expect(s1.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(7);
			expect(s2.sheet.cellAt('B1').value).toBe(17);
		});
	});
	describe('chained execute', () => {
		test('chain of execution with several sheets on manual steps', async () => {
			// CHAIN: S1 -> S3 -> S2
			const { machine, s1, s2 } = setup();
			const s3 = createStreamsheet({
				name: 'S3',
				trigger: { type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' }
			});
			machine.addStreamSheet(s3);
			s2.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S3")' }, s1.sheet);
			createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
			createCellAt('C1', { formula: 'C1+1' }, s3.sheet);
			createCellAt('C2', { formula: 'execute("S2")' }, s3.sheet);
			createCellAt('C3', { formula: 'C3+1' }, s3.sheet);
			createCellAt('C4', { formula: 'if(mod(C3,3)=0,return(),false)' }, s3.sheet);
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			createCellAt('B2', { formula: 'if(mod(B1,3)=0,return(),false)' }, s2.sheet);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(false);
			expect(s3.sheet.cellAt('C1').value).toBe(2);
			expect(s3.sheet.cellAt('C3').value).toBe(1);
			expect(s3.sheet.cellAt('C4').value).toBe(false);
			await machine.step(); // finish S2 which resumes S3
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s3.sheet.cellAt('C1').value).toBe(2);
			expect(s3.sheet.cellAt('C3').value).toBe(2);
			expect(s3.sheet.cellAt('C4').value).toBe(false);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(6);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s3.sheet.cellAt('C1').value).toBe(3);
			expect(s3.sheet.cellAt('C3').value).toBe(3);
			expect(s3.sheet.cellAt('C4').value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(9);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s3.sheet.cellAt('C1').value).toBe(4);
			expect(s3.sheet.cellAt('C3').value).toBe(4);
			expect(s3.sheet.cellAt('C4').value).toBe(false);
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A3').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(15);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s3.sheet.cellAt('C1').value).toBe(6);
			expect(s3.sheet.cellAt('C3').value).toBe(6);
			expect(s3.sheet.cellAt('C4').value).toBe(true);
		});
		test('chain of execution on manual steps', async () => {
			// setup: S1 -- executes --> S2 -- executes --> S3
			const { machine, s1, s2 } = setup();
			const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE } });
			machine.addStreamSheet(s3);
			s1.trigger.update({ repeat: 'endless' });
			s1.sheet.load({
				cells: {
					A1: { formula: 'A1+1' },
					A2: { formula: 'execute("S2", 2)' },
					A3: { formula: 'A3+1' }
				}
			});
			s2.sheet.load({
				cells: {
					B1: { formula: 'B1+1' },
					B2: { formula: 'execute("S3", 3)' },
					B3: { formula: 'B3+1' }
				}
			});
			s3.sheet.load({ cells: { C1: { formula: 'C1+1' } } });	
			// initial values:
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			expect(s2.sheet.cellAt('B3').value).toBe(1);
			expect(s3.sheet.cellAt('C1').value).toBe(1);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(s2.sheet.cellAt('B3').value).toBe(1);
			expect(s2.stats.executesteps).toBe(1);
			expect(s3.sheet.cellAt('C1').value).toBe(2);
			expect(s3.stats.executesteps).toBe(1);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(s2.sheet.cellAt('B3').value).toBe(1);
			expect(s2.stats.executesteps).toBe(1);
			expect(s3.sheet.cellAt('C1').value).toBe(3);
			expect(s3.stats.executesteps).toBe(2);
			await machine.step();	// finishes S3 -> resumes S2
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(s2.sheet.cellAt('B3').value).toBe(2);
			expect(s2.stats.executesteps).toBe(1);
			expect(s3.sheet.cellAt('C1').value).toBe(4);
			expect(s3.stats.executesteps).toBe(3);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(s2.sheet.cellAt('B3').value).toBe(2);
			expect(s2.stats.executesteps).toBe(2);
			expect(s3.sheet.cellAt('C1').value).toBe(5);
			expect(s3.stats.executesteps).toBe(1);
			await machine.step();
			await machine.step();	// finishes S3 -> resumes & finishes S2 -> resumes S1
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(s2.sheet.cellAt('B3').value).toBe(3);
			expect(s2.stats.executesteps).toBe(2);
			expect(s3.sheet.cellAt('C1').value).toBe(7);
			expect(s3.stats.executesteps).toBe(3);
			await machine.step();	// once again from the beginning
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			expect(s2.sheet.cellAt('B3').value).toBe(3);
			expect(s2.stats.executesteps).toBe(1);
			expect(s3.sheet.cellAt('C1').value).toBe(8);
			expect(s3.stats.executesteps).toBe(1);
			await machine.step();
			await machine.step();	// finishes S3 -> resumes S2
			await machine.step();
			await machine.step();
			await machine.step();	// finishes S3 -> resumes & finishes S2 -> resumes S1
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A3').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			expect(s2.sheet.cellAt('B3').value).toBe(5);
			expect(s2.stats.executesteps).toBe(2);
			expect(s3.sheet.cellAt('C1').value).toBe(13);
			expect(s3.stats.executesteps).toBe(3);
		});
	});
});


describe.skip('executesteps counter', () => {
	it('should count each repetition in executesteps', async () => {
		const { machine, s1, s2 } = setup();
		createCellAt('A1', { formula: 'execute("S2", 4)' }, s1.sheet);
		createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
		await machine.start();
		await wait(30);
		await machine.pause();
		expect(s2.stats.steps).toBe(4);
		expect(s2.stats.executesteps).toBe(4);
		expect(s1.sheet.cellAt('A1').value).toBe(true);
		expect(s2.sheet.cellAt('B1').value).toBe(5);
		await machine.stop();
	});
	it('should restart repetition count on each execution', async () => {
		const { machine, s1, s2 } = setup();
		createCellAt('A1', { formula: 'execute("S2", 4)' }, s1.sheet);
		createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
		await machine.start();
		await wait(120);
		await machine.pause();
		expect(s2.stats.executesteps).toBe(4);
		expect(s1.sheet.cellAt('A1').value).toBe(true);
		expect(s2.sheet.cellAt('B1').value).toBe(13);
		await machine.stop();
	});
	it('should restart repetition count on each repeat in "repeat until..."', async () => {
		const { machine, s1, s2 } = setup();
		const monitorS2 = monitorStreamSheet(s2);
		s2.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2",5)' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
		createCellAt('B2', { formula: 'if(mod(B1,2)=0,return(),false)' }, s2.sheet);
		await machine.start();
		await monitorS2.hasPassedStep(2);
		await machine.pause();
		expect(s1.stats.steps).toBe(1);
		// 5x repetitions
		expect(s2.stats.steps).toBe(5);
		expect(s2.stats.executesteps).toBe(5);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(10);
		expect(s2.sheet.cellAt('B2').value).toBe(true);
		await machine.stop();
	});
	it('should increase step counter on each execution call', async () => {
		const { machine, s1, s2 } = setup();
		createCellAt('A1', { formula: 'execute("S2", 4)' }, s1.sheet);
		createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
		await machine.start();
		await wait(120);
		await machine.pause();
		expect(s1.stats.steps).toBe(3);
		expect(s2.stats.steps).toBe(12);
		expect(s2.stats.executesteps).toBe(4);
		expect(s1.sheet.cellAt('A1').value).toBe(true);
		expect(s2.sheet.cellAt('B1').value).toBe(13);
		await machine.stop();
	});
	it('should not increase step counter on each execution call on "repeat until..."', async () => {
		const { machine, s1, s2 } = setup();
		s2.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
		await machine.start();
		await wait(70);
		await machine.pause();
		expect(s1.stats.steps).toBe(1);
		expect(s2.stats.steps).toBe(1);
		expect(s2.stats.repeatsteps).toBeGreaterThan(2);
		expect(s2.stats.executesteps).toBe(1);
		await machine.stop();
	});
	it('should not count repeat steps in "repeat until..." mode if paused by function', async () => {
		const { machine, s2 } = setup();
		const t1 = new StreamSheet();
		t1.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START });
		machine.addStreamSheet(t1);
		machine.cycletime = 50000;
		s2.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'A1+1' }, t1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, t1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, t1.sheet);
		createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
		createCellAt('B2', { formula: 'pause(0.1)' }, s2.sheet);
		createCellAt('C2', { formula: 'C2+1' }, s2.sheet);
		createCellAt('B3', { formula: 'B3+1' }, s2.sheet);
		await machine.start();
		await wait(500);
		expectValue(s2.stats.repeatsteps).toBeInRange(3, 6);
		await machine.stop(); // resumes execute...
		expect(t1.sheet.cellAt('A1').value).toBe(2);
		expect(t1.sheet.cellAt('A2').value).toBe(true);
		expect(t1.sheet.cellAt('A3').value).toBe(2); // because execute resumes on stop
		expectValue(s2.sheet.cellAt('B1').value).toBeInRange(3, 6);
		expectValue(s2.sheet.cellAt('C2').value).toBeInRange(3, 6);
		expectValue(s2.sheet.cellAt('B3').value).toBeInRange(3, 6);
	});
});
describe.skip('updating trigger', () => {
	it('should stop repeat "repeat until..." if corresponding setting is disabled', async () => {
		const { machine, s1, s2 } = setup();
		machine.cycletime = 5000;
		s2.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
		await machine.start();
		await wait(10);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B2').value).toBeGreaterThan(2);
		s2.trigger.update({ repeat: 'once' });
		const s2b2 = s2.sheet.cellAt('B2').value;
		await wait(20);
		expect(s2.sheet.cellAt('B2').value).toBe(s2b2);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		await machine.stop();
	});
	it('should continue process sheet if new trigger is set', async () => {
		const { machine, s1, s2 } = setup();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
		await machine.start();
		await wait(10);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(2);
		s2.trigger = new ExecuteTrigger();
		await wait(70);
		expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(3);
		expect(s1.sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
		expect(s2.sheet.cellAt('B2').value).toBeGreaterThanOrEqual(3);
		await machine.stop();
	});
	it('should stop process sheet if new trigger is NONE', async () => {
		const { machine, s1, s2 } = setup();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
		await machine.start();
		await wait(10);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(2);
		s2.trigger = new NeverTrigger();
		await wait(70);
		expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(3);
		expect(s1.sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
		expect(s2.sheet.cellAt('B2').value).toBe(2);
		await machine.stop();
	});
	it('should stop "repeat until..." if new trigger is set without "repeat until..."', async () => {
		const { machine, s1, s2 } = setup();
		machine.cycletime = 5000;
		s2.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
		await machine.start();
		await wait(10);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B2').value).toBeGreaterThan(2);
		s2.trigger = new ExecuteTrigger();
		const s2b2 = s2.sheet.cellAt('B2').value;
		await wait(20);
		expect(s2.sheet.cellAt('B2').value).toBe(s2b2);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		await machine.stop();
	});
	it('should keep "repeat until..." if new trigger is set with same setting', async () => {
		const { machine, s1, s2 } = setup();
		const machineMonitor = monitorMachine(machine);
		s2.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
		await machine.start();
		await machineMonitor.nextSteps(2);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B2').value).toBeGreaterThan(2);
		s2.trigger = new ExecuteTrigger({ repeat: 'endless' });
		const s2b2 = s2.sheet.cellAt('B2').value;
		// await wait(20);
		await machineMonitor.nextSteps(2);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B2').value).toBeGreaterThan(s2b2);
		await machineMonitor.nextSteps(2);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		await machine.stop();
	});
	// it('should resume on "repeat until.." if new trigger is set and sheet is paused by function', async () => {
	it('should have no effect if new trigger has same settings in "repeat until..." mode and sheet is paused by function', async () => {
		const { machine, s1, s2 } = setup();
		const machineMonitor = monitorMachine(machine);
		const newTrigger = new ExecuteTrigger({ repeat: 'endless' });
		s2.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		createCellAt('B2', { formula: 'pause()' }, s2.sheet);
		createCellAt('B3', { formula: 'B3+1' }, s2.sheet);
		await machine.start();
		await machineMonitor.nextSteps(2);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B3').value).toBe(1);
		s2.trigger = newTrigger;
		await machineMonitor.nextSteps(3);
		expect(s2.sheet.cellAt('B3').value).toBe(1);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		await machine.stop();
	});
});
describe.skip('serialize', () => {
	it('should be possible to save trigger settings to JSON', () => {
		let json = new ExecuteTrigger().toJSON();
		expect(json).toBeDefined();
		expect(json.type).toBe(ExecuteTrigger.TYPE);
		expect(json.repeat).toBe('once');
		json = new ExecuteTrigger({ repeat: 'endless' }).toJSON();
		expect(json).toBeDefined();
		expect(json.type).toBe(ExecuteTrigger.TYPE);
		expect(json.repeat).toBe('endless');
	});
	it('should be possible to restore trigger from JSON', () => {
		let trigger = TriggerFactory.create(new ExecuteTrigger().toJSON());
		expect(trigger).toBeDefined();
		expect(trigger.type).toBe(ExecuteTrigger.TYPE);
		expect(trigger.isEndless).toBe(false);
		trigger = TriggerFactory.create(new ExecuteTrigger({ repeat: 'endless' }).toJSON());
		expect(trigger).toBeDefined();
		expect(trigger.type).toBe(ExecuteTrigger.TYPE);
		expect(trigger.isEndless).toBe(true);
	});
});
describe.skip('tickets based tests',()=>{
	test('DL-1528: verify number of executions', async () => {
		const { machine, s1, s2 } = setup();
		const monitorS2 = monitorStreamSheet(s2);
		s1.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' });
		s2.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
		createCellAt('B2', { formula: 'if(B1>=10,return(),false)' }, s2.sheet);
		await machine.start();
		// wait until s2 got called 5 times
		await monitorS2.hasPassedStep(5);
		// s1 is endless and never returns, so stay at 1
		expect(s1.stats.steps).toBe(1);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(6);
		expect(s2.sheet.cellAt('B1').value).toBe(14);
		expect(s2.sheet.cellAt('B2').value).toBe(true);
	});
	test('DL-1114: one execution with passed data in "repeat until..." mode', async () => {
		const { machine, s1, s2 } = setup();
		s1.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START });
		s2.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' });
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: 'hello', B2: 'world',
			A3: { formula: 'execute("S2",3,array(A2,B2))' },
			A4: { formula: 'A4+1' }
		});
		s2.sheet.loadCells({ 
			B1: { formula: 'B1+1' },
			B2: { formula: 'if(mod(B1,4)=0,return(42),"waiting")'},
			B3: { formula: 'B3+1' } });
		await machine.start();
		await wait(30);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(true);
		expect(s2.sheet.cellAt('B1').value).toBe(12);
		expect(s2.sheet.cellAt('B2').value).toBe(42);
		expect(s2.sheet.cellAt('B3').value).toBe(9);
	});
});



describe.skip('to review and include if all works', () => {
	describe('manual steps: general behaviour', () => {
		test('execute sheet on paused machine', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const machineMonitor = monitorMachine(machine);
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
			createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
			createCellAt('B2', { formula: 'B2+1' }, s2.sheet);
			await machine.start();
			// await monitorS1.hasFinishedStep(1);
			await machineMonitor.hasPassedStep(1);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(2);
			await machine.step();
			await machine.step();
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(4);
			expect(s2.sheet.cellAt('B2').value).toBe(4);
		});
		test.skip('execute after start/stop machine', () => {
			expect(false).toBe(true);
		});
		test.skip('execute after start/pause machine', () => {
			expect(false).toBe(true);
		});
		test.skip('start machine after execute several steps', () => {
			expect(false).toBe(true);
		});
	});
});