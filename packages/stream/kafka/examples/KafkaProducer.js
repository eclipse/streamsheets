var kafka = require('kafka-node');
var HighLevelProducer = kafka.HighLevelProducer;
var Client = kafka.Client;
var client = new Client('localhost:2181');
var argv = require('optimist').argv;
var topic = argv.topic || 'tests_88888';
var count = 10000;
var rets = 0;
var producer = new HighLevelProducer(client);

producer.on('ready', function () {
	setInterval(send, 10);
});

producer.on('error', function (err) {
	console.log('error', err);
});

function send () {
	var message = new Date().toString();
	producer.send([
		{topic: topic, messages: '<xml>tests</xml>'}
	], function (err, data) {
		if (err) console.log(err);
		else console.log('send %d messages', ++rets);
		if (rets === count) process.exit();
	});
}