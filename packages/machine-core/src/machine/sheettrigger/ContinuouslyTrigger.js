const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

const TYPE_CONF = Object.freeze({ type: 'continuously' });

class ContinuouslyTrigger extends AbstractStreamSheetTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}
	constructor(cfg = {}) {
		super(Object.assign(cfg, TYPE_CONF));
	}

	step(/* manual */) {
		this.trigger();
	}
}

module.exports = ContinuouslyTrigger;
