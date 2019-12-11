const { InternalError } = require('./errors');
const { UserAuth } = require('./apis');

const INTERNAL_ERROR_PAYLOAD = {
	success: false,
	code: 'INTERNAL_ERROR',
	message: 'An internal server error occured'
};

const Payload = {
	createFailure: (error) => {
		if (InternalError.isInternal(error)) {
			return INTERNAL_ERROR_PAYLOAD;
		}
		return { ...error, success: false };
	},
	createSuccess: (payload) => ({ ...payload, success: true })
};

// const currentUser = async ({ repositories, session }) => repositories.userRepository.findUser(session.user.id);

const resolvers = {
	Query: {
		me: async (obj, args, { actor }) => actor,
		machines: async (obj, args, context) => context.repositories.machineRepository.getMachines(),
		user: async (obj, { id }, { apis }) => {
			try {
				return apis.user.findUser(id);
			} catch (error) {
				return null;
			}
		},
		users: async (obj, args, { apis }) => apis.user.findAllUsers(),
		streams: async (obj, args, { repositories, session }) => repositories.streamRepository.findAllStreams(session)
	},
	Mutation: {
		createUser: async (obj, { user }, { apis, encryption }) => {
			try {
				const hashedPassword = await encryption.hash(user.password);
				const createdUser = await apis.user.createUser({ ...user, password: hashedPassword });
				return Payload.createSuccess({
					code: 'USER_CREATED',
					message: 'User created successfully',
					user: createdUser
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		updateUser: async (obj, { id, user }, { apis }) => {
			try {
				const updatedUser = await apis.user.updateUser(id, user);
				return Payload.createSuccess({
					code: 'USER_UPDATED',
					message: 'User updated successfully',
					user: updatedUser
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		updateUserPassword: async (obj, { id, newPassword }, { apis, encryption }) => {
			try {
				const hashedPassword = await encryption.hash(newPassword);
				await apis.user.updatePassword(id, hashedPassword);
				return Payload.createSuccess({
					code: 'PASSWORD_UPDATED',
					message: 'Password updated successfully'
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		updateUserSettings: async (obj, { id, settings }, { apis }) => {
			try {
				const updatedUser = await apis.user.updateSettings(id, settings);
				return Payload.createSuccess({
					code: 'SETTINGS_UPDATED',
					message: 'Settings updated successfully',
					user: updatedUser
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		deleteUser: async (obj, { id }, { apis }) => {
			try {
				await apis.user.deleteUser(id);
				return Payload.createSuccess({
					code: 'USER_DELETED',
					message: 'User deleted successfully'
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		}
	},
	User: {
		admin: async (obj) => UserAuth.isAdmin(obj),
		canDelete: async (obj, args, { actor }) => UserAuth.canDelete(actor, obj)
	}
};

module.exports = { resolvers };
