const requireFile = (file) => {
	try {
		// eslint-disable-next-line
		return require(file);
	} catch (err) {
		/* ignore */
	}
	return undefined;
};

module.exports = requireFile;
