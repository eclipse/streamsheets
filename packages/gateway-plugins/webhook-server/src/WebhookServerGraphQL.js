const { gql } = require('apollo-server-express');
const { InternalError } = require('@cedalo/gateway/out/src/errors');
const { getWebhookServer, getWebhookPath } = require('./WebhookServer');

// TODO: 	Copied from @cedalo/gateway/../resolvers
// 			Move to reusable package
/* ----------------------------------- */
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
/* ----------------------------------- */

module.exports = {
	typeDefs: gql`
		type WebhookServer {
			enabled: Boolean!
			id: ID
			streamsheetId: ID
			path: String
		}

		extend type Machine {
			webhookServer: WebhookServer!
		}

		type UpdateWebhookServerResult implements MutationResponse {
			success: Boolean!
			code: String!
			message: String!
			webhookServer: WebhookServer
		}

		input WebhookServerInput {
			enabled: Boolean
			streamsheetId: ID
		}

		extend type ScopedMutation {
			updateMachineWebhookServer(machineId: ID!, webhookServer: WebhookServerInput!): UpdateWebhookServerResult!
		}
	`,
	resolvers: {
		ScopedMutation: {
			updateMachineWebhookServer: async ({ scope }, { machineId, webhookServer }, { api }) => {
				try {
					await api.machine.updateWebhookServer(scope, machineId, webhookServer);
					return Payload.createSuccess({
						code: 'UPDATE_WEBHOOK_SERVER_SUCCESS',
						message: 'Webhook Server updated successfully',
						webhookServer: await api.machine.getWebhookServer(scope, machineId)
					});
				} catch (error) {
					return Payload.createFailure(error);
				}
			}
		},
		Machine: {
			webhookServer: async (obj) => ({
				...getWebhookServer(obj),
				path: getWebhookPath(obj)
			})
		}
	}
};
