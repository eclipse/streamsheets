const { createTerm } = require('./utils');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Machine, StreamSheet } = require('@cedalo/machine-core');


const ERROR = FunctionErrors.code;

const setup = (name) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet({ name });
	machine.removeAllStreamSheets();
	machine.addStreamSheet(streamsheet);
	machine.isOPCUA = true;
	return streamsheet;
};

describe('opcua variables functions', () => {
	describe.skip('variable', () => {
		it('should trigger an opcua variable event', () => {
			let lastevent;
			const t1 = setup('T1');
			const sheet = t1.sheet.loadCells({ A1: 'accuracy', B1: 2, N1: 'name2' });
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.variable("name1", 42, JSON(A1:B1))', sheet).value).toBe(true);
			expect(lastevent).toBeDefined();
			expect(lastevent.type).toBe('opcua');
			expect(lastevent.action).toBe('variable');
			expect(lastevent.data).toBeDefined();
			// we passed name as string:
			expect(lastevent.data.name).toBe('name1');
			expect(lastevent.data.value).toBe(42);
			expect(lastevent.data.config).toBeDefined();
			expect(lastevent.data.config.accuracy).toBe(2);
			expect(createTerm('opcua.variable(N1, 21, JSON(A1:B1))', sheet).value).toBe(true);
			expect(lastevent).toBeDefined();
			expect(lastevent.type).toBe('opcua');
			expect(lastevent.action).toBe('variable');
			expect(lastevent.data).toBeDefined();
			// we passed name as string:
			expect(lastevent.data.name).toBe('name2');
			expect(lastevent.data.value).toBe(21);
			expect(lastevent.data.config).toBeDefined();
			expect(lastevent.data.config.accuracy).toBe(2);
		});
		it('allow optional config object', () => {
			let lastevent;
			const t1 = setup('T1');
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.variable("hello", "world")', t1.sheet).value).toBe(true);
			expect(lastevent).toBeDefined();
			expect(lastevent.type).toBe('opcua');
			expect(lastevent.action).toBe('variable');
			expect(lastevent.data).toBeDefined();
			// we passed name as string:
			expect(lastevent.data.name).toBe('hello');
			expect(lastevent.data.value).toBe('world');
			expect(lastevent.data.config == null).toBe(true);
		});
		it(`should return ${ERROR.NO_MACHINE_OPCUA} if machine is not an OPCUA machine`, () => {
			let lastevent;
			const t1 = setup('T1');
			t1.machine.isOPCUA = false;
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.variable("hello", "world")', t1.sheet).value).toBe(ERROR.NO_MACHINE_OPCUA);
			expect(lastevent).toBeUndefined();
		});
	});

	describe('variables', () => {
		it('should trigger an opcua variables event', () => {
			let lastevent;
			const t1 = setup('T1');
			const sheet = t1.sheet.loadCells({
				/* eslint-disable */
				A1: null, B1: 'values', C1: 'dataType', D1: 'typeDefinition',
				A2: null, B2: 'values', C2: 'Double', D2: 'DiscreteItemType',
				A3: 'prop1', B3: '123',
				A4: 'prop2', B4: '456', C4: 'Int64',
				A5: 'prop3', B5: '789', C5: 'Int64', D5: 'AnalogItemType'
				/* eslint-enable */
			});
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.variables(42)', sheet).value).toBe(true);
			expect(lastevent).toBeDefined();
			expect(lastevent.type).toBe('opcua');
			expect(lastevent.action).toBe('variables');
			expect(lastevent.data).toBeDefined();
			expect(lastevent.data).toBe(42);
			lastevent = undefined;
			expect(createTerm('opcua.variables(json(A3:B5))', sheet).value).toBe(true);
			expect(lastevent).toBeDefined();
			expect(lastevent.type).toBe('opcua');
			expect(lastevent.action).toBe('variables');
			expect(lastevent.data).toEqual({ prop1: '123', prop2: '456', prop3: '789' });
		});
		it('should thrown an error if no value is passed', () => {
			const t1 = setup('T1');
			const sheet = t1.sheet.loadCells({ A2: null });
			expect(createTerm('opcua.variables()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('opcua.variables(A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('opcua.variables(A2)', sheet).value).toBe(ERROR.VALUE);
		});
	});

	describe.skip('delete variable', () => {
		it('should trigger an opcua delete_variable event', () => {
			let lastevent;
			const t1 = setup('T1');
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.deletevariable("name1")', t1.sheet).value).toBe(true);
			expect(lastevent).toBeDefined();
			expect(lastevent.type).toBe('opcua');
			expect(lastevent.action).toBe('delete_variable');
			expect(lastevent.data).toBeDefined();
			// we passed name as string:
			expect(lastevent.data.name).toBe('name1');
		});
		it(`should return ${ERROR.NO_MACHINE_OPCUA} if machine is not an OPCUA machine`, () => {
			let lastevent;
			const t1 = setup('T1');
			t1.machine.isOPCUA = false;
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.deletevariable("name1")', t1.sheet).value).toBe(ERROR.NO_MACHINE_OPCUA);
			expect(lastevent).toBeUndefined();
		});
	});
});
