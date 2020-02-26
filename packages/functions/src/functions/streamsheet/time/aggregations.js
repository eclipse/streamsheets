const isNumber = (value) => typeof value === 'number';
const isNonZero = (value) => !!value;

const none = (/* key */) => (entry) => entry;

const avg = (key) => {
	let n = 0;
	let total = 0;
	return (entry) => {
		n += 1;
		total += entry[key];
		entry[key] = total / n;
		return entry;
	};
};
const count = (predicate) => (key) => {
	let total = 0;
	return (entry) => {
		total += predicate(entry[key]) ? 1 : 0;
		entry[key] = total;
		return entry;
	};
};
const max = (key) => {
	let maxi = Number.MIN_SAFE_INTEGER;
	return (entry) => {
		if (entry[key] > maxi) maxi = entry[key];
		entry[key] = maxi;
		return entry;
	};
};
const min = (key) => {
	let mini = Number.MAX_SAFE_INTEGER;
	return (entry) => {
		if (entry[key] < mini) mini = entry[key];
		entry[key] = mini;
		return entry;
	};
};
const product = (key) => {
	let total = 1;
	return (entry) => {
		total *= entry[key];
		entry[key] = total;
		return entry;
	};
};
const stdev = (key) => {
	let n = 0;
	let q1 = 0;
	let q2 = 0;
	let sq = 0;
	return (entry) => {
		const val = entry[key];
		n += 1;
		q1 += val;
		q2 += val ** 2;
		sq = q2 - q1 ** 2 / n;
		entry[key] = n > 1 ? Math.sqrt(Math.abs(sq / (n - 1))) : 0;
		return entry;
	};
};
const sum = (key) => {
	let total = 0;
	return (entry) => {
		total += entry[key];
		entry[key] = total;
		return entry;
	};
};

const ALL = {
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
		const method = ALL[nr];
		return method ? method(key) : undefined;
	},
	ALL,
	avg,
	sum
};
