const AbstractTrigger = require('./AbstractTrigger');

const TYPE_CONF = Object.freeze({ type: 'none' });

class NeverTrigger extends AbstractTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}
	constructor(cfg = {}) {
		super(Object.assign(cfg, TYPE_CONF));
	}

	step() {}
}

module.exports = NeverTrigger;
