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
const { serialnumber: { ms2serial } } = require('@cedalo/commons');

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
		const subscription = this._subscription;
		const streamRequest = new toitSubscribeModel.StreamRequest();
		streamRequest.setSubscription(subscription);
		const stream = this.client.stream(streamRequest);

		const onData = (e) => {
			const toAcknowledge = [];
			try {
				const messages = e.getMessagesList();
				for (const envelope of messages) {
					toAcknowledge.push(envelope.getId());
					const msg = envelope.getMessage();
					const createdAt = msg.getCreatedAt().toDate();
					const data = Buffer.from(msg.getData(),  "utf-8");
					const meta = {
						"createdAt": ms2serial(createdAt),
					};
					this.onMessage(this.config.topic, data, meta);
				}
			} finally {
				if (toAcknowledge.length !== 0) {
					const ackRequest = new toitSubscribeModel.AcknowledgeRequest();
					ackRequest.setSubscription(subscription);
					ackRequest.setEnvelopeIdsList(toAcknowledge);
					this.client.acknowledge(ackRequest, (err) => {
						if (err) {
							this.handleWarning(err);
						}
					});
				}
			}
		}

		const onError = (err) => {
			if (this.isRetryableGrpcError(err)) {
				stream = this.client.stream(streamRequest);
				bindStream(stream);
			} else {
				this.handleError(err);
			}
		}

		const bindStream = (stream) => {
			stream.on('data', onData);
			stream.on('error', onError);
			stream.on('end', () => this.onClose());
		}
		bindStream(stream);
	}

	isRetryableGrpcError(err) {
		switch (err.code) {
			case grpc.status.INVALID_ARGUMENT:
			case grpc.status.NOT_FOUND:
			case grpc.status.ALREADY_EXISTS:
			case grpc.status.PERMISSION_DENIED:
			case grpc.status.FAILED_PRECONDITION:
			case grpc.status.ABORTED:
			case grpc.status.OUT_OF_RANGE:
			case grpc.status.UNIMPLEMENTED:
			case grpc.status.DATA_LOSS:
			case grpc.status.UNAUTHENTICATED:
				return false
		}
		return true
	}

	createSubscription() {
		const topic = this.config.topic;
		const name = `streamsheets-${Math.floor(Math.random() * 1000000000)}`;
		const subscription = new toitSubscribeModel.Subscription();
		subscription.setTopic(topic);
		subscription.setName(name);
		const request = new toitSubscribeModel.CreateSubscriptionRequest();
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
		const request = new toitSubscribeModel.DeleteSubscriptionRequest();
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
			const sub = this._subscription;
			this._subscription = null;
			await this.deleteSubscription(sub);
		}
		this._client = null;
		super.dispose();
	}
};
