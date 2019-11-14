const { ProviderConfiguration } = require('@cedalo/sdk-streams');
const MongoDBFunctions = require('./MongoDBFunctions');

module.exports = class MongoDBProviderConfiguration extends ProviderConfiguration {
	constructor() {
		super({
			name: 'MongoDB Provider'
		});
		this.addConnectorDefinition({
			id: 'host',
			label: 'Host(s)',
			onUpdate: 'reConnect'
		});
		this.addConnectorDefinition({
			id: 'dbName',
			label: {
				en: 'Database Name',
				de: 'Datenbankname'
			},
			type: ProviderConfiguration.FIELDTYPES.TEXT
		});
		this.addConnectorDefinition({
			id: 'clusterName',
			label: 'ReplicaSet',
			advanced: true,
			onUpdate: 'reConnect',
		});
		this.addConnectorDefinition({
			id: 'authType',
			label: {
				en: 'Authentication Mechanism',
				de: 'Authentifizierungsmethode'
			},
			advanced: true,
			type: ProviderConfiguration.FIELDTYPES.SELECT,
			options: [
				{
					label: 'DEFAULT',
					value: 'DEFAULT'
				},
				{
					label: 'SCRAM-SHA-1',
					value: 'SCRAM-SHA-1'
				},
				{
					label: 'GSSAPI',
					value: 'GSSAPI'
				},
				{
					label: 'PLAIN',
					value: 'PLAIN'
				},
				{
					label: 'MONGODB-X509',
					value: 'MONGODB-X509'
				},
				{
					label: 'MONGODB-CR',
					value: 'MONGODB-CR'
				}
			],
			defaultValue: 'DEFAULT',
			onUpdate: 'reConnect'
		});
		this.addConnectorDefinition({
			id: 'userName',
			label: {
				en: 'User Name',
				de: 'Benutzername'
			},
			advanced: true,
			onUpdate: 'reConnect',
		});
		this.addConnectorDefinition({
			id: 'password',
			label: {
				en: 'Password',
				de: 'Kennwort'
			},
			advanced: true,
			onUpdate: 'reConnect',
			type: ProviderConfiguration.FIELDTYPES.PASSWORD
		});

		this.addConsumerDefinition({
			id: 'collections',
			label: 'Collections',
			type: ProviderConfiguration.FIELDTYPES.TEXTLIST
		});
		this.addProducerDefinition({
			id: 'collection',
			label: {
				en: 'Collection Name',
				de: 'Kollektioname'
			},
			type: ProviderConfiguration.FIELDTYPES.TEXT
		});

		this.addFunctionDefinition(
			this.requestFunction((target, resultKeys, timeout) => ({
				name: MongoDBFunctions.DELETE,
				baseFunction: 'request',
				parameters: [
					{
						id: 'collection',
						label: 'Collection',
						type: {
							name: 'string'
						}
					},
					{
						id: 'query',
						label: 'Query',
						description: {
							en:
								'JSON used for the query. Use "{}" to delete all documents',
							de:
								'JSON das für Query benutzt wird. "{}" um alle Dokumente zu löschen'
						},
						type: {
							name: 'json'
						}
					},
					{ ...target, optional: true },
					timeout
				]
			}))
		);

		this.addFunctionDefinition(
			this.requestFunction((target, resultKeys, timeout) => ({
				name: MongoDBFunctions.QUERY,
				baseFunction: 'request',
				parameters: [
					{
						id: 'collection',
						label: 'Collection',
						type: {
							name: 'string'
						}
					},
					{
						id: 'query',
						label: 'Query',
						description: {
							en: 'JSON used for the query',
							de: 'JSON das für Query benutzt wird'
						},
						type: {
							name: 'json'
						},
						defaultValue: {}
					},
					target,
					{ ...resultKeys, forward: true },
					{
						id: 'pageSize',
						label: {
							en: 'Page Size',
							de: 'Seitengröße'
						},
						description: {
							en: 'Number of documents to return per page',
							de: 'Gewünschte Anzahl von Dokumenten pro Seite'
						},
						type: {
							name: 'integer'
						},
						defaultValue: 0
					},
					{
						id: 'page',
						label: {
							en: 'Page',
							de: 'Seite'
						},
						description: {
							en: 'Index of the page to return',
							de: 'Index der gewünschten Seite'
						},
						type: {
							name: 'integer'
						},
						defaultValue: 0
					},
					{
						id: 'sort',
						label: {
							en: 'Sort',
							de: 'Sortierung'
						},
						description: {
							en:
								'1 or -1 to sort by creation time or range with sort JSON',
							de:
								'1 oder -1 für zeitliche Sortierung oder Zellbereich der Sortierung vorgibt'
						},
						type: {
							name: 'union',
							types: [
								{ name: 'json' },
								{
									name: 'enum',
									values: ['-1', '1']
								}
							]
						},
						defaultValue: 1
					},
					timeout
				]
			}))
		);

		this.addFunctionDefinition(
			this.requestFunction((target, resultKeys, timeout) => ({
				name: MongoDBFunctions.AGGREGATE,
				baseFunction: 'request',
				parameters: [
					{
						id: 'collection',
						label: 'Collection',
						type: {
							name: 'string'
						}
					},
					{
						id: 'query',
						label: 'Aggregate JSON',
						type: {
							name: 'json'
						}
					},
					target,
					{ ...resultKeys },
					timeout
				]
			}))
		);

		this.addFunctionDefinition(
			this.requestFunction((target, resultKeys, timeout) => ({
				name: MongoDBFunctions.COUNT,
				baseFunction: 'request',
				parameters: [
					{
						id: 'collection',
						label: 'Collection',
						type: {
							name: 'string'
						}
					},
					{
						id: 'query',
						label: 'Query',
						description: {
							en: 'JSON used for the query',
							de: 'JSON das für Query benutzt wird'
						},
						type: {
							name: 'json'
						}
					},
					target,
					timeout
				]
			}))
		);

		this.addFunctionDefinition({
			name: 'MONGO.STORE',
			baseFunction: 'produce',
			parameters: [
				{
					id: 'collection',
					label: 'Collection',
					type: {
						name: 'string'
					}
				},
				{
					id: 'message',
					label: {
						en: 'Document',
						de: 'Dokument'
					},
					type: {
						name: 'json'
					}
				}
			]
		});
	}
};
