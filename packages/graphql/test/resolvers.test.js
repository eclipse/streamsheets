const { resolvers } = require('..');

const mockContext = {
	repositories: {
		userRepository: {
			findUser: jest.fn(),
			findAllUsers: jest.fn(),
			createUser: jest.fn(),
			updateUser: jest.fn(),
			deleteUser: jest.fn(),
			updatePassword: jest.fn(),
			updateSettings: jest.fn()
		}
	},
	encryption: {
		hash: (string) => Buffer.from(string).toString('base64'),
		verify: (hash, string) => Buffer.from(hash, 'base64').toString() === string
	},
	session: {
		user: {
			id: 'johndoe',
			email: 'johndoe@example.com'
		}
	}
};

const SAMPLE_USER_1 = {
	id: 0,
	username: 'johndoe',
	email: 'johndoe@example.com',
	firstName: 'John',
	lastName: 'Doe'
};

const SAMPLE_USER_2 = {
	id: 1,
	username: 'janedoe',
	email: 'janedoe@example.com',
	firstName: 'Jane',
	settings: {
		locale: 'en'
	}
};

const SAMPLE_USERS = [SAMPLE_USER_1, SAMPLE_USER_2];

describe('Query.me', () => {
	const { findUser } = mockContext.repositories.userRepository;

	it('returns the user of the session', async () => {
		findUser.mockReturnValueOnce(SAMPLE_USER_1);

		const res = await resolvers.Query.me(null, null, mockContext);

		expect(res).toEqual(SAMPLE_USER_1);
		expect(findUser).toBeCalledWith('johndoe');
	});
});

describe('Query.user', () => {
	const { findUser } = mockContext.repositories.userRepository;

	it('returns an existing user', async () => {
		findUser.mockReturnValueOnce(SAMPLE_USER_1);

		const res = await resolvers.Query.user(null, { id: 'johndoe' }, mockContext);

		expect(res).toEqual(SAMPLE_USER_1);
		expect(findUser).toBeCalledWith('johndoe');
	});

	it('returns null for non-existing user', async () => {
		findUser.mockReturnValueOnce(null);

		const res = await resolvers.Query.user(null, { id: 'janedoe' }, mockContext);

		expect(res).toBeNull();
		expect(findUser).toBeCalledWith('janedoe');
	});
});

describe('Query.users', () => {
	const { findAllUsers } = mockContext.repositories.userRepository;

	it('returns all existing users', async () => {
		findAllUsers.mockReturnValueOnce(SAMPLE_USERS);

		const res = await resolvers.Query.users(null, null, mockContext);

		expect(res).toEqual(SAMPLE_USERS);
	});
});

describe('Mutation.createUser', () => {
	const { createUser } = mockContext.repositories.userRepository;

	it('returns a succesful reponse with the created user', async () => {
		createUser.mockReturnValueOnce(SAMPLE_USER_2);
		const userInput = { ...SAMPLE_USER_2, id: undefined, password: 'aPassword' };

		const res = await resolvers.Mutation.createUser(null, { user: userInput }, mockContext);

		expect(res.success).toBe(true);
		expect(res.code).toBe('USER_CREATED');
		expect(res.user).toBe(SAMPLE_USER_2);
		expect(createUser).toBeCalledWith({ ...userInput, password: 'YVBhc3N3b3Jk' });
	});

	it('returns an error response on username conflict', async () => {
		createUser.mockImplementationOnce(() => {
			const error = { code: 'CONFLICT', fieldErrors: { username: 'USERNAME_IN_USE' } };
			throw error;
		});
		const userInput = { ...SAMPLE_USER_2, id: undefined, password: 'aPassword' };

		const res = await resolvers.Mutation.createUser(null, { user: userInput }, mockContext);

		expect(res.success).toBe(false);
		expect(res.code).toEqual('CONFLICT');
		expect(res.fieldErrors.username).toEqual('USERNAME_IN_USE');
		expect(res.user).toBeUndefined();
		expect(createUser).toBeCalledWith({ ...userInput, password: 'YVBhc3N3b3Jk' });
	});
});

describe('Mutation.updateUser', () => {
	const { updateUser } = mockContext.repositories.userRepository;

	it('returns a succesful reponse with the updated user', async () => {
		updateUser.mockReturnValueOnce(SAMPLE_USER_2);
		const userInput = { ...SAMPLE_USER_2, id: undefined };
		const id = 1;

		const res = await resolvers.Mutation.updateUser(null, { id, user: userInput }, mockContext);

		expect(res.success).toBe(true);
		expect(res.code).toEqual('USER_UPDATED');
		expect(res.user).toEqual(SAMPLE_USER_2);
		expect(updateUser).toBeCalledWith(id, userInput);
	});

	it('returns an error response if user does not exist', async () => {
		updateUser.mockImplementationOnce(() => {
			const error = { code: 'USER_NOT_FOUND' };
			throw error;
		});
		const userInput = { ...SAMPLE_USER_2, id: undefined };
		const id = 1;

		const res = await resolvers.Mutation.updateUser(null, { id, user: userInput }, mockContext);

		expect(res.success).toBe(false);
		expect(res.code).toEqual('USER_NOT_FOUND');
		expect(res.user).toBeUndefined();
		expect(updateUser).toBeCalledWith(id, userInput);
	});

	it('returns an error response on username conflict', async () => {
		updateUser.mockImplementationOnce(() => {
			const error = { code: 'CONFLICT', fieldErrors: { username: 'USERNAME_IN_USE' } };
			throw error;
		});
		const userInput = { ...SAMPLE_USER_2, id: undefined };
		const id = 1;

		const res = await resolvers.Mutation.updateUser(null, { id, user: userInput }, mockContext);

		expect(res.success).toBe(false);
		expect(res.code).toEqual('CONFLICT');
		expect(res.fieldErrors.username).toEqual('USERNAME_IN_USE');
		expect(res.user).toBeUndefined();
		expect(updateUser).toBeCalledWith(id, userInput);
	});
});

describe('Mutation.updateUserPassword', () => {
	const { updatePassword } = mockContext.repositories.userRepository;

	it('returns a succesful reponse', async () => {
		updatePassword.mockReturnValueOnce(SAMPLE_USER_2);
		const id = 1;
		const newPassword = 'aPassword';

		const res = await resolvers.Mutation.updateUserPassword(null, { id, newPassword }, mockContext);

		expect(res.success).toBe(true);
		expect(res.code).toEqual('PASSWORD_UPDATED');
		expect(updatePassword).toBeCalledWith(id, 'YVBhc3N3b3Jk');
	});

	it('returns an error response if user does not exist', async () => {
		updatePassword.mockImplementationOnce(() => {
			const error = { code: 'USER_NOT_FOUND' };
			throw error;
		});
		const id = 1;
		const newPassword = 'aPassword';

		const res = await resolvers.Mutation.updateUserPassword(null, { id, newPassword }, mockContext);

		expect(res.success).toBe(false);
		expect(res.code).toEqual('USER_NOT_FOUND');
		expect(updatePassword).toBeCalledWith(id, 'YVBhc3N3b3Jk');
	});
});

describe('Mutation.updateUserSettings', () => {
	const { updateSettings } = mockContext.repositories.userRepository;

	it('returns a succesful reponse', async () => {
		updateSettings.mockReturnValueOnce(SAMPLE_USER_2);
		const id = 1;
		const newSettings = { locale: 'de' };

		const res = await resolvers.Mutation.updateUserSettings(null, { id, settings: newSettings }, mockContext);

		expect(res.success).toBe(true);
		expect(res.code).toEqual('SETTINGS_UPDATED');
		expect(res.user.settings).toBeDefined();
		expect(updateSettings).toBeCalledWith(id, newSettings);
	});

	it('returns an error response if user does not exist', async () => {
		updateSettings.mockImplementationOnce(() => {
			const error = { code: 'USER_NOT_FOUND' };
			throw error;
		});
		const id = 1;
		const newSettings = { locale: 'de' };

		const res = await resolvers.Mutation.updateUserSettings(null, { id, settings: newSettings }, mockContext);

		expect(res.success).toBe(false);
		expect(res.code).toEqual('USER_NOT_FOUND');
		expect(updateSettings).toBeCalledWith(id, newSettings);
	});

	it('returns an error response if locale is invalid', async () => {
		updateSettings.mockImplementationOnce(() => {
			const error = { code: 'INVALID' };
			throw error;
		});
		const id = 1;
		const newSettings = { locale: 'de' };

		const res = await resolvers.Mutation.updateUserSettings(null, { id, settings: newSettings }, mockContext);

		expect(res.success).toBe(false);
		expect(res.code).toEqual('INVALID');
		expect(updateSettings).toBeCalledWith(id, newSettings);
	});
});

describe('Mutation.deleteUser', () => {
	const { deleteUser } = mockContext.repositories.userRepository;

	it('returns a succesful reponse when the user is deleted', async () => {
		deleteUser.mockReturnValueOnce(true);
		const id = 1;

		const res = await resolvers.Mutation.deleteUser(null, { id }, mockContext);

		expect(res.success).toBe(true);
		expect(res.code).toEqual('USER_DELETED');
		expect(deleteUser).toBeCalledWith(id);
	});

	it('returns an error response if user does not exist', async () => {
		deleteUser.mockImplementationOnce(() => {
			const error = { code: 'USER_NOT_FOUND' };
			throw error;
		});
		const id = 1;

		const res = await resolvers.Mutation.deleteUser(null, { id }, mockContext);

		expect(res.success).toBe(false);
		expect(res.code).toEqual('USER_NOT_FOUND');
		expect(deleteUser).toBeCalledWith(id);
	});
});
