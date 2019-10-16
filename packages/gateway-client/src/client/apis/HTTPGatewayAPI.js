'use strict';

const GatewayAPI = require('./GatewayAPI');
const {
	BackupHTTPRequest,
	DeleteGraphHTTPRequest,
	DeleteMachineDefinitionHTTPRequest,
	ExportMachineStreamHTTPRequest,
	GetGraphHTTPRequest,
	GetGraphsHTTPRequest,
	GetMachineDefinitionHTTPRequest,
	GetMachineDefinitionsHTTPRequest,
	GetMachineDefinitionsByNameHTTPRequest,
	GetMetaInformationHTTPRequest,
	GetTemplateHTTPRequest,
	GetTemplatesHTTPRequest,
	GraphQLHTTPRequest,
	ImportMachineHTTPRequest,
	RestoreHTTPRequest,
	SaveGraphHTTPRequest,
	SaveMachineDefinitionHTTPRequest,
	SaveTemplateHTTPRequest,
	UpdateGraphHTTPRequest,
	UpdateMachineDefinitionHTTPRequest,
	SaveConfigurationHTTPRequest,
	GetAllConfigurationsHTTPRequest,
	GetConfigurationsByTypeHTTPRequest,
	GetConfigurationByIdHTTPRequest,
	DeleteConfigurationByIdHTTPRequest,
	SaveMachineProcessSettingsHTTPRequest,
	GetMachineProcessSettingsHTTPRequest,
	AuthenticateHTTPRequest
} = require('../../requests/http/HTTPRequests');

module.exports = class HTTPGatewayAPI extends GatewayAPI {
	constructor(restEndpointURL, token, logger) {
		super(logger);
		this._restEndpointURL = restEndpointURL;
		this._token = token;
	}

	set token(token) {
		this._token = token;
	}

	/**
	 * ******************************************************************************************
	 * High Level API: REST API
	 * ******************************************************************************************
	 */

	authenticate(authRequest) {
		return this.sendRequest(
			new AuthenticateHTTPRequest(this._restEndpointURL, authRequest)
		);
	}

	getMetaInformation() {
		return this.sendRequest(
			new GetMetaInformationHTTPRequest(
				this._restEndpointURL,
				this._token
			)
		);
	}

	saveConfiguration(configuration) {
		return this.sendRequest(
			new SaveConfigurationHTTPRequest(
				this._restEndpointURL,
				this._token,
				configuration
			)
		);
	}

	getAllConfigurations() {
		return this.sendRequest(
			new GetAllConfigurationsHTTPRequest(
				this._restEndpointURL,
				this._token
			)
		);
	}

	getConfigurationsByType(configType) {
		return this.sendRequest(
			new GetConfigurationsByTypeHTTPRequest(
				this._restEndpointURL,
				this._token,
				configType
			)
		);
	}

	getConfigurationById(configId) {
		return this.sendRequest(
			new GetConfigurationByIdHTTPRequest(
				this._restEndpointURL,
				this._token,
				configId
			)
		);
	}

	deleteConfigurationById(configId) {
		return this.sendRequest(
			new DeleteConfigurationByIdHTTPRequest(
				this._restEndpointURL,
				this._token,
				configId
			)
		);
	}

	saveMachineProcessSettings(settings) {
		return this.sendRequest(
			new SaveMachineProcessSettingsHTTPRequest(
				this._restEndpointURL,
				this._token,
				settings
			)
		);
	}

	getMachineProcessSettings(machineId) {
		return this.sendRequest(
			new GetMachineProcessSettingsHTTPRequest(
				this._restEndpointURL,
				this._token,
				machineId
			)
		);
	}

	getMachineDefinitions(query) {
		if (query) {
			return this.sendRequest(
				new GraphQLHTTPRequest(
					this._restEndpointURL,
					this._token,
					query
				)
			).then((result) => result.machines);
		}
		return this.sendRequest(
			new GetMachineDefinitionsHTTPRequest(
				this._restEndpointURL,
				this._token
			)
		);
	}

	graphql(query, variables) {
		return this.sendRequest(
			new GraphQLHTTPRequest(
				this._restEndpointURL,
				this._token,
				query,
				variables
			)
		);
	}

	getMachineDefinitionsByName(name) {
		return this.sendRequest(
			new GetMachineDefinitionsByNameHTTPRequest(
				this._restEndpointURL,
				this._token,
				name
			)
		);
	}

	getTemplate(templateId) {
		return this.sendRequest(
			new GetTemplateHTTPRequest(
				this._restEndpointURL,
				this._token,
				templateId
			)
		);
	}

	saveTemplate(template) {
		return this.sendRequest(
			new SaveTemplateHTTPRequest(
				this._restEndpointURL,
				this._token,
				template
			)
		);
	}

	getTemplates() {
		return this.sendRequest(
			new GetTemplatesHTTPRequest(this._restEndpointURL, this._token)
		);
	}

	getMachineDefinition(machineId) {
		return this.sendRequest(
			new GetMachineDefinitionHTTPRequest(
				this._restEndpointURL,
				this._token,
				machineId
			)
		);
	}

	saveMachineDefinition(machineDefinition) {
		return this.sendRequest(
			new SaveMachineDefinitionHTTPRequest(
				this._restEndpointURL,
				this._token,
				machineDefinition
			)
		);
	}

	updateMachineDefinition(machineId, machine) {
		return this.sendRequest(
			new UpdateMachineDefinitionHTTPRequest(
				this._restEndpointURL,
				this._token,
				machineId,
				machine
			)
		);
	}

	deleteMachineDefinition(machineId) {
		return this.sendRequest(
			new DeleteMachineDefinitionHTTPRequest(
				this._restEndpointURL,
				this._token,
				machineId
			)
		);
	}

	exportMachine(machineIds, streamIds) {
		return this.sendRequest(
			new ExportMachineStreamHTTPRequest(
				this._restEndpointURL,
				this._token,
				machineIds,
				streamIds
			)
		);
	}

	importMachine(importData, importAsNew) {
		return this.sendRequest(
			new ImportMachineHTTPRequest(
				this._restEndpointURL,
				this._token,
				importData,
				importAsNew
			)
		);
	}

	backup() {
		return this.sendRequest(
			new BackupHTTPRequest(this._restEndpointURL, this._token)
		);
	}

	restore(file) {
		return this.sendRequest(
			new RestoreHTTPRequest(this._restEndpointURL, this._token, file)
		);
	}

	getGraphs() {
		return this.sendRequest(
			new GetGraphsHTTPRequest(this._restEndpointURL, this._token)
		);
	}

	getGraph(graphId) {
		return this.sendRequest(
			new GetGraphHTTPRequest(this._restEndpointURL, this._token, graphId)
		);
	}

	saveGraph(graph) {
		return this.sendRequest(
			new SaveGraphHTTPRequest(this._restEndpointURL, this._token, graph)
		);
	}

	updateGraph(graphId, graph) {
		return this.sendRequest(
			new UpdateGraphHTTPRequest(
				this._restEndpointURL,
				this._token,
				graphId,
				graph
			)
		);
	}

	deleteGraph(graphId) {
		return this.sendRequest(
			new DeleteGraphHTTPRequest(
				this._restEndpointURL,
				this._token,
				graphId
			)
		);
	}

	/**
	 * ******************************************************************************************
	 * Low Level API
	 * ******************************************************************************************
	 */

	sendRequest(request) {
		/* eslint-disable */
		this.logger.debug('Sending request to Gateway', request);
		return request
			.send()
			.then((response) => {
				this.logger.debug('Got response from Gateway', response);
				if (request instanceof GraphQLHTTPRequest) {
					if (response.errors) {
						const error = {
							message: 'GraphQL Error',
							errors: response.errors
						};
						throw error;
					}
					return response.data;
				}
				return response;
			})
			.catch((error) => {
				this.logger.error(
					'Sending request to Gateway',
					request._getPath()
				);
				this.logger.error(
					'Sending request to Gateway',
					request._getConfig()
				);
				this.logger.error(
					`Error while communicating with Gateway while executing request '${
						request.constructor.name
					}'`,
					error
				);
				throw error;
			});
		/* eslint-enable */
	}
};
