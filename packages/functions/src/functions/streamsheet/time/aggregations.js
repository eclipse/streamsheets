const isNumber = (value) => typeof value === 'number';
const isNonZero = (value) => !!value;

const none = (/* key */) => (entry) => entry;
const access = key => ({
	get: entry => entry.values[key],
	set: (value, entry) => {
		entry.values[key] = value;
		return entry;
	}
});

const avg = (key) => {
	let n = 0;
	let total = 0;
	const accessor = access(key);
	return (entry) => {
		n += 1;
		total += accessor.get(entry);
		return accessor.set(total / n, entry);
	};
};
const count = (predicate) => (key) => {
	let total = 0;
	const accessor = access(key);
	return (entry) => {
		total += predicate(accessor.get(entry)) ? 1 : 0;
		return accessor.set(total, entry);
	};
};
const max = (key) => {
	let maxi = Number.MIN_SAFE_INTEGER;
	const accessor = access(key);
	return (entry) => {
		if (accessor.get(entry) > maxi) maxi = accessor.get(entry);
		return accessor.set(maxi, entry);
	};
};
const min = (key) => {
	let mini = Number.MAX_SAFE_INTEGER;
	const accessor = access(key);
	return (entry) => {
		if (accessor.get(entry) < mini) mini = accessor.get(entry);
		return accessor.set(mini, entry);
	};
};
const product = (key) => {
	let total = 1;
	const accessor = access(key);
	return (entry) => {
		total *= accessor.get(entry);
		return accessor.set(total, entry);
	};
};
const stdev = (key) => {
	let n = 0;
	let q1 = 0;
	let q2 = 0;
	let sq = 0;
	const accessor = access(key);
	return (entry) => {
		const val = accessor.get(entry);
		n += 1;
		q1 += val;
		q2 += val ** 2;
		sq = q2 - q1 ** 2 / n;
		return accessor.set(n > 1 ? Math.sqrt(Math.abs(sq / (n - 1))) : 0, entry);
	};
};
const sum = (key) => {
	let total = 0;
	const accessor = access(key);
	return (entry) => {
		total += accessor.get(entry);
		return accessor.set(total, entry);
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
	}
};
