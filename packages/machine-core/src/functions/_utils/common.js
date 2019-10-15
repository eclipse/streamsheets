const pipe = (...fns) => (val) => fns.reduce((res, fn) => fn(res), val);
const compose = (...fns) => (val) => fns.reduceRight((res, fn) => fn(res), val);
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

module.exports = {
	compose,
	deepCopy,
	pipe
};
