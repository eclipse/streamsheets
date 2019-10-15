const isEmptyObject = (obj) => obj == null || Object.keys(obj).length === 0;
const isEmptyString = (str) => str == null || str === '';

module.exports = {
	isEmptyObject,
	isEmptyString
};
