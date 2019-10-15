const AbstractItemCommand = require('./AbstractItemCommand');

class ResizeGroupCommand extends AbstractItemCommand {
	constructor(group, newbox) {
		super(group);

		this.oldpin = group.getPin().copy();
		this.oldbox = group.getBoundingBox();
		this.newbox = newbox.copy();
	}

	undo() {
		if (this._graphItem.isSizeable()) {
			this._graphItem.setBoundingBoxTo(this.oldbox);
			this._graphItem.getPin().setTo(this.oldpin);
			this._graphItem.evaluate();
		}
	}

	redo() {
		if (this._graphItem.isSizeable()) {
			this._graphItem.setBoundingBoxTo(this.newbox);
		}
	}
}

module.exports = ResizeGroupCommand;
