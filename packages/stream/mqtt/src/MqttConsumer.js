const sdk = require('@cedalo/sdk-streams');
const MqttConnector = require('./MqttConnector');
const Utils = require('./Utils');

module.exports = class MqttConsumer extends sdk.ConsumerMixin(MqttConnector) {
	constructor(config) {
		super({ ...config, type: sdk.Connector.TYPE.CONSUMER });
	}

	registerDefaultListeners() {
		super.registerDefaultListeners();
		this._client.on('message', (topic, message, packet) => {
			this.onMessage(topic, message, {
				userProperties: packet.properties ? packet.properties.userProperties : {}
			});
		});
	}

	get topics() {
		return Utils.getTopicsFromConfig(this.config);
	}

	async initialize() {
		let pass = true;
		this.topics.forEach((t) => {
			const {errors, warnings} = Utils.validateTopicForSubscribe(t);
			errors.forEach(e => {
				this.handleError(new Error(e));
			});
			warnings.forEach(w => {
				this.handleWarning(new Error(w));
			});
			pass = pass && errors.length<1;
		});
		if (pass){
			const options = {
				properties : {}
			};
			if(this.hasUserProperties(this.config.userPropertiesSubscribe)) {
				options.properties.userProperties = this.config.userPropertiesSubscribe;
			}
			return new Promise((res, rej) => {
				this.client.subscribe(this.topics, options, (err) => {
					if (err) {
						this.handleWarning(err);
						return rej(err);
					}
					return res(err);
				});
			});
		}
		return false;
	}

	async dispose() {
		if(this.client) {
			if(Array.isArray(this.topics) && this.topics.length >0) {
				this.client.unsubscribe(this.topics);
			}
		}
		return super.dispose();
	}
};
