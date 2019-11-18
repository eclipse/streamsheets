const { isNumber } = require('./values');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const create = (key, next, parent) => {
	const newparent = isNumber(next) ? [] : {};
	parent[key] = newparent;
	return newparent;
};
const createParent = (path, parent) => {
	if (path.length > 1) {
		const key = path.shift();
		if (key != null) {
			parent = parent[key] || create(key, path[0], parent);
			return createParent(path, parent);
		}
	}
	return parent;
};

const addTo = (parent, key, value) => {
	if (key === '-1' && Array.isArray(parent)) {
		parent.splice(0, 0, value);
	} else if (key != null) {
		parent[key] = value;
	} else if (typeof value === 'object') {
		Object.assign(parent, value);
	} else {
		return false;
	}
	return true;
};

const add = (json, path, value) => {
	const parent = createParent(path, json);
	if (value == null) return ERROR.VALUE;
	else if (typeof parent !== 'object') return ERROR.INVALID_PATH;
	return addTo(parent, path.pop(), value) && json;
};

module.exports = {
	add
};
