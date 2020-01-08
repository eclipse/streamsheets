const flatten = (arrays) => [].concat(...arrays);

const unique = (array) => [...new Set(array)];

module.exports = {
	flatten,
	unique
};
