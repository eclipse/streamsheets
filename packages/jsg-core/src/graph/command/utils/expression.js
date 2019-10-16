const ObjectFactory = require('../../../ObjectFactory');
const { readObject, writeJSON } = require ('./json');

const restoreExpression = (exprData, item) => {
	const obj = ObjectFactory.create(exprData.type);
	const expr = readObject('expr', exprData.json, obj);
	expr.evaluate(item);
	expr.correctFormula(item);
	return expr;
};

const writeExpression = (expr, cb) => ({
	type: expr.constructor.name,
	json: writeJSON('expr', expr, 15, cb)
});

module.exports = {
	restoreExpression,
	writeExpression
};
