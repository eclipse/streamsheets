const isConflict = (error) => (error && error.code === 11000) || false;

module.exports = {
	isConflict
};
