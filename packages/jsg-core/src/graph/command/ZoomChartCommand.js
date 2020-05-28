const CompoundCommand = require('./CompoundCommand');

class ZoomChartCommand extends CompoundCommand {
	static createFromObject(data = {}, context) {
		return new ZoomChartCommand().initWithObject(data, context);
	}

	constructor() {
		super();
		// no undo/redo for zooming charts => done via button/mouse...
		this.isVolatile = true;
	}
}

module.exports = ZoomChartCommand;
