module.exports = class BackupRestoreManager {
	
	async backup(/* config */) {
		throw new Error('Method backup() must be implemented in subclass');
	}

	async restore(/* config */) {
		throw new Error('Method restore() must be implemented in subclass');
	}

};
