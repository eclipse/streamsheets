const TriggerFactory = require('./TriggerFactory');
const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

const TYPE_CONF = { type: TriggerFactory.TYPE.CONTINUOUSLY };

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
