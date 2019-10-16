const replaceCharAt = (str, index, replacement) =>
	(index >= 0 && index < str.length
		? str.substr(0, index) + replacement + str.substr(index + 1)
		: str);

const isValidNrString = (str, thousandIndex, decimalIndex) =>
	thousandIndex < 0 || (str.length - thousandIndex > 3 && (decimalIndex < 0 || decimalIndex - thousandIndex === 4));

const nrString = (str, locale) => {
	let nr;
	const separators = locale.separators;
	const indexOfDeci = str.indexOf(separators.decimal);
	const indexOfThou = str.indexOf(separators.thousand);
	if (isValidNrString(str, indexOfThou, indexOfDeci)) {
		nr = replaceCharAt(str, indexOfDeci, '.');
		nr = replaceCharAt(nr, indexOfThou, '');
	}
	return nr;
};

const replaceAllWith = (replace, replacement, str) => {
	if (replace === '.') replace = '\\.';
	return str.replace(new RegExp(replace, 'g'), replacement);
}
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
