const { Parser, ParserContext, Term } = require('@cedalo/parser');

const QUOTE = /"/g;
const andor = /AND|OR/g;
const REPLACEMENT = {
	'OR': '|',
	'AND': '&&'
};

const isInsideQuotes = (index, quotes) => {
	let idx = 0;
	quotes.some((val, i) => {
		const stop = index <= val;
		if (!stop) idx = i + 1;
		return stop;
	});
	return idx % 2 !== 0;
};
const correct = (wherestr) => {
	const quotes = [];
	wherestr.replace(QUOTE, (match, offset) => quotes.push(offset));
	return wherestr.replace(andor, (match, offset) =>
		isInsideQuotes(offset, quotes) ? match : REPLACEMENT[match] || match
	);
};

class EntryTerm extends Term {
	constructor(keyValue) {
		super();
		this.keyValue = keyValue;
	}
	get value() {
		const val = this.keyValue();
		return val != null ? val : super.value;
	}
}
const isBool = (str) => {
	const val = str.toLowerCase();
	return val === 'true' || val === 'false';
};
class EntryContext extends ParserContext {
	createReferenceTerm({type, value}) {
		return type === 'identifier' && !isBool(value) ? new EntryTerm(this.scope.getKeyValue(value)) : undefined;
	}
	hasFunction(/* id */) {
		return false;
	}
}
class EntryScope {
	constructor() {
		this.values = undefined;
	}
	set entry(entry) {
		this.values = entry.values || {};
	}

	getKeyValue(key) {
		return 	() => this.values != null ? this.values[key] : undefined;
	}
}

const whereCondition = (term, scope) => (entry) => {
	scope.entry = entry;
	return term.value;
};

const CONTEXT = new EntryContext();

const parseCondition = (wherestr) => {
	let condition;
	if (wherestr) {
		CONTEXT.scope = new EntryScope();
		const term = Parser.parse(correct(wherestr), CONTEXT);
		if (term) condition = whereCondition(term, CONTEXT.scope);
		CONTEXT.scope = undefined;
	}
	return condition;
};

module.exports = {
	parseCondition
};
