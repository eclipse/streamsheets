const SERVER_COMMANDS = [
	'command.server.CompoundRequestCommand',
	'command.server.DeleteCellsCommand',
	'command.server.PasteCellsCommand',
	'command.server.SetCellLevelsCommand',
	'command.server.SetCellsCommand',
	'command.server.SetCellsPropertiesCommand'
];

const ignoreAll = (list) => (str) => !str || list.includes(str);

module.exports = {
	SERVER_COMMANDS,
	ignoreAll
}