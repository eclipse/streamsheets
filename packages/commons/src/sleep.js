const noop = () => {};

const sleep = async (ms, fn = noop) =>
	new Promise((resolve) => {
		setTimeout(() => resolve(fn()), ms);
	});

module.exports = sleep;
