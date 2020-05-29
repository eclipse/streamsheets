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
const { TestHelper } = require('@cedalo/sdk-streams');
const DockerHelper = require('./DockerHelper');
const streamModule = require('../index');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 999999;

describe('KafkaProvider', () => {
  it('should create a new KafkaProvider and test()', async (done) => {
    await DockerHelper.startAll('docker/docker-compose.yml');
    const connectorConfig = {
      name: 'Kafka Connector',
      connectionString: 'localhost:9092'
    };
    const consumerConfig = {
      name: 'Kafka Consumer',
      topics: ['cedalo'],
      connector: connectorConfig
    };
    const producerConfig = {
      name: 'Kafka Producer',
      topic: 'cedalo',
      connector: connectorConfig
    };
    const produceConfig = {
      topic: 'cedalo',
      message: {
        test: 'testme'
      }
    };
    try {
      const { result } = await TestHelper.testPubSub({
        streamModule,
        consumerConfig,
        producerConfig,
        produceConfig,
        timeout: 10000
      });
      expect(result)
          .not
          .toEqual(false);
      if (result) {
        expect(result.origin)
            .toEqual(produceConfig.topic);
        expect(result.message.data)
            .toEqual(produceConfig.message);
      }
    } catch (e) {
      console.error(e);
      DockerHelper.stopAll();
    }
    done();
    DockerHelper.stopAll();
  });
  it.skip('should create kafka consumer with ssl auth', async (done) => {
    const config = {
      topics: ['cedalo'],
      clientId: 'cedalo-kafka-consumer',
      connector: {
        name: 'Kafka Connector',
        mode: 'zk',
        connectionString: 'localhost:2181/',
        auth: 'ssl'
      }
    };
    const { result } = await TestHelper.testPubSub(streamModule, config);
    expect(result)
        .toEqual(true);
    done();
  });
  it.skip('should create kafka consumer for confluent cloud', async (done) => {
    const connectorConfig = {
      name: 'Kafka Connector',
      connectionString: 'pkc-l6y8e.eu-central-1.aws.confluent.cloud:9092',
      auth: 'ssl_sasl',
      userName: 'SZX2R7MY24QCTX5P',
      password:
          '7cSKe7SFFhqmjlVFg8qfpyq2RCCsEkYjcoQsV2cCBeXG6XXKV3urEPMaU9bIKnJI',
      authMechanism: 'PLAIN'
    };
    const producerConfig = {
      topics: ['cedalo'],
      className: 'ProducerConfiguration',
      connector: connectorConfig
    };
    const consumerConfig = {
      topics: ['cedalo'],
      clientId: 'cedalo-kafka-consumer',
      className: 'ProducerConfiguration',
      connector: connectorConfig
    };
    const produceConfig = {
      topic: 'cedalo',
      message: {
        test: 'testme'
      }
    };
    try {
      const { result } = await TestHelper.testPubSub({
        streamModule,
        consumerConfig,
        producerConfig,
        produceConfig,
        timeout: 10000
      });
      expect(result)
          .not
          .toEqual(false);
      if (result) {
        expect(result.origin)
            .toEqual(produceConfig.topic);
        expect(result.message.data)
            .toEqual(produceConfig.message);
      }
    } catch (e) {
      console.error(e);
    }
    done();
  });
});
