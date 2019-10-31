const { runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');


const getParent = (node, level) => {
	const parent = node.parent;
	return (parent.level >= level) ? getParent(node.parent, level) : parent;
};
const insert = (node) => {
	const doIt = node.key != null;
	if (doIt) {
		// find parent
		const parent = getParent(node, node.level);
		parent.kids[node.key] = node;
	}
	return doIt;
};
// DL-1305: stronger constraints for arrays
// all keys are numbers => first key must be 0 & last must be length -1!!
// const isArray = (node, keys) => keys[0] === '0' && keys[keys.length - 1] === `${keys.length - 1}`;
const isArray = keys => keys.reduce((isArr, key, index) => isArr && key === `${index}`, true);

const toJSON = (node, json) => {
	const kids = node.kids;
	const keys = Object.keys(kids);
	// eslint-disable-next-line no-nested-ternary
	const parent = keys.length ? (isArray(keys) ? [] : {}) : node.value;
	// const parent = keys.length ? (isArray(node, keys) ? [] : {}) : node.value;
	json[node.key] = parent;
	keys.forEach(key => toJSON(kids[key], parent));
	return json;
};
const jsonFromRange = (range) => {
	const root = { level: -1, kids: {} };
	let node = { parent: root, kids: {} };
	range.iterate((cell, index, next) => {
		if (next && insert(node)) {
			node = { parent: node, kids: {}, value: null };
		}
		if (cell) {
			// first cell value always defines key...
			if (node.key != null) node.value = cell.value != null ? cell.value : node.value;
			node.key = node.key != null ? node.key : cell.value;
			node.level = node.level != null ? node.level : cell.level;
		}
	});
	insert(node);
	root.key = 'root';
	return toJSON(root, {}).root || {};
};

const json = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(range => getCellRangeFromTerm(range, sheet))
		.validate((range) => ((range == null || range.width < 2) ? Error.INVALID_PARAM : null))
		.run(range => jsonFromRange(range));


module.exports = json;
