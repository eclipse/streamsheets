const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

class NoneTrigger extends AbstractStreamSheetTrigger {
	constructor(cfg) {
		super(cfg);
		this.isActive = true;
	}

	step() {}
}
module.exports = NoneTrigger;
