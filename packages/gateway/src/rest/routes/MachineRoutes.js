const httpError = require('http-errors');

const logger = require('../../utils/logger').create({ name: 'MachineRoutes' });

module.exports = class MachineRoute {
	static async machines(request, response, next) {
		const { machineRepository } = request.app.locals.RepositoryManager;
		switch (request.method) {
		case 'GET':
			if (request.query && request.query.name) {
				const { name } = request.query;
				request.app.locals.RepositoryManager.machineRepository
					.findMachinesByName(name)
					.then(machines => response.status(200).json(machines))
					.catch(next);
			} else {
				request.app.locals.RepositoryManager.machineRepository.getMachines()
					.then(machines => response.status(200).json(machines))
					.catch(next);
			}
			break;
		case 'PUT': {
			try {
				const newMachine = await machineRepository.saveMachine(request.body);
				response.status(200).json(newMachine);
			} catch(e) {
				next();
			}
			break;
		}
		// eslint-disable-next-line
		case 'POST':
			logger.info('Save machine definition');
			// TODO: save graph for machine
			const machineDefinition = request.body;
			machineRepository
				.saveOrUpdateMachine(machineDefinition.id, machineDefinition)
				.then(() => response.status(200).json(machineDefinition))
				.catch((/* error */) => {
					machineRepository.deleteMachine(machineDefinition.id);
					next(httpError(500, 'Failed to store created machine!'));
				});
			break;
		default:
			response.set('allow', 'GET, POST, PUT');
			next(new httpError.MethodNotAllowed());
			break;
		}
	}

	// TODO: improve and remove duplicate code
	static machinesOverview(request, response, next) {
		switch (request.method) {
		case 'GET':
			if (request.query && request.query.name) {
				const { name } = request.query;
				request.app.locals.RepositoryManager.machineRepository
					.findMachinesByName(name)
					.then(machines => response.status(200).json(machines))
					.catch(next);
			} else {
				request.app.locals.RepositoryManager.machineRepository.getMachines()
					.then(machines => machines.map(machine => ({
						id: machine.id,
						name: machine.name,
						state: machine.state,
						metadata: machine.metadata,
						previewImage: machine.previewImage
					})))
					.then(machines => response.status(200).json(machines))
					.catch(next);
			}
			break;
		default:
			response.set('allow', 'GET');
			next(new httpError.MethodNotAllowed());
			break;
		}
	}
	static machine(request, response, next) {
		const machineId = request.params.machineId;
		const {
			machineRepository
		} = request.app.locals.RepositoryManager;
		switch (request.method) {
		case 'GET':
			machineRepository.findMachine(machineId)
				.then(machine => response.status(200).json(machine))
				.catch(next);
			break;
		case 'PUT':
			machineRepository.updateMachine(machineId, request.body)
				.then(() => machineRepository.findMachine(machineId))
				.then(machine => response.status(200).json(machine))
				.catch(next);
			break;
		default:
			response.set('allow', 'GET, PUT');
			next(new httpError.MethodNotAllowed());
			break;
		}
	}

	static processSettings(request, response, next) {
		const machineId = request.params.machineId;
		const {
			processSettingsRepository
		} = request.app.locals.RepositoryManager;
		switch (request.method) {
		case 'GET':
			processSettingsRepository.getMachineProcessSettings(machineId)
					.then(setting => response.status(200).json(setting))
					.catch(next);
			break;
		case 'PUT':
			processSettingsRepository.saveMachineProcessSettings(request.body)
					.then(result => response.status(200).json(result))
					.catch(next);
			break;
		default:
			response.set('allow', 'GET, PUT');
			next(new httpError.MethodNotAllowed());
			break;
		}
	}
};
