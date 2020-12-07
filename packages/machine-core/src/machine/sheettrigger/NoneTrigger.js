const StreamSheetTrigger = require('../StreamSheetTrigger');
const AbstractStreamSheetTrigger = require('./AbstractStreamSheetTrigger');

const TYPE_CONF = { type: StreamSheetTrigger.TYPE.NONE };

class NoneTrigger extends AbstractStreamSheetTrigger {
	constructor(cfg = {}) {
		super(Object.assign(cfg, TYPE_CONF));
	}

	step() {}
}
module.exports = NoneTrigger;
