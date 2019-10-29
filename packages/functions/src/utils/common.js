const pipe = (...fns) => (val) => fns.reduce((res, fn) => fn(res), val);
const compose = (...fns) => (val) => fns.reduceRight((res, fn) => fn(res), val);
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

const cutBrackets = (str) => {
	str = str.startsWith('[') ? str.substr(1) : str;
	return str.endsWith(']') ? str.substr(0, str.length - 1) : str;
};

module.exports = {
	compose,
	cutBrackets,
	deepCopy,
	pipe
};
