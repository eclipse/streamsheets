/** @param {number[]} values */
const max = (values) => values.reduce((m, v) => (m > v ? m : v), Number.MIN_SAFE_INTEGER);

/** @param {number[]} values */
const min = (values) => values.reduce((m, v) => (m < v ? m : v), Number.MAX_SAFE_INTEGER);

/** @param {number[]} values */
const product = (values) => values.reduce((p, v) => p * v, 1);

/** @param {number[]} values */
const sum = (values) => values.reduce((s, v) => s + v, 0);

/** @param {number[]} values */
const standardDerivation = (values) => {
	const len = values.length;
	const avg = sum(values) / len;
	const variance = values.reduce((total, curr) => total + (curr - avg) ** 2, 0);
	return Math.sqrt(variance / (len - 1));
};

/** @param {number[]} values */
const avg = (values) => (values.length ? sum(values) / values.length : 0);

module.exports = {
	avg,
	max,
	min,
	product,
	sum,
	standardDerivation
};
