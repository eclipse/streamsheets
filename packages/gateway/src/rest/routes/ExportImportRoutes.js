const httpError = require('http-errors');
const IdGenerator = require('@cedalo/id-generator');

// const logger = utils.createLoggers('ExportImportRoutes', ['info', 'error']);

const fixName = (name, existingNames, count = 1) => {
	const newName = `${name} ${count}`;
	return existingNames.has(newName) ? fixName(name, existingNames, count + 1) : newName;
};

module.exports = class ExportImportRoutes {

	static async import(request, response, next) {
		const { machineRepository, graphRepository } = request.app.locals.RepositoryManager;
		switch (request.method) {
			case 'POST': {

				const { machine, graph, importAsNew = false } = request.body;
				if (importAsNew) {
					machine.id = IdGenerator.generate();
					graph.id = IdGenerator.generate();
					graph.machineId = machine.id;
					const sheetIdMap = {};
					machine.streamsheets.forEach((streamsheet) => {
						const newSheetId = IdGenerator.generate();
						sheetIdMap[streamsheet.id] = newSheetId;
						streamsheet.id = newSheetId;
						streamsheet.inbox.id = IdGenerator.generate();
					});
					if(graph.graphdef && graph.graphdef['a-graphitem']){
						graph.graphdef['a-graphitem'].forEach(gi => {
							if(gi['o-attributes'] && gi['o-attributes']['o-sheetid']) {
								const sheetIdObject = gi['o-attributes']['o-sheetid'];
								sheetIdObject.v = sheetIdMap[sheetIdObject.v] || sheetIdObject.v;
							}
						});
					}
				}
				const existingMachine = await machineRepository.findMachineByName(machine.name, { id: 1 });
				const isNameConflict = existingMachine && existingMachine.id !== machine.id;
				if (isNameConflict) {
					const existingMachines = await machineRepository.getMachines();
					const existingMachineNames = new Set(existingMachines.map((m) => m.name));
					machine.name = fixName(machine.name, existingMachineNames);
				}
				// if (isNameConflict) {
				// 	response.status(409).json({
				// 		name: machine.name,
				// 		imported: false
				// 	});
				// }
				try {
					await Promise.all([
						machineRepository.saveOrUpdateMachine(machine.id, machine),
						graphRepository.saveOrUpdateGraph(graph.id, graph)
					]);
					response.status(201).json({
						machine,
						name: machine.name,
						id: machine.id,
						imported: true
					});
				} catch (error) {
					next(error);
				}

				break;
			}
			default: {
				response.set('allow', 'POST');
				next(new httpError.MethodNotAllowed());
				break;
			}
		}
	}
};
