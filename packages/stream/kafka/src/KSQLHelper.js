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
const ksql = require('request');
const util = require('util');

const getHttpUrl = (url) => {
	url = url || '';
	if (url.length < 1) throw Error('INVALID_REST_URL');
	return url.toLowerCase().startsWith('http') ? url : `http://${url}`;
};


class KSQLHelper {

	static getResponseMessage(data) {
		const msg = JSON.parse(data);
		if (msg['@type'] && msg['@type'].toLowerCase().includes('error')) {
			return {
				error: msg
			};
		}
		if (msg['@currentStatus'] && msg['@commandStatus']) {
			this.logger.info(msg['@commandStatus']);
			return {
				...msg['@currentStatus']
			};
		}
		return msg;
	}

	static query(ksqlRESTUrl, query, cb, logger = console) {
		if (typeof cb !== 'function') throw Error('INVALID_QUERY_CALLBACK');
		const restUrl = getHttpUrl(ksqlRESTUrl);
		const ksqlurl = `${restUrl}/query`;
		const body = { ksql: query };
		ksql({
			method: 'POST',
			url: ksqlurl,
			headers: {
				'Content-Type': 'application/json; charset=utf-8'
			},

			body: JSON.stringify(body) })
		.on('data', (chunk) => {
			const data = chunk.toString();
			const isEmpty = (d) => {
				if (!d || d === null) {
					return false;
				}
				const tmp = data.replace(/(?:\r\n|\r|\n)/g, '');
				return tmp.length < 1;
			};
			if (!(util.isNullOrUndefined(chunk) || isEmpty(data))) {
				try {
					const msg = KSQLHelper.getResponseMessage(data);
					if (msg.error) {
						cb(msg.error);
					} else {
						cb(null, msg);
					}
				} catch (e) {
					logger.error(`[ksql] caught the following error parsing response: ${e}`);
					cb(e, null);
				}
			}
		})
		.on('error', (error) => {
			logger.error(`[ksql] ${error}`);
			return cb(error, null);
		});
	}

	static command(ksqlRESTUrl, ksqlCommand, cb, logger = console) {
		// create stream
		const restUrl = getHttpUrl(ksqlRESTUrl);
		if (ksqlCommand && ksqlCommand.length > 0) {
			const ksqlurl = `${restUrl}/ksql`;
			const reqbody = { ksql: ksqlCommand };
			logger.debug(`ksqlurl = ${ksqlurl}`);
			logger.debug(`body = ${util.inspect(reqbody)}`);
			ksql({
				method: 'POST',
				url: ksqlurl,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
				body: JSON.stringify(reqbody)
			}, (error, response, data) => {
				if (util.isNullOrUndefined(data)) {
					logger.debug('[ksql] Null or Undefined response body');
					if (error) {
						logger.error(error);
						cb(error);
					}
				} else {
					try {
						logger.debug('body received');
						const msg = KSQLHelper.getResponseMessage(data);
						if (msg.error) {
							cb(msg.error);
						} else {
							cb(null, msg);
						}
					} catch (e) {
						logger.debug(`[ksql] caught the following error parsing response: ${e}`);
						cb(e);
					}
				}
			});
		}
	}
}

module.exports = KSQLHelper;
