import 'jest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongodb from 'mongodb';
import { createUserRepository, UserRepository } from '../../src/user/UserRepository';
import glue from '../../src/glue';
import { UserApi, Actor } from '../../src/user';
import { GlobalContext } from '../../src/streamsheets';

let mongoServer: MongoMemoryServer;
let client: any;

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

const newUserApi = async (actor: Actor) => {
	const collection = newCollection();
	const userRepo = await createUserRepository(collection);
	const { api } = glue({ userRepo } as GlobalContext, actor);
	return {
		internalApi: userRepo,
		api: <UserApi>api.user
	};
};

const ADMIN = {
	id: '00000000000000',
	username: 'admin',
	email: 'admin@example.com',
	password: 'passwordadmin',
	scope: { id: 'root' }
};

const NON_ADMIN = {
	id: '3',
	username: 'nonadmin',
	email: 'nonadmin@example.com',
	password: 'passwordnonadmin',
	scope: { id: 'root' }
};

const TEST_USER_1 = {
	id: '1',
	username: 'johndoe',
	email: 'johndoe@example.com',
	firstName: 'John',
	lastName: 'Doe',
	password: 'password1',
	scope: { id: 'root' }
};
const TEST_USER_2 = {
	id: '2',
	username: 'janedoe',
	email: 'janedoe@example.com',
	firstName: 'Jane',
	lastName: 'Doe',
	password: 'password2',
	scope: { id: 'root' }
};

const removePassword = (user: any) => {
	const copy = { ...user };
	delete copy.password;
	return copy;
};

describe('UserApi', () => {
	describe('createUser', () => {
		test('should succeed as admin', async () => {
			const { api } = await newUserApi(ADMIN);
			const user = TEST_USER_1;

			const result = await api.createUser(user);

			expect(result).toBeDefined();
			expect(result.lastModified).toBeDefined();
			expect(result).toMatchObject(removePassword(TEST_USER_1));
		});

		test('should fail as non-admin', async () => {
			expect.assertions(1);
			const { api } = await newUserApi(NON_ADMIN);
			const user = TEST_USER_1;
			await expect(api.createUser(user)).rejects.toHaveProperty('code', 'NOT_ALLOWED');
		});
	});

	describe('updateUser', () => {
		test('should succeed as admin', async () => {
			const { api, internalApi } = await newUserApi(ADMIN);
			const user = TEST_USER_1;
			const update = {
				username: 'new_username'
			};
			await internalApi.createUser(user, () => {});

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
			const { api, internalApi } = await newUserApi(TEST_USER_1);
			const user = TEST_USER_1;
			const update = {
				username: 'new_username'
			};
			await internalApi.createUser(user, () => {});

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
			const { api, internalApi } = await newUserApi(NON_ADMIN);
			const user = TEST_USER_1;
			const update = {
				username: 'new_username'
			};

			await internalApi.createUser(user, () => {});

			const promise = api.updateUser(user.id, update);

			await expect(promise).rejects.toHaveProperty('code', 'NOT_ALLOWED');
		});
	});

	describe('updatePassword', () => {
		test('should succeed as admin', async () => {
			const { api, internalApi } = await newUserApi(ADMIN);
			const user = TEST_USER_1;

			await internalApi.createUser(TEST_USER_1, () => {});
			const newPassword = 'new_password';

			const result = await api.updatePassword(user.id, newPassword);

			const updatedPassword = await internalApi.getPassword(user.username);
			expect(result).toBe(true);
			expect(updatedPassword).toEqual(newPassword);
		});

		test('should succeed as self', async () => {
			const { api, internalApi } = await newUserApi(TEST_USER_1);
			const user = TEST_USER_1;

			await internalApi.createUser(TEST_USER_1, () => {});
			const newPassword = 'new_password';

			const result = await api.updatePassword(user.id, newPassword);

			const updatedPassword = await internalApi.getPassword(user.username);
			expect(result).toBe(true);
			expect(updatedPassword).toEqual(newPassword);
		});

		test('should fail as non-admin', async () => {
			const { api, internalApi } = await newUserApi(NON_ADMIN);
			const user = TEST_USER_1;
			await internalApi.createUser(TEST_USER_1, () => {});
			const newPassword = 'new_password';

			const promise = api.updatePassword(user.id, newPassword);

			await expect(promise).rejects.toHaveProperty('code', 'NOT_ALLOWED');
		});
	});

	describe('updateSettings', () => {
		test('should succeed as admin', async () => {
			const { api, internalApi } = await newUserApi(ADMIN);
			const user = TEST_USER_1;
			const { lastModified } = await internalApi.createUser(user, () => {});
			const newSettings = { locale: 'de' };

			const result = await api.updateSettings(user.id, newSettings);

			expect(result).toBeDefined();
			expect(result.settings).toBeDefined();
			expect(result.settings?.locale).toEqual('de');
			expect(result.lastModified).not.toEqual(lastModified);
		});

		test('should succeed as self', async () => {
			const { api, internalApi } = await newUserApi(ADMIN);
			const user = TEST_USER_1;
			const { lastModified } = await internalApi.createUser(user, () => {});
			const newSettings = { locale: 'de' };

			const result = await api.updateSettings(user.id, newSettings);

			expect(result).toBeDefined();
			expect(result.settings).toBeDefined();
			expect(result.settings?.locale).toEqual('de');
			expect(result.lastModified).not.toEqual(lastModified);
		});

		test('should fail as non-admin', async () => {
			const { api, internalApi } = await newUserApi(NON_ADMIN);
			const user = TEST_USER_1;
			await internalApi.createUser(user, () => {});
			const newSettings = { locale: 'de' };

			const promise = api.updateSettings(user.id, newSettings);

			await expect(promise).rejects.toHaveProperty('code', 'NOT_ALLOWED');
		});
	});

	describe('deleteUser', () => {
		test('should succeed as admin', async () => {
			const { api, internalApi } = await newUserApi(ADMIN);
			const user = TEST_USER_1;
			await internalApi.createUser(user, () => {});

			const result = await api.deleteUser(user.id);

			expect(result).toBe(true);
		});

		test('should succeed as self', async () => {
			const { api, internalApi } = await newUserApi(TEST_USER_1);
			const user = TEST_USER_1;
			await internalApi.createUser(user, () => {});

			const result = await api.deleteUser(user.id);

			expect(result).toBe(true);
		});

		test('should fail as non-admin', async () => {
			const { api, internalApi } = await newUserApi(NON_ADMIN);
			const user = TEST_USER_1;
			await internalApi.createUser(user, () => {});

			const promise = api.deleteUser(user.id);

			await expect(promise).rejects.toHaveProperty('code', 'NOT_ALLOWED');
		});

		test('should fail to delete admin', async () => {
			const { api, internalApi } = await newUserApi(ADMIN);
			const user = ADMIN;
			await internalApi.createUser(user, () => {});

			const promise = api.deleteUser(user.id);

			await expect(promise).rejects.toHaveProperty('code', 'NOT_ALLOWED');
		});
	});

	describe('find', () => {
		const populate = async (internalApi: UserRepository) => {
			await internalApi.createUser(TEST_USER_1, () => {});
			await internalApi.createUser(TEST_USER_2, () => {});
			await internalApi.createUser(ADMIN, () => {});
		};

		describe('as admin', () => {
			let api: UserApi;
			beforeAll(async () => {
				const repo = await newUserApi(ADMIN);
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
					expect(testUser1?.lastModified).toBeDefined();
					expect(result.map((user) => user.username).sort()).toEqual(['admin', 'janedoe', 'johndoe']);
				});
			});
		});

		describe('as non-admin', () => {
			let api: UserApi;
			beforeAll(async () => {
				const repo = await newUserApi(TEST_USER_1);
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
