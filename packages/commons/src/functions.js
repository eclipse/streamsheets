const pipe = (...fns) => (val) => fns.reduce((res, fn) => fn(res), val);
const compose = (...fns) => (val) => fns.reduceRight((res, fn) => fn(res), val);

module.exports = {
	compose,
	pipe
};
