const flatten = (arrays) => [].concat(...arrays);

const unique = (array) => [...new Set(array)];

const intersperse = (array, separator) => {
	const applyWithIndex = typeof separator === 'function';
	return array.reduce((acc, element, index) => {
		const isLast = index === array.length - 1;
		return [...acc, element, ...(isLast ? [] : [applyWithIndex ? separator(index) : separator])];
	}, []);
};

const partition = (array, keyF) =>
	array.reduce((acc, element) => {
		const key = keyF(element);
		const existing = acc[key] || [];
		return {
			...acc,
			[key]: [...existing, element]
		};
	}, {});

module.exports = {
	flatten,
	unique,
	intersperse,
	partition
};
