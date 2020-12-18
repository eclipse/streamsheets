const ContinuousTrigger = require('./ContinuousTrigger');
const ExecuteTrigger = require('./ExecuteTrigger');
const MachineTrigger = require('./MachineTrigger');
const NeverTrigger = require('./NeverTrigger');
const OnMessageTrigger = require('./OnMessageTrigger');
const TimerTrigger = require('./TimerTrigger');

const TYPE = {
	ARRIVAL: OnMessageTrigger.TYPE,
	CONTINUOUSLY: ContinuousTrigger.TYPE,
	EXECUTE: ExecuteTrigger.TYPE,
	MACHINE_START: MachineTrigger.TYPE_START,
	MACHINE_STOP: MachineTrigger.TYPE_STOP,
	NONE: NeverTrigger.TYPE,
	RANDOM: TimerTrigger.TYPE_RANDOM,
	TIMER: TimerTrigger.TYPE_TIME,
	// currently for debugging purpose only
	ONCE: 'once',
	ALWAYS: 'always'
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
			case TYPE.RANDOM:
			case TYPE.TIMER:
				trigger = new TimerTrigger(config);
				break;
			default:
				trigger = new NeverTrigger(config);
				break;
			// case TriggerFactory.TYPE.ONCE:
			// 	trigger = new OneTimeTrigger(config);
			// 	break;
			// case TriggerFactory.TYPE.ALWAYS:
			// 	trigger = new AlwaysTrigger(config);
			// 	break;
			// default:
			// 	trigger = new ArrivalTrigger(config);
		}
		return trigger;
	}
};

module.exports = Object.freeze(TriggerFactory);
