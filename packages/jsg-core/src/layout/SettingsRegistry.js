const Settings = require('./Settings');

const Registry = {
	'Settings': Settings,
	'JSG.graph.layout.Settings': Settings
};

module.exports = {
	get(name) {
		return Registry[name];
	}
};
