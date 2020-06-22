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
const Locale = require('./Locale');
const { Operand, StringOperand } = require('./Operand');
const { Operation } = require('./Operation');
const TermContext = require('./TermContext');

class Term {
	static fromNumber(nr) {
		return new Term(new Operand(Operand.TYPE.NUMBER, nr));
	}

	static fromBoolean(bool) {
		return new Term(new Operand(Operand.TYPE.BOOL, bool));
	}

	static fromString(str) {
		return new Term(new StringOperand(str));
	}

	// val should be a valid json data type, i.e. string, number, boolean, object, array or null...
	static fromValue(val) {
		// object, array, null => converted to string...
		if (typeof val === 'number') {
			return Term.fromNumber(val);
		} 
		if (typeof val === 'boolean') {
			return Term.fromBoolean(val);
		}
		 if (typeof val === 'string') {
			return Term.fromString(val);
		}
		return val ? Term.fromString(val.toString()) : Term.fromString('');
	}

	static withOperator(symbol, ...terms) {
		const term =
			symbol === '?'
				? // eslint-disable-next-line
				  new CondTerm(terms[0], terms[1], terms[2])
				: new Term(undefined, terms[0], terms[1]);
		term.operator = Operation.get(symbol);
		return term;
	}

	constructor(operand, left, right) {
		this.left = left;
		this.right = right;
		this.operand = operand || Operand.UNDEF;
		this.operator = undefined;
		this.useBrackets = false;
		this.isDisposed = false;
		this._invalid = false;
	}

	get value() {
		return this.operator
			? this.operator.calc(this.left, this.right)
			: this.operand.value;
	}

	get isInvalid() {
		return (
			this._invalid ||
			(this.left && this.left.isInvalid) ||
			(this.right && this.right.isInvalid)
		);
	}

	// returns true if term value is only based on static operands, like string, bool, number...
	// NOTE: UNDEF operand is treated as static too!!
	get isStatic() {
		// check for unary operators which might comes from general parsiing with negative numbers...
		return (
			!this.operand.isTypeOf(Operand.TYPE.REFERENCE) &&
			(!this.operator || (this.operator.isTypeOf(Operation.TYPE.UNARY) && this.operator.symbol === '-'))
		);
		// return !this.operator && !this.operand.isTypeOf(Operand.TYPE.REFERENCE);
	}

	get isUnit() {
		return this.hasOperatorOfType(Operation.TYPE.UNIT);
	}

	// can be used by application to perform clean up on custom terms or references
	dispose() {
		if (this.left) this.left.dispose();
		if (this.right) this.right.dispose();
		if (this.operand) this.operand.dispose();
		this.isDisposed = true;
	}

	hasOperandOfType(type) {
		return this.operand && this.operand.isTypeOf(type);
	}

	hasOperatorOfType(type) {
		return this.operator && this.operator.isTypeOf(type);
	}

	_toStr(symbol, leftstr, rightstr) {
		const { operator } = this;
		if (operator.isTypeOf(Operation.TYPE.UNARY)) {
			return operator.toRight ? `${leftstr}${symbol}` : `${symbol}${leftstr}`;
		}
		return `${leftstr}${symbol}${rightstr}`;
	}
	toString(...params) {
		let str;
		const { operator } = this;
		if (operator) {
			const { symbol } = operator;
			const leftstr = this.left ? this.left.toString(...params) : '';
			const rightstr = this.right ? this.right.toString(...params) : '';
			str = this._toStr(symbol, leftstr, rightstr);
		} else {
			str = this.operand.toString(...params);
		}
		return this.useBrackets ? `(${str})` : str;
		// do not extract to a common localizedString() method because we want to keep both separated, because
		// it should be clear which one to override in subclasses for which purpose!! And toLocaleString() maybe
		// enhanced in future versions
		// return this._localizedString(Separators.DEFAULT, ...params);
	}

	/* locale: an optional object which specifies separators to use as decimal and parameter characters... */
	toLocaleString(locale, ...params) {
		let str;
		const { operator } = this;
		if (operator) {
			const { symbol } = operator;
			const leftstr = this.left ? this.left.toLocaleString(locale, ...params) : '';
			const rightstr = this.right ? this.right.toLocaleString(locale, ...params) : '';
			str = this._toStr(symbol, leftstr, rightstr);
		} else {
			str = this.operand.toLocaleString(locale, ...params);
		}
		return this.useBrackets ? `(${str})` : str;
	}

	toStringWithBrackets(...params) {
		const str = this.toString(...params);
		return this.operand === Operand.UNDEF ? `(${str})` : str;
	}

	isEqualTo(term) {
		let isEqual = !!term;
		isEqual =
			isEqual &&
			(this.operator
				? this.operator.isEqualTo(term.operator)
				: !term.operator);
		isEqual =
			isEqual &&
			(this.left ? this.left.isEqualTo(term.left) : !term.left);
		isEqual =
			isEqual &&
			(this.right ? this.right.isEqualTo(term.right) : !term.right);
		isEqual =
			isEqual &&
			(this.operand
				? this.operand.isEqualTo(term.operand)
				: !term.operand);
		return isEqual;
	}

	newInstance() {
		return new Term();
	}

	copy() {
		const copy = this.newInstance();
		copy.setTo(this);
		return copy;
	}

	setTo(term) {
		if (term) {
			this.dispose();
			this.left = term.left ? term.left.copy() : undefined;
			this.right = term.right ? term.right.copy() : undefined;
			this.operand = term.operand ? term.operand.copy() : Operand.UNDEF;
			this.operator = term.operator;
			this.useBrackets = term.useBrackets;
		}
	}

	hasCycle(startref) {
		const start = { hasCycle: false, refop: startref };
		const check = this._cycleCheck(start);
		this.traverse(check);
		return start.hasCycle;
	}

	_cycleCheck(start) {
		return (term) => {
			const { operand } = term;
			if (operand && operand.type === Operand.TYPE.REFERENCE) {
				// check cycle first to ignore if we are not initialized yet...
				start.hasCycle = operand.isEqualTo(start.refop);
				// initialize start object on first reference...
				start.refop = start.refop || operand;
			}
			return !start.hasCycle;
		};
	}

	traverse(func, scope, followRefs = true) {
		scope = scope || func;
		let goOn = !!(func ? func.call(scope, this) : true);
		if (goOn) {
			if (followRefs && this.operand && this.operand.type === Operand.TYPE.REFERENCE) {
				goOn = this._followReference(this.operand, func, scope);
			} else {
				goOn = goOn && (this.left ? this.left.traverse(func, scope, followRefs) : goOn);
				goOn = goOn && (this.right ? this.right.traverse(func, scope, followRefs) : goOn);
			}
		}
		return goOn;
	}

	findReferences() {
		if (
			this.operand &&
			this.operand.type === Operand.TYPE.REFERENCE &&
			this.operand.name
		) {
			return [this.operand];
		}
		const left = this.left ? this.left.findReferences() : [];
		const right = this.right ? this.right.findReferences() : [];
		return [...left, ...right];
	}

	_followReference(refop, func, scope) {
		const { target } = refop;
		const term =
			target &&
			(target.term || (target.getTerm ? target.getTerm() : undefined));
		return term ? term.traverse(func, scope) : true;
	}
}

class CondTerm extends Term {
	constructor(condition, truthy, falsy) {
		super();
		this.condstr = '?';
		this.condition = condition;
		this.left = truthy;
		this.right = falsy;
	}

	newInstance() {
		return new CondTerm();
	}

	dispose() {
		super.dispose();
		if (this.condition) this.condition.dispose();
	}

	setTo(term) {
		super.setTo(term);
		this.condstr = term.condstr || '?';
		this.condition = term.condition ? term.condition.copy() : undefined;
	}

	get value() {
		return this.operator.calc(this.condition, this.left, this.right);
	}

	get isInvalid() {
		return super.isInvalid || (this.condition && this.condition.isInvalid);
	}

	get isStatic() {
		return false;
	}

	isTrue() {
		return (
			this.condition &&
			this.condition.operand.isResolved() &&
			!!this.condition.value
		);
	}

	traverse(func, scope, followRefs) {
		const goOn = this.condition
			? this.condition.traverse(func, scope, followRefs)
			: true;
		return goOn && super.traverse(func, scope, followRefs);
	}

	isEqualTo(term) {
		const isEqual = super.isEqualTo(term);
		return (
			isEqual &&
			(this.condition
				? this.condition.isEqualTo(term.condition)
				: !term.condition)
		);
	}

	toString(...params) {
		const cond = this.condition.toString(...params);
		const onTrue = this.left.toString(...params);
		const onFalse = this.right.toString(...params);
		return `${this.condstr}(${cond},${onTrue},${onFalse})`;
	}

	toLocaleString(locale, ...params) {
		const cond = this.condition.toLocaleString(locale, ...params);
		const onTrue = this.left.toLocaleString(locale, ...params);
		const onFalse = this.right.toLocaleString(locale, ...params);
		const separators = Locale.get(locale, Locale.DEFAULT).separators;
		return `${this.condstr}(${cond}${separators.parameter}${onTrue}${
			separators.parameter
		}${onFalse})`;
	}
}

class FuncTerm extends Term {
	constructor(name) {
		super();
		this.name = name;
		this.context = new TermContext(this);
		this.func = undefined;
		this.scope = undefined;
		this.params = undefined;
	}

	newInstance() {
		return new FuncTerm(this.name);
	}

	dispose() {
		super.dispose();
		if (this.params) this.params.forEach((param) => param.dispose());
		this.context.dispose();
		this.context = undefined;
	}

	setTo(term) {
		super.setTo(term);
		this.name = term.name;
		this.func = term.func;
		this.scope = term.scope;
		this.context = term.context.copy(this);
		this.params = term.params ? term.params.map((param) => param.copy()) : undefined;
	}

	get value() {
		// we pass FuncTerm as context on every function call
		let val;
		if (this.func) {
			this.func.term = this;
			// changed default function call, to support old JSG functions we can override this in JSGParserContext...
			val = this.func(this.scope || this.func, ...this.params);
			this.func.term = undefined;
		}
		return val;
	}

	get isInvalid() {
		return super.isInvalid || this.params.some((param) => param.isInvalid);
	}

	get isStatic() {
		return false;
	}

	getFuncId() {
		return this.name;
	}

	isEqualTo(term) {
		let isEqual = super.isEqualTo(term);
		isEqual = isEqual && this.name === term.name;
		return isEqual && this.areParamsEqualTo(term.params);
	}

	areParamsEqualTo(params) {
		const myParams = this.params;
		let equal = myParams
			? params && myParams.length === params.length
			: !params;
		const n = myParams ? myParams.length : 0;
		for (let i = 0; i < n && equal; i += 1) {
			equal = myParams[i].isEqualTo(params[i]);
		}
		return equal;
	}

	// overwrite travers to support cycle detection:
	traverse(func, scope, followRefs) {
		const goOn = super.traverse(func, scope, followRefs);
		return (
			goOn && this._traverseParams(this.params, func, scope, followRefs)
		);
	}

	findReferences() {
		return [].concat(...this.params.map((p) => p.findReferences()));
	}

	_traverseParams(params, func, scope, followRefs) {
		let goOn = true;
		const n = params ? params.length : 0;
		for (let i = 0; i < n; i += 1) {
			if (!params[i].traverse(func, scope, followRefs)) {
				goOn = false;
				break;
			}
		}
		return goOn;
	}

	iterateParams(func, scope) {
		this.params.forEach((param, i) => {
			func.call(scope, param, i);
		});
	}

	toString(...params) {
		const paramstrs = this.params
			? this.params.reduce((strings, param) => {
					strings.push(param.toString(...params));
					return strings;
			  }, [])
			: [];
		return `${this.name.toUpperCase()}(${paramstrs.join(',')})`;
	}

	toLocaleString(locale, ...params) {
		const paramstrs = this.params
			? this.params.reduce((strings, param) => {
					strings.push(param.toLocaleString(locale, ...params));
					return strings;
			  }, [])
			: [];
		const separators = Locale.get(locale, Locale.DEFAULT).separators;
		return `${this.name.toUpperCase()}(${paramstrs.join(
			separators.parameter
		)})`;
	}
}

class ListTerm extends Term {
	constructor() {
		super();
		this.isList = true;
		this.params = undefined;
	}

	newInstance() {
		return new ListTerm();
	}

	dispose() {
		super.dispose();
		if (this.params) this.params.forEach((param) => param.dispose());
	}

	setTo(term) {
		super.setTo(term);
		this.params = term.params
			? term.params.map((param) => param.copy())
			: undefined;
	}

	get value() {
		return this.params ? this.params.map((param) => param.value) : [];
	}

	get isInvalid() {
		return super.isInvalid || this.params.some((param) => param.isInvalid);
	}

	get isStatic() {
		return false;
	}

	isEqualTo(term) {
		const isEqual =
			term && term instanceof ListTerm && super.isEqualTo(term);
		return isEqual && this.areParamsEqualTo(term.params);
	}

	areParamsEqualTo(params) {
		const myParams = this.params;
		let equal = myParams
			? params && myParams.length === params.length
			: !params;
		const n = myParams ? myParams.length : 0;
		for (let i = 0; i < n && equal; i += 1) {
			equal = myParams[i].isEqualTo(params[i]);
		}
		return equal;
	}

	// overwrite travers to support cycle detection:
	traverse(func, scope, followRefs) {
		const goOn = super.traverse(func, scope, followRefs);
		return (
			goOn && this._traverseParams(this.params, func, scope, followRefs)
		);
	}

	findReferences() {
		return [].concat(...this.params.map((p) => p.findReferences()));
	}

	_traverseParams(params, func, scope, followRefs) {
		let goOn = true;
		const n = params ? params.length : 0;
		for (let i = 0; i < n; i += 1) {
			if (!params[i].traverse(func, scope, followRefs)) {
				goOn = false;
				break;
			}
		}
		return goOn;
	}

	toString(...params) {
		const paramstrs = this.params
			? this.params.reduce((strings, param) => {
					strings.push(param.toString(...params));
					return strings;
			  }, [])
			: [];
		return `[${paramstrs.join(',')}]`;
	}

	toLocaleString(locale, ...params) {
		const paramstrs = this.params
			? this.params.reduce((strings, param) => {
					strings.push(param.toLocaleString(locale, ...params));
					return strings;
			  }, [])
			: [];
		const separators = Locale.get(locale, Locale.DEFAULT).separators;
		return `[${paramstrs.join(separators.parameter)}]`;
	}
}

class NullTerm extends Term {
	get value() {
		return null; // <-- return undefined can cause NaN e.g. 1 * undefined!
	}

	newInstance() {
		return new NullTerm();
	}

	toString(/* ...params */) {
		return this.useBrackets ? '()' : '';
	}

	toLocaleString(/* locale, ...params */) {
		return this.toString();
	}
}

module.exports = {
	Term,
	CondTerm,
	FuncTerm,
	ListTerm,
	NullTerm
};
