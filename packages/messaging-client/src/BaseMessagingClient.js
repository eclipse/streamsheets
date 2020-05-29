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