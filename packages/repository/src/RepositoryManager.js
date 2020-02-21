module.exports = class RepositoryManager {
	static init({
		graphRepository,
		machineRepository,
		streamRepositoryLegacy,
		backupRestoreManager,
		configurationRepository
	}) {
		RepositoryManager.graphRepository = graphRepository;
		RepositoryManager.machineRepository = machineRepository;
		RepositoryManager.streamRepositoryLegacy = streamRepositoryLegacy;
		RepositoryManager.backupRestoreManager = backupRestoreManager;
		RepositoryManager.configurationRepository = configurationRepository;
	}

	static async populateDatabases(initJSON) {
		if (initJSON) {
			try {
				const machines = initJSON.machines;
				if (machines) {
					// eslint-disable-next-line
					for (const machineContainer of machines) {
						try {
							const { graph, machine } = machineContainer;
							machine.scope = { id: 'root' };
							// eslint-disable-next-line
							await RepositoryManager.graphRepository.saveGraph(graph);
							// eslint-disable-next-line
							await RepositoryManager.machineRepository.saveMachine(machine);
						} catch (error) {
							// ignore machine
						}
					}
				}
				const streams = initJSON.streams;
				if (streams) {
					// eslint-disable-next-line
					for (const stream of streams) {
						try {
							// TODO: replace with stream repository procy
							stream.scope = { id: 'root' };
							// eslint-disable-next-line
							await RepositoryManager.streamRepositoryLegacy.saveConfiguration(stream);
						} catch (error) {
							// ignore stream
						}
					}
				}
			} catch (error) {
				// console.error(error);
			}
		}
	}

	static connectAll() {
		return Promise.all(
			Object.values(RepositoryManager)
				.filter((repository) => repository && repository.connect)
				.map((repositoryWithConnect) => repositoryWithConnect.connect())
		);
	}

	static setupAllIndicies() {
		return Promise.all(
			Object.values(RepositoryManager)
				.filter((repository) => repository && repository.setupIndicies && repository.db)
				.map((repository) => repository.setupIndicies())
		);
	}

	static async backup(config) {
		if (RepositoryManager.backupRestoreManager) {
			return RepositoryManager.backupRestoreManager.backup(config);
		}
		return null;
	}

	static async restore(config) {
		if (RepositoryManager.backupRestoreManager) {
			return RepositoryManager.backupRestoreManager.restore(config);
		}
		return null;
	}
};
