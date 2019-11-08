const logger = require('../logger').create({ name: 'SheetParserContext' });
const { referenceFromNode } = require('./References');
const { FunctionErrors } = require('@cedalo/error-codes');
const { ParserContext, Term } = require('@cedalo/parser');

// DL-1431
const EXCLUDE_FUNCTIONS = ['ACOS', 'ASIN', 'ATAN', 'ATAN2'];
const filter = (functions) => Object.entries(functions).reduce((acc, [name, func]) => {
		if (!EXCLUDE_FUNCTIONS.includes(name)) acc[name] = func;
		return acc;
	}, {});

const executor = func => function wrappedFunction(sheet, ...terms) {
	let result;
	func.term = wrappedFunction.term;
	try {
		result = func(sheet, ...terms);
	} catch (err) {
		logger.error('Error', err);
		return FunctionErrors.code.FUNC_EXEC;
	}
	func.term = undefined;
	return result;
};

// DL-1253: an identifier can contain an error code. we ignore this and simply use a string term for it
const createErrorTermFromNode = node => (node.type === 'identifier' && FunctionErrors.isError(node.value)
	? Term.fromString(node.value)
	: undefined);

const referenceTerm = (node, context) => {
	const operand = referenceFromNode(node, context) || createErrorTermFromNode(node);
	if (operand) {
		const term = new Term();
		term.operand = operand;
		return term;
	}
	return undefined;
};

class SheetParserContext extends ParserContext {
	constructor() {
		super();
		this.strict = true;
		this.parserFunctions = filter(this.functions);
		this.functions = Object.assign({}, this.parserFunctions);
		this._functionFactory = undefined;
	}

	// node: is a parser AST node
	// return a reference term or undefined...
	createReferenceTerm(node) {
		return referenceTerm(node, this);
	}

	getFunction(id) {
		const func = super.getFunction(id);
		// wrap into an execution function...
		return func ? executor(func) : func;
	}

	getFunctionDefinitions() {
		// currently we only need the names...
		return Object.keys(this.functions).map((name) => ({ name }));
	}

	registerFunctions(functions = {}) {
		this.functions = Object.assign({}, this.functions, functions);
		return this;
	}

	registerFunctionDefinitions(definitions = []) {
		const factory = this._functionFactory;
		if (factory) {
			this.registerFunctions(
				definitions.reduce((fns, def) => {
					const fn = factory.createFrom(def);
					if (fn) fns[def.name] = fn;
					return fns;
				}, {})
			);
		}
		return this;
	}

	registerFunctionFactory(factory) {
		this._functionFactory = factory;
		return this;
	}
}

module.exports = SheetParserContext;
