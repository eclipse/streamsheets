const memoize = (fn, keyfn) => {
	const mem = {};
	return (...args) => {
		const key = keyfn(...args);
		if (mem[key] == null) mem[key] = fn(...args);
		return mem[key];
	};
};

const replaceRegEx = memoize((str) => new RegExp(str, 'g'), (str) => str);
const replaceAllWith = (replace, replacement, str) => {
	if (replace === '.') replace = '\\.';
	return str.replace(replaceRegEx(replace), replacement);
};

const nrChecker = memoize(
	(separators) => {
		const decimal = separators.decimal === '.' ? '\\.' : separators.decimal;
		const thousand = separators.thousand === '.' ? '\\.' : separators.thousand;
		return new RegExp(`^[-+]?(\\d{1,3})+(${thousand}\\d{3})*(${decimal}\\d*)?$`);
	},
	(separators) => `${separators.decimal}${separators.thousand}`
);

const isValidNr = (str, separators) => {
	const rx = nrChecker(separators);
	return rx.test(str);
};
const nrString = (str, locale) => {
	let nr;
	const separators = locale.separators;
	if (isValidNr(str, separators)) {
		nr = replaceAllWith(separators.thousand, '', str);
		nr = replaceAllWith(separators.decimal, '.', nr);
	}
	return nr;
};

const nrFormatString = (str, locale) => {
	const separators = locale.separators;
	let format = replaceAllWith(separators.decimal, ';', str);
	format = replaceAllWith(separators.thousand, ',', format);
	return replaceAllWith(';', '.', format);
};

module.exports = {
	nrString,
	nrFormatString
};
