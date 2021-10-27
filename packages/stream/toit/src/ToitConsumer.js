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
const ToitConnector = require('./ToitConnector');
const toitSubscribe = require("@toit/api/src/toit/api/pubsub/subscribe_grpc_pb");
const toitSubscribeModel = require("@toit/api/src/toit/api/pubsub/subscribe_pb");
const grpc = require("@grpc/grpc-js")

module.exports = class ToitConsumer extends sdk.ConsumerMixin(ToitConnector) {
	constructor(config) {
		super({ ...config, type: sdk.Connector.TYPE.CONSUMER });
		this._client = null;
		this._subscription = null;
	}

	registerDefaultListeners() {
		super.registerDefaultListeners();
	}

	get client() {
		return this._client;
	}

	async initialize() {
		this._client = new toitSubscribe.SubscribeClient("", null, { channelOverride: this._channel });
		this._subscription = await this.createSubscription();
		this.startListening();
	}

	startListening() {
		let subscription = this._subscription;
		let streamRequest = new toitSubscribeModel.StreamRequest();
		streamRequest.setSubscription(subscription);
		let stream = this.client.stream(streamRequest);
		stream.on('data', (e) => {
			let toAcknowledge = [];
			try {
				let messages = e.getMessagesList();
				for (let envelope of messages) {
					toAcknowledge.push(envelope.getId());
					let msg = envelope.getMessage();
					let createdAt = msg.getCreatedAt().toDate();
					let data = Buffer.from(msg.getData(),  "utf-8");
					let decoded = JSON.parse(data);
					this.onMessage(this.config.topic, {
						"data": decoded,
						"createdAt": createdAt,
					})
				}
			} finally {
				let ackRequest = new toitSubscribeModel.AcknowledgeRequest();
				ackRequest.setSubscription(subscription);
				ackRequest.setEnvelopeIdsList(toAcknowledge);
				this.client.acknowledge(ackRequest, (err) => {
					if (err) {
						// TODO(florian): this could also be a 'handleError'.
						this.handleWarning(err);
					}
				});
			}
		});
		stream.on('error', (err) => {
			console.log(err);
			if (err.code == grpc.status.INTERNAL) {
				// TODO(florian): there is a case when the connection to the
				// server is cut. We should just reestablish the connection in
				// that case.
				// Not 100% sure it's this internal error here...
				console.log("Hitting internal error.");
			}
			this.handleError(err);
		});
		stream.on('end', (status) => {
			this.onClose();
		});
	}

	createSubscription() {
		let topic = this.config.topic;
		let name = "streamsheets-" + Math.floor(Math.random() * 1000000000);
		let subscription = new toitSubscribeModel.Subscription();
		subscription.setTopic(topic);
		subscription.setName(name);
		let request = new toitSubscribeModel.CreateSubscriptionRequest();
		request.setSubscription(subscription);
		return new Promise((res, rej) => {
			this.client.createSubscription(request, (err) => {
				if (err) {
					this.handleError(err);
					return rej(err);
				}
				return res(subscription);
			});
		});
	}

	deleteSubscription(subscription) {
		let request = new toitSubscribeModel.DeleteSubscriptionRequest();
		request.setSubscription(subscription);
		return new Promise((res, rej) => {
			this.client.deleteSubscription(request, (err) => {
				if (err) {
					this.handleWarning(err);
					return rej(err);
				}
				return res(err);
			});
		});
	}

	async dispose() {
		if (this._subscription) {
			let sub = this._subscription;
			this._subscription = null;
			await this.deleteSubscription(sub);
		}
		this._client = null;
		super.dispose();
	}
};
