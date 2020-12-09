const StreamSheetTrigger = require('../StreamSheetTrigger');
const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

const TYPE_CONF = { type: StreamSheetTrigger.TYPE.CONTINUOUSLY };

class ContinuouslyTrigger extends AbstractStreamSheetTrigger {
	constructor(cfg = {}) {
		super(Object.assign(cfg, TYPE_CONF));
	}

	step(manual) {
		// this.isActive = true;
		this.trigger(manual);
	}
}
module.exports = ContinuouslyTrigger;
