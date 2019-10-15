const Numbers = require('../../commons/Numbers');
const Expression = require('./Expression');
const NumberConstraint = require('./NumberConstraint');

/**
 * A number expression should be used for number values. It uses a
 * {{#crossLink "NumberConstraint"}}{{/crossLink}} to transform expression value into a number if
 * required.
 *
 * @class NumberExpression
 * @constructor
 * @extends BooleanExpression
 */
class NumberExpression extends Expression {
	constructor(value, formula, term) {
		super();
		this._constraint = new NumberConstraint(0);
		this.set(value, formula, term);
	}

	newInstance() {
		return new NumberExpression();
	}

	isValueEqualTo(value, accuracy) {
		// we use a very small threshold, because we don't know what accuracy is required! E.g. angles in radiant...
		return this._value === undefined
			? value === undefined
			: Numbers.areEqual(this._value, value, accuracy || 0.000001);
	}

	setValue(value) {
		value = this._constraint ? this._constraint.getValue(value) : value;
		return super.setValue(value);
	}

	_writeValueAttribute(writer, decimals) {
		const round =
			decimals === undefined ? this._constraint.decimals : decimals;
		writer.writeAttributeString('v', this._value.toFixed(round));
	}
}

module.exports = NumberExpression;
