const TriggerFactory = require('./TriggerFactory');
const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

const TYPE_CONF = { type: TriggerFactory.TYPE.NONE };

class NoneTrigger extends AbstractStreamSheetTrigger {
	constructor(cfg = {}) {
		super(Object.assign(cfg, TYPE_CONF));
	}

	step() {}
}
module.exports = NoneTrigger;
