const { ParserContext, Term } = require('@cedalo/parser');
const ReferenceFactory = require('./ReferenceFactory');

const refTermFromStr = (str, scope) => {
	const operand = ReferenceFactory.fromString(str, scope.graph, scope.item);
	if (operand) {
		const term = new Term();
		term.defstr = str;
		term.operand = operand;
		return term;
	}
	return undefined;
};

module.exports = class GraphParserContext extends ParserContext {
	constructor() {
		super({
			/* graph, item */
		});
	}

	// to clear scope, call without any parameter or pass undefined...
	setScope(graph, item) {
		// always create new scope, because context is shared during parsing different formula...
		this.scope =
			graph != null || item != null
				? {
						graph,
						item,
						getDrawings: () => item.getDrawings()
				  }
				: {};
	}

	// node: is a parser AST node
	// return a reference term or undefined...
	createReferenceTerm(node /* , parent */) {
		// is string still relevant?
		return node.type === 'identifier' && refTermFromStr(node.value, this.scope);
	}
};
