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

describe('opcua folders functions', () => {
	describe.skip('folder', () => {
		it('should trigger an opcua folder event', () => {
			let lastevent;
			const t1 = setup('T1');
			const sheet = t1.sheet.loadCells({ A1: 'path/to/folder' });
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.folder(A1)', sheet).value).toBe(true);
			expect(lastevent).toBeDefined();
			expect(lastevent.type).toBe('opcua');
			expect(lastevent.action).toBe('folder');
			expect(lastevent.data).toBeDefined();
			expect(lastevent.data.path).toBe('path/to/folder');
			expect(createTerm('opcua.folder("folder/nodeA")', sheet).value).toBe(true);
			expect(lastevent).toBeDefined();
			expect(lastevent.type).toBe('opcua');
			expect(lastevent.action).toBe('folder');
			expect(lastevent.data).toBeDefined();
			expect(lastevent.data.path).toBe('folder/nodeA');
		});
		it('should return an error if no path is given', () => {
			const t1 = setup('T1');
			const sheet = t1.sheet.loadCells({ A1: null });
			expect(createTerm('opcua.folder()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('opcua.folder(null)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('opcua.folder(A1)', sheet).value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.NO_MACHINE_OPCUA} if machine is not an OPCUA machine`, () => {
			let lastevent;
			const t1 = setup('T1');
			t1.machine.isOPCUA = false;
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.folder("hello")', t1.sheet).value).toBe(ERROR.NO_MACHINE_OPCUA);
			expect(lastevent).toBeUndefined();
		});
	});

	describe('folders', () => {
		it('should trigger an opcua folders event', () => {
			let lastevent;
			const t1 = setup('T1');
			const sheet = t1.sheet.loadCells({ A1: 'path/to/folderA', B1: 'path/to/folderB' });
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.folders(A1:B1)', sheet).value).toBe(true);
			expect(lastevent).toBeDefined();
			expect(lastevent.type).toBe('opcua');
			expect(lastevent.action).toBe('folders');
			expect(lastevent.data).toBeDefined();
			expect(lastevent.data.paths).toEqual(['path/to/folderA', 'path/to/folderB']);
		});
		it('should return an error if no paths are given', () => {
			const sheet = setup('T1').sheet;
			expect(createTerm('opcua.folders()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('opcua.folders(null)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('opcua.folders(A1:B1)', sheet).value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.NO_MACHINE_OPCUA} if machine is not an OPCUA machine`, () => {
			let lastevent;
			const t1 = setup('T1');
			t1.sheet.loadCells({ A1: 'path/to/folderA', B1: 'path/to/folderB' });
			t1.machine.isOPCUA = false;
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.folders(A1:B1)', t1.sheet).value).toBe(ERROR.NO_MACHINE_OPCUA);
			expect(lastevent).toBeUndefined();
		});
	});
	describe.skip('delete folder', () => {
		it('should trigger an opcua delete_folder event', () => {
			let lastevent;
			const t1 = setup('T1');
			t1.sheet.load({ cells: { A1: 'path/to/nodeA' } });
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.deletefolder(A1)', t1.sheet).value).toBe(true);
			expect(lastevent).toBeDefined();
			expect(lastevent.type).toBe('opcua');
			expect(lastevent.action).toBe('delete_folder');
			expect(lastevent.data).toBeDefined();
			expect(lastevent.data.path).toBe('path/to/nodeA');
			lastevent = null;
			expect(createTerm('opcua.deletefolder("rootB")', t1.sheet).value).toBe(true);
			expect(lastevent).toBeDefined();
			expect(lastevent.type).toBe('opcua');
			expect(lastevent.action).toBe('delete_folder');
			expect(lastevent.data).toBeDefined();
			expect(lastevent.data.path).toBe('rootB');
		});
		it('should return an error if no path is given', () => {
			const t1 = setup('T1');
			const sheet = t1.sheet.loadCells({ A1: null });
			expect(createTerm('opcua.deletefolder()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('opcua.deletefolder(null)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('opcua.deletefolder(A1)', sheet).value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.NO_MACHINE_OPCUA} if machine is not an OPCUA machine`, () => {
			let lastevent;
			const t1 = setup('T1');
			t1.machine.isOPCUA = false;
			t1.on('event', (msg) => { if (msg.type === 'opcua') lastevent = msg; });
			expect(createTerm('opcua.deletefolder("name1")', t1.sheet).value).toBe(ERROR.NO_MACHINE_OPCUA);
			expect(lastevent).toBeUndefined();
		});
	});
});
