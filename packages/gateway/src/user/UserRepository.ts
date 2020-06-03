/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import {
	applyUpdate,
	Authorizer,
	ErrorCodes,
	generateId,
	ID,
	InputError,
	InternalError,
	MongoError,
	PropType,
	touch,
	User,
	UserSettings
} from '@cedalo/gateway';
import { Collection, FindOneAndReplaceOption, FindOneOptions } from 'mongodb';

export interface NewUser extends User {
	password: string;
}

export type UserFromRepo = Required<Pick<User, 'settings' | 'lastModified'>> & User;

export interface UserRepository {
	findUser(id: ID): Promise<UserFromRepo | null>;
	findUserByUsername(username: string): Promise<UserFromRepo | null>;
	findAllUsers(): Promise<Array<UserFromRepo>>;
	createUser(user: User & { password: string }): Promise<UserFromRepo>;
	deleteUser(id: ID): Promise<boolean>;
	getPassword(username: string): Promise<string>;
	updatePassword(id: ID, password: string): Promise<boolean>;
	updateSettings(id: ID, settingsUpdate: Partial<UserSettings>): Promise<UserFromRepo>;
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
	if (user.password !== undefined) {
		internal.password = user.password;
	}
	if (user.settings !== undefined) {
		internal.settings = toInternalSettings(user.settings);
	}
	return internal;
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
	const { username, password } = user;
	const errors = {
		username: !username ? ErrorCodes.USERNAME_INVALID : undefined,
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
		const userDocument = beforeWrite(defaults(generateId(toInternal(user)) as InternalUser));
		try {
			await collection.insertOne(userDocument);
			return toExternal(userDocument);
		} catch (error) {
			if (MongoError.isConflict(error)) {
				const fieldErrors = {
					username: ErrorCodes.USERNAME_IN_USE
				};
				throw InputError.conflict('Username already in use', fieldErrors);
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
		}
	]);
	collection.dropIndex('email').catch(() => {});
	collection.updateMany({ scopes: { $exists: false } }, { $set: { scopes: [{ id: 'root', role: 'developer' }] } });
	return Object.entries(UserRepository).reduce(
		(obj, [name, func]) => ({
			...obj,
			[name]: InternalError.catchUnexpected((...args: any[]) => func(collection, args[0], args[1], args[2]))
		}),
		{}
	) as UserRepository;
};
