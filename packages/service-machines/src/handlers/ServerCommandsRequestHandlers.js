// const fixCellRange = (str) => (str && str.indexOf(':') < 0 ? `${str}:${str}` : str);
// // TODO: remove undo handling or check it with persistence
// class DeleteCellsCommandRequestHandler {
// 	async handleCommand(command, runner, streamsheetId, userId, undo) {
// 		const cmd = undo ? 'insert' : 'delete';
// 		const info = command.msrvrinfo || {};
// 		info.streamsheetId = streamsheetId;
// 		return info.range ? runner.request(cmd, userId, info) : {};
// 	}
// }
// // TODO: remove undo handling or check it with persistence
// class InsertCellsCommandRequestHandler {
// 	async handleCommand(command, runner, streamsheetId, userId, undo) {
// 		const cmd = undo ? 'delete' : 'insert';
// 		const info = command.msrvrinfo || {};
// 		info.streamsheetId = streamsheetId;
// 		return info.range ? runner.request(cmd, userId, info) : {};
// 	}
// }
// TODO: remove undo handling or check it with persistence
class PasteCellsCommandRequestHandler {
	async handleCommand(command, runner, streamsheetId, userId /* , undo */) {
		// const { sourceref, targetref, action, fill } = command;
		const { sourcecells, targetcells, action, fill } = command;
		// fix target and source ranges
		// const sourcerange = fixCellRange(sourceref);
		// const targetrange = fixCellRange(targetref);
		return runner.request('pasteCells', userId, { streamsheetId, sourcecells, targetcells, action, fill });
	}
}

class SetCellsLevelPropertyCommand2RequestHandler {
	async handleCommand(command, runner, streamsheetId, userId) {
		const { info } = command;
		const result = info ? await runner.request('setCellsLevelProperty', userId, { streamsheetId, info }) : {};
		return { result };
	}
}
class SetCellsPropertiesCommand2RequestHandler {
	async handleCommand(command, runner, streamsheetId, userId) {
		const { info } = command;
		const result = info ? await runner.request('setCellsProperties', userId, { streamsheetId, info }) : {};
		return { result };
	}
}
class SetCellsCommand2RequestHandler {
	async handleCommand(command, runner, streamsheetId, userId) {
		const { info } = command;
		const result = info ? await runner.request('setCells2', userId, { streamsheetId, info }) : {};
		return { result };
	}
}
class DeleteCellsCommand2RequestHandler {
	async handleCommand(command, runner, streamsheetId, userId) {
		const { info } = command;
		const result = info ? await runner.request('deleteCells2', userId, { streamsheetId, info }) : {};
		return { result };
	}
}
class CompoundRequestCommandRequestHandler {
	constructor(handlers) {
		this.handlers = handlers;
	}
	async handleCommand(command, runner, streamsheetId, userId) {
		const { info: commands } = command;
		if (commands) {
			const handlers = commands.map((cmd) => this.handlers.get(cmd.name)).filter((handler) => handler != null);
			if (handlers.size === commands.size) {
				const result = await Promise.all(
					handlers.map((handler, index) =>
						handler.handleCommand(commands[index], runner, streamsheetId, userId)
					)
				);
				return { result };
			}
		}
		return { warning: 'Failed to run CompoundRequestCommand because it contains no or unknown commands' };
	}
}

const Registry = new Map();
Registry.set('command.server.CompoundRequestCommand', new CompoundRequestCommandRequestHandler(Registry));
Registry.set('command.server.DeleteCellsCommand', new DeleteCellsCommand2RequestHandler());
Registry.set('command.server.PasteCellsCommand', new PasteCellsCommandRequestHandler());
Registry.set('command.server.SetCellLevelsCommand', new SetCellsLevelPropertyCommand2RequestHandler());
Registry.set('command.server.SetCellsCommand', new SetCellsCommand2RequestHandler());
Registry.set('command.server.SetCellsPropertiesCommand', new SetCellsPropertiesCommand2RequestHandler());

module.exports = Registry;
