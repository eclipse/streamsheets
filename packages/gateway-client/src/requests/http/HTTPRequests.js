'use strict';

const HTTPRequest = require('./HTTPRequest');

class AuthenticateHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, params) {
		super(baseEndpoint);
		this._params = params;
	}

	_getPath() {
		return '/login';
	}

	_getConfig() {
		return this._createPOSTConfig(
			{
				...this._params
			},
			{}
		);
	}
}

class GetMetaInformationHTTPRequest extends HTTPRequest {
	_getPath() {
		return '/meta';
	}

	_getConfig() {
		return this._createGETConfig({}, this._createAuthHeader(this._token));
	}
}

class GraphQLHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, query, variables) {
		super(baseEndpoint, token);
		this._query = query;
		this._variables = variables;
	}

	_getPath() {
		return '/graphql';
	}

	_getConfig() {
		return this._createPOSTConfig(
			{
				query: this._query,
				variables: this._variables
			},
			{},
			this._createAuthHeader(this._token)
		);
	}
}

class GetMachineDefinitionsHTTPRequest extends HTTPRequest {
	_getPath() {
		return '/machines';
	}

	_getConfig() {
		return this._createGETConfig({}, this._createAuthHeader(this._token));
	}
}

class GetMachineDefinitionsByNameHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, name) {
		super(baseEndpoint, token);
		this._name = name;
	}

	_getPath() {
		return '/machines';
	}

	_getConfig() {
		return this._createGETConfig({}, this._createAuthHeader(this._token));
	}

	_getQueryString() {
		return `?name=${this._name}`;
	}
}

class GetMachineDefinitionHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, machineId) {
		super(baseEndpoint, token);
		this._machineId = machineId;
	}

	_getPath() {
		return `/machines/${this._machineId}`;
	}

	_getConfig() {
		return this._createGETConfig({}, this._createAuthHeader(this._token));
	}
}

class ExportMachineStreamHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, machineIds, streamIds) {
		super(baseEndpoint, token);
		this._exportData = { machineIds, streamIds };
	}

	_getPath() {
		return '/export';
	}

	_getConfig() {
		return this._createPOSTConfig(
			this._exportData,
			{},
			this._createAuthHeader(this._token)
		);
	}
}

class ImportMachineHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, importData, importAsNew) {
		super(baseEndpoint, token);
		this._importData = importData;
		this._importData.importAsNew = importAsNew;
	}

	_getPath() {
		return '/import';
	}

	_getConfig() {
		return this._createPOSTConfig(
			this._importData,
			{},
			this._createAuthHeader(this._token)
		);
	}
}

class BackupHTTPRequest extends HTTPRequest {
	_getPath() {
		return '/backup';
	}

	_getConfig() {
		return this._createGETConfig(
			{
				responseType: 'blob'
			},
			this._createAuthHeader(this._token)
		);
	}
}

class RestoreHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, file) {
		super(baseEndpoint, token);
		this.formData = new FormData();
		this.formData.append('restoreData', file);
		console.log(this.formData.get('restoreData'));
	}

	_getPath() {
		return '/restore';
	}

	_getConfig() {
		return this._createPOSTConfig(
			this.formData,
			{},
			this._createAuthHeader(this._token)
		);
	}

	_getDefaultHeaders() {
		return {
			Accept: 'application/json'
		};
	}

	_setBodyToPayloadConfig(payloadConfig, body) {
		// don't serialize to JSON because it is form data
		payloadConfig.body = body;
	}
}

class SaveMachineDefinitionHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, machineDefinition) {
		super(baseEndpoint, token);
		this._machineDefinition = machineDefinition;
	}

	_getPath() {
		return '/machines';
	}

	_getConfig() {
		return this._createPOSTConfig(
			this._machineDefinition,
			{},
			this._createAuthHeader(this._token)
		);
	}
}

class UpdateMachineDefinitionHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, machineId, machine) {
		super(baseEndpoint, token);
		this._machineId = machineId;
		this._machine = machine;
	}

	_getPath() {
		return `/machines/${this._machineId}`;
	}

	_getConfig() {
		return this._createPUTConfig(
			this._machine,
			this._createAuthHeader(this._token)
		);
	}
}

class DeleteMachineDefinitionHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, machineId) {
		super(baseEndpoint, token);
		this._machineId = machineId;
	}

	_getPath() {
		return `/machines/${this._machineId}`;
	}

	_getConfig() {
		return this._createDELETEConfig(
			{},
			this._createAuthHeader(this._token)
		);
	}
}

class GetGraphsHTTPRequest extends HTTPRequest {
	_getPath() {
		return '/graphs';
	}

	_getConfig() {
		return this._createGETConfig({}, this._createAuthHeader(this._token));
	}
}

class GetGraphHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, graphId) {
		super(baseEndpoint, token);
		this._graphId = graphId;
	}

	_getPath() {
		return `/graphs/${this._graphId}`;
	}

	_getConfig() {
		return this._createGETConfig({}, this._createAuthHeader(this._token));
	}
}

class SaveGraphHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, graph) {
		super(baseEndpoint, token);
		this._graph = graph;
	}

	_getPath() {
		return '/graphs';
	}

	_getConfig() {
		return this._createPOSTConfig(
			this._graph,
			{},
			this._createAuthHeader(this._token)
		);
	}
}

class UpdateGraphHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, graphId, graph) {
		super(baseEndpoint, token);
		this._graphId = graphId;
		this._graph = graph;
	}

	_getPath() {
		return `/graphs/${this._graphId}`;
	}

	_getConfig() {
		return this._createPUTConfig(
			this._graph,
			this._createAuthHeader(this._token)
		);
	}
}

class DeleteGraphHTTPRequest extends HTTPRequest {
	constructor(baseEndpoint, token, graphId) {
		super(baseEndpoint, token);
		this._graphId = graphId;
	}

	_getPath() {
		return `/graphs/${this._graphId}`;
	}

	_getConfig() {
		return this._createDELETEConfig(
			{},
			this._createAuthHeader(this._token)
		);
	}
}

module.exports = {
	BackupHTTPRequest,
	AuthenticateHTTPRequest,
	DeleteGraphHTTPRequest,
	DeleteMachineDefinitionHTTPRequest,
	ExportMachineStreamHTTPRequest,
	GetGraphHTTPRequest,
	GetGraphsHTTPRequest,
	GetMachineDefinitionHTTPRequest,
	GetMachineDefinitionsHTTPRequest,
	GetMachineDefinitionsByNameHTTPRequest,
	GetMetaInformationHTTPRequest,
	GraphQLHTTPRequest,
	ImportMachineHTTPRequest,
	RestoreHTTPRequest,
	SaveGraphHTTPRequest,
	SaveMachineDefinitionHTTPRequest,
	UpdateGraphHTTPRequest,
	UpdateMachineDefinitionHTTPRequest
};
