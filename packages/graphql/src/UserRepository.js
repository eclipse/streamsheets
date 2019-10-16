const { touch, generateId, applyUpdate } = require('./Document');
const InternalError = require('./InternalError');
const InputError = require('./InputError');
const MongoError = require('./MongoError');
const ERROR_CODES = require('./ErrorCodes');

const toExternal = (user) => {
	if (!user) {
		return null;
	}
	const copy = { ...user };
	if (copy._id !== undefined) {
		copy.id = copy._id;
		delete copy._id;
	}
	delete copy.password;
	return copy;
};

const toInternalSettings = (settings) => {
	const internal = {};
	if (settings.locale !== undefined) {
		internal.locale = settings.locale;
	}
	return internal;
};

const toInternal = (user) => {
	const internal = {};
	if (user.id !== undefined) {
		internal._id = user.id;
	}
	if (user.username !== undefined) {
		internal.username = user.username;
	}
	if (user.email !== undefined) {
		internal.email = user.email;
	}
	if (user.lastName !== undefined) {
		internal.lastName = user.lastName;
	}
	if (user.firstName !== undefined) {
		internal.firstName = user.firstName;
	}
	if (user.password !== undefined) {
		internal.password = user.password;
	}
	if (user.settings !== undefined) {
		internal.settings = toInternalSettings(user.settings);
	}
	return internal;
};

const sanitizeUpdate = (update) => {
	const copy = { ...update };
	delete copy.password;
	return copy;
};

const validateSettings_ = (settings) => {
	const { locale } = settings;
	const errors = {
		locale: !['en', 'de'].includes(locale) ? ERROR_CODES.LOCALE_INVALID : undefined
	};
	return Object.values(errors).filter((error) => !!error).length > 0 ? errors : undefined;
};

const validateSettings = (settings) => {
	const errors = validateSettings_(settings);
	if (errors) {
		throw InputError.invalid('Invalid settings', errors);
	}
	return settings;
};

const validate = (user) => {
	const { username, email, password } = user;
	const errors = {
		username: !username ? ERROR_CODES.USERNAME_INVALID : undefined,
		email: !(email && typeof email === 'string' && email.match(/^\S+@\S+\.\S+/))
			? ERROR_CODES.EMAIL_INVALID
			: undefined,
		password: !password ? ERROR_CODES.PASSWORD_INVALID : undefined,
		settings: validateSettings_(user.settings)
	};

	if (Object.values(errors).filter((error) => !!error).length > 0) {
		throw InputError.invalid('Invalid user', errors);
	}
	return user;
};

const hidePassword = (options = {}) => ({ ...options, projection: { ...options.projection, password: false } });

const beforeWrite = (user) => validate(touch(user));

const findConflict = async (collection, self = '', fields) => {
	const existing = await collection
		.find(
			{ $or: Object.entries(fields).map(([key, { value }]) => ({ [key]: value })), _id: { $ne: self } },
			{ projection: Object.keys(fields) }
		)
		.toArray();
	const fieldErrors = existing.reduce(
		(acc, current) =>
			Object.assign(
				...Object.entries(fields).map(([key, { value, error }]) => ({
					[key]: acc[key] || value === current[key] ? error : undefined
				}))
			),
		{}
	);
	return fieldErrors;
};

const defaults = (user) => {
	const copy = { ...user };
	if (!copy.settings) {
		copy.settings = {};
	}
	if (!copy.settings.locale) {
		copy.settings.locale = 'en';
	}
	return copy;
};

const UserRepository = {
	findUser: async (collection, id) => {
		const result = await collection.findOne({ _id: id }, hidePassword());
		return toExternal(result);
	},
	findUserByUsername: async (collection, username) => {
		const result = await collection.findOne({ username }, hidePassword());
		return toExternal(result);
	},
	findAllUsers: async (collection) => {
		const result = await collection.find({}, hidePassword()).toArray();
		return result.map(toExternal);
	},
	createUser: async (collection, user) => {
		const userDocument = beforeWrite(defaults(generateId(toInternal(user))));
		try {
			await collection.insertOne(userDocument);
			return toExternal(userDocument);
		} catch (error) {
			if (MongoError.isConflict(error)) {
				const fieldErrors = await findConflict(collection, null, {
					username: {
						value: userDocument.username,
						error: ERROR_CODES.USERNAME_IN_USE
					},
					email: {
						value: userDocument.email,
						error: ERROR_CODES.EMAIL_IN_USE
					}
				});
				throw InputError.conflict('Username or email already in use', fieldErrors);
			}
			throw error;
		}
	},
	updateUser: async (collection, id, userUpdate) => {
		let userDocument;
		try {
			const currentUser = await collection.findOne({ _id: id });
			if (!currentUser) {
				throw InputError.notFound('User does not exist', ERROR_CODES.USER_NOT_FOUND);
			}
			const sanitizedUpdate = toInternal(sanitizeUpdate(userUpdate));
			const updatedUser = applyUpdate(currentUser, sanitizedUpdate);
			updatedUser.password = currentUser.password;
			userDocument = beforeWrite(updatedUser);
			const result = await collection.findOneAndReplace(
				{ _id: id },
				userDocument,
				hidePassword({ returnOriginal: false })
			);
			return toExternal(result.value);
		} catch (error) {
			if (MongoError.isConflict(error)) {
				const fieldErrors = await findConflict(collection, id, {
					username: {
						value: userDocument.username,
						error: ERROR_CODES.USERNAME_IN_USE
					},
					email: {
						value: userDocument.email,
						error: ERROR_CODES.EMAIL_IN_USE
					}
				});
				throw InputError.conflict('Username or email already in use', fieldErrors);
			}
			throw error;
		}
	},
	updateSettings: async (collection, id, settingsUpdate) => {
		let userDocument;
		try {
			const currentUser = await collection.findOne({ _id: id });
			if (!currentUser) {
				throw InputError.notFound('User does not exist', ERROR_CODES.USER_NOT_FOUND);
			}
			const updatedSettings = validateSettings({
				...currentUser.settings,
				...toInternalSettings(settingsUpdate)
			});
			const update = { $set: touch({ settings: updatedSettings }) };
			const result = await collection.findOneAndUpdate(
				{ _id: id },
				update,
				hidePassword({ returnOriginal: false })
			);
			return toExternal(result.value);
		} catch (error) {
			if (MongoError.isConflict(error)) {
				const fieldErrors = await findConflict(collection, id, {
					username: {
						value: userDocument.username,
						error: ERROR_CODES.USERNAME_IN_USE
					},
					email: {
						value: userDocument.email,
						error: ERROR_CODES.EMAIL_IN_USE
					}
				});
				throw InputError.conflict('Username or email already in use', fieldErrors);
			}
			throw error;
		}
	},
	deleteUser: async (collection, id) => {
		const { result } = await collection.deleteOne({ _id: id });
		if (result.n === 1) {
			return true;
		}
		throw InputError.notFound('User does not exist', ERROR_CODES.USER_NOT_FOUND);
	},
	getPassword: async (collection, username) => {
		const result = await collection.findOne({ username }, { projection: { password: true } });
		if (!result) {
			throw InputError.notFound('User does not exist', ERROR_CODES.USER_NOT_FOUND);
		}
		return result.password;
	},
	updatePassword: async (collection, id, password) => {
		const user = await collection.findOne({ _id: id });
		if (!user) {
			throw InputError.notFound('User does not exist', ERROR_CODES.USER_NOT_FOUND);
		}
		const userDocument = beforeWrite(applyUpdate(user, { password }));
		const { result } = await collection.replaceOne({ _id: id }, userDocument, hidePassword());
		return result.nModified === 1;
	}
};

const catchUnexpectedErrors = (func) => async (...args) => {
	try {
		const result = await func(...args);
		return result;
	} catch (error) {
		if (error.own) {
			throw error;
		}
		throw InternalError.unexpected(error);
	}
};

const createUserRepository = (collection) => {
	collection.createIndexes([
		{
			key: {
				username: 1
			},
			name: 'username',
			unique: true
		},
		{
			key: {
				email: 1
			},
			name: 'email',
			unique: true
		}
	]);
	return Object.entries(UserRepository).reduce(
		(obj, [name, func]) => ({ ...obj, [name]: catchUnexpectedErrors((...args) => func(collection, ...args)) }),
		{}
	);
};

module.exports = {
	createUserRepository
};
