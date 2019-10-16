const DummyClient = require('./DummyClient');

class LoggerClient extends DummyClient {

	constructor(logger) {
		super();
		this.logger = logger;
	}

	end() { 
		super.end();
		this.logger.info('LoggerMessagingClient: end message handler');
	 }
	
	on(event, callback) {
		super.on(event, callback);
		this.logger.info('LoggerMessagingClient: register message handler');
	}

	off(event, callback) {
		super.off(event, callback);
		this.logger.info('LoggerMessagingClient: unregister message handler');
	}

	publish(topic, message) { 
		super.publish(topic, message);
		this.logger.info(`LoggerMessagingClient: publish to topic "${topic}": `, message);
	}

	subscribe(topic, handler) {
		const didIt = super.subscribe(topic, handler);
		if (didIt) this.logger.info(`LoggerMessagingClient: subscribe to topic ${topic}`);
		return didIt;
	}

	unsubscribe(topic, handler) {
		const didIt = super.unsubscribe(topic, handler);
		if (didIt) this.logger.info(`LoggerMessagingClient: unsubscribe from topic ${topic}`);
		return didIt;
	}
}


module.exports = LoggerClient;
