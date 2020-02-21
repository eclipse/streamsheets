// const countNonZero = (acc, entry) => entry.value ? acc + 1 : acc;
// const countNumber = (acc, entry) => isType.number(entry.value) ? acc + 1 : acc;

const avg = () => {
	let n = 0;
	let total = 0;
	return {
		init: () => total,
		step: (val) => {
			n += 1;
			total += val;
		},
		result: () => n > 0 ? total / n : 0
	};
};
const sum = () => {
	let total = 0;
	return {
		init: () => total,
		step: (val) => {
			total += val;
		},
		result: () => total
	};
};

// const aggregations = {
// 	// '0': (entries) => toValue(entries[en	tries.length - 1]),
// 	'0': (values) => values,
// 	'1': (values) => calculate.avg(values),
// 	// doesn't make sense because no number values are ignored anyway!
// 	'2': (values) => values.reduce(countNumber, 0),
// 	'3': (values) => values.reduce(countNonZero, 0),
// 	'4': (values) => calculate.max(values),
// 	'5': (values) => calculate.min(values),
// 	'6': (values) => calculate.product(values),
// 	'7': (values) => calculate.standardDerivation(values),
// 	'9': (values) => calculate.sum(values)
// };

const ALL = {
	'1': avg,
	'9': sum
};

module.exports = {
	get: (nr) => {
		const method = ALL[nr];
		return method ? method() : undefined;
	},
	ALL,
	avg,
	sum
};
