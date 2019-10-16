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
		} else if (term.trim().startsWith("'")) {
			return term.trim().replace(/[']+/g, '');
		} else if (term.trim().replace(/\s/g, '').length === 0) {
			return term.trim();
		}
		return jsonpath
			.query(payload, term.trim().replace(/\s/g, ''), 1)
			.toString();
	}
}

module.exports = MessageParser;
