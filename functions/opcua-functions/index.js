const { folders } = require('./src/folders');
const help = require('./src/help');
const json = require('./src/json');
const respond = require('./src/respond');
const { setvariables } = require('./src/variables');
// 'OPCUA.DELETEFOLDER': deletefolder,
// 'OPCUA.DELETEVARIABLE': deletevariable,
// 'OPCUA.FOLDER': folder,
// 'OPCUA.VARIABLE': setvariable,

module.exports = {
	help,
	functions: {
		'OPCUA.FOLDERS': folders,
		'OPCUA.JSON': json,
		'OPCUA.RESPOND': respond,
		'OPCUA.VARIABLES': setvariables
	}
};
