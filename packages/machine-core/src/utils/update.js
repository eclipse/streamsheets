const updateArray = (arr, index, count) => {
	const newel = [];
	newel.length = Math.abs(count);
	// ensure idx is set -> important for splice!! if index > arr.length
	if (index >= arr.length) arr[index] = undefined;
	if (count < 0) arr.splice(index, newel.length);
	else arr.splice(index, 0, ...newel);
};

module.exports = {
	updateArray
};
