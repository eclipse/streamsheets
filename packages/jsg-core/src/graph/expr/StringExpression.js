const Expression = require('./Expression');
const StringConstraint = require('./StringConstraint');

/**
 * A string expression should be used for string values. It uses a
 * {{#crossLink "StringConstraint"}}{{/crossLink}} to transform expression value into a string if
 * required.
 *
 * @class StringExpression
 * @constructor
 * @extends BooleanExpression
 */
class StringExpression extends Expression {
	constructor(value, formula, term) {
		super();
		this._constraint = new StringConstraint();
		this.set(value, formula, term);
	}

	newInstance() {
		return new StringExpression();
	}
}

module.exports = StringExpression;
