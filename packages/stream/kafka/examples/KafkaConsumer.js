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
'use strict';
const kafka = require('kafka-node');
var HighLevelConsumer = kafka.HighLevelConsumer;
var Client = kafka.KafkaClient;
var argv = require('optimist').argv;
var topic = argv.topic || 'topic1';
var client = new Client({kafkaHost: 'localhost:9092'});
var topics = [{ topic: topic }];
var options = { autoCommit: true, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024 * 1024 };
var consumer = new HighLevelConsumer(client, topics, options);

consumer.on('message', function (message) {
	console.log(message);
});

consumer.on('error', function (err) {
	console.log('error', err);
});