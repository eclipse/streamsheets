/********************************************************************************
 * Copyright (c) 2022 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { ProducerMixin, Connector } = require('@cedalo/sdk-streams');
const ToitConnector = require('./ToitConnector');
const toitPublish = require("@toit/api/src/toit/api/pubsub/publish_grpc_pb");
const toitPublishModel = require("@toit/api/src/toit/api/pubsub/publish_pb");

module.exports = class ToitProducer extends ProducerMixin(ToitConnector) {

  constructor(config) {
    super({ ...config, type: Connector.TYPE.PRODUCER });
  }

  async initialize() {
    this.currentConfig = JSON.parse(JSON.stringify(this.config));
  }

  async produce(config) {
    console.log(config);
    let { topic, publisherName } = config;
    const { deviceId, message } = config;
    if (typeof deviceId !== "undefined") {
      topic += `?device-id=${deviceId}`;
    }
    if (typeof publisherName === "undefined") {
      publisherName = this.config.publisherName;
    }

    const client = new toitPublish.PublishClient("", null, { channelOverride: this._channel });
    const request = new toitPublishModel.PublishRequest();
    request.setTopic(topic);
    request.setPublisherName(publisherName);
    request.setDataList([Buffer.from(`${message}`).toString("base64")]);
    try {
      this.logger.info(`Sending message to Toit topic '${topic}', as ${publisherName}`);
      client.publish(request, (err) => {
        if (err) {
          this.handleWarning(err);
        }
      });
    } catch (e) {
      this.handleError(e);
    }
  }

};
