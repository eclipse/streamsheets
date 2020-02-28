const isNumber = (value) => typeof value === 'number';
const isNonZero = (value) => !!value;

// on none we simply keep and return first received value...
const none = () => {
	let val;
	let first = false;
	return (value) => {
		if (!first) {
			val = value;
			first = true;
		}
		return val;
	};
};

const avg = () => {
	let n = 0;
	let total = 0;
	return (value) => {
		n += 1;
		total += value;
		return total / n;
	};
};
const count = (predicate) => () => {
	let total = 0;
	return (value) => {
		total += predicate(value) ? 1 : 0;
		return total;
	};
};
const max = () => (value, previous = Number.MIN_SAFE_INTEGER) => (value > previous ? value : previous);
const min = () => (value, previous = Number.MAX_SAFE_INTEGER) => (value < previous ? value : previous);
const product = () => (value, previous = 1) => value * previous;
const stdev = () => {
	let n = 0;
	let q1 = 0;
	let q2 = 0;
	let sq = 0;
	return (value) => {
		n += 1;
		q1 += value;
		q2 += value ** 2;
		sq = q2 - q1 ** 2 / n;
		return n > 1 ? Math.sqrt(Math.abs(sq / (n - 1))) : 0;
	};
};
const sum = () => (value, previous = 0) => value + previous;


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
		// TODO check that we get number for entry value!
		const value = method(accessor.get(entry), accessor.get(acc));
		return accessor.set(value, acc);
	};
};

const METHODS = {
	'0': none,
	'1': avg,
	'2': count(isNumber),
	'3': count(isNonZero),
	'4': max,
	'5': min,
	'6': product,
	'7': stdev,
	'9': sum
};

module.exports = {
	get: (nr, key) => {
		const method = METHODS[nr];
		return method ? aggregate(key, method()) : undefined;
	}
};
