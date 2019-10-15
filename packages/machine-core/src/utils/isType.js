const date = val => val && val instanceof Date;
const nullOrUndefined = val => val == null;
const number = val => val != null && typeof val === 'number' && isFinite(val);
const object = val => val != null && typeof val === 'object';
const string = val => val != null && (typeof val === 'string' || val instanceof String);

const is = {
	date,
	nullOrUndefined,
	number,
	object,
	string
};
/*
class Type {

	static of(value) {
		// eslint-disable-next-line no-nested-ternary
		let typestr = value === null ? 'null' : value === undefined ? 'undefined' : typeof value;
		if (typestr === 'object' && Array.isArray(value)) typestr = 'array';
		return new Type(typestr);
	}

	constructor(str) {
		this.type = str;
	}

	is(str) {
		return this.type === str;
	}
}
*/
/*  more fluent will be following  =>  usage: is(val).aNumber();
const is = val => ({
	aDate: () => date(val),
	aNumber: () => number(val),
	anObject: () => object(val),
	aString: () => string(val),
	nullOrUndefined: () => nullOrUndefined(val)
});
*/

module.exports = is;
