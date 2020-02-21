const noop = () => {};

const sleep = (ms, fn = noop) =>
	new Promise((resolve) => {
		setTimeout(() => resolve(fn()), ms);
	});

module.exports = sleep;
