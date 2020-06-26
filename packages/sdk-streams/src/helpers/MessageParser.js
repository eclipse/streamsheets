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
const jsonpath = require('jsonpath');

class MessageParser {
	static parse(expr, payload) {
		const terms = expr.split('+');
		return terms
			.map((term) => MessageParser.parseTerm(term, payload))
			.join('');
	}

	static parseTerm(term, payload) {
		if (term.trim().startsWith('"')) {
			return term.trim().replace(/["]+/g, '');
		}
		if (term.trim().startsWith("'")) {
			return term.trim().replace(/[']+/g, '');
		}
		if (term.trim().replace(/\s/g, '').length === 0) {
			return term.trim();
		}
		return jsonpath
			.query(payload, term.trim().replace(/\s/g, ''), 1)
			.toString();
	}
}

module.exports = MessageParser;
