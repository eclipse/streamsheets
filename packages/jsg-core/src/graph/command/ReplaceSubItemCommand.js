const JSG = require('../../JSG');
const AbstractItemCommand = require('./AbstractItemCommand');

/**
 * A command that replaces a subitem with another one.
 *
 * @example
 *     var parent = new GraphItem(new RectangleShape());
 *     var cmd = new ReplaceSubItemCommand(parent, subItemToReplace, subItemReplacement);
 *     interactionHandler.execute(cmd);
 *
 * @class ReplaceSubItemCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} parent Parent item of the sub item.
 * @param {GraphItem} subItem The sub item to replace.
 * @param {GraphItem} replacement The replacement item.
 */
class ReplaceSubItemCommand extends AbstractItemCommand {
	constructor(parent, subItem, replacement) {
		super(parent);

		this._index = subItem.getIndex();
		this._subItem = subItem;
		this._replacement = replacement;
	}

	undo() {
		this._graphItem.removeItem(this._replacement);
		this._graphItem.addItem(this._subItem, this._index);
	}

	redo() {
		this._graphItem.removeItem(this._subItem);
		this._graphItem.addItem(this._replacement, this._index);
	}
}

module.exports = ReplaceSubItemCommand;
