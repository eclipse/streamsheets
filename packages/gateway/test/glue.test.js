const { createUserRepository } = require('../src/user/index.ts');
const glue = require('../src/glue.ts').default;

describe('glue', () => {
	test('returns api and auth', async () => {
		const collection = { createIndexes: jest.fn() };
		const userRepo = await createUserRepository(collection);
		const { api, auth } = glue({ userRepo });
		expect(api).toBeDefined();
		expect(api.user).toBeDefined();
		expect(auth).toBeDefined();
	});
});
