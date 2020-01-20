const keyGenerator = (...args) => args.join(',');

const func = (fn, keyfn = keyGenerator) => {
	const mem = {};
	return (...args) => {
		const key = keyfn(...args);
		if (mem[key] == null) mem[key] = fn(...args);
		return mem[key];
	};
};

module.exports = {
	func
};
