const sdk = require('@cedalo/sdk-streams');

module.exports = class MqttProviderConfiguration extends sdk.ProviderConfiguration {
	constructor() {
		super({
			name: 'AMPQ Provider',
		});

		// connector
		this.addConnectorDefinition({
			id: 'protocolVersion',
			label: 'AMPQ Protocol Version',
			type: sdk.ProviderConfiguration.FIELDTYPES.SELECT_NUM,
			options: [
				{
					label: '0-9-1',
					value: '0.9.1',
				}
			],
			defaultValue: '0.9.1',
			helperText: '0-9-1 (Default for RabbitMQ)',
			advanced: true,
		});
		this.addConnectorDefinition({
			id: 'uri',
			label: 'AMPQ URI',
			defaultValue: 'amqp://streamuser:streampass@localhost:5672/streamshost', //'amqp://username:password@localhost/myvhost',
			helperText: 'starting with protocol amqp:// or amqps://. For auth use amqp://guest:guest@localhost:5672/vhost?query https://www.rabbitmq.com/uri-spec.html'
		});
		// consumer
		this.addConsumerDefinition({
			id: 'queue',
			label: 'Queue',
			defaultValue: 'queueName',
		});
		this.addConsumerDefinition({
			id: 'assertQueue',
			label: 'Assert queue before consuming',
			type: sdk.ProviderConfiguration.FIELDTYPES.CHECKBOX,
			defaultValue: false,
		});
		this.addConsumerDefinition({
			id: 'noAck',
			label: 'Do not send message acknowledgement',
			type: sdk.ProviderConfiguration.FIELDTYPES.CHECKBOX,
			defaultValue: false,
		});
		this.addConsumerDefinition({
			id: 'exclusive',
			label: 'Make queue exclusive while asserting - if does not exist already',
			type: sdk.ProviderConfiguration.FIELDTYPES.CHECKBOX,
			defaultValue: false,
		});
		this.addConnectorDefinition({
			id: 'connectionID',
			label: 'Connection ID. ',
			defaultValue: '',
			helperText: 'Leave empty if you do not want to share / reuse',
			advanced: true
		});
		this.addConnectorDefinition({
			id: 'channelID',
			label: 'Channel ID. ',
			defaultValue: '',
			helperText: 'Leave empty if you do not want to share / reuse',
			advanced: true
		});

		// producer
		this.addProducerDefinition({
			id: 'exchangeName',
			label: {
				en: 'Exchange Name',
			},
			defaultValue: '',
		});
		this.addProducerDefinition({
			id: 'exchangeType',
			label: {
				en: 'Exchange Type',
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.SELECT_NUM,
			options: [
				{
					label: 'fanout',
					value: 'fanout',
				},
				{
					label: 'headers',
					value: 'headers',
				},
				{
					label: 'direct',
					value: 'direct',
				},
				{
					label: 'topic',
					value: 'topic',
				},
			],
			defaultValue: 'topic',
		});
		this.addProducerDefinition({
			id: 'routingKey',
			label: {
				en: 'Routing Key',
			},
			defaultValue: '',
			helperText: 'For Direct queue leave exchange empty and set queue as routing key',
		});
		this.addConnectorDefinition({
			id: 'properties',
			label: {
				en: 'Properties',
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.MULTITEXTFIELDPAIRS,
			advanced: true,
			helperText: 'content_type, content_encoding, priority, correlation_id, reply_to, expiration, message_id, timestamp, type, user_id, app_id, cluster_id',
			defaultValue: undefined,
		});
		this.addConnectorDefinition({
			id: 'headers',
			label: {
				en: 'Headers',
			},
			type: sdk.ProviderConfiguration.FIELDTYPES.MULTITEXTFIELDPAIRS,
			advanced: true,
			defaultValue: undefined,
		});

		// functions
		const functionDefinition = {
			name: 'AMPQ.PUBLISH',
			displayName: true,
			baseFunction: 'produce',
			parameters: [
				{
					id: 'message',
					label: {
						en: 'Message',
						de: 'Nachricht',
					},
					description: '',
					type: {
						name: 'union',
						types: [
							{name: 'json'},
							{name: 'number'},
							{name: 'string'},
						],
					},
				},
				{
					id: 'exchangeName',
					label: {
						en: 'Exchange Name',
					},
					description: '',
					type: {
						name: 'union',
						types: [
							{name: 'string'},
						],
					},
					optional: true,
				},
				{
					id: 'routingKey',
					label: {
						en: 'Routing Key',
					},
					description: '',
					type: {
						name: 'union',
						types: [
							{name: 'string'},
						],
					},
				},
				{
					id: 'properties',
					label: {
						en: 'Properties',
						de: 'User Properties',
					},
					description: '',
					type: {
						name: 'union',
						types: [
							{name: 'json'},
						],
					},
					optional: true,
				},
			],
		};
		this.addFunctionDefinition(functionDefinition);
	}
};
