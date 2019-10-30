// eslint-disable-next-line
const requireModule = async (path) => require(path);

let machinecore;
const set = (mod) => {
	machinecore = mod;
};
	// requireModule(mod)
	// 	.then((m) => {
	// 		machinecore = m;
	// 	})
	// 	.catch((err) => console.error(err));

const get = () => machinecore;
module.exports = {
	get,
	set
};
