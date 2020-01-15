const JSG = require('@cedalo/jsg-core');

const { GraphParserContext } = JSG;

const isFunctionParam = (node, parent) => parent && parent.type === 'function' && node.type === 'string';

const FN_CALC = () => '#CALC';
const ALL_FUNCTIONS = new Set();

module.exports = class SheetParserContext extends GraphParserContext {
	static updateFunctions(fnDefinitions = []) {
		// seems we only need function names for copy paste => remove when c&p is done by machine server...
		fnDefinitions.forEach((def) => ALL_FUNCTIONS.add(def.name));
	}

	createReferenceTerm(node, parent) {
		return isFunctionParam(node, parent) ? undefined : super.createReferenceTerm(node);
	}

	hasFunction(id) {
		return ALL_FUNCTIONS.has(id.toUpperCase());
	}

	getFunction(id) {
		return this.hasFunction(id) ? FN_CALC : undefined;
	}
};
