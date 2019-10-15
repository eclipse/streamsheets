const JSG = require('@cedalo/jsg-core');

const SheetFunctions = require('./SheetFunctions');

const { GraphParserContext } = JSG;

const isFunctionParam = (node, parent) =>
	parent && parent.type === 'function' && (node.type === 'string');


module.exports = class SheetParserContext extends GraphParserContext {

	constructor() {
		super();
		this.functions = Object.assign(this.functions, SheetFunctions);
	}

	createReferenceTerm(node, parent) {
		return (isFunctionParam(node, parent)) ? undefined : super.createReferenceTerm(node);
	}
};
