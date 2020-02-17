import { Collection, FindOneOptions, FindOneAndReplaceOption } from 'mongodb';
import { User, UserSettings, UserFromRepo, NewUser } from './types';
import { Authorizer, ID } from '../streamsheets';
import { PropType } from '../common';

const { touch, generateId, applyUpdate } = require('./Document');
const { InternalError, InputError, MongoError, ErrorCodes } = require('../errors');

export interface UserRepository {
	findUser(id: ID): Promise<UserFromRepo | null>;
	findMinimalUser(id: ID): Promise<Pick<User, 'id'> | null>;
	findUserByUsername(username: string): Promise<UserFromRepo | null>;
	findAllUsers(): Promise<Array<UserFromRepo>>;
	createUser(user: User, auth: Authorizer<UserFromRepo>): Promise<UserFromRepo>;
	updateUser(id: ID, userUpdate: Partial<User>, auth: Authorizer<User>): Promise<UserFromRepo>;
	updateSettings(id: ID, settingsUpdate: Partial<UserSettings>, auth: Authorizer<User>): Promise<UserFromRepo>;
	deleteUser(id: ID, auth: Authorizer<User>): Promise<boolean>;
	getPassword(username: string): Promise<string>;
	updatePassword(id: ID, password: string, auth: Authorizer<User>): Promise<boolean>;
}

type InternalUser = Omit<UserFromRepo, 'id' | 'settings'> & {
	_id: PropType<UserFromRepo, 'id'>;
	password: string;
	settings: InternalSettings;
};
type InternalSettings = UserSettings;
type PartialInternalUser = Partial<Omit<InternalUser, 'settings'> & { settings: Partial<InternalSettings> }>;
type UserCollection = Collection<InternalUser>;

function toExternal(user: null | undefined): null;
function toExternal(user: InternalUser): UserFromRepo;
function toExternal(user: InternalUser | null | undefined): UserFromRepo | null;
function toExternal(user: InternalUser | null | undefined): UserFromRepo | null {
	if (!user) {
		return null;
	}
	const { _id, password, ...copy } = { ...user, id: user._id };
	return copy;
}

const toInternalSettings = (settings: Partial<UserSettings>): Partial<InternalSettings> => {
	const internal: Partial<InternalSettings> = {};
	if (settings.locale !== undefined) {
		internal.locale = settings.locale;
	}
	return internal;
};

const toInternal = (user: Partial<User & NewUser>): PartialInternalUser => {
	const internal: PartialInternalUser = {};
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

const sanitizeUpdate = (update: Partial<User>) => {
	const { password = '', ...copy } = { ...update };
	return copy;
};

const validateSettings_ = (settings: InternalSettings) => {
	const { locale } = settings;
	const errors = {
		locale: !['en', 'de'].includes(locale) ? ErrorCodes.LOCALE_INVALID : undefined
	};
	return Object.values(errors).filter((error) => !!error).length > 0 ? errors : undefined;
};

const validateSettings = (settings: InternalSettings) => {
	const errors = validateSettings_(settings);
	if (errors) {
		throw InputError.invalid('Invalid settings', errors);
	}
	return settings;
};

const validate = (user: InternalUser) => {
	const { username, email, password } = user;
	const errors = {
		username: !username ? ErrorCodes.USERNAME_INVALID : undefined,
		email: !(email && typeof email === 'string' && email.match(/^\S+@\S+\.\S+/))
			? ErrorCodes.EMAIL_INVALID
			: undefined,
		password: !password ? ErrorCodes.PASSWORD_INVALID : undefined,
		settings: validateSettings_(user.settings)
	};

	if (Object.values(errors).filter((error) => !!error).length > 0) {
		throw InputError.invalid('Invalid user', errors);
	}
	return user;
};

const hidePassword = (options: FindOneOptions | FindOneAndReplaceOption = {}) => ({
	...options,
	projection: { ...options.projection, password: false }
});

const beforeWrite = (user: InternalUser) => validate(touch(user));

type UniqueFields = 'username' | 'email';

const findConflict = async (
	collection: UserCollection,
	self = '',
	fields: { [key in UniqueFields]: { value: any; error: string } }
) => {
	const existing: PartialInternalUser[] = await collection
		.find(
			{ $or: Object.entries(fields).map(([key, { value }]) => ({ [key]: value })), _id: { $ne: self } },
			{ projection: Object.keys(fields) }
		)
		.toArray();
	const fieldErrors: { [key in UniqueFields]?: string } = existing.reduce(
		(acc, current) =>
			Object.assign(
				{},
				...Object.entries(fields).map(([key, { value, error }]) => {
					if (key === 'email' || key === 'username') {
						return { [key]: acc[key] || value === current[key] ? error : undefined };
					}
				})
			),
		<{ [key in UniqueFields]?: string }>{}
	);
	return fieldErrors;
};

const defaults = (user: Omit<InternalUser, 'settings'> & { settings: Partial<InternalSettings> }): InternalUser => {
	const copy = { ...user };
	if (!copy.settings) {
		copy.settings = {};
	}
	if (!copy.settings.locale) {
		copy.settings.locale = 'en';
	}
	return <InternalUser>copy;
};

const noop = () => {};

const UserRepository = {
	findUser: async (collection: UserCollection, id: ID) => {
		const result = await collection.findOne({ _id: id }, hidePassword());
		return toExternal(result);
	},
	findMinimalUser: async (collection: UserCollection, id: ID) => {
		const result = await collection.findOne({ _id: id }, hidePassword({ projection: { _id: 1 } }));
		return toExternal(result);
	},
	findUserByUsername: async (collection: UserCollection, username: string) => {
		const result = await collection.findOne({ username }, hidePassword());
		return toExternal(result);
	},
	findAllUsers: async (collection: UserCollection) => {
		const result = await collection.find({}, hidePassword()).toArray();
		return result.map(toExternal);
	},
	createUser: async (collection: UserCollection, user: User, auth: Authorizer<User> = noop) => {
		try {
			await auth(user);
		} catch (error) {
			throw error;
		}
		const userDocument = beforeWrite(defaults(generateId(toInternal(user))));
		try {
			await collection.insertOne(userDocument);
			return toExternal(userDocument);
		} catch (error) {
			if (MongoError.isConflict(error)) {
				const fieldErrors = await findConflict(collection, undefined, {
					username: {
						value: userDocument.username,
						error: ErrorCodes.USERNAME_IN_USE
					},
					email: {
						value: userDocument.email,
						error: ErrorCodes.EMAIL_IN_USE
					}
				});
				throw InputError.conflict('Username or email already in use', fieldErrors);
			}
			throw error;
		}
	},
	updateUser: async (
		collection: UserCollection,
		id: ID,
		userUpdate: Partial<User>,
		auth: Authorizer<User> = noop
	) => {
		let userDocument;
		try {
			const dbUser = await collection.findOne({ _id: id });
			if (!dbUser) {
				throw InputError.notFound('User does not exist', ErrorCodes.USER_NOT_FOUND);
			}
			await auth(toExternal(dbUser));
			const sanitizedUpdate = toInternal(sanitizeUpdate(userUpdate));
			const updatedUser = applyUpdate(dbUser, sanitizedUpdate);
			updatedUser.password = dbUser.password;
			userDocument = beforeWrite(updatedUser);
			const result = await collection.findOneAndReplace(
				{ _id: id },
				userDocument,
				hidePassword({ returnOriginal: false })
			);
			return toExternal(result.value);
		} catch (error) {
			if (MongoError.isConflict(error) && userDocument) {
				const fieldErrors = await findConflict(collection, id, {
					username: {
						value: userDocument.username,
						error: ErrorCodes.USERNAME_IN_USE
					},
					email: {
						value: userDocument.email,
						error: ErrorCodes.EMAIL_IN_USE
					}
				});
				throw InputError.conflict('Username or email already in use', fieldErrors);
			}
			throw error;
		}
	},
	updateSettings: async (
		collection: UserCollection,
		id: ID,
		settingsUpdate: Partial<UserSettings>,
		auth: Authorizer<User> = noop
	) => {
		try {
			const dbUser = await collection.findOne({ _id: id });
			if (!dbUser) {
				throw InputError.notFound('User does not exist', ErrorCodes.USER_NOT_FOUND);
			}
			await auth(toExternal(dbUser));
			const updatedSettings = validateSettings({
				...dbUser.settings,
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
			throw error;
		}
	},
	deleteUser: async (collection: UserCollection, id: ID, auth: Authorizer<User> = noop) => {
		const dbUser = await collection.findOne({ _id: id });
		if (!dbUser) {
			throw InputError.notFound('User does not exist', ErrorCodes.USER_NOT_FOUND);
		}
		await auth(toExternal(dbUser));

		const { result } = await collection.deleteOne({ _id: id });
		if (result.n === 1) {
			return true;
		}
		throw InputError.notFound('User does not exist', ErrorCodes.USER_NOT_FOUND);
	},
	getPassword: async (collection: UserCollection, username: string) => {
		const result = await collection.findOne({ username }, { projection: { password: true } });
		if (!result) {
			throw InputError.notFound('User does not exist', ErrorCodes.USER_NOT_FOUND);
		}
		return result.password;
	},
	updatePassword: async (collection: UserCollection, id: ID, password: string, auth: Authorizer<User> = noop) => {
		const dbUser = await collection.findOne({ _id: id });
		if (!dbUser) {
			throw InputError.notFound('User does not exist', ErrorCodes.USER_NOT_FOUND);
		}
		await auth(toExternal(dbUser));
		const userDocument = beforeWrite(applyUpdate(dbUser, { password }));
		const { result } = await collection.replaceOne({ _id: id }, userDocument, hidePassword());
		return result.nModified === 1;
	}
};

export const createUserRepository = (collection: UserCollection): UserRepository => {
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
	collection.updateMany({ scope: { $exists: false } }, { $set: { scope: { id: 'root' } } });
	return Object.entries(UserRepository).reduce(
		(obj, [name, func]) => ({
			...obj,
			[name]: InternalError.catchUnexpected((...args: any[]) => func(collection, args[0], args[1], args[2]))
		}),
		{}
	) as UserRepository;
};
