const MachineCore = require('./MachineCore');

const testdummy = (/* sheet, ...terms */) => '42! Yeah!';


const registerMachineCoreModule = (mcoremod) => {
	MachineCore.set(mcoremod);
};

module.exports = {
	registerMachineCoreModule,
	functions: {
		DUMMY: testdummy
	},
	help: {
		cedalo: {
			en: 'Cedalo AG',
			de: 'Cedalo AG',
			functions: {
				DUMMY: {
					en: {
						argumentList: '',
						description: 'test-dummy function'
					},
					de: {
						argumentList: '',
						description: 'Test-Dummy Funktion'
					}
				},
				FUNC: {
					en: {
						argumentList: '',
						description: 'test function'
					},
					de: {
						argumentList: '',
						description: 'Test Funktion'
					}
				}
			}
		}
	}
};
