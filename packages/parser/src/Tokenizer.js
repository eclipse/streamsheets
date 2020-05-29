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
const ParserError = require('./ParserError');
const ErrorCode = require('./ErrorCodes');

const KEY_CODES = {
	QUOTE: 34,
	// SPECIAL QUOTES:
	LEFT_QUOTE: 8220,
	RIGHT_QUOTE: 8221,
	OPAREN: 40,
	CPAREN: 41,
	OBRACKET: 91,
	CBRACKET: 93,
	COMMA: 44,
	POINT: 46,
	EQUAL: 61,
	QMARK: 63,
	SEMICOLON: 59,
	SPACE: 32,
	TAB: 9,
	BSLASH: 92,
	PARAM_SEP: 44,
	DECIMAL_SEP: 46
};

// operators:
const UNARY_OPS = {
	'-': 12,
	'+': 12,
	'!': 12
};
// think we do not need precedence values for units...
const UNIT_OPS = [ '%' ];
const BINARY_OPS = {
	'^': 11,
	'*': 10,
	'/': 10,
	'+': 8,
	'-': 8,
	'%': 8
};
const BOOL_OPS = {
	'>': 6,
	'>=': 6,
	'<': 6,
	'<=': 6,
	'=': 4,
	'==': 4,
	'!=': 4,
	'<>': 4,
	'|': 2,
	'&': 2
};


const chregex = new RegExp(/\w/);
const octalregex = new RegExp(/x/gi);

let index = 0;	// current index
let length;		// expression length
let ch;			// current character code
let expr;		// expression to parse
let ctxt;		// parsing context, provides defined functions...

function keyCode(char) {
	return char != null ? char.charCodeAt(0) : undefined;
}

function throwException(msg, atIndex, code) {
	const throwIt = !ctxt.ignoreErrors;
	if (throwIt) {
		msg = `${msg} at index ${atIndex}`;
		throw ParserError.create({ name: 'Parser Error', message: msg, index: atIndex, code });
	}
	return throwIt;
}

function skipWhiteSpace() {
	while ((index < length) && (!ch || ch === KEY_CODES.TAB || ch === KEY_CODES.SPACE)) {
		ch = expr.charCodeAt(index);
		index += 1;
	}
}

function isQuote(code) {
	return code === KEY_CODES.QUOTE || code === KEY_CODES.LEFT_QUOTE || code === KEY_CODES.RIGHT_QUOTE;
}
function isDigit(code) {
	// test against separator here to recognize (e.g.) .5 too...
	return code === KEY_CODES.DECIMAL_SEP || (code >= 48 && code <= 57);
}
function isOctal(code) {
	return (code >= 65 && code <= 70) || (code >= 97 && code <= 102);
}
function isBinaryOperatorStr(str) {
	return (BINARY_OPS.hasOwnProperty(str) || BOOL_OPS.hasOwnProperty(str));
}
function isUnaryOperator(c) {
	const chstr = String.fromCharCode(c);
	return UNARY_OPS.hasOwnProperty(chstr);
}
function isUnitOperator(c) {
	const chstr = String.fromCharCode(c);
	return UNIT_OPS.includes(chstr);
}

function isValidIdentifier(_ch) {
	let valid = true;
	switch (_ch) {
	case KEY_CODES.QUOTE:
	case KEY_CODES.LEFT_QUOTE:
	case KEY_CODES.RIGHT_QUOTE:
	case KEY_CODES.OPAREN:
	case KEY_CODES.CPAREN:
	case KEY_CODES.OBRACKET:
	case KEY_CODES.CBRACKET:
	case KEY_CODES.COMMA:
	case KEY_CODES.SEMICOLON:
	case KEY_CODES.EQUAL:
	case KEY_CODES.QMARK:
	case KEY_CODES.SPACE:
	case KEY_CODES.TAB:
	case KEY_CODES.BSLASH:
	case KEY_CODES.PARAM_SEP:
	// case POINT: <-- we use it e.g. for attribute IDs: model.attributes
		valid = false;
		break;
	default:
		valid = true;
	}
	return !!valid;
}
function precedenceOfBinary(op) {
	let prec = 0;
	if (BINARY_OPS.hasOwnProperty(op)) {
		prec = BINARY_OPS[op];
	} else if (BOOL_OPS.hasOwnProperty(op)) {
		prec = BOOL_OPS[op];
	}
	return prec;
}

function isOperator(c1, c2) {
	const op = String.fromCharCode(c1);
	return isBinaryOperatorStr(op) || (c2 ? isBinaryOperatorStr(op + String.fromCharCode(c2)) : false);
}

function parseConditionPart() {
	let exp;
	if (index <= length && ch !== KEY_CODES.PARAM_SEP && ch !== KEY_CODES.CPAREN) {
		// eslint-disable-next-line
		exp = parseExpression(true);
		skipWhiteSpace();
	} else if (!throwException('Expecting expression', index, ErrorCode.EXPECTED_EXPRESSION)) {
		index = index < length ? index : length;
		exp = { type: 'undef', isInvalid: true, start: index, end: index };
		ch = expr.charCodeAt(index);
		index += 1;
	}
	return exp;
}
function skipSeparator() {
	const skip = ch === KEY_CODES.PARAM_SEP;
	if (skip) {
		// move on
		ch = expr.charCodeAt(index);
		index += 1;
	}
	return skip;
}
function parseConditionTrueFalse(cond) {
	let exp;
	if (index < length && ch !== KEY_CODES.CPAREN) {
		// if condition given it expects separator next
		if (!skipSeparator() && cond) {
			cond.isInvalid = true;
			throwException(
				`Expecting '${String.fromCharCode(KEY_CODES.PARAM_SEP)}'`,
				index,
				ErrorCode.EXPECTED_SEPARATOR
			);
		}
		// eslint-disable-next-line
		exp = parseExpression(true);
		skipWhiteSpace();
	}
	index = index < length ? index : length;
	return exp || { type: 'undef', isInvalid: true, start: index, end: index }
}
// condition: ?(condition, doOnTrue, doOnFalse)
function parseCondition() {
	const cond = { type: 'condition', start: index - 1 };
	ch = expr.charCodeAt(index);
	index += 1;
	skipWhiteSpace();
	if (ch !== KEY_CODES.OPAREN && !throwException('Expecting "("', index, ErrorCode.EXPECTED_BRACKET_LEFT)) {
		index -= 1; // move index one back, to get this character again when move on...
		cond.isInvalid = true;
	}
	ch = expr.charCodeAt(index);
	index += 1;
	cond.condition = parseConditionPart();
	cond.onTrue = parseConditionTrueFalse(cond);
	cond.onFalse = parseConditionTrueFalse();
	if (index > length) index = length;
	cond.end = index;
	if (ch !== KEY_CODES.CPAREN && !throwException('Expecting ")"', index, ErrorCode.EXPECTED_BRACKET_RIGHT)) {
		// index -= 1; // move index one back, to get this character again when move on...
		cond.isInvalid = true;
	} else {
		 // move on...
		ch = expr.charCodeAt(index); // move on...
		index += 1;
	}
	return cond;
}

function parseOctalNumber(nr) {
	const token = { type: 'number', start: index - 1};
	while (isDigit(ch) || isOctal(ch)) {
		nr += String.fromCharCode(ch);
		ch = expr.charCodeAt(index);
		index += 1;
	}
	token.value = `${parseInt(nr, 16)}`;
	token.end = index - 1;
	return token;
}

function parseString(prefix) {
	let str = prefix || '';
	const token = { type: 'string', start: index - 1, constant: true };
	while (index < length) {
		ch = expr.charCodeAt(index);
		index += 1;
		if (isQuote(ch)) {
			break;
		} else {
			str += String.fromCharCode(ch);
			if (ch === KEY_CODES.BSLASH) {
				str += expr.charAt(index);
				ch = expr.charCodeAt(index);
				index += 1;
			}
		}
		// 	/* DL-1111 2x quotes should be handled as 1
		// 	this is wrong and this is not that easy since result will be invalid if parsed again!
		// 	e.g: '"abc""def"' => results in '"abc"def"' => if parsed again => ERROR!!
		// 	if (isQuote(ch)) {
		// 		ch = expr.charCodeAt(index);
		// 		index += 1;
		// 	} else {
		// 		break;
		// 	}
		// 	*/
	}
	token.end = index;
	token.value = str;
	if (isQuote(ch)) {
		ch = expr.charCodeAt(index);
		index += 1;
	}
	return token;
}

function parseNumber() {
	let nr = '';
	let parsedSeparator = false;
	const start = index - 1;
	while (isDigit(ch) || ch === 101 || ch === 69) { // 'e' || 'E'
		const sepch = ch === KEY_CODES.DECIMAL_SEP;
		if (sepch && parsedSeparator) {
			index -= 1;
			break;
		}
		parsedSeparator = parsedSeparator || sepch;
		nr += sepch ? '.' : String.fromCharCode(ch);
		if (ch === 101 || ch === 69) {
			// next must be either a digit or a sign -/+ ...
			nr += expr.charAt(index);
			index += 1;
		}
		ch = expr.charCodeAt(index);
		index += 1;
	}
	// 'x' || 'X' => it should be an octal number
	if (ch === 120 || ch === 88) {
		nr += String.fromCharCode(ch);
		ch = expr.charCodeAt(index);
		index += 1;
		return parseOctalNumber(nr);
	}
	// if number is followed by a character => switch to identifier...
	const char = String.fromCharCode(ch);
	// eslint-disable-next-line
	if (char === ':' || chregex.test(char)) return parseIdentifier(nr);
	return {
		end: index - 1,
		start,
		type: 'number',
		value: nr
	};
}

function parseGroup() {
	// start parsing a group, must be closed by parenthesis...
	// if not throw exception...
	ch = expr.charCodeAt(index);
	index += 1;
	// eslint-disable-next-line
	const group = parseExpression(true);
	skipWhiteSpace();
	if (ch !== KEY_CODES.CPAREN && !throwException('Missing )', index, ErrorCode.EXPECTED_BRACKET_RIGHT)) {
		index -= 1;
		if (group) {
			group.isInvalid = true;
		}
	}
	ch = expr.charCodeAt(index);
	index += 1;
	return group;
}
function parseIdentifier(prefix) {
	const token = { type: 'identifier', start: index - 1};
	// we simply add characters until we reach space, tab or binary op....
	let identifier = prefix || '';
	identifier += Number.isNaN(ch) ? '' : String.fromCharCode(ch);
	while (index < length) {
		ch = expr.charCodeAt(index);
		index += 1;
		const ch2 = expr.charCodeAt(index);
		if (ch === KEY_CODES.QMARK || !isValidIdentifier(ch) || isOperator(ch, ch2)) {
			break;
		}
		identifier += String.fromCharCode(ch);
	}
	token.end = token.start + identifier.length;
	token.value = identifier;
	return token;
}

function toNumberNode(valstr) {
	let node;
	// filter out octal numbers...
	if (!octalregex.test(valstr)) {
		// eslint-disable-next-line no-nested-ternary
		let nrstr = ctxt.separators.decimal !== '.'
			? (valstr.indexOf('.') < 0 ? valstr.replace(ctxt.separators.decimal, '.') : undefined)
			: valstr;
		// DL-1808: number can end with a unit...
		let unitop;
		if (nrstr) {
			for (let i = 0; i < UNIT_OPS.length; i += 1) {
				unitop = UNIT_OPS[i];
				unitop = nrstr.endsWith(unitop) ? unitop : null;
				if (unitop) nrstr = nrstr.substr(0, nrstr.length - unitop.length);
			};
		}
		if (!Number.isNaN(Number(nrstr))) {
			node = { type: 'number', value: nrstr };
			if (unitop) node = { type: 'unaryop', operator: unitop, arg: node };
		}
	}
	return node;
}
function parseValue(rawval) {
	return toNumberNode(expr) || { type: 'string', value: expr, rawval };
}

function parseParams(forList) {
	const params = [];
	const closeCh = forList ? KEY_CODES.CBRACKET : KEY_CODES.CPAREN;
	while (ch !== closeCh) { // KEY_CODES.CPAREN) {
		// eslint-disable-next-line
		const param = parseExpression(true) || { type: 'undef', start: index - 1, end: index };
		params.push(param);
		skipWhiteSpace();
		if (ch === KEY_CODES.PARAM_SEP) {
			ch = expr.charCodeAt(index);
			index += 1;
			// special case: ,)
			if (ch === closeCh) { // KEY_CODES.CPAREN) {
				params.push({ type: 'undef', start: index - 1, end: index });
			}
		} else if (ch !== closeCh) { // KEY_CODES.CPAREN) {
			const errmsg = index < length
				? `Expected ${String.fromCharCode(KEY_CODES.PARAM_SEP)}`
				: `Missing ${String.fromCharCode(closeCh)}`;
			const errcode = index < length ? ErrorCode.EXPECTED_SEPARATOR : ErrorCode.EXPECTED_BRACKET_RIGHT;
			if (!throwException(errmsg, index, errcode)) {
				// throw error:
				// index -= 1;
				params.invalid = true;
				break;
			}
		}
	}
	if (ch === closeCh) { // KEY_CODES.CPAREN) {
		ch = expr.charCodeAt(index);
		index += 1;
	}
	return params;
}

function parseList() {
	const token = { type: 'list', start: index - 1};
	ch = expr.charCodeAt(index);
	index += 1;
	const params = parseParams(true);
	token.params = params;
	token.invalid = !!params.invalid;
	token.end = index - 1;
	return token;
}

function parseFunctionOrIdentifier() {
	let op = parseIdentifier();
	skipWhiteSpace();
	if (ch === KEY_CODES.OPAREN) {
		// we expecting a function:
		const fname = ctxt.hasFunction(op.value) ? op.value : undefined;
		if (fname) {
			ch = expr.charCodeAt(index);
			index += 1;
			const params = parseParams();
			op = {
				end: index - 1,
				start: op.start,
				type: 'function',
				value: fname,
				params
			};
			op.isInvalid = !!params.invalid;
			if (op.isInvalid && index >= length) op.end = length;
		} else {
			const idx = op.value ? index - op.value.length : index;
			throwException(`Unknown function "${op.value}"`, idx - 1, ErrorCode.UNKNOWN_FUNCTION);
			// no exception thrown, we simply ignore. op should be an identifier at least...
			op.isInvalid = true; // mark it as invalid...
		}
	}
	return op;
}

function parseUnary(arg) {
	// currently all unary operations are single characters...
	const op = String.fromCharCode(ch);
	const token = { type: 'unaryop', start: index - 1, operator: op };
	ch = expr.charCodeAt(index);
	index += 1;
	// eslint-disable-next-line
	token.arg = arg || parseOperand();
	token.end = index - 1;
	return token;
}

function parseOperand() {
	skipWhiteSpace();
	let op;
	if (isDigit(ch)) {
		op = parseNumber();
		// currently all unit operations are single characters...
		op = isUnitOperator(ch) ? parseUnary(op) : op;
	} else if (ch === KEY_CODES.QMARK) {
		op = parseCondition();
	} else if (isQuote(ch)) { // === KEY_CODES.QUOTE) {
		op = parseString();
		// DL-1253: have to check if string is terminated by closing quote...
		if (index >= length
			&& !isQuote(expr.charCodeAt(index - 2))
			&& !throwException('Expecting "', index - 1, ErrorCode.EXPECTED_QUOTE)) {
			op.isInvalid = true;
		}
	} else if (ch === KEY_CODES.OBRACKET) {
		op = parseList();
	} else if (ch === KEY_CODES.OPAREN) {
		op = parseGroup();
		if (op) {
			op.useBrackets = true;
			// currently all unit operations are single characters...
			op = isUnitOperator(ch) ? parseUnary(op) : op;
		}
	} else if (isUnaryOperator(ch)) {
		op = parseUnary();
	} else if (ch === KEY_CODES.CPAREN || ch === KEY_CODES.PARAM_SEP) {
		// closing parenthesis => we are inside a group expression
		// or a comma which signals next term  => in both cases go on with undef operand, so
		op = { type: 'undef', start: index - 1, end: index };
	} else if (ch != null && !isNaN(ch)) {
		op = parseFunctionOrIdentifier();
		// currently all unit operations are single characters...
		op = isUnitOperator(ch) ? parseUnary(op) : op;
	} else {
		op = { type: 'undef', isInvalid: true, start: index - 1, end: index };
	}
	return op;
}

function parseOperator() {
	skipWhiteSpace();
	const start = index - 1;
	let op = String.fromCharCode(ch);
	// for >=, ==, <=, !=...
	const nxt = op + String.fromCharCode(expr.charCodeAt(index));
	if (isBinaryOperatorStr(nxt)) {
		op = nxt;
		index += 1; // skip char
	} else if (!isBinaryOperatorStr(op)) {
		op = undefined;
	}
	if (op != null) {
		ch = expr.charCodeAt(index);
		op = { end: index, start, symbol: op };
		index += 1;
	}
	return op;
}

function createBinaryNode(left, operator, right) {
	return {
		type: 'binaryop',
		operator: operator.symbol,
		end: right.end,
		start: left.start,
		left,
		right
	};
}

function parseRight(left, operator) {
	let right = parseOperand();
	if (!right && !throwException(`Missing expression after ${operator.symbol}`, index, ErrorCode.EXPECTED_EXPRESSION)) {
		right = { type: 'undef', isInvalid: true, start: index - 1, end: index };
	}
	// stack required for moving & rearranging nodes according to operators precedence
	const treestack = [left, operator, right];
	let node;
	let nextop;
	// while we still have operators...
	// eslint-disable-next-line
	while ((nextop = parseOperator())) {
		const prec = precedenceOfBinary(nextop.symbol);
		if (prec === 0) {
			break;
		}
		// move operator plus its operand according to its precedence
		while ((treestack.length > 2) && prec <= precedenceOfBinary(treestack[treestack.length - 2].symbol)) {
			right = treestack.pop();
			operator = treestack.pop();
			left = treestack.pop();
			node = createBinaryNode(left, operator, right);
			treestack.push(node);
		}
		// next operand
		right = parseOperand();
		if (!right
			&& !throwException(`Missing expression after ${operator.symbol}`, index, ErrorCode.EXPECTED_EXPRESSION)) {
			right = { type: 'undef', isInvalid: true, start: index - 1, end: index };
		}
		treestack.push(nextop, right);
	}
	// connect operators/operand tree
	node = treestack[treestack.length - 1];
	for (let i = treestack.length - 1; i > 1; i -= 2) {
		node = createBinaryNode(treestack[i - 2], treestack[i - 1], node);
	}
	return node;
}

function parseExpression(isGroupOrParam) {
	skipWhiteSpace();
	const left = parseOperand();
	const operator = parseOperator();
	if (left && operator) {
		return parseRight(left, operator);
	}
	// no operator, run 'til next character
	skipWhiteSpace();
	// operator might was used by unit operator, e.g. %
	if (index <= length && left) {
		if (UNIT_OPS.includes(left.operator) && isBinaryOperatorStr(left.operator)) {
			const right = parseOperand();
			if (right && right.type !== 'undef') {
				const { operator: symbol, start } = left;
				return createBinaryNode(left.arg, { start, symbol }, right);
			}
		} else if (index < length && !isGroupOrParam) {
			// eslint-disable-next-line max-len
			left.isInvalid = !throwException(`Unexpected character: ${expr.charAt(index - 1)}`, index, ErrorCode.UNEXPECTED_CHAR);
		}
	}
	return left;
}

const initWith = (formula = '', context) => {
	ch = undefined;
	// force string, if number given
	formula = String(formula);
	expr = formula.trim();
	index = 0;
	length = formula.length;
	ctxt = context;
	// if not specifed use separators from default locale...
	const separators = context.separators || Locale.DEFAULT.separators;
	KEY_CODES.PARAM_SEP = keyCode(separators.parameter) || KEY_CODES.PARAM_SEP;
	KEY_CODES.DECIMAL_SEP = keyCode(separators.decimal) || KEY_CODES.DECIMAL_SEP;
	if (KEY_CODES.PARAM_SEP === KEY_CODES.DECIMAL_SEP) {
		throw ParserError.create({
			name: 'Parser Error',
			message: 'It is not allowed to use same character for parameter- and decimal-separator!!'
		});
	}
};

class Tokenizer {
	static createAST(formula, context) {
		initWith(formula, context);
		return parseExpression();
	}

	static createValueNode(str, context) {
		initWith(str, context);
		return parseValue(str);
	}

	// UNDER REVIEW, see Operation.js:
	static registerOperation(symbol, type, precedence) {
		// eslint-disable-next-line no-nested-ternary
		const ops = (type === 'unary' ? UNARY_OPS : type === 'bool' ? BOOL_OPS : BINARY_OPS);
		// support others!!
		ops[symbol] = precedence;
	}
	// UNDER REVIEW, see Operation.js:
	static unregisterOperation(symbol, type) {
		if (type == null || type === 'bool') delete BOOL_OPS[symbol];
		if (type == null || type === 'unary') delete UNARY_OPS[symbol];
		if (type == null || type === 'binary') delete BINARY_OPS[symbol];
	}
}

module.exports = Tokenizer;
