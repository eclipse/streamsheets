const ContinuouslyTrigger = require('./ContinuouslyTrigger');
const ExecuteTrigger = require('./ExecuteTrigger');
const NeverTrigger = require('./NeverTrigger');

const TriggerFactory = {
	TYPE: {
		ARRIVAL: 'arrival',
		CONTINUOUSLY: ContinuouslyTrigger.TYPE,
		EXECUTE: ExecuteTrigger.TYPE,
		MACHINE_START: 'start',
		MACHINE_STARTSTOP: 'startstop',
		MACHINE_STOP: 'stop',
		NONE: NeverTrigger.TYPE,
		RANDOM: 'random',
		TIMER: 'time',
		// currently for debugging purpose only
		ONCE: 'once',
		ALWAYS: 'always'
	},
	create(config = {}) {
		let trigger;
		const { TYPE } = this;
		config.type = config.type || TYPE.ARRIVAL;
		switch (config.type) {
			case TYPE.CONTINUOUSLY:
				trigger = new ContinuouslyTrigger(config);
				break;
			case TYPE.EXECUTE:
				trigger = new ExecuteTrigger(config);
				break;
			case TYPE.NONE:
				trigger = new NeverTrigger(config);
				break;
			default:
				trigger = new NeverTrigger(config);
				break;
			// case TriggerFactory.TYPE.TIMER:
			// case TriggerFactory.TYPE.RANDOM:
			// 	trigger = new TimerTrigger(config);
			// 	break;
			// case TriggerFactory.TYPE.MACHINE_STOP:
			// 	trigger = new MachineTrigger(config);
			// 	break;
			// case TriggerFactory.TYPE.MACHINE_START:
			// 	trigger = new MachineTrigger(config);
			// 	break;
			// case TriggerFactory.TYPE.MACHINE_STARTSTOP:
			// 	trigger = new MachineTrigger(config);
			// 	break;
			// case TriggerFactory.TYPE.NONE:
			// 	trigger = new NeverTrigger(config);
			// 	break;
			// case TriggerFactory.TYPE.EXECUTE:
			// 	trigger = new ExecuteTrigger(config);
			// 	break;
			// case TriggerFactory.TYPE.ONCE:
			// 	trigger = new OneTimeTrigger(config);
			// 	break;
			// case TriggerFactory.TYPE.ALWAYS:
			// 	trigger = new AlwaysTrigger(config);
			// 	break;
			// // case TriggerFactory.TYPE.CONTINUOUSLY:
			// // 	trigger = new ContinuouslyTrigger(config);
			// // 	break;
			// default:
			// 	trigger = new ArrivalTrigger(config);
		}
		return trigger;
	}
};

module.exports = Object.freeze(TriggerFactory);
