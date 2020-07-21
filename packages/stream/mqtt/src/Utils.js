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
const ERRORS = {
	EMPTY_CERTIFICATE: 'EMPTY_CERTIFICATE'
};
const TOPIC_ERRORS = {
	TOPIC_FORMAT_INVALID: 'TOPIC_FORMAT_INVALID',
	TOPIC_WITH_FILTER_ALL: 'TOPIC_WITH_FILTER_ALL',
	TOPIC_WILDCARD_POSITION_INVALID: 'TOPIC_WILDCARD_POSITION_INVALID',
	TOPIC_WILDCARD_UNEXPECTED: 'TOPIC_WILDCARD_UNEXPECTED'
};
const TOPIC_WARNINGS = {
	TOPIC_WITH_DOUBLE_SLASH: 'TOPIC_WITH_DOUBLE_SLASH',
	TOPIC_WITH_LEADING_SLASH: 'TOPIC_WITH_LEADING_SLASH',
	TOPIC_WITH_FILTER_ALL: 'TOPIC_WITH_FILTER_ALL',
	TOPIC_WITH_SPACES: 'TOPIC_WITH_SPACES',
	TOPIC_STARTS_RESERVED: 'TOPIC_STARTS_RESERVED'
	// TOPIC_TOO_SHORT: 'TOPIC_TOO_SHORT'
};

const getUrl = (conf) => {
	let url = conf.url;
	if (typeof url === 'string') {
		url = url.replace('mqtt+ssl', 'mqtts');
		if (url.indexOf('://') < 0) {
			url = `mqtt://${url}`;
		}
	}
	return url;
};
const decodeCert = (cert) => {
	let certText = null;
	if (cert && cert.value) {
		certText = cert.value;
	}
	if (certText && certText.length > 0) {
		return certText.replace(/(\r\n|\n|\\n|\r)/gm, '\n');
	}
	throw new Error(ERRORS.EMPTY_CERTIFICATE);
};
const getBufferCert = (val) => {
	if (!val) return '';
	return Buffer.from(decodeCert(val));
};

const getTopicValue = (topic) => {
	topic = typeof topic === 'string' ? topic.trim() : '';
	// cut off leading or trailing / if any...
	// if (topic.startsWith('/')) topic = topic.substr(1);
	// if (topic.endsWith('/')) topic = topic.substring(0, topic.length - 1);
	return topic;
};

const getProducerTopic = (topic, config) =>
	getTopicValue(`${config.connector.baseTopic}${topic || config.pubTopic}`);

const getTopicsFromConfig = (config) => {
	const baseTopic = getTopicValue(config.connector.baseTopic);
	let topics = [];
	if (
		config.topics &&
		Array.isArray(config.topics) &&
		config.topics.length > 0
	) {
		topics = config.topics.map((t) => `${baseTopic}${getTopicValue(t)}`);
	} else if (baseTopic.length > 0) {
		topics.push(baseTopic);
	}
	return topics;
};

const validateTopicBasic = (topic) => {
	// based on https://www.hivemq.com/blog/mqtt-essentials-part-5-mqtt-topics-best-practices/
	const result = { errors: [], warnings: [], topic };
	if (typeof topic !== 'string') {
		result.errors.push(TOPIC_ERRORS.TOPIC_FORMAT_INVALID);
	}
	if (topic.indexOf('//') > -1) {
		result.warnings.push(TOPIC_WARNINGS.TOPIC_WITH_DOUBLE_SLASH);
	}
	if (topic.startsWith('/')) {
		result.warnings.push(TOPIC_WARNINGS.TOPIC_WITH_LEADING_SLASH);
	}
	// if (topic.startsWith('#')) {
	// 	result.warnings.push(TOPIC_WARNINGS.TOPIC_WITH_FILTER_ALL);
	// }
	if (topic.indexOf(' ') > -1) {
		result.warnings.push(TOPIC_WARNINGS.TOPIC_WITH_SPACES);
	}
	return result;
};

const validateTopicForProduce = (topic) => {
	const result = validateTopicBasic(topic);
	const topicParts = String(topic).split('/');
	topicParts.forEach((t) => {
		if (t === '+' || t === '#') {
			result.errors.push(TOPIC_ERRORS.TOPIC_WILDCARD_UNEXPECTED);
		}
	});
	return result;
};

const validateTopicForSubscribe = (topic) => {
	const result = validateTopicBasic(topic);
	const parts = String(topic).split('/');
	// If any part of the topic is not `+` or `#`, then it must not contain `+` and '#'
	if (topic.indexOf('+') > -1 && !parts.includes('+')) {
		result.errors.push(TOPIC_ERRORS.TOPIC_WILDCARD_POSITION_INVALID);
	}
	if (topic.indexOf('#') > -1 && !parts.includes('#')) {
		result.errors.push(TOPIC_ERRORS.TOPIC_WILDCARD_POSITION_INVALID);
	}
	// Part `#` must be located at the end of the mailbox
	if (topic.indexOf('#') > -1 && topic.indexOf('#') < topic.length - 1) {
		result.errors.push(TOPIC_ERRORS.TOPIC_WILDCARD_POSITION_INVALID);
	}
	// Remove it for now as seems to be confusing. However keep code till #19 is closed
	// if (parts.length < 2) {
	//	result.warnings.push(TOPIC_WARNINGS.TOPIC_TOO_SHORT);
	// }
	return result;
};

module.exports = {
	getBufferCert,
	decodeCert,
	getUrl,
	getTopicsFromConfig,
	getTopicValue,
	getProducerTopic,
	validateTopicForProduce,
	validateTopicForSubscribe
};
