let machinecore;
const promises = [];
const set = (mod) => {
	machinecore = mod;
	promises.forEach((p) => (mod ? p.resolve(mod) : p.reject(new Error('MachineCore not available!'))));
	promises.lenth = 0;
	return mod;
};
const get = () => machinecore;

const getAsync = () => {
	if (machinecore) return Promise.resolve(machinecore);
	return new Promise((resolve, reject) => {
		promises.push({ resolve, reject });
	});
};

module.exports = {
	get,
	getAsync,
	set
};
