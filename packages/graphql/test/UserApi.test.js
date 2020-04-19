const { MongoMemoryServer } = require('mongodb-memory-server');
const mongodb = require('mongodb');
const { createUserRepository } = require('../src/UserRepository');
const UserApi = require('../src/apis/UserApi');

let mongoServer;
let client;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

const newCollection = () => client.db().collection(Math.random().toString());

beforeAll(async () => {
	mongoServer = new MongoMemoryServer();
	client = await mongodb.connect(await mongoServer.getConnectionString());
});

afterAll(async () => {
	client.close();
	await mongoServer.stop();
});

const newUserRepository = async (actor) => {
	const collection = newCollection();
	const internalApi = await createUserRepository(collection);
	return {
		internalApi,
		api: UserApi.create(internalApi, actor)
	};
};

const ADMIN = {
	id: '00000000000000',
	username: 'admin',
	email: 'admin@example.com',
	password: 'passwordadmin'
};

const NON_ADMIN = {
	id: 3,
	username: 'nonadmin',
	email: 'nonadmin@example.com',
	password: 'passwordnonadmin'
};

const TEST_USER_1 = {
	id: 1,
	username: 'johndoe',
	email: 'johndoe@example.com',
	firstName: 'John',
	lastName: 'Doe',
	password: 'password1'
};
const TEST_USER_2 = {
	id: 2,
	username: 'janedoe',
	email: 'janedoe@example.com',
	firstName: 'Jane',
	lastName: 'Doe',
	password: 'password2'
};

const removePassword = (user) => {
	const copy = { ...user };
	delete copy.password;
	return copy;
};

describe('AuthUserRepository', () => {
	describe('createUser', () => {
		test('should succeed as admin', async () => {
			const { api } = await newUserRepository(ADMIN);
			const user = TEST_USER_1;

			const result = await api.createUser(user);

			expect(result).toBeDefined();
			expect(result.lastModified).toBeDefined();
			expect(result).toMatchObject(removePassword(TEST_USER_1));
		});

		test('should fail as non-admin', async () => {
			expect.assertions(1);
			const { api } = await newUserRepository(NON_ADMIN);
			const user = TEST_USER_1;

			try {
				await api.createUser(user);
			} catch (error) {
				expect(error.code).toEqual('NOT_ALLOWED');
			}
		});
	});

	describe('updateUser', () => {
		test('should succeed as admin', async () => {
			const { api, internalApi } = await newUserRepository(ADMIN);
			const user = TEST_USER_1;
			const update = {
				username: 'new_username'
			};
			await internalApi.createUser(user);

			const result = await api.updateUser(user.id, update);

			expect(result).toBeDefined();
			expect(result).toMatchObject(
				removePassword({
					...TEST_USER_1,
					username: 'new_username'
				})
			);
		});

		test('should succeed as self', async () => {
			const { api, internalApi } = await newUserRepository(TEST_USER_1);
			const user = TEST_USER_1;
			const update = {
				username: 'new_username'
			};
			await internalApi.createUser(user);

			const result = await api.updateUser(user.id, update);

			expect(result).toBeDefined();
			expect(result).toMatchObject(
				removePassword({
					...TEST_USER_1,
					username: 'new_username'
				})
			);
		});

		test('should fail as non-admin', async () => {
			const { api, internalApi } = await newUserRepository(NON_ADMIN);
			const user = TEST_USER_1;
			const update = {
				username: 'new_username'
			};

			await internalApi.createUser(user);

			const promise = api.updateUser(user.id, update);

			await expect(promise).rejects.toHaveProperty('code', 'NOT_ALLOWED');
		});
	});

	describe('updatePassword', () => {
		test('should succeed as admin', async () => {
			const { api, internalApi } = await newUserRepository(ADMIN);
			const user = TEST_USER_1;

			await internalApi.createUser(TEST_USER_1);
			const newPassword = 'new_password';

			const result = await api.updatePassword(user.id, newPassword);

			const updatedPassword = await internalApi.getPassword(user.username);
			expect(result).toBe(true);
			expect(updatedPassword).toEqual(newPassword);
		});

		test('should succeed as self', async () => {
			const { api, internalApi } = await newUserRepository(TEST_USER_1);
			const user = TEST_USER_1;

			await internalApi.createUser(TEST_USER_1);
			const newPassword = 'new_password';

			const result = await api.updatePassword(user.id, newPassword);

			const updatedPassword = await internalApi.getPassword(user.username);
			expect(result).toBe(true);
			expect(updatedPassword).toEqual(newPassword);
		});

		test('should fail as non-admin', async () => {
			const { api, internalApi } = await newUserRepository(NON_ADMIN);
			const user = TEST_USER_1;
			await internalApi.createUser(TEST_USER_1);
			const newPassword = 'new_password';

			const promise = api.updatePassword(user.id, newPassword);

			await expect(promise).rejects.toHaveProperty('code', 'NOT_ALLOWED');
		});
	});

	describe('updateSettings', () => {
		test('should succeed as admin', async () => {
			const { api, internalApi } = await newUserRepository(ADMIN);
			const user = TEST_USER_1;
			const { lastModified } = await internalApi.createUser(user);
			const newSettings = { locale: 'de' };

			const result = await api.updateSettings(user.id, newSettings);

			expect(result).toBeDefined();
			expect(result.settings).toBeDefined();
			expect(result.settings.locale).toEqual('de');
			expect(result.lastModified).not.toEqual(lastModified);
		});

		test('should succeed as self', async () => {
			const { api, internalApi } = await newUserRepository(ADMIN);
			const user = TEST_USER_1;
			const { lastModified } = await internalApi.createUser(user);
			const newSettings = { locale: 'de' };

			const result = await api.updateSettings(user.id, newSettings);

			expect(result).toBeDefined();
			expect(result.settings).toBeDefined();
			expect(result.settings.locale).toEqual('de');
			expect(result.lastModified).not.toEqual(lastModified);
		});

		test('should fail as non-admin', async () => {
			const { api, internalApi } = await newUserRepository(NON_ADMIN);
			const user = TEST_USER_1;
			await internalApi.createUser(user);
			const newSettings = { locale: 'de' };

			const promise = api.updateSettings(user.id, newSettings);

			await expect(promise).rejects.toHaveProperty('code', 'NOT_ALLOWED');
		});
	});

	describe('deleteUser', () => {
		test('should succeed as admin', async () => {
			const { api, internalApi } = await newUserRepository(ADMIN);
			const user = TEST_USER_1;
			await internalApi.createUser(user);

			const result = await api.deleteUser(user.id);

			expect(result).toBe(true);
		});

		test('should succeed as self', async () => {
			const { api, internalApi } = await newUserRepository(TEST_USER_1);
			const user = TEST_USER_1;
			await internalApi.createUser(user);

			const result = await api.deleteUser(user.id);

			expect(result).toBe(true);
		});

		test('should fail as non-admin', async () => {
			const { api, internalApi } = await newUserRepository(NON_ADMIN);
			const user = TEST_USER_1;
			await internalApi.createUser(user);

			const promise = api.deleteUser(user.id);

			await expect(promise).rejects.toHaveProperty('code', 'NOT_ALLOWED');
		});

		test('should fail to delete admin', async () => {
			const { api, internalApi } = await newUserRepository(ADMIN);
			const user = ADMIN;
			await internalApi.createUser(user);

			const promise = api.deleteUser(user.id);

			await expect(promise).rejects.toHaveProperty('code', 'NOT_ALLOWED');
		})
	});

	describe('find', () => {
		const populate = async (internalApi) => {
			await internalApi.createUser(TEST_USER_1);
			await internalApi.createUser(TEST_USER_2);
			await internalApi.createUser(ADMIN);
		};

		describe('as admin', () => {
			let api;
			beforeAll(async () => {
				const repo = await newUserRepository(ADMIN);
				api = repo.api;
				await populate(repo.internalApi);
			});

			describe('findUser', () => {
				test('should return null if user does not exist', async () => {
					const result = await api.findUser('non_existing_user');

					expect(result).toBeNull();
				});

				test('should be able to find self', async () => {
					const result = await api.findUser(ADMIN.id);
					expect(result).toMatchObject(removePassword(ADMIN));
				});

				test('should be able to find other user', async () => {
					const result = await api.findUser(TEST_USER_1.id);
					expect(result).toMatchObject(removePassword(TEST_USER_1));
				});
			});

			describe('findAllUsers', () => {
				test('should return all existing users', async () => {
					const result = await api.findAllUsers();

					expect(result).toHaveLength(3);
					const testUser1 = result.find((user) => user.username === TEST_USER_1.username);
					expect(testUser1).toMatchObject(removePassword(TEST_USER_1));
					expect(testUser1.lastModified).toBeDefined();
					expect(result.map((user) => user.username).sort()).toEqual(['admin', 'janedoe', 'johndoe']);
				});
			});
		});

		describe('as non-admin', () => {
			let api;
			beforeAll(async () => {
				const repo = await newUserRepository(TEST_USER_1);
				api = repo.api;
				await populate(repo.internalApi);
			});

			describe('findUser', () => {
				test(' be able to find self', async () => {
					const result = await api.findUser(TEST_USER_1.id);

					expect(result).toMatchObject(removePassword(TEST_USER_1));
				});

				test('should fail to find other user', async () => {
					const promise = api.findUser(TEST_USER_2.id);

					await expect(promise).rejects.toHaveProperty('code', 'NOT_ALLOWED');
				});

				test('should return null if user does not exist', async () => {
					const result = await api.findUser('non_existing_user');

					expect(result).toBeNull();
				});
			});

			describe('findAllUsers', () => {
				test('should return only self', async () => {
					const result = await api.findAllUsers();

					expect(result).toHaveLength(1);
					expect(result[0]).toMatchObject(removePassword(TEST_USER_1));
				});
			});
		});
	});
});
