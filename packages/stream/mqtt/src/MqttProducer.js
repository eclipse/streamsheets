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
const sdk = require('@cedalo/sdk-streams');
const MqttConnector = require('./MqttConnector');
const Utils = require('./Utils');

module.exports = class MqttProducer extends sdk.ProducerMixin(MqttConnector) {
	constructor(config) {
		super({ ...config, type: sdk.Connector.TYPE.PRODUCER });
	}

	async produce(config) {
		const {
			topic,
			message,
			userProperties,
			qos = this.config.connector.qos || 0,
			retain = this.config.connector.retain || false,
			dup = false
		} = config;
		const finalTopic = Utils.getProducerTopic(topic, this.config);
		const {errors, warnings} = Utils.validateTopicForProduce(finalTopic);
		if(warnings.length>0) {
			this.handleWarningOnce(new Error(warnings[0]));
		}
		if(errors.length>0) {
			this.handleWarningOnce(new Error(errors[0]));
		}
		if(!this.connected) {
			this.handleErrorOnce(
					new Error('Cannot publish as client is not connected yet')
			);
		}
		if (this.connected && errors.length<1) {
			return new Promise((res, rej) => {
				const options = {
					qos,
					retain,
					dup,
					properties: {}
				};
				if(this.hasUserProperties(this.config.userPropertiesProduce)) {
					options.properties.userProperties = this.config.userPropertiesProduce;
				}
				if(this.hasUserProperties(userProperties)) {
					options.properties.userProperties = {
						...options.properties.userProperties,
						...userProperties
					};
				}
				const msg =
					typeof message === 'string'
						? message
						: JSON.stringify(message);
				try {
					this.client.publish(finalTopic, msg, options, (err) => {
						if (err) {
							this.handleWarningOnce(err);
							return rej(err);
						}
						return res(err);
					});
				} catch (err) {
					this.handleErrorOnce(
						new Error(
							'Cannot publish as client is not connected yet'
						)
					);
					return rej(err);
				}
				return false;
			});
		}
		return false;
	}

	async request(/* config */) {
		// TODO: implement
		return true;
	}

};
