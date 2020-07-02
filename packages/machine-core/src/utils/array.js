const firstElements = (n, arr) => arr.slice(0, n);
const lastElements = (n, arr) => {
	const length = arr.length;
	if (n > length) n = length;
	return arr.slice(length - n).reverse();
};


module.exports = {
	firstElements,
	lastElements
}