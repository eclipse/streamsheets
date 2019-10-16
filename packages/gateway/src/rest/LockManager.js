const locks = new Map();

const logger = require('../utils/logger').create({ name: 'LockManager' });

class LockManager {

	static acquireLock(nodeId, path, userId) {
		if (arguments.length !== 3 || !userId) {
			logger.warn('aquireLock has been called with insufficient arguments');
			return false;
		}
		if (LockManager.isLocked(nodeId, path)) {
			return false;
		}
		locks.set(nodeId, { path, issuedAt: Date.now(), userId });
		logger.debug(`lock acquire for nodeId: ${nodeId}, path: ${path} userId: ${userId}`);
		return true;
	}

	static releaseLock(nodeId, path, userId) {
		if (arguments.length !== 3 || !userId) {
			logger.warn('releaseLock has been called with insufficient arguments');
			return false;
		}

		if (LockManager.isUserHoldingLock(nodeId, path, userId)) {
			locks.delete(nodeId);
			logger.debug(`lock released for nodeId: ${nodeId}, path: ${path} userId: ${userId}`);
			return true;
		}
		logger.warn(`unable to release lock nodeId: ${nodeId}, path: ${path} userId: ${userId}`);
		return false;
	}

	static getLockOwner(nodeId, path) {
		let userId = '';
		locks.forEach((value, lockedNodeId) => {
			if (nodeId === lockedNodeId || path.split(',').includes(lockedNodeId)) {
				userId = value.userId;
			}
		});
		return userId;
	}

	static isLocked(nodeId, path) {
		let isLocked = false;
		locks.forEach((value, key) => {
			if (nodeId === key || path.split(',').includes(key) || value.path.split(',').includes(nodeId)) {
				isLocked = true;
			}
		});
		return isLocked;
	}

	static isUserHoldingLock(nodeId, path, userId) {
		if (LockManager.isLocked(nodeId, path)) {
			// is lock owned by supplied userId?
			return LockManager.getLockOwner(nodeId, path) === userId;
		}
		return false;
	}

	static releaseAllLocks() {
		locks.clear();
	}

	static getAllLocks() {
		const locksArray = [];
		locks.forEach((value, key) => {
			locksArray.push(Object.assign({}, value, {
				_id: key
			}));
		});
		return locksArray;
	}

	static releaseAllLocksByUser(userId) {
		logger.debug(`releasing all locks of user ${userId}`);
		locks.forEach((lockObj, nodeId) => {
			if (lockObj.userId === userId) {
				LockManager.releaseLock(nodeId, lockObj.path, userId);
			}
		});
	}
}

module.exports = LockManager;
