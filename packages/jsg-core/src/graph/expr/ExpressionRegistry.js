const Expression = require('./Expression');
const AttributeExpression = require('./AttributeExpression');
const BooleanExpression = require('./BooleanExpression');
const ConstExpression = require('./ConstExpression');
const MapExpression = require('./MapExpression');
const NumberExpression = require('./NumberExpression');
const ObjectExpression = require('./ObjectExpression');
const StringExpression = require('./StringExpression');

const Registry = {
	'AttributeExpression': AttributeExpression,
	'BooleanExpression': BooleanExpression,
	'ConstExpression': ConstExpression,
	'Expression': Expression,
	'MapExpression': MapExpression,
	'NumberExpression': NumberExpression,
	'ObjectExpression': ObjectExpression,
	'StringExpression': StringExpression,
	'JSG.graph.expr.AttributeExpression': AttributeExpression,
	'JSG.graph.expr.BooleanExpression': BooleanExpression,
	'JSG.graph.expr.ConstExpression': ConstExpression,
	'JSG.graph.expr.Expression': Expression,
	'JSG.graph.expr.MapExpression': MapExpression,
	'JSG.graph.expr.NumberExpression': NumberExpression,
	'JSG.graph.expr.ObjectExpression': ObjectExpression,
	'JSG.graph.expr.StringExpression': StringExpression,
};

module.exports = {
	get(name) {
		return Registry[name];
	}
};
