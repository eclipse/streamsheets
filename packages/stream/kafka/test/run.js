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
