module.exports = class BaseMessagingClient {

	connect(url, configuration) {
		return Promise.reject('Method connect() must be implemented by subclass.');
	}

	publish(topic, message) {
		return Promise.reject('Method publish() must be implemented by subclass.');
	}

	subscribe(topic) {
		return Promise.reject('Method subscribe() must be implemented by subclass.');
	}

	unsubscribe(topic) {
		return Promise.reject('Method unsubscribe() must be implemented by subclass.');
	}

	/**
	 * 
	 * @param {*} event 
	 * @param {*} callback (topic, message) => {}
	 */
	on(event, callback) {
		return Promise.reject('Method on() must be implemented by subclass.');
	}

	end() {
		
	}

}