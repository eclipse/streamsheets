const InternalError = require('./InternalError');

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

const resolvers = {
	Query: {
		me: async (obj, args, { repositories, session }) => repositories.userRepository.findUser(session.user.id),
		machines: async (obj, args, context) => context.repositories.machineRepository.getMachines(),
		user: async (obj, { id }, { repositories }) => repositories.userRepository.findUser(id),
		users: async (obj, args, { repositories }) => repositories.userRepository.findAllUsers(),
		streams: async (obj, args, { repositories, session }) => repositories.streamRepository.findAllStreams(session)
	},
	Mutation: {
		createUser: async (obj, { user }, { repositories, encryption }) => {
			try {
				const hashedPassword = await encryption.hash(user.password);
				const createdUser = await repositories.userRepository.createUser({ ...user, password: hashedPassword });
				return Payload.createSuccess({
					code: 'USER_CREATED',
					message: 'User created successfully',
					user: createdUser
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		updateUser: async (obj, { id, user }, { repositories }) => {
			try {
				const updatedUser = await repositories.userRepository.updateUser(id, user);
				return Payload.createSuccess({
					code: 'USER_UPDATED',
					message: 'User updated successfully',
					user: updatedUser
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		updateUserPassword: async (obj, { id, newPassword }, { repositories, encryption }) => {
			try {
				const hashedPassword = await encryption.hash(newPassword);
				await repositories.userRepository.updatePassword(id, hashedPassword);
				return Payload.createSuccess({
					code: 'PASSWORD_UPDATED',
					message: 'Password updated successfully'
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		updateUserSettings: async (obj, { id, settings }, { repositories }) => {
			try {
				const updatedUser = await repositories.userRepository.updateSettings(id, settings);
				return Payload.createSuccess({
					code: 'SETTINGS_UPDATED',
					message: 'Settings updated successfully',
					user: updatedUser
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		},
		deleteUser: async (obj, { id }, { repositories }) => {
			try {
				await repositories.userRepository.deleteUser(id);
				return Payload.createSuccess({
					code: 'USER_DELETED',
					message: 'User deleted successfully'
				});
			} catch (error) {
				return Payload.createFailure(error);
			}
		}
	}
};

module.exports = { resolvers };
