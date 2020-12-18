const ContinuousTrigger = require('./ContinuousTrigger');
const ExecuteTrigger = require('./ExecuteTrigger');
const MachineTrigger = require('./MachineTrigger');
const NeverTrigger = require('./NeverTrigger');
const OneTimeTrigger = require('./OneTimeTrigger');
const OnMessageTrigger = require('./OnMessageTrigger');
const TimerTrigger = require('./TimerTrigger');

const TYPE = {
	ARRIVAL: OnMessageTrigger.TYPE,
	CONTINUOUSLY: ContinuousTrigger.TYPE,
	EXECUTE: ExecuteTrigger.TYPE,
	MACHINE_START: MachineTrigger.TYPE_START,
	MACHINE_STOP: MachineTrigger.TYPE_STOP,
	NONE: NeverTrigger.TYPE,
	ONCE: OneTimeTrigger.TYPE,
	RANDOM: TimerTrigger.TYPE_RANDOM,
	TIMER: TimerTrigger.TYPE_TIME
	// MACHINE_STARTSTOP: MachineTrigger.TYPE_STARTSTOP,
};
const TriggerFactory = {
	TYPE,
	create(config = {}) {
		let trigger;
		config.type = config.type || TYPE.ARRIVAL;
		switch (config.type) {
			case TYPE.ARRIVAL:
				trigger = new OnMessageTrigger(config);
				break;
			case TYPE.CONTINUOUSLY:
				trigger = new ContinuousTrigger(config);
				break;
			case TYPE.EXECUTE:
				trigger = new ExecuteTrigger(config);
				break;
			case TYPE.MACHINE_START:
			case TYPE.MACHINE_STOP:
				trigger = new MachineTrigger(config);
				break;
			case TYPE.NONE:
				trigger = new NeverTrigger(config);
				break;
			case TYPE.ONCE:
				trigger = new OneTimeTrigger(config);
				break;
			case TYPE.RANDOM:
			case TYPE.TIMER:
				trigger = new TimerTrigger(config);
				break;
			default:
				trigger = new NeverTrigger(config);
				break;
		}
		return trigger;
	}
};

module.exports = Object.freeze(TriggerFactory);
