const ContinuouslyTrigger = require('./ContinuouslyTrigger');
const NoneTrigger = require('./NoneTrigger');

const TriggerFactory = {
	TYPE: {
		ARRIVAL: 'arrival',
		CONTINUOUSLY: 'continuously',
		EXECUTE: 'execute',
		MACHINE_START: 'start',
		MACHINE_STARTSTOP: 'startstop',
		MACHINE_STOP: 'stop',
		NONE: 'none',
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
			case TYPE.NONE:
				trigger = new NoneTrigger(config);
				break;
			default:
				trigger = new NoneTrigger(config);
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
			// 	trigger = new NoneTrigger(config);
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
