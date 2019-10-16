const { create } = require('@cedalo/logger');

const argvalue = (key, argv) => {
	const value = argv.find(el => `${el}`.startsWith(key));
	return value ? value.split(' ')[1] : undefined;
};
const level = argvalue('--log', process.argv) || 'info';


module.exports = {
	level,
	create: ({ name = 'Logger', prefix = '(MachineTask) ' } = {}) => create({ name: `${prefix}${name}`, level })
};
