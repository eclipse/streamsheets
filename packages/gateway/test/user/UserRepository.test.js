const { MongoMemoryServer } = require('mongodb-memory-server');
const mongodb = require('mongodb');
const { createUserRepository } = require('../../src/user/UserRepository.ts');

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

const newUserRepository = () => {
	const collection = newCollection();
	return createUserRepository(collection);
};

const MINIMAL_USER = {
	id: 0,
	username: 'minimal',
	email: 'minimal@example.com',
	password: 'password0'
};

// const ADMIN = {
// 	id: '00000000000000',
// 	usename: 'admin',
// 	email: 'admin@example.com',
// 	password: 'passwordadmin'
// }

const TEST_USER_1 = {
	id: 1,
	username: 'johndoe',
	email: 'johndoe@example.com',
	firstName: 'John',
	lastName: 'Doe',
	password: 'password1',
	scope: { id: 'scope1' }
};
const TEST_USER_2 = {
	id: 2,
	username: 'janedoe',
	email: 'janedoe@example.com',
	firstName: 'Jane',
	lastName: 'Doe',
	password: 'password2',
	scope: { id: 'scope2' }
};

const removePassword = (user) => {
	const copy = { ...user };
	delete copy.password;
	return copy;
};

describe('UserRepository', () => {
	describe('createUser', () => {
		test('should succeed with a new minimal user', async () => {
			const api = await newUserRepository();
			const user = MINIMAL_USER;

			const result = await api.createUser(user);

			expect(result).toBeDefined();
			expect(result.lastModified).toBeDefined();
			expect(result).toMatchObject(removePassword(MINIMAL_USER));
		});

		test('should generate a shortId if non id is passed', async () => {
			const api = await newUserRepository();
			const user = { ...MINIMAL_USER };
			delete user.id;

			const result = await api.createUser(user);

			expect(result).toBeDefined();
			expect(result.lastModified).toBeDefined();
			expect(result.id).toBeDefined();
			expect(typeof result.id).toEqual('string');
		});

		test('should succeed with a full user', async () => {
			const api = await newUserRepository();
			const user = TEST_USER_1;

			const result = await api.createUser(user);

			expect(result).toBeDefined();
			expect(result.lastModified).toBeDefined();
			expect(result).toMatchObject(removePassword(TEST_USER_1));
		});

		test('should not return password', async () => {
			const api = await newUserRepository();
			const user = TEST_USER_1;

			const result = await api.createUser(user);

			expect(result).toBeDefined();
			expect(result.password).toBeUndefined();
		});

		test('should fail if username is missing', async () => {
			expect.assertions(2);
			const api = await newUserRepository();
			const user = { ...MINIMAL_USER };
			delete user.username;

			try {
				await api.createUser(user);
			} catch (error) {
				expect(error.code).toEqual('INVALID');
				expect(error.fieldErrors.username).toEqual('USERNAME_INVALID');
			}
		});

		test('should fail if email is missing', async () => {
			expect.assertions(2);
			const api = await newUserRepository();
			const user = { ...MINIMAL_USER };
			delete user.email;

			try {
				await api.createUser(user);
			} catch (error) {
				expect(error.code).toEqual('INVALID');
				expect(error.fieldErrors.email).toEqual('EMAIL_INVALID');
			}
		});

		test('should fail if password is missing', async () => {
			expect.assertions(2);
			const api = await newUserRepository();
			const user = { ...MINIMAL_USER };
			delete user.password;

			try {
				await api.createUser(user);
			} catch (error) {
				expect(error.code).toEqual('INVALID');
				expect(error.fieldErrors.password).toEqual('PASSWORD_INVALID');
			}
		});

		test('should fail if email is invalid', async () => {
			expect.assertions(2);
			const api = await newUserRepository();
			const user = { ...MINIMAL_USER, email: 'invalid' };

			try {
				await api.createUser(user);
			} catch (error) {
				expect(error.code).toEqual('INVALID');
				expect(error.fieldErrors.email).toEqual('EMAIL_INVALID');
			}
		});

		test('should fail if username already exists', async () => {
			expect.assertions(3);
			const api = await newUserRepository();
			const user = MINIMAL_USER;
			const user2 = { ...MINIMAL_USER, email: 'other@example.com' };
			await api.createUser(user);

			try {
				await api.createUser(user2);
			} catch (error) {
				expect(error.code).toEqual('CONFLICT');
				expect(error.fieldErrors.email).toBeUndefined();
				expect(error.fieldErrors.username).toEqual('USERNAME_IN_USE');
			}
		});

		test('should fail if email already exists', async () => {
			expect.assertions(3);
			const api = await newUserRepository();
			const user = MINIMAL_USER;
			const user2 = { ...MINIMAL_USER, username: 'other' };
			await api.createUser(user);

			try {
				await api.createUser(user2);
			} catch (error) {
				expect(error.code).toEqual('CONFLICT');
				expect(error.fieldErrors.usename).toBeUndefined();
				expect(error.fieldErrors.email).toEqual('EMAIL_IN_USE');
			}
		});

		test('should fail if username and email already exist', async () => {
			expect.assertions(3);
			const api = await newUserRepository();
			const user = MINIMAL_USER;
			const user2 = { ...MINIMAL_USER };
			await api.createUser(user);

			try {
				await api.createUser(user2);
			} catch (error) {
				expect(error.code).toEqual('CONFLICT');
				expect(error.fieldErrors.email).toEqual('EMAIL_IN_USE');
				expect(error.fieldErrors.username).toEqual('USERNAME_IN_USE');
			}
		});

		test('should discard additional properties', async () => {
			const api = await newUserRepository();
			const user = { ...TEST_USER_1, additionalProperty: 'test' };

			const result = await api.createUser(user);

			expect(result).toBeDefined();
			expect(result.additionalProperty).toBeUndefined();
			expect(result).toMatchObject(removePassword(TEST_USER_1));
		});

		test('should return user with default settings', async () => {
			const api = await newUserRepository();
			const user = TEST_USER_1;

			const result = await api.createUser(user);

			expect(result).toBeDefined();
			expect(result.settings).toBeDefined();
			expect(result.settings.locale).toEqual('en');
		});
	});

	describe('updateUser', () => {
		test('should fail if user does not exists', async () => {
			const api = await newUserRepository();
			const update = { username: 'new_username' };

			const promise = api.updateUser('non_existing_id', update);

			await expect(promise).rejects.toHaveProperty('code', 'USER_NOT_FOUND');
		});

		test('should succeed to update every field', async () => {
			const api = await newUserRepository();
			const user = TEST_USER_1;
			const update = {
				...TEST_USER_2,
				id: undefined
			};
			await api.createUser(user);

			const result = await api.updateUser(user.id, update);

			expect(result).toBeDefined();
			expect(result.lastModified).toBeDefined();
			expect(result).toMatchObject({
				id: TEST_USER_1.id,
				username: TEST_USER_2.username,
				email: TEST_USER_2.email,
				firstName: TEST_USER_2.firstName,
				lastName: TEST_USER_2.lastName
			});
		});

		test('should apply a partial update', async () => {
			const api = await newUserRepository();
			const user = TEST_USER_1;
			const update = {
				username: 'new_username'
			};
			await api.createUser(user);

			const result = await api.updateUser(user.id, update);

			expect(result).toBeDefined();
			expect(result).toMatchObject(
				removePassword({
					...TEST_USER_1,
					username: 'new_username'
				})
			);
		});

		test('should ignore id and _id in update', async () => {
			const api = await newUserRepository();
			const user = TEST_USER_1;
			const update = {
				id: 'new_id',
				_id: 'new_id',
				username: 'new_username'
			};
			await api.createUser(user);

			const result = await api.updateUser(user.id, update);

			expect(result).toBeDefined();
			expect(result).toMatchObject(
				removePassword({
					...TEST_USER_1,
					username: 'new_username'
				})
			);
		});

		test('should ignore password in update', async () => {
			const api = await newUserRepository();
			const user = TEST_USER_1;
			const update = {
				password: 'new_password'
			};
			await api.createUser(user);

			await api.updateUser(user.id, update);

			const password = await api.getPassword(user.username);
			expect(password).not.toEqual('new_password');
		});

		test('should fail if username already exists', async () => {
			expect.assertions(3);
			const api = await newUserRepository();
			const user = TEST_USER_1;
			const user2 = TEST_USER_2;
			await api.createUser(user);
			await api.createUser(user2);
			const update = {
				username: user.username
			};

			try {
				await api.updateUser(user2.id, update);
			} catch (error) {
				expect(error.code).toEqual('CONFLICT');
				expect(error.fieldErrors.email).toBeUndefined();
				expect(error.fieldErrors.username).toEqual('USERNAME_IN_USE');
			}
		});

		test('should fail if email already exists', async () => {
			expect.assertions(3);
			const api = await newUserRepository();
			const user = TEST_USER_1;
			const user2 = TEST_USER_2;
			await api.createUser(user);
			await api.createUser(user2);
			const update = {
				email: user.email
			};

			try {
				await api.updateUser(user2.id, update);
			} catch (error) {
				expect(error.code).toEqual('CONFLICT');
				expect(error.fieldErrors.username).toBeUndefined();
				expect(error.fieldErrors.email).toEqual('EMAIL_IN_USE');
			}
		});

		test('should fail if username and email already exists', async () => {
			expect.assertions(3);
			const api = await newUserRepository();
			const user = TEST_USER_1;
			const user2 = TEST_USER_2;
			await api.createUser(user);
			await api.createUser(user2);
			const update = {
				email: user.email,
				username: user.username
			};

			try {
				await api.updateUser(user2.id, update);
			} catch (error) {
				expect(error.code).toEqual('CONFLICT');
				expect(error.fieldErrors.email).toEqual('EMAIL_IN_USE');
				expect(error.fieldErrors.username).toEqual('USERNAME_IN_USE');
			}
		});

		test('should discard additional properties', async () => {
			const api = await newUserRepository();
			const user = { ...TEST_USER_1 };
			await api.createUser(user);
			const update = {
				additionalProperty: 'test',
				username: 'new_username'
			};

			const result = await api.updateUser(user.id, update);

			expect(result).toBeDefined();
			expect(result.additionalProperty).toBeUndefined();
			expect(result.username).toEqual('new_username');
		});
	});

	describe('getPassword', () => {
		test('should return user password hash', async () => {
			const api = await newUserRepository();
			const user = TEST_USER_1;
			await api.createUser(TEST_USER_1);

			const result = await api.getPassword(user.username);

			expect(result).toEqual(TEST_USER_1.password);
		});

		test('should fail if user does not exists', async () => {
			const api = await newUserRepository();

			const promise = api.getPassword('non_existing_user');

			await expect(promise).rejects.toHaveProperty('code', 'USER_NOT_FOUND');
		});
	});

	describe('updatePassword', () => {
		test('should update the user password hash', async () => {
			const api = await newUserRepository();
			const user = TEST_USER_1;
			await api.createUser(TEST_USER_1);
			const newPassword = 'new_password';

			const result = await api.updatePassword(user.id, newPassword);

			const updatedPassword = await api.getPassword(user.username);
			expect(result).toBe(true);
			expect(updatedPassword).toEqual(newPassword);
		});

		test('should fail if user does not exists', async () => {
			const api = await newUserRepository();

			const promise = api.updatePassword('non_exisiting_user', 'new_password');

			await expect(promise).rejects.toHaveProperty('code', 'USER_NOT_FOUND');
		});
	});

	describe('updateSettings', () => {
		test('should update the user locale', async () => {
			const api = await newUserRepository();
			const user = TEST_USER_1;
			const { lastModified } = await api.createUser(user);
			const newSettings = { locale: 'de' };

			const result = await api.updateSettings(user.id, newSettings);

			expect(result).toBeDefined();
			expect(result.settings).toBeDefined();
			expect(result.settings.locale).toEqual('de');
			expect(result.lastModified).not.toEqual(lastModified);
		});

		test('should fail if the locale is invalid', async () => {
			expect.assertions(2);
			const api = await newUserRepository();
			const user = TEST_USER_1;
			await api.createUser(user);
			const newSettings = { locale: 'invalid' };

			try {
				await api.updateSettings(user.id, newSettings);
			} catch (error) {
				expect(error.code).toEqual('INVALID');
				expect(error.fieldErrors.locale).toEqual('LOCALE_INVALID');
			}
		});

		test('should fail if user does not exists', async () => {
			const api = await newUserRepository();

			const promise = api.updatePassword('non_exisiting_user', 'new_password');

			await expect(promise).rejects.toHaveProperty('code', 'USER_NOT_FOUND');
		});
	});

	describe('deleteUser', () => {
		test('should succeed if user exists', async () => {
			const api = await newUserRepository();
			const user = TEST_USER_1;
			await api.createUser(TEST_USER_1);

			const result = await api.deleteUser(user.id);

			expect(result).toBe(true);
		});

		test('should fail if user does not exists', async () => {
			const api = await newUserRepository();

			const promise = api.deleteUser('non_exisiting_user');

			await expect(promise).rejects.toHaveProperty('code', 'USER_NOT_FOUND');
		});
	});

	describe('find', () => {
		let api;
		beforeAll(async () => {
			api = await newUserRepository();
			await api.createUser(TEST_USER_1);
			await api.createUser(TEST_USER_2);
		});

		describe('findUser', () => {
			test('should return user if it exists', async () => {
				const result = await api.findUser(TEST_USER_1.id);

				expect(result).toMatchObject(removePassword(TEST_USER_1));
				expect(result.lastModified).toBeDefined();
			});

			test('should return null if user does not exist', async () => {
				const result = await api.findUser('non_existing_user');

				expect(result).toBeNull();
			});
		});

		describe('findAllUsers', () => {
			test('should return all exisiting users', async () => {
				const result = await api.findAllUsers();

				expect(result).toHaveLength(2);
				const testUser1 = result.find((user) => user.username === TEST_USER_1.username);
				expect(testUser1).toMatchObject(removePassword(TEST_USER_1));
				expect(testUser1.lastModified).toBeDefined();
				expect(result.map((user) => user.username).sort()).toEqual(['janedoe', 'johndoe']);
			});
		});

		describe('findByScope', () => {
			test('should return all users with scope', async () => {
				const result = await api.findByScope({ id: 'scope1' });

				expect(result).toMatchObject([removePassword(TEST_USER_1)]);
			});
			test('should return no user if no user with scope exists', async () => {
				const result = await api.findByScope({ id: 'scope3' });

				expect(result).toEqual([]);
			});
		});

		describe('countByScope', () => {
			test('should return count of all users with scope', async () => {
				const result = await api.countByScope({ id: 'scope1' });

				expect(result).toEqual(1);
			});
			test('should return 0 if no user with scope exists', async () => {
				const result = await api.countByScope({ id: 'scope3' });

				expect(result).toEqual(0);
			});
		});

		describe('findUserByUsername', () => {
			test('should return user if it exists', async () => {
				const result = await api.findUserByUsername(TEST_USER_1.username);

				expect(result).toMatchObject(removePassword(TEST_USER_1));
				expect(result.lastModified).toBeDefined();
				expect(result.password).toBeUndefined();
			});

			test('should return null if user does not exist', async () => {
				const result = await api.findUserByUsername('non_existing_user');

				expect(result).toBeNull();
			});
		});
	});
});
