const { FunctionErrors } = require('@cedalo/error-codes');

const pipe = (...fns) => (val) => fns.reduce((res, fn) => fn(res), val);
const compose = (...fns) => (val) => fns.reduceRight((res, fn) => fn(res), val);
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

const cutBrackets = (str) => {
	str = str.startsWith('[') ? str.substr(1) : str;
	return str.endsWith(']') ? str.substr(0, str.length - 1) : str;
};


const ignoreOnError = (fn) => (res) => FunctionErrors.isError(res) ? res : fn(res);
const wrapFunctions = (fn, fns) => fns.map(f => fn(f));

const pipeCheckError = (...fns) => (val) => {
	let res = val;
	for (let i = 0; i < fns.length && !FunctionErrors.isError(res); i += 1) {
		res = fns[i](res);
	}
	return res;
};

module.exports = {
	compose,
	cutBrackets,
	deepCopy,
	ignoreOnError,
	pipe,
	pipeCheckError,
	wrapFunctions
};
