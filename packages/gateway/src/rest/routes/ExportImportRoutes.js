const httpError = require('http-errors');
const IdGenerator = require('@cedalo/id-generator');

// const logger = utils.createLoggers('ExportImportRoutes', ['info', 'error']);

const fixName = (name, existingNames, count = 1) => {
	const newName = `${name} ${count}`;
	return existingNames.has(newName) ? fixName(name, existingNames, count + 1) : newName;
};

const filterRejected = (promises) =>
	promises.reduce(async (pResults, p) => {
		const results = await pResults;
		try {
			const result = await p;
			return [...results, result];
		} catch (e) {
			return results;
		}
	}, Promise.resolve([]));

module.exports = class ExportImportRoutes {
	static async export(request, response, next) {
		const { machineRepository, graphRepository } = request.app.locals.RepositoryManager;
		switch (request.method) {
			case 'POST': {
				const { machineIds = [] } = request.body;
				try {
					const pendingMachines = machineIds.map(async (machineId) => {
						const result = await Promise.all([
							machineRepository.findMachine(machineId),
							graphRepository.findGraphByMachineId(machineId)
						]);
						return {
							machine: { ...result[0], state: 'stopped' },
							graph: result[1]
						};
					});
					const machines = await filterRejected(pendingMachines);
					if (machines.length === 0 && machineIds.length > 0) {
						// Only fail if no machine could be exported
						// Can occur when graph is missing
						response.status(404).json({ machineIds, success: false });
					} else {
						response.status(200).json({ machines, success: true });
					}
				} catch (error) {
					next(error);
				}
				break;
			}
			default:
				response.set('allow', 'POST');
				next(new httpError.MethodNotAllowed());
				break;
		}
	}

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

	static exportAll(request, response, next) {
		const { machineRepository, graphRepository } = request.app.locals.RepositoryManager;
		switch (request.method) {
			case 'GET':
				machineRepository
					.getMachines()
					.then((machines) => {
						const promises = machines.map((machine) =>
							graphRepository.findGraphByMachineId(machine.id).then((graph) => ({
								machine,
								graph
							}))
						);
						Promise.all(promises)
							.then((result) => response.status(200).json(result))
							.catch(next);
					})
					.catch(next);
				break;
			default:
				response.set('allow', 'GET');
				next(new httpError.MethodNotAllowed());
				break;
		}
	}
};
