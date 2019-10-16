/* eslint no-unused-vars: 0 */
let LockManager;

beforeEach(() => {
	/* eslint global-require: 0 */
	LockManager = require('../src/rest/LockManager');
});
afterEach(() => {
	delete require.cache[require.resolve('../src/LockManager')];
});


describe('LockManager.acquireLock', () => {
	it('should return true for a resource which is not yet locked', () => {
		LockManager.releaseAllLocks();
		expect(LockManager.acquireLock('b', ',a,', 'myUser')).toBe(true);
	});

	it('should return false if the resource is already locked', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('b', ',a,', 'myUser');
		expect(LockManager.acquireLock('b', ',a,', 'myUser')).toBe(false);
	});

	it('should return false if the a parent resource is already locked', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('b', ',a,', 'myUser');
		expect(LockManager.acquireLock('d', ',a,b,c,', 'myUser')).toBe(false);
	});

	it('should return false if the a child resource is already locked', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('d', ',a,b,c,', 'myUser');
		expect(LockManager.acquireLock('b', ',a,', 'myUser')).toBe(false);
	});

	it('should return true if a sibling-resource is already locked', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('b', ',a,', 'myUser');
		expect(LockManager.acquireLock('c', ',a,', 'myUser')).toBe(true);

		LockManager.releaseAllLocks();
		LockManager.acquireLock('g', ',a,c,', 'myUser');
		expect(LockManager.acquireLock('f', ',a,c,', 'myUser')).toBe(true);

		LockManager.releaseAllLocks();
		LockManager.acquireLock('g', ',a,c,', 'myUser');
		expect(LockManager.acquireLock('f', ',a,c,', 'myUser')).toBe(true);
	});

	it('should return false if required argument length is not satisfied', () => {
		LockManager.releaseAllLocks();
		expect(LockManager.acquireLock()).toBe(false);
		expect(LockManager.acquireLock('b')).toBe(false);
		expect(LockManager.acquireLock('b', ',a,')).toBe(false);
		expect(LockManager.acquireLock('b', ',a,', '')).toBe(false);
	});
});

describe('LockManager.releaseLock', () => {
	it('should return true for a locked resources with matching users', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('b', ',a,', 'myUser');
		expect(LockManager.releaseLock('b', ',a,', 'myUser')).toBe(true);
	});

	it('should return false if the lock has not been aquired', () => {
		LockManager.releaseAllLocks();
		expect(LockManager.releaseLock('b', ',a,', 'myUser')).toBe(false);
	});

	it('should return false if the lock was aquired by someone else', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('b', ',a,', 'myUser');
		expect(LockManager.releaseLock('b', ',a,', 'someOtherUser')).toBe(false);
	});

	it('should return false if required argument length is not satisfied', () => {
		LockManager.releaseAllLocks();
		expect(LockManager.releaseLock()).toBe(false);
		expect(LockManager.releaseLock('b')).toBe(false);
		expect(LockManager.releaseLock('b', ',a,')).toBe(false);
		expect(LockManager.releaseLock('b', ',a,', '')).toBe(false);
	});
});


describe('LockManager.isLocked', () => {
	it('should return true for a locked resource', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('b', ',a,', 'myUser');
		expect(LockManager.isLocked('b', ',a,')).toBe(true);
	});

	it('should return true for a locked parent-resource', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('b', ',a,', 'myUser');
		expect(LockManager.isLocked('d', ',a,b,c,')).toBe(true);
	});

	it('should return true for a locked child-resource', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('d', ',a,b,c,', 'myUser');
		expect(LockManager.isLocked('b', ',a,')).toBe(true);
	});

	it('should return false for a locked sibling-resource', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('dd', ',aa,bb,cc,', 'myUser');
		expect(LockManager.isLocked('dd2', ',aa,bb,cc,')).toBe(false);

		LockManager.releaseAllLocks();
		LockManager.acquireLock('dd', ',aa,bb,cc,', 'myUser');
		expect(LockManager.isLocked('ff', ',aa,bb,ee,', 'myUser')).toBe(false);
	});
});

describe('LockManager.isUserHoldingLock', () => {
	it('should return true for a locked resource with matching users', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('b', ',a,', 'myUser');
		expect(LockManager.isUserHoldingLock('b', ',a,', 'myUser')).toBe(true);
	});

	it('should return true for a locked parent-resource with matching users', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('b', ',a,', 'myUser');
		expect(LockManager.isUserHoldingLock('d', ',a,b,c,', 'myUser')).toBe(true);
	});

	it('should return false for a locked child-resource with matching users', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('d', ',a,b,c,', 'myUser');
		expect(LockManager.isUserHoldingLock('b', ',a,', 'myUser')).toBe(false);
	});

	it('should return false for a locked resource with non-matching users', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('b', ',a,', 'someOtherUser');
		expect(LockManager.isUserHoldingLock('b', ',a,', 'myUser')).toBe(false);
	});

	it('should return false for a locked child-resources with non-matching users', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('d', ',a,b,c,', 'someOtherUser');
		expect(LockManager.isUserHoldingLock('b', ',a,', 'myUser')).toBe(false);
	});
});


describe('LockManager.getAllLocks', () => {
	it('should return empty array if no locks have been acquired', () => {
		LockManager.releaseAllLocks();
		expect(LockManager.getAllLocks()).toEqual([]);
	});

	it('should return array with acquired lock', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('d', ',a,b,c,', 'someOtherUser');
		const result = LockManager.getAllLocks();
		expect(result.length).toBe(1);
		expect(result[0]._id).toBe('d');
		expect(result[0].path).toBe(',a,b,c,');
		expect(result[0].userId).toBe('someOtherUser');
		expect(result[0].issuedAt).toBeLessThanOrEqual(Date.now());
	});
});

describe('LockManager.releaseAllLocksByUser', () => {
	it('should do nothing if user has no locks acquired', () => {
		LockManager.releaseAllLocks();
		LockManager.releaseAllLocksByUser('myUser');
		expect(LockManager.getAllLocks()).toEqual([]);
	});

	it('should leave other users locks untouched', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('d', ',a,b,c,', 'someOtherUser');
		LockManager.releaseAllLocksByUser('myUser');

		const result = LockManager.getAllLocks();
		expect(result.length).toBe(1);
		expect(result[0]._id).toBe('d');
		expect(result[0].path).toBe(',a,b,c,');
		expect(result[0].userId).toBe('someOtherUser');
		expect(result[0].issuedAt).toBeLessThanOrEqual(Date.now());
	});

	it('should release all locks by supplied userId', () => {
		LockManager.releaseAllLocks();
		LockManager.acquireLock('d', ',a,b,c,', 'someOtherUser');
		LockManager.acquireLock('e', ',a,b,c,', 'myUser');
		LockManager.acquireLock('f', ',a,b,c,', 'myUser');
		LockManager.releaseAllLocksByUser('myUser');

		const result = LockManager.getAllLocks();
		expect(result.length).toBe(1);
		const hasUserLocksAcquired = result.some(lock => lock.userId === 'myUser');
		expect(hasUserLocksAcquired).toBe(false);
	});
});
