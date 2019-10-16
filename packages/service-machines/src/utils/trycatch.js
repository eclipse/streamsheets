module.exports = (fn, logger) => (...args) => {
	let res;
	try {
		res = fn(...args);
	} catch (ex) {
		if (logger) logger.error(ex);
	}
	return res;
};
