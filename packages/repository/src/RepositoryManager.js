module.exports = class RepositoryManager {
	static init({
		graphRepository,
		machineRepository,
		backupRestoreManager,
		configurationRepository
	}) {
		RepositoryManager.graphRepository = graphRepository;
		RepositoryManager.machineRepository = machineRepository;
		RepositoryManager.backupRestoreManager = backupRestoreManager;
		RepositoryManager.configurationRepository = configurationRepository;
	}

	static connectAll() {
		return Promise.all(Object.values(RepositoryManager)
			.filter(repository => repository && repository.connect)
			.map(repositoryWithConnect => repositoryWithConnect.connect()));
	}

	static setupAllIndicies() {
		return Promise.all(Object.values(RepositoryManager)
			.filter(repository => repository && repository.setupIndicies && repository.db)
			.map(repository => repository.setupIndicies()));
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
