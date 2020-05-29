/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { Locale, Term } = require('@cedalo/parser');

const JSG = require('../../JSG');
const ObjectFactory = require('../../ObjectFactory');
const Numbers = require('../../commons/Numbers');
const Strings = require('../../commons/Strings');
const ExpressionConstraint = require('./ExpressionConstraint');

/**
 * An Expression is used to determine a value by a formula or a {{#crossLink
 * "Term"}}{{/crossLink}}.</br>
 * Since almost all properties of a {{#crossLink "GraphItem"}}{{/crossLink}} can be
 * referenced by a formula, this mechanism gives you great power, dynamic and flexibility by linking
 * the properties of one item to the properties of another one.</br>
 * To link or reference from one <code>GraphItem</code> to the property of another item, the keyword <code>Item.</code>
 * is used followed by the unique graph item ID and the predefined name of the property interested in.
 * The <code>Item</code> keyword and its ID are not required if a property of the item itself is
 * referenced. To easily reference an item's parent the <code>Parent</code> keyword can be used.
 * </br></br>
 * Here are some examples of valid formulas:
 * @example
 *     var formula1 = "Item.2!ANGLE";    //angle property of item with id 2
 *     var formula2 = "Parent!WIDTH";    //width property of items parent
 *     var formula3 = "HEIGHT * 0.5";    //height * 0.5 property of item itself
 *
 * In order to get a dynamic <code>Term</code> from a static formula the expression must be
 * evaluated. To do this simply call {{#crossLink "BooleanExpression/evaluate:method"}}{{/crossLink}}
 * which should be done after each expression creation or after each change of its formula.</br>
 * Now the value of an expression is either defined by the value of its internal term or by its
 * default (or last computed) value, if no term is present. If the expression value needs
 * to be of type <code>Number</code>, <code>String</code> or <code>Boolean</code> one can use
 * {{#crossLink "NumberExpression"}}{{/crossLink}},
 * {{#crossLink "StringExpression"}}{{/crossLink}} or
 * {{#crossLink "BooleanExpression"}}{{/crossLink}} respectively. These expressions
 * use special {{#crossLink "ExpressionConstraint"}}{{/crossLink}}s to define their
 * value types. That means the output of any calculated expression value can be checked and transformed to any desired
 * value type if required. Note that it is also possible to define custom expression types by subclassing
 * <code>ExpressionConstraint</code> and use it inside a custom <code>Expression</code> or simply set a custom
 *     constraint to an already defined expression class by calling {{#crossLink
 *     "BooleanExpression/setConstraint:method"}}{{/crossLink}}.</br></br> Finally here is a simple example of
 *     an expression creation and evaluation:
 * @example
 *     //set the height of GraphItem myItem to half the width of its parent item
 *     var heightExpr = new NumberExpression(0, "Parent!WIDTH * 0.5");
 *     myItem.setHeight(heightExpr); //heightExpr will be evaluated in setHeight...
 *
 */
/**
 * Creates a new <code>Expression</code> with given formula or term and default value.</br>
 * <b>Note:</b> call {{#crossLink "BooleanExpression/evaluate:method"}}{{/crossLink}} to
 * compile the formula into a corresponding term.
 *
 * @class Expression
 * @constructor
 * @param {Object} [value] The optional default value to use if neither a formula nor term is present.
 * @param {String} [formula] The optional formula to use.
 * @param {Term} [term] The optional term to get the value from.
 */
class Expression {
	constructor(value, formula, term) {
		this._isLocked = false;
		this._constraint = new ExpressionConstraint();
		this._term = undefined;
		this._value = undefined;
		this._formula = undefined;
		this.set(value, formula, term);
		// performance: we store last item path under which this Expression was evaluated since it marks a kind of
		// dirty flag too!! e.g. create an expression WIDTH * 0.5, evaluate it => expression is not dirty but same
		// expression can be used (WITHOUT COPY!) for another item!! a general use case is GraphItem#setShape() where
		// new shape is constructed and evaluated before it is set to an item...
		this._isDirty = false;
		this._ctxtPath = undefined;
	}

	/**
	 * Creates a new <code>Expression</code> instance. This method is part of our copy-pattern, in which
	 * the copy is initially created by <code>newInstance</code>.
	 *
	 * @method newInstance
	 * @return {BooleanExpression} a new expression instance
	 */
	newInstance() {
		return new Expression();
	}

	/**
	 * Creates a copy of this expression. The returned copy and this expression are equal in terms of
	 * <code>equal</code> function.</br>
	 * <b>Note:</b> a possible existing term is not copied! Therefore a caller should run <code>evaluate()</code>
	 * on the returned copy before first usage.
	 *
	 * @method copy
	 * @return {BooleanExpression} a copy of this expression
	 */
	copy() {
		const copy = this.newInstance();
		const formula =
			this._formula !== undefined
				? this._formula
				: this._term !== undefined
				? this._term.toString()
				: undefined;

		copy.set(this.getValue(), formula);
		copy._constraint =
			this._constraint !== undefined
				? this._constraint.copy()
				: undefined;

		return copy;
	}

	/**
	 * Returns <code>true</code> if this expression has the same formula and the same value as given
	 * expression.
	 *
	 * @method isEqualTo
	 * @param {BooleanExpression} other The expression to check equality against
	 * @return {Boolean} <code>true</code> if this expression equals given one, <code>false</code> otherwise
	 */
	isEqualTo(other, accuracy) {
		if (other !== undefined) {
			return (
				this._formula === other._formula &&
				this.isValueEqualTo(other._value, accuracy)
			);
		}
		return false;
	}

	/**
	 * A convenience method to check expression equality to either a passed expression or value. </br>
	 * <b>Note:</b> if the parameter is an expression this method has the same effect as calling
	 * {{#crossLink "BooleanExpression/isEqualTo:method"}}{{/crossLink}}. If it is a value
	 * <code>true</code> is only returned if this expression has no formula and its current value is
	 * equal to given value. <br>
	 * To check only equality of values call
	 * {{#crossLink "BooleanExpression/isValueEqualTo:method"}}{{/crossLink}}.
	 *
	 * @method isEqualToExpressionOrValue
	 * @param {BooleanExpression|Object} other The expression or value to check equality against
	 * @return {Boolean} <code>true</code> if this expression equals passed expression or value, <code>false</code>
	 *     otherwise
	 */
	isEqualToExpressionOrValue(other, accuracy) {
		if (other instanceof Expression) {
			return this.isEqualTo(other, accuracy);
		}
		// no expression => compare values if we have no formula
		if (this._formula === undefined) {
			return this.isValueEqualTo(other, accuracy);
		}
		return false;
		// our value is derived by a formula...
	}

	/**
	 * Returns <code>true</code> if this expression has the same value as the given value.
	 * Note that the current expression value might depend on an inner formula. </br>
	 * Subclasses might overwrite this function, default implementation simply comparey by <code>===<code>.
	 *
	 * @method isValueEqualTo
	 * @param {Object} value The value object to check equality against
	 * @return {Boolean} <code>true</code> if this expression value equals given one, <code>false</code> otherwise
	 */
	isValueEqualTo(value, accuracy) {
		if (accuracy === undefined) {
			return this._value === value;
		}

		return Math.abs(this._value === value) < accuracy;
	}

	getPureValue() {
		return this.getValue();
	}

	/**
	 * Returns the value computed by inner term ({{#crossLink "Term"}}{{/crossLink}}).
	 * If term is undefined the current value is returned.
	 * @method getValue
	 * @return {Object|Number|String} the current expression value
	 */
	getValue() {
		if (this._term) {
			const val = this._term.value;
			if (val === undefined) {
				this._term = undefined;
			} else {
				this._value = this._constraint
					? this._constraint.getValue(val)
					: val;
			}
		}
		// return this._value;
		return this._constraint && this._constraint.alwaysCheckValue
			? this._constraint.getValue(this._value)
			: this._value;
	}

	/**
	 * Returns the currently used formula.
	 * @method getFormula
	 * @return {String} the currently used formula or <code>undefined</code>
	 */
	getFormula() {
		return this._formula;
	}

	/**
	 * Returns the currently used term.
	 * @method getTerm
	 * @return {Term} the currently used term or <code>undefined</code>
	 */
	getTerm() {
		return this._term;
	}

	/**
	 * Returns the currently used constraint.
	 * @method getConstraint
	 * @return {ExpressionConstraint} the currently used constraint
	 */
	getConstraint() {
		return this._constraint;
	}

	/**
	 * Returns <code>true</code> if this expression is locked. Locked means that neither its value nor
	 * its formula or term can be changed.
	 * @method isLocked
	 * @return <code>true</code> if this expression is locked, <code>false</code> otherwise
	 */
	isLocked() {
		return this._isLocked;
	}

	/**
	 * Specify <code>true</code> to lock this expression or <code>false</code> to unlock it. Lock means
	 * that neither the expression value nor its formula or term can be changed.
	 * @method setLocked
	 * @param {Boolean} doIt <code>true</code> to lock expression, <code>false</code> to unlock it
	 * @return {Boolean} <code>true</code> if this expression was changed, <code>false</code> otherwise
	 */
	setLocked(doIt) {
		if (this._isLocked !== doIt) {
			this._isLocked = doIt;
			return true;
		}
		return false;
	}

	/**
	 * Returns <code>true</code> if this expression has a defined formula.
	 * @method hasFormula
	 * @return <code>true</code> if this expression has a formula, <code>false</code> otherwise
	 */
	hasFormula() {
		return this._formula !== undefined;
	}

	/**
	 * Returns <code>true</code> if this expression has a defined term.
	 * @method hasTerm
	 * @return <code>true</code> if this expression has a term, <code>false</code> otherwise
	 */
	hasTerm() {
		return this._term !== undefined;
	}

	/**
	 * Sets the constraint to use for this expression.
	 * @method setConstraint
	 * @param {ExpressionConstraint} constraint The new constraint to use
	 * @return {Boolean} <code>true</code> if this expression was changed, <code>false</code> otherwise
	 */
	setConstraint(constraint) {
		if (constraint !== undefined) {
			if (this._constraint !== constraint) {
				this._constraint = constraint;
				return true;
			}
		}
		return false;
	}

	/**
	 * Sets the new expression value. </br>
	 * <b>Note:</b> this will not affect a defined formula or term. That means if a term is defined this
	 * expression can still return a different value than it was set here.
	 * @method setValue
	 * @param {Object|Number|String} value The new value to use
	 * @return {Boolean} <code>true</code> if this expression was changed, <code>false</code> otherwise
	 */
	setValue(value) {
		if (
			this._isLocked ||
			(this._constraint && !this._constraint.isValid(value))
		) {
			return false;
		}
		if (!this.isValueEqualTo(value)) {
			this._value = value;
			return true;
		}
		return false;
	}

	/**
	 * Sets the new expression formula. </br>
	 * <b>Note:</b> this will not affect a defined term. Call <code>evaluate</code> to
	 * automatically change term correspondingly.
	 * See {{#crossLink "BooleanExpression/evaluate:method"}}{{/crossLink}} too.
	 * @method setFormula
	 * @param {String} formula The new formula to use.
	 * @return {Boolean} <code>true</code> if this expression was changed, <code>false</code> otherwise
	 */
	setFormula(formula) {
		if (!this._isLocked && this._formula !== formula) {
			this._formula = formula;
			this._isDirty = true;
			return true;
		}
		return false;
	}

	/**
	 * Sets the new expression term. </br>
	 * <b>Note:</b> this will not affect a defined formula.
	 * @method setTerm
	 * @param {Term} term The new term to use
	 * @return {Boolean} <code>true</code> if this expression was changed, <code>false</code> otherwise
	 */
	setTerm(term) {
		if (!this._isLocked && !this._equalTerms(this._term, term)) {
			this._isDirty = this._formula !== undefined;
			if (term !== undefined) {
				this._term = term.copy();
			} else {
				this._term = undefined;
			}
			return true;
		}
		return false;
	}

	_equalTerms(t1, t2) {
		return t1 ? t1.isEqualTo(t2) : !t2;
	}

	/**
	 * Sets this expression to given one. After calling this method both expressions are equal in the
	 * sense of {{#crossLink "BooleanExpression/isEqualTo:method"}}{{/crossLink}}.</br>
	 * <b>Note:</b> this will change this expression, no matter if it is locked or not!
	 * @method setTo
	 * @param {BooleanExpression} expression The new expression
	 * @return {Boolean} <code>true</code> if this expression was changed, <code>false</code> otherwise
	 */
	setTo(expression) {
		let changed = false;
		if (expression !== undefined) {
			// to allow setting of new expression
			this._isLocked = false;
			changed = this.set(
				expression.getValue(),
				expression.getFormula(),
				expression.getTerm()
			);
			this._isLocked = expression._isLocked;
		}
		return changed;
	}

	/**
	 * Sets expression value, formula and or term directly.
	 *
	 * @method set
	 * @param {Object|Number|String} value The new value to use
	 * @param {String} formula The new formula to use
	 * @param {Term} term The new term to use
	 * @return {Boolean} <code>true</code> if this expression was changed, <code>false</code> otherwise
	 */
	set(value, formula, term) {
		let changed = false;
		changed = this.setValue(value) || changed;
		changed = this.setTerm(term) || changed;
		changed = this.setFormula(formula) || changed;
		return changed;
	}

	/**
	 * Convenience method. If passed value is an expression calling this function has same effect as
	 * calling {{#crossLink "BooleanExpression/setTo:method"}}{{/crossLink}} otherwise it
	 * simply sets given value as new value and clears term and formula.
	 *
	 * @method setExpressionOrValue
	 * @param {BooleanExpression|Object} value The new value or <code>Expression</code> to set.
	 * @return {Boolean} <code>true</code> if this expression was changed, <code>false</code> otherwise
	 */
	setExpressionOrValue(value) {
		if (value instanceof Expression) {
			return this.setTo(value);
		}

		// clears formula and term!!
		return this.set(value);
	}

	/**
	 * Invalidates the term. This can be used, if references within a formula changed to recreate the term and its
	 * references
	 *
	 * @method invalidateTerm
	 */
	invalidateTerm() {
		this._isDirty = true;
	}

	/**
	 * Evaluates the expression formula and creates and sets inner {{#crossLink "Term"}}{{/crossLink}}.
	 * The optional passed item is used to resolve specified references within formula.
	 *
	 * @method evaluate
	 * @param {GraphItem} [item] Used to resolve references.
	 */
	evaluate(item) {
		if (this._formula === undefined) {
			// no formula, clear context!! => important!! e.g. parent changes with no/existing formula
			// should always be evaluated to get correct results... (undo/redo bug)
			this._ctxtPath = undefined;
		} else if (this._isDirty || !this._isContextEqualTo(item)) {
			const graph = item !== undefined ? item.getGraph() : undefined;
			const locked = this._isLocked;
			this._isLocked = false;
			try {
				this.setTerm(
					JSG.FormulaParser.parse(this._formula, graph, item)
				);
				this._isDirty = false;
			} catch (err) {
				/* we currently fail silently... */
				// console.error(err);
				JSG.debug.logError(
					`Failed to evaluate formula '${this._formula}'!`,
					err
				);
			}
			this._isLocked = locked;
		}
	}

	_isContextEqualTo(item) {
		let path = item !== undefined ? item.createPath() : undefined;
		if (path !== undefined) {
			path = path.toString();
			const equals = this._ctxtPath === path;
			this._ctxtPath = path;
			return equals;
		}
		// not added items are always evaluated...
		this._ctxtPath = undefined;
		return false;
	}

	/**
	 * Resolves parent references within inner formula string.</br>
	 * The passed GraphItem is used to resolve its parent and the optional <code>doRemove</code>
	 * flag can be used to clear the complete formula.
	 *
	 * @method resolveParentReference
	 * @param {GraphItem} item Used to resolve parent reference.
	 * @param {Boolean} [doRemove] Specify <code>true</code> to remove inner formula completely.
	 */
	resolveParentReference(item, doRemove) {
		if (
			this._formula !== undefined &&
			this._formula.toLowerCase().indexOf('parent') !== -1
		) {
			if (doRemove) {
				this.setFormula(undefined);
			} else if (item !== undefined) {
				const parentstr = `Item.${this.getParent().getId()}`;
				this.setFormula(this._formula.replace('Parent', parentstr));
			}
		}
	}

	/**
	 * Returns a string representation of this expression.
	 *
	 * @method toString
	 * @param {GraphItem} [forItem] Used to resolve references.
	 * @return {String} String representation of this expression
	 */
	toString(...params) {
		if (this._formula !== undefined) {
			return this._formula;
		}

		if (this._term !== undefined) {
			return this._term.toString(...params);
		}

		const value = this.getValue();
		return value !== undefined ? value.toString() : '';
	}

	/**
	 * Returns a string representation of this expression with respect to specified locale.</br>
	 * The locale should be specified either as a string, e.g. <code>de<code> or <code>de-DE<code>, or as an object.
	 * If an object is passed either use one of the predefined <code>Locale</code> objects or specify an object which
	 * provides a separators property like following:
	 * <code> locale = { separators: { decimal: '.', parameters: ',' } };</code>
	 *
	 * @method toLocaleString
	 * @param {Object|String} [locale] An optional locale object or string which specifies the locale to use.
	 * @param {GraphItem} [forItem] Used to resolve references.
	 * @return {String} String representation of this expression
	 */
	toLocaleString(locale, ...params) {
		// let str = this._formula != null ? this._formula : null;
		let str =
			this._term != null
				? `=${this._term.toLocaleString(locale, ...params)}`
				: null;
		if (str == null) {
			const value = this.getValue();
			str = value == null ? '' : null;
			if (typeof value === 'boolean') {
				str = value.toString().toUpperCase();
			}
			str =
				str ||
				(Numbers.isNumber(value)
					? Locale.localizeNumber(value, locale)
					: `${value}`);
		}
		return str;
	}

	/**
	 * Returns a string representation of this expression using item names.
	 *
	 * @method toString
	 * @param {GraphItem} [forItem] Used to resolve references.
	 * @param {boolean} [useName] True to use name of item.
	 * @return {String} String representation of this expression
	 */
	toStringUsingName(forItem) {
		if (this._term !== undefined) {
			return Strings.decode(this._term.toString(forItem, true));
		}

		const value = this.getValue();
		return value !== undefined ? value.toString() : '';
	}

	correctFormula(forItem) {
		if (this._term !== undefined) {
			this._formula = this._term.toString(
				{ item: forItem, useName: true },
				true
			);
			this._isDirty = true;
			this.evaluate(forItem);
		}
	}

	/**
	 * Only used during loading...
	 *
	 * @method _setTerm
	 * @param {Term} term The term to set.
	 * @private
	 */
	_setTerm(term) {
		const locked = this._isLocked;
		this._isLocked = false;
		this.setTerm(term);
		this._isLocked = locked;
	}

	/**
	 * Saves this Expression to XML.<br/>
	 * To customize saving subclasses should overwrite the various <code>_write</code> methods.
	 *
	 * @method save
	 * @param {String} name Name of created xml tag.
	 * @param {Writer} writer Writer object to save to.
	 */
	save(name, writer, decimals) {
		writer.writeStartElement(name);

		if (this._formula !== undefined) {
			this._writeFormulaAttribute(writer);
		} else if (this._term !== undefined) {
			this._writeTermAttribute(writer);
		}

		this._writeValueAttribute(writer, decimals);
		this._writeValueTypeAttribute(writer);

		if (this._isLocked) {
			writer.writeAttributeString('locked', 'true');
		}

		if (this._constraint && this._constraint.doSave(this)) {
			this._writeConstraint('cstr', writer);
		}

		writer.writeEndElement();
	}

	/**
	 * Saves the formula of this Expression to XML in an encoded format.</br>
	 * An optional <code>formula</code> string could be passed. This is useful whenever an adjusted
	 * formula should be written without changing inner formula.
	 *
	 * @method _writeFormulaAttribute
	 * @param {Writer} writer Writer object to save to.
	 * @param {String} [formula] An optional formula String to be written instead. If not given intern one is used.
	 * @private
	 */
	_writeFormulaAttribute(writer, formula) {
		formula = formula || this._formula;
		writer.writeAttributeString('f', Strings.encode(formula));
	}

	/**
	 * Saves the term of this Expression to XML in an encoded format.
	 *
	 * @method _writeTermAttribute
	 * @param {Writer} writer Writer object to save to.
	 * @private
	 */
	_writeTermAttribute(writer) {
		writer.writeAttributeString('f', Strings.encode(this._term.toString()));
	}

	/**
	 * Saves the value of this Expression to XML.
	 *
	 * @method _writeValueAttribute
	 * @param {Writer} writer Writer object to save to.
	 * @private
	 */
	_writeValueAttribute(writer) {
		if (this._value !== undefined) {
			writer.writeAttributeString(
				'v',
				Strings.encode(this._value.toString())
			);
		}
		// DON'T USE getValue() BECAUSE WE MIGHT WANT TO SAVE A DIFFERENT VALUE...
		// writer.writeAttributeString("v", this.getValue().toString().encode());
	}

	/**
	 * Saves a value type description to XML.
	 *
	 * @method _writeValueTypeAttribute
	 * @param {Writer} writer Writer object to save to.
	 * @private
	 */
	_writeValueTypeAttribute(writer) {
		const type = typeof this._value;
		if (type[0] !== 'n') {
			writer.writeAttributeString('t', type[0]);
		}
	}

	/**
	 * Asked registered constraint to save itself by calling its <code>save</code> method.<br/>
	 * Note: this method is only called if {{#crossLink
	 * "ExpressionConstraint/doSave:method"}}{{/crossLink}} returns <code>true</code>.
	 *
	 * @method _writeConstraint
	 * @param {String} tag The tag name under which the constraint should be saved.
	 * @param {Writer} writer Writer object to save to.
	 */
	_writeConstraint(tag, writer) {
		writer.writeStartElement(tag);
		writer.writeAttributeString('cl', this._constraint.getClassString());
		this._constraint.save(writer);
		writer.writeEndElement();
	}

	/**
	 * Reads an expression.<br/>
	 * To customize reading subclasses should overwrite the various <code>_read</code> methods.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use.
	 * @param {Node} node Node to read from.
	 */
	read(reader, node) {
		const value = this._readValueAttribute(reader, node);
		const formula = this._readFormulaAttribute(reader, node);
		const constraint = this._readConstraint(reader, node);
		const locked = reader.getAttribute(node, 'locked');

		this._isLocked = false;
		this.set(value, formula);
		this.setConstraint(constraint);
		this._isLocked = locked && locked === 'true';
	}

	/**
	 * Reads and decodes an expression formula.
	 *
	 * @method _readFormulaAttribute
	 * @param {Reader} reader Reader to use.
	 * @param {Node} node Node to read from.
	 */
	_readFormulaAttribute(reader, node) {
		let formula = reader.getAttribute(node, 'f');
		if (formula === undefined) {
			return undefined;
		}

		formula = Strings.decode(formula);
		if (JSG.idUpdater.isActive && formula.indexOf('Item.', 0) !== -1) {
			JSG.idUpdater.addExpression(this);
		}
		return formula;
	}

	/**
	 * Reads the expression.
	 *
	 * @method _readValueAttribute
	 * @param {Reader} reader Reader to use.
	 * @param {Object} node An object to read from.
	 * @return {Boolean|Number|String} The loaded expression value.
	 */
	_readValueAttribute(reader, node) {
		let type = reader.getAttribute(node, 't');
		// "number";
		let value = reader.getAttribute(node, 'v');

		if (type === undefined) {
			type = 'number';
		}

		if (value === undefined) {
			value = 0;
		} else if (type === 'number' || type === 'n') {
			value = Number(value);
		} else if (type === 'boolean' || type === 'b') {
			value = value === 'true';
		} else {
			value = Strings.decode(value);
		}

		return value;
	}

	/**
	 * Creates and reads constraint.
	 *
	 * @method _readConstraint
	 * @param {Reader} reader Reader to use.
	 * @param {Object} node An object to read from.
	 * @return {ExpressionConstraint} The created and loaded expression constraint instance or <code>undefined</code>.
	 */
	_readConstraint(reader, node) {
		let constraint;
		const constrnode = reader.getObject(node, 'cstr');
		const classname = constrnode && reader.getAttribute(constrnode, 'cl');

		if (classname) {
			constraint = ObjectFactory.create(classname);
			if (constraint) {
				constraint.read(reader, constrnode);
			}
		}
		return constraint;
	}

	getFunctionName() {
		const termFunc = this.getTerm();
		if (termFunc instanceof Term.Func) {
			return termFunc.getFuncId();
		}
		return undefined;
	}
}

module.exports = Expression;
