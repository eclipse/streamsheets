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
const KafkaProvider = require('../src/KafkaProvider');
const KafkaConsumerConfiguration = require('../src/KafkaConsumerConfiguration');

const test = async () => {
	const provider = new KafkaProvider();
	const config = new KafkaConsumerConfiguration({
		name: 'Kafka consumer',
		topics: ['topic1'],
		clientId: 'cedalo-kafka-consumer',
		connector: {
			connectionString: 'localhost:2181/'
		}
	});
	// console.log(JSON.stringify(config, null, 2));
	const consumer = await provider.provide(config);
	consumer.connect();
};
test();
