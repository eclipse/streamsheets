const JSG = require('../../JSG');
const AbstractItemCommandProxy = require('./AbstractItemCommandProxy');
const InternalMoveItemCommand = require('./InternalMoveItemCommand');
const MoveNodeCommand = require('./MoveNodeCommand');
const MoveEdgeCommand = require('./MoveEdgeCommand');
const NoOpCommand = require('./NoOpCommand');
const Edge = require('../model/Edge');
const Node = require('../model/Node');

/**
 * Command to move a GraphItem to a new location.
 *
 * @example
 *     // interactionhandler and item given
 *     // move item to (1cm, 1cm)
 *     var cmd = new MoveItemCommand(item, new Point(1000, 1000));
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class MoveItemCommand
 * @extends AbstractItemCommandProxy
 * @constructor
 * @param {GraphItem} item GraphItem to be moved.
 * @param {Point} newPinPoint The new Pin location relative to its parent.
 */
class MoveItemCommand extends AbstractItemCommandProxy {
	static createFromObject(data = {}, context) {
		let cmd;
		const item = context.graph.getItemById(data.itemId);
		if (item) {
			cmd = new MoveItemCommand().initWithObject(data);
			if (item instanceof Node) {
				cmd._cmd = MoveNodeCommand.createFromObject(data, context);
			} else if (item instanceof Edge) {
				cmd._cmd = MoveEdgeCommand.createFromObject(data, context);
			} else {
				cmd._cmd = InternalMoveItemCommand.createFromObject(
					data,
					context
				);
			}
		}
		return cmd;
	}

	constructor(item, newPinPoint) {
		function createCommand() {
			if (item instanceof Node) {
				return new MoveNodeCommand(item, newPinPoint);
			}
			if (item instanceof Edge) {
				return new MoveEdgeCommand(item, newPinPoint);
			}
			return item
				? new InternalMoveItemCommand(item, newPinPoint)
				: new NoOpCommand();
		}

		const cmd = createCommand();

		super(cmd);
	}
}

module.exports = MoveItemCommand;
