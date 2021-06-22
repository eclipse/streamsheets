const { WebhookServerApi } = require('./src/WebhookServerApi');
const { WebhookServerRepository } = require('./src/WebhookServerRepository');
const { typeDefs, resolvers } = require('./src/WebhookServerGraphQL');
const WebhookServerMiddleware = require('./src/WebhookServerMiddleware');	
const { PLUGIN_ID } = require('./src/WebhookServer');

const apply = async (globalContext) => {
	Object.assign(globalContext.machineRepo, WebhookServerRepository)
	return {
		...globalContext,
		rawApi: {
			...globalContext.rawApi,
			machine: {
				...globalContext.rawApi.machine,
				...WebhookServerApi
			}
		},
		middleware: {
			...globalContext.middleware,
			[PLUGIN_ID]: [WebhookServerMiddleware.init(globalContext)]
		},
		graphql: {
			...globalContext.graphql,
			[PLUGIN_ID]: {
				typeDefs,
				resolvers
			}
		}
	};
};

module.exports = {
	apply
};
