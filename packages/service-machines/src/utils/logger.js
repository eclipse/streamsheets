const { create } = require('@cedalo/logger');

// const level = process.env.MACHINE_SERVICE_LOG_LEVEL || 'info';
// const level = process.env.STREAMSHEETS_LOG_LEVEL || 'info';
// const _create = ({ name = 'MachineService-Logger' } = {}) => create({ name, level });

module.exports = {
	// level,
	create: ({ name = 'Logger', prefix = '(MachineService) ' } = {}) =>
		create({ name: `${prefix}${name}` })
};
