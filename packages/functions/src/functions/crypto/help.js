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
	en: 'Crypto',
	de: 'Krypto',
	functions: {
		'CRYPTO.HASH': {
			en: {
				argumentList: 'Text,Algorithm',
				description: 'Creates an hash for given text using specified algorithm'
			},
			de: {
				argumentList: 'Text,Algorithmus',
				description: 'Erzeugt einen hash-Wert aus dem Text mittels angegebenen Algorithmus'
			}
		},
		'CRYPTO.HMAC': {
			en: {
				argumentList: 'Text,Secret,Algorithm',
				description: 'Creates an hmac from given text and secret using specified algorithm'
			},
			de: {
				argumentList: 'Text,Geheimnis,Algorithmus',
				description: 'Erzeugt einen hmac-Wert aus dem Text und Geheimnis mittels angegebenen Algorithmus'
			}
		}
	}
};
