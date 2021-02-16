/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const crypto = require('crypto');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { runFunction } = require('../../utils');

const ERROR = FunctionErrors.code;

const DEF_HASHES = ['sha256', 'sha512', 'sha384', 'md5'];
const HASH_ALGOS = crypto.getHashes().map((algo) => algo.toLowerCase());
const DEFAULT_HASH = DEF_HASHES.find((hash) => HASH_ALGOS.includes(hash)) || HASH_ALGOS[0];

const getAlgorithm = (str) => {
	str = str.toLowerCase();
	return HASH_ALGOS.includes(str) ? str : ERROR.VALUE;
};

const hash = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((text) => convert.toString(text.value, ERROR.VALUE))
		.mapNextArg((algorithm) => getAlgorithm(algorithm ? convert.toString(algorithm.value, '') : DEFAULT_HASH))
		.run((text, algorithm) => {
			const cryptoHash = crypto.createHash(algorithm);
			return cryptoHash.update(text).digest('hex');
		});

const hmac = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.withMaxArgs(3)
		.mapNextArg((text) => convert.toString(text.value, ERROR.VALUE))
		.mapNextArg((secret) => convert.toString(secret.value, ERROR.VALUE))
		.mapNextArg((algorithm) => getAlgorithm(algorithm ? convert.toString(algorithm.value, '') : DEFAULT_HASH))
		.run((text, secret, algorithm) => {
			if (!secret) return ERROR.VALUE;
			const cryptoHmac = crypto.createHmac(algorithm, secret);
			return cryptoHmac.update(text).digest('hex');
		});

module.exports = {
	'CRYPTO.HASH': hash,
	'CRYPTO.HMAC': hmac
};
