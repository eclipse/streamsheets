const { Parser, ParserContext, Term } = require('@cedalo/parser');

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
class EntryContext extends ParserContext {
	createReferenceTerm(node) {
		return node.type === 'identifier' ? new EntryTerm(this.scope.getKeyValue(node.value)) : undefined;
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
		const term = Parser.parse(wherestr, CONTEXT);
		if (term) condition = whereCondition(term, CONTEXT.scope);
		CONTEXT.scope = undefined;
	}
	return condition;
};

module.exports = {
	parseCondition
};
