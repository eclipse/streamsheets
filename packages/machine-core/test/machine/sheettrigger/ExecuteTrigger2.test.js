const {
	Machine,
	Message,
	StreamSheet,
	TriggerFactory
} = require('../../..');
const { createCellAt, expectValue, monitorMachine, monitorStreamSheet, wait } = require('../../utils');

// jasmine.DEFAULT_TIMEOUT_INTERVAL = 60 * 60 * 1000;

// const addOutboxMessage = (machine, message) => {
// 	message = message || new Message({ outbox: true });
// 	machine.outbox.put(message);
// 	return message.id;
// };

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
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2")' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			await machine.start();
			await wait(30);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
		});
		test('execute with paused & resumed sheet', async () => {
			const { machine, s1, s2 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' } });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'pause(0.1)' } });
			await machine.start();
			await monitorS1.hasPassedStep(3);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
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
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2")' },
				A3: { formula: 'A3+1' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'if(B1>4,return(42),false)' } });
			await machine.start();
			await wait(40);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBeGreaterThan(4);
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
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2")' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'pause(0.01)' } });
			await machine.start();
			await machine.pause();
			await wait(30);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			await machine.start();
			await wait(45);
			await machine.stop();
			expectValue(s1.sheet.cellAt('A1').value).toBeInRange(4, 5);
			expectValue(s1.sheet.cellAt('A3').value).toBeInRange(3, 4);
			expectValue(s2.sheet.cellAt('B1').value).toBeInRange(3, 4);
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
			await monitorS1.hasPassedStep(1);
			await wait(40);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
		});
		test('repeated execute and pause function', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",4)' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'pause(0.01)' } });
			await machine.start();
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			// once again with longer pause and stop before it could resume:
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'execute("S2",4)' },
				A3: { formula: 'A3+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'pause(0.1)' } });
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(1);
			await machine.start();
			await wait(200);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
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
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world',
				A3: { formula: 'execute("S2",1,array(A2,B2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.start();
			await monitorS2.hasPassedStep(2);
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(3);
			expect(monitorS2.messages.attached).toBe(1);
			expect(monitorS2.messages.detached).toBe(1);
		});
		test('execute sheet and pass message with loop is stopped by return', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2: '!!!', D2: 23,
				A3: { formula: 'execute("S2",1,array(A2,B2,C2,D2))' },
				A4: { formula: 'A4+1' }
			});
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'if(B1>2,return(42),"waiting")'} });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.start();
			await wait(300);
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
			const monitorS2 = monitorStreamSheet(s2);
			machine.cycletime = 10;
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2:'!!!',
				A3: { formula: 'execute("S2",4,array(A2,B2,C2))' },
				A4: { formula: 'A4+1' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'if(mod(B1,2)=0,return(42),false)' } });
			await machine.start();
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(8);
			expect(s2.sheet.cellAt('B2').value).toBe(42);
			expect(monitorS2.messages.attached).toBe(4);
			expect(monitorS2.messages.detached).toBe(4);
		});
		test('repeated execute and pass message with loop and "repeat until..." return()', async () => {
			const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
			const monitorS2 = monitorStreamSheet(s2);
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: 'hello', B2: 'world', C2: '!!!', D2: 23,
				A3: { formula: 'execute("S2",4,array(A2,B2,C2,D2),true)' },
				A4: { formula: 'A4+1' }
			});
			s2.trigger.update({ repeat: 'endless' });
			s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'if(mod(B1,3)=0,return(42),"waiting")'} });
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.start();
			await wait(50);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A3').value).toBe(true);
			expect(s1.sheet.cellAt('A4').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(12);
			expect(s2.sheet.cellAt('B2').value).toBe(42);
			expect(monitorS2.messages.attached).toBe(4);
			expect(monitorS2.messages.detached).toBe(4);
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
				B3: { formula: 'pause(0.02)' }
			});
			s2.updateSettings({ loop: { path: '[data]', enabled: true } });
			await machine.start();
			// await monitorS1.hasPassedStep(2);
			await monitorS1.hasProcessedStep(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			// expect(s1.sheet.cellAt('A4').value).toBe(2);
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
			await monitorS1.hasPassedStep(4);
			await machine.stop();
			expect(s2.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			expect(s1.sheet.cellAt('A4').value).toBe(4);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			expect(monitorS2.messages.detached).toBe(3);
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
			await machine.start();
			await monitorS1.hasPassedStep(4);
			await machine.stop();
			expect(s2.inbox.size).toBe(1);
			expect(monitorS2.stats.steps).toBe(8);
			expect(s2.sheet.cellAt('B1').value).toBe(9);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,2,0,1,2,0,1');
			expect(monitorS2.messages.detached).toBe(3);
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
			await monitorS1.hasPassedStep(2);
			await machine.pause();
			expect(s2.inbox.size).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(7);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,2,0,1,2');
			expect(monitorS2.messages.detached).toBe(2);
			await machine.start();
			await monitorS1.hasPassedStep(4);
			await machine.stop();
			expect(s2.inbox.size).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(11);
			expect(s2.sheet.cellAt('B2').value).toBe('0,1,2,0,1,2,0,1,0,0');
			expect(monitorS2.messages.detached).toBe(5);
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
			s2.inbox.put(new Message(['john','doe','!!!']));
			s2.inbox.put(new Message(['hello','world','!!!']));
			s2.inbox.put(new Message(['hy','!!!']));
			s2.inbox.put(new Message());
			expect(s2.inbox.size).toBe(4);
			await machine.start();
			await monitorS1.hasPassedStep(2);
			await machine.pause();
			expect(s2.inbox.size).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			expect(s2.sheet.cellAt('B2').value).toBe('0,0,1');
			expect(monitorS2.messages.detached).toBe(2);
			await machine.start();
			await monitorS1.hasPassedStep(4);
			await machine.stop();
			expect(s2.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			expect(s2.sheet.cellAt('B1').value).toBe(8);
			expect(s2.sheet.cellAt('B2').value).toBe('0,0,1,0,1,0,0');
			expect(monitorS2.messages.detached).toBe(5);
		});		
	});
	describe('chained execute', () => {

	});
});

describe.skip('manual stepping through execute', () => {
	test.skip('manual step with message', () => {
		expect(false).toBe(true);
	});
	test.skip('manual step with message in endless mode', () => {
		expect(false).toBe(true);
	});
	test.skip('manual step with message and loop', () => {
		expect(false).toBe(true);
	});
	test.skip('manual step with message and loop in endless mode', () => {
		expect(false).toBe(true);
	});
	test.skip('same as above but with repeat > 1 ', () => {
		expect(false).toBe(true);
	});
});

describe.skip('execute in "repeat until..." mode', () => {
	test('execute sheet on running machine', async () => {
		const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
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
		expect(s2.sheet.cellAt('B1').value).toBeGreaterThan(2);
	});
	test('repeated execute sheet on running machine', async () => {
		const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'execute("S2", 10)' },
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
		expect(s2.sheet.cellAt('B1').value).toBeGreaterThan(11);
	});
	test('execute sheet and pass message on running machine', async () => {
		const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
		const monitorS2 = monitorStreamSheet(s2);
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: 'hello', B2: 'world',
			A3: { formula: 'execute("S2",1,array(A2,B2))' },
			A4: { formula: 'A4+1' }
		});
		s2.trigger.update({ repeat: 'endless' });
		s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
		await machine.start();
		await wait(30);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(true);
		expect(s1.sheet.cellAt('A4').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBeGreaterThan(2);
		expect(monitorS2.messages.attached).toBe(1);
		// endless mode we keep message until return
		expect(monitorS2.messages.detached).toBe(0);
	});
	test('repeated execute sheet and pass message on running machine', async () => {
		const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
		const monitorS2 = monitorStreamSheet(s2);
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: 'hello', B2: 'world',
			A3: { formula: 'execute("S2",10,array(A2,B2))' },
			A4: { formula: 'A4+1' }
		});
		s2.trigger.update({ repeat: 'endless' });
		s2.sheet.loadCells({ B1: { formula: 'B1+1' } });
		await machine.start();
		await wait(30);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(true);
		expect(s1.sheet.cellAt('A4').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBeGreaterThan(2);
		// endless mode: stay at message until return
		expect(monitorS2.messages.attached).toBe(1);
		expect(monitorS2.messages.detached).toBe(0);
	});
	test('repeated execute sheet with return() and passed message on running machine', async () => {
		const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
		const monitorS2 = monitorStreamSheet(s2);
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: 'hello', B2: 'world',
			A3: { formula: 'execute("S2",4,array(A2,B2))' },
			A4: { formula: 'A4+1' }
		});
		s2.trigger.update({ repeat: 'endless' });
		s2.sheet.loadCells({
			B1: { formula: 'B1+1' },
			B2: { formula: 'if(mod(B1,4)=0,return(42),"waiting")' },
			B3: { formula: 'B3+1' }
		});
		await machine.start();
		await wait(100);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(true);
		expect(s1.sheet.cellAt('A4').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(16);
		expect(s2.sheet.cellAt('B2').value).toBe(42);
		expect(s2.sheet.cellAt('B3').value).toBe(12);
		expect(monitorS2.messages.attached).toBe(4);
		expect(monitorS2.messages.detached).toBe(4);
	});
	test('execute consumes always same loop element on "repeat until..." return() is called', async () => {
		const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
		const monitorS2 = monitorStreamSheet(s2);
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: 'hello', B2: 'world', C2: '!!!',
			A3: { formula: 'execute("S2",1,array(A2,B2,C2))' },
			A4: { formula: 'A4+1' }
		});
		s2.trigger.update({ repeat: 'endless' });
		s2.updateSettings({ loop: { path: '[data]', enabled: true } });
		s2.sheet.loadCells({
			B1: { formula: 'B1+1' },
			B2: { formula: 'if(mod(B1,4)=0,return(42),"waiting")' },
			B3: { formula: 'B3+1' }
		});
		await machine.start();
		await wait(100);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(true);
		expect(s1.sheet.cellAt('A4').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(12);
		expect(s2.sheet.cellAt('B2').value).toBe(42);
		expect(s2.sheet.cellAt('B3').value).toBe(9);
		expect(monitorS2.messages.attached).toBe(1);
		expect(monitorS2.messages.detached).toBe(1);
	});
	test('repeat execute sheet and pass message with loop on running machine', async () => {
		const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
		const monitorS2 = monitorStreamSheet(s2);
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: 'hello', B2: 'world', C2: '!!!',
			A3: { formula: 'execute("S2",4,array(A2,B2,C2))' },
			A4: { formula: 'A4+1' }
		});
		s2.trigger.update({ repeat: 'endless' });
		s2.updateSettings({ loop: { path: '[data]', enabled: true } });
		s2.sheet.loadCells({
			B1: { formula: 'B1+1' },
			B2: { formula: 'if(mod(B1,4)=0,return(42),"waiting")' },
			B3: { formula: 'B3+1' }
		});
		await machine.start();
		await wait(100);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(true);
		expect(s1.sheet.cellAt('A4').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(48);
		expect(s2.sheet.cellAt('B2').value).toBe(42);
		expect(s2.sheet.cellAt('B3').value).toBe(36);
		expect(monitorS2.messages.attached).toBe(4);
		expect(monitorS2.messages.detached).toBe(4);
	});
	test('execute with paused & resumed sheet', async () => {
		const { machine, s1, s2 } = setup();
		s2.trigger.update({ repeat: 'endless' });
		s1.sheet.loadCells({ A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' } });
		s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'pause(0.1)' } });
		await machine.start();
		await wait(400);
		await machine.stop();
		// s2 never returns
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expectValue(s2.sheet.cellAt('B1').value).toBeInRange(4, 5);
	});
	test('repeated execute and pause function', async () => {
		const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
		s2.trigger.update({ repeat: 'endless' });
		s1.sheet.loadCells({ A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2", 4)' }, A3: { formula: 'A3+1' } });
		s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'pause(0.1)' } });
		await machine.start();
		await wait(400);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expectValue(s2.sheet.cellAt('B1').value).toBeInRange(4, 5);
	});
	test('execute with loop, return() and pause function', async () => {
		const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: 'hello', B2: 'world',
			A3: { formula: 'execute("S2",1,array(A2,B2))' },
			A4: { formula: 'A4+1' }
		});
		s2.trigger.update({ repeat: 'endless' });
		s2.updateSettings({ loop: { path: '[data]', enabled: true } });
		s2.sheet.loadCells({
			B1: { formula: 'B1+1' },
			B2: { formula: 'loopindices()' },
			B3: { formula: 'pause(0.05)' },
			B4: { formula: 'if(mod(B1,4)=0,return(42),"waiting")' },
			B5: { formula: 'B5+1' }
		});
		await machine.start();
		await wait(500);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A4').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(8);
		expect(s2.sheet.cellAt('B2').value).toBe('0,0,0,1,1,1,1');
		expect(s2.sheet.cellAt('B4').value).toBe(42);
		expect(s2.sheet.cellAt('B5').value).toBe(6);
	});
	test('repeated execute with loop, return() and pause function', async () => {
		const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START});
		const monitorS2 = monitorStreamSheet(s2);
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: 'hello', B2: 'world',
			A3: { formula: 'execute("S2",4,array(A2,B2))' },
			A4: { formula: 'A4+1' }
		});
		s2.trigger.update({ repeat: 'endless' });
		s2.updateSettings({ loop: { path: '[data]', enabled: true } });
		s2.sheet.loadCells({
			B1: { formula: 'B1+1' },
			B2: { formula: 'loopindices()' },
			B3: { formula: 'pause(0.05)' },
			B4: { formula: 'if(mod(B1,3)=0,return(42),"waiting")' },
			B5: { formula: 'B5+1' }
		});
		await machine.start();
		await wait(400);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		// s2 will not resume within 400ms so
		expect(s1.sheet.cellAt('A4').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(9);
		expect(s2.sheet.cellAt('B2').value).toBe('0,0,1,1,1,0,0,0');
		expect(s2.sheet.cellAt('B4').value).toBe('waiting');
		expect(s2.sheet.cellAt('B5').value).toBe(6);
		expect(monitorS2.messages.attached).toBe(2);
		expect(monitorS2.messages.detached).toBe(1);
	});
});
describe.skip('chained execution', () => {
	test('chained executed sheets', async()=> {
		// s1 -> executes s2 -> executes s3
		const { machine, s1, s2 } = setup({ s1Type: TriggerFactory.TYPE.MACHINE_START });
		const s3 = createStreamsheet({ name: 'S3', trigger: { type: TriggerFactory.TYPE.EXECUTE } });
		machine.addStreamSheet(s3);
		s1.sheet.loadCells({ A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' }, A3: { formula: 'A3+1' } });
		s2.sheet.loadCells({ B1: { formula: 'B1+1' }, B2: { formula: 'execute("S3")' }, C2: { formula: 'C2+1' } });
		s3.sheet.loadCells({ C1: { formula: 'C1+1' } });
		await machine.start();
		await wait(30);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(true);
		expect(s2.sheet.cellAt('C2').value).toBe(2);
		expect(s3.sheet.cellAt('C1').value).toBe(2);
	});
	test('chained executed sheets with repetition', async () => {
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
	test('chained executed sheets with repetition and loop elements', async () => {
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
	test('chained executed sheets with repetition, loop elements and return()', async () => {
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
	test('chained executed sheets in "repeat until..." mode', async () => {
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