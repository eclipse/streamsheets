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
module.exports = {
	functions: {
		'CRYPTO.HASH': {
			default: {
				category: 'Crypto',
				description: 'Creates an hash value for given text. The used hash algorithm can be optionally specified. For a list of supported hash algorithms please refer to [Hash Algorithms](../../other#hash-algorithms). The used hash algorithms are from the OpenSSL Library. See their [docs](https://www.openssl.org/docs/) for more details.',
				inlineDescription: 'Creates an hash for given text using specified algorithm',
				arguments: [
					{
						type: 'String',
						name: 'Text',
						description: 'A text to create hash value for.',
						optional: false
					},
					{
						type: 'String',
						name: 'Algorithm',
						description: 'The hash algorithm to use. Defaults to "sha256"',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The hash value or an [Error Code](../../other#error-codes)'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=CRYPTO.HASH("hello")',
							result: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
							comment: 'By default "sha256" is used.'
						},
						{
							formula: '=CRYPTO.HASH("hello","md5")',
							result: '5d41402abc4b2a76b9719d911017c592',
							comment: 'Same text as before but creates an hash using "md5" algorithm.'
						}
					]
				}
			}
		},
		'CRYPTO.HMAC': {
			default: {
				category: 'Crypto',
				description: 'Creates an hash based authentication code (HMAC) for given text and secret. The used hash algorithm can be optionally specified. For a list of supported hash algorithms please refer to [Hash Algorithms](../../other#hash-algorithms). The used hash algorithms are from the OpenSSL Library. See their [docs](https://www.openssl.org/docs/) for more details.',
				inlineDescription: 'Creates an hmac from given text and secret using specified algorithm',
				arguments: [
					{
						type: 'String',
						name: 'Text',
						description: 'A text to create hash value for.',
						optional: false
					},
					{
						type: 'String',
						name: 'Secret',
						description: 'A text used as key to generate the cryptographic HMAC hash.',
						optional: false
					},
					{
						type: 'String',
						name: 'Algorithm',
						description: 'The hash algorithm to use. Defaults to "sha256"',
						optional: true
					}
				],
				return: {
					type: '',
					description: 'The hmac value or an [Error Code](../../other#error-codes)'
				},
				examples: {
					infoStart: '',
					infoEnd: '',
					formulas: [
						{
							formula: '=CRYPTO.HMAC("hello", "top secret")',
							result: 'a28f6aee6a27565bf1b868da1947c35147039fe6482b35d3b8fdeb9592e42e99',
							comment: 'By default "sha256" is used.'
						},
						{
							formula: '=CRYPTO.HMAC("hello", "top secret", "md5")',
							result: '9ffaf5da07c95deaa000729cd65fefea',
							comment: 'Same text and secret as before but creates an hmac using "md5" algorithm.'
						}
					]
				}
			}
		}
	},
};
