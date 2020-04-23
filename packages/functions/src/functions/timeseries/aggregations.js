const { isType } = require('@cedalo/machine-core');

const isNumber = (value) => isType.number(value);
const isNonZero = (value) => !!value;
// const isNonZero = (value) => isType.number(value) && !!value;

// on none we simply keep and return first received value...
const none = () => {
	let val;
	let first = false;
	return (value) => {
		if (!first) {
			val = value;
			first = true;
		}
		return isType.object(val) ? '{ JSON Object }' : val;
	};
};

const avg = () => {
	let n = 0;
	let total = 0;
	return (value, previous = 0) => {
		if (isType.number(value)) {
			n += 1;
			total += value;
			return total / n;
		}
		return previous;
	};
};
const count = (predicate) => () => {
	let total = 0;
	return (value) => {
		total += predicate(value) ? 1 : 0;
		return total;
	};
};
const max = () => (value, previous = Number.MIN_SAFE_INTEGER) =>
	isType.number(value) && value > previous ? value : previous;
const min = () => (value, previous = Number.MAX_SAFE_INTEGER) => 
	isType.number(value) && value < previous ? value : previous;
const product = () => (value, previous = 1) => isType.number(value) ? value * previous : previous;
const stdev = () => {
	let n = 0;
	let q1 = 0;
	let q2 = 0;
	let sq = 0;
	return (value, previous = 0) => {
		if (isType.number(value)) {
			n += 1;
			q1 += value;
			q2 += value ** 2;
			sq = q2 - q1 ** 2 / n;
			return n > 1 ? Math.sqrt(Math.abs(sq / (n - 1))) : 0;
		}
		return previous;
	};
};
const sum = () => (value, previous = 0) => isType.number(value) ? value + previous : previous;


const access = (key) => ({
	get: (entry) => entry.values[key],
	set: (value, entry) => {
		entry.values[key] = value;
		return entry;
	}
});
const aggregate = (key, method) => {
	const accessor = access(key);
	return (acc, entry) => {
		const value = method(accessor.get(entry), accessor.get(acc));
		return accessor.set(value, acc);
	};
};

const methodFactory = (method) => {
	const keys = {};
	return {
		get: (key) => {
			keys[key] = keys[key] || method();
			return keys[key];
		}
	};
};
const wildcard = (method) => {
	const methodMap = methodFactory(method);
	return (acc, entry) => {
		const accValues = acc.values;
		Object.entries(entry.values).forEach(([key, value]) => {
			const aggr = methodMap.get(key);
			accValues[key] = aggr(value, accValues[key]);
		});
		return acc;
	};
};

const METHODS = {
	'none': none,
	'avg': avg,
	'count': count(isNumber),
	'counta': count(isNonZero),
	'max': max,
	'min': min,
	'product': product,
	'stdevs': stdev,
	'sum': sum
};

module.exports = {
	get: (str, key) => { // = 0, key) => {
		const method = METHODS[str || 'none'];
		return method ? aggregate(key, method()) : undefined;
	},
	getWildCard: (str) => { // = 'none') => {
		const method = METHODS[str || 'none'];
		return method ? wildcard(method) : undefined;
	},
	validate: (methods = []) => methods.every((str) => !str || !!METHODS[str])
};
