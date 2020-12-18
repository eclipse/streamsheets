const AbstractTrigger = require('./AbstractTrigger');

const TYPE_CONF = Object.freeze({ type: 'continuously' });

class ContinuousTrigger extends AbstractTrigger {
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

module.exports = ContinuousTrigger;
