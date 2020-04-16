/* eslint-disable no-unused-vars */

module.exports = class BaseMessagingClient {

	connect(url, configuration) {
		return Promise.reject(new Error('Method connect() must be implemented by subclass.'));
	}

	publish(topic, message) {
		return Promise.reject(new Error('Method publish() must be implemented by subclass.'));
	}

	subscribe(topic) {
		return Promise.reject(new Error('Method subscribe() must be implemented by subclass.'));
	}

	unsubscribe(topic) {
		return Promise.reject(new Error('Method unsubscribe() must be implemented by subclass.'));
	}

	/**
	 * 
	 * @param {*} event 
	 * @param {*} callback (topic, message) => {}
	 */
	on(event, callback) {
		return Promise.reject(new Error('Method on() must be implemented by subclass.'));
	}

	end() {
		
	}

}