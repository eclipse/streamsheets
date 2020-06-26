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
const convert = require('xml-js');

// https://www.npmjs.com/package/xml-js
const convertOptions = {
	compact: true,
	nativeType: true,
	nativeTypeAttributes: true,
	spaces: 4
};

module.exports = class Utils {
	static getAsNumber(val) {
		if (val && typeof val === 'string') return +val;
		return null;
	}
	static getAsInt(val) {
		if (val && typeof val === 'number') return val;
		if (val && typeof val === 'string') return parseInt(val, 10);
		return null;
	}

	static parseJson(str = '') {
		/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
		for (let index = 0; index < str.length; index++) {
			const char = str[index];
			if (char === '{' || char === '[') {
				const end = char === '{' ? str.lastIndexOf('}') : str.lastIndexOf(']');
				if (end > 0 && end > index) {
					const subStr = str.substring(index, end + 1);
					try {
						return JSON.parse(subStr);
					} catch (e) {
						// console.warn(e.message);
					}
				}
			}
		}
		throw new Error('invalid');
	}
	//

	/**
	 * Transforms any message to JS Object based on mimeType
	 * @param message
	 * @param mimeType
	 * @returns {*}
	 */

	static transformToJSONObject(message, mimeType = 'application/json') {
		if (!message) return message;
		const msgString = Buffer.isBuffer(message)
			? message.toString()
			: message;
		if (typeof msgString === 'object') return msgString;
		let msg = {};
		switch (mimeType) {
			case 'auto': {
				try {
					return Utils.parseJson(msgString);
					// eslint-disable-next-line no-empty
				} catch (e) {}
				try {
					return convert.xml2js(msgString, convertOptions);
					// eslint-disable-next-line no-empty
				} catch (e) {}
				return { value: msgString };
			}
			case 'text/plain': {
				msg = { value: msgString };
				break;
			}
			case 'application/json': {
				try {
					msg = Utils.parseJson(msgString);
				} catch (e) {
					throw new Error(
						'Invalid data for mimeType application/json'
					);
				}
				break;
			}
			case 'application/xml': {
				try {
					msg = convert.xml2js(msgString, convertOptions);
				} catch (e) {
					throw new Error(
						'Invalid data for mimeType application/xml'
					);
				}
				break;
			}
			default:
				msg = { value: msgString };
		}
		return msg;
	}

	/**
	 * Converts a JS/JSON object to appropriate mime type as string
	 * @param msgObject
	 * @param mimeType
	 * @returns {string}
	 */

	static transformFromJSONObject(msgObject, mimeType = 'application/json') {
		if (typeof msgObject === 'string') {
			return msgObject;
		}
		if (typeof msgObject === 'number') {
			return `${msgObject}`;
		}
		if (typeof msgObject !== 'object')
			throw new Error('Expect json object');
		let msg = JSON.stringify(msgObject);
		switch (mimeType) {
			case 'application/xml': {
				try {
					msg = convert.json2xml(msg, convertOptions);
				} catch (e) {
					throw new Error(
						'Invalid data for mimeType application/xml'
					);
				}
				break;
			}
			case 'application/json': {
				if (typeof msg === 'string') {
					try {
						msg = JSON.parse(msg);
					} catch (e) {
						throw new Error(
							'Invalid data for mimeType application/json'
						);
					}
				}
				break;
			}
			default:
		}
		return msg;
	}
};
