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
const IdGenerator = require('@cedalo/id-generator');
const EventEmitter = require('events').EventEmitter;

class SimpleSource {
	constructor() {
		this.emitter = new EventEmitter();
		this.timeInterval = 1000;
		this.timeIntervalId = null;
		this.subscribers = new Set();
		this.topics = ['topic1', 'topic2'];
		this.topics.forEach(topic => this.emitter.on(topic, (message) => {
			this.onMessage(message, topic);
		}));
	}

	start(interval) {
		if (!this.timeIntervalId) {
			console.log('Starting Simple source');
			this.timeIntervalId = setInterval(() => this.publishMessage(), interval || this.timeInterval);
		}
	}

	stop() {
		clearInterval(this.timeIntervalId);
		console.log('Simple source stopped');
	}

	publishMessage(topic, msg) {
		topic = topic || this.topics[Math.floor(Math.random() * this.topics.length)];
		msg = msg || {
			id: IdGenerator.generate(),
			date: new Date()
		};
		this.emitter.emit(topic, msg);
	}

	subscribe(target, topic) {
		if (target) {
			target.topic = topic;
			this.subscribers.add(target);
		}
	}

	unSubscribe(target) {
		this.subscribers.delete(target);
	}

	onMessage(message, topic) {
		console.log(`Got msg: Topic ${topic} ${JSON.stringify(message)}`);
		this.subscribers.forEach((s) => {
			if (!s.topic || (s.topic && s.topic === topic)) {
				s(message, topic);
			}
		});
	}

}
const source = new SimpleSource();
module.exports = source;
