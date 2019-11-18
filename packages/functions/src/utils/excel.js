// const ERROR = require('../errors');


const toExcelRegEx = (searchstr) => {
	// taken from JSG Strings.wmatch() => seems NOT TO WORK!! e.g. ~? or ~* is not supported!!
	// eslint-disable-next-line
	// searchstr = searchstr.replace(/[\-\[\]\/\{\}\(\)\+\.\\\^\$\|]/g, '\\$&');
	// searchstr = searchstr.replace(/\*/g, '.*');
	// searchstr = searchstr.replace(/\?/g, '.');
	// return new RegExp(`^${searchstr}$`, 'i');

	searchstr = searchstr.replace(/(\(|\)|\[|\])/g, '\\$1');
	searchstr = searchstr.replace(/\*/g, '.*');
	searchstr = searchstr.replace(/~.(?=\*)/g, '\\');
	searchstr = searchstr.replace(/~(?=\*|\?)/g, '\\');
	searchstr = searchstr.replace(/~~/g, '~');
	return new RegExp(`^${searchstr}$`);
};
const wmatch = (str, search) => search && toExcelRegEx(search).test(str);


module.exports = {
	toExcelRegEx,
	wmatch
};
