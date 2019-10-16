const capitalize = (s) => {
	if (typeof s === 'string' && s.length > 0) {
		return `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
	}
	return '';
};

const isEmpty = (s) => !s || s.length === 0;

module.exports = {
	capitalize,
	isEmpty
};
