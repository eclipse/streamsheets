const Redis = require('ioredis');
const logger = require('../utils/logger').create({ name: 'ServerConnection' });

const REDIS_HOST = process.env.REDIS_HOST || 'internal-redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const STEP_CONFIRMATION_TIMEOUT = 5000;

// currently we ignore redis errors
const logError = (error) => logger.warn(error);

const getMachineStepKey = (machineId) => `machines.${machineId}.step`;
const getMachineStepKeySpaceEvent = (machineId) => `__keyspace@0__:${getMachineStepKey(machineId)}`;
const getMachineIdFromKeySpaceEvent = (msgstr) => {
	// string must have following format: __keyspace@0__:machines.<MACHINE_ID>.step
	const last = msgstr.indexOf('.step');
	return last > 0 ? msgstr.substring(24, last) : undefined;
};

class Subscription {

	static of(machineId, stepHandler) {
		return new Subscription(machineId, stepHandler);
	}

	constructor(machineId, stepHandler) {
		this.machineId = machineId;
		this.stepHandler = stepHandler;
		this.isNewStepAvailable = false;
		this._confirmationTimoutId = null;
	}

	get isConfirmationPending() {
		return this._confirmationTimoutId != null;
	}
		onTimeout(cb) {
		this._confirmationTimoutId = setTimeout(cb, STEP_CONFIRMATION_TIMEOUT);
	}
	clearOnTimeout() {
		clearTimeout(this._confirmationTimoutId);
		this._confirmationTimoutId = null;
	}
}

class RedisConnection {
	static connect() {
		const redis = new Redis(REDIS_PORT, REDIS_HOST);
		return new RedisConnection(redis, redis.duplicate());
	}

	constructor(redis, eventRedis) {
		this.redis = redis;
		this.eventRedis = eventRedis;
		this.redis.on('error', logError);
		this.eventRedis.on('error', logError);
		this.eventRedis.on('message', this.onRedisMessage.bind(this));
		this.confirmMachineStep = this.confirmMachineStep.bind(this);
		// machine subscriptions:
		this.subscriptions = new Map();
	}

	close() {
		this.clearTimeouts();
		if(this.redis.status !== 'end') {
			this.redis.quit();
			this.eventRedis.quit();
		}
	}

	clearTimeouts() {
		this.subscriptions.forEach((subscription) => subscription.clearOnTimeout());
	}

	confirmMachineStep(machineId) {
		const subscription = this.subscriptions.get(machineId);
		if (subscription) {
			subscription.clearOnTimeout();
			if (subscription.isNewStepAvailable) {
				subscription.isNewStepAvailable = false;
				this.fetchStep(subscription);
			}
		}
	}

	async fetchStep(subscription) {
		// check again to prevent additional fetch & notification if called on confirm and on new message same time
		if (!subscription.isConfirmationPending) {
			subscription.onTimeout(() => { this.confirmMachineStep(subscription.machineId); });
			const latestStep = await this.getLatestStep(subscription);
			subscription.stepHandler(latestStep);
		}
	}
	async getLatestStep(subscription) {
		return this.redis.get(getMachineStepKey(subscription.machineId));
	}

	onRedisMessage(message) {
		const machineId = getMachineIdFromKeySpaceEvent(message);
		if (machineId) {
			const subscription = this.subscriptions.get(machineId);
			if (subscription) this.handleStepMessage(subscription);
		}
	}
	// if redis performance gets poor a solution might be to unsubscribe here and subscribe again in fetchStep()....
	handleStepMessage(subscription) {
		if (subscription.isConfirmationPending) {
			// inform pending subscription that new step is available
			subscription.isNewStepAvailable = true;
		} else {
			// inform client about latest step
			this.fetchStep(subscription);
		}
	}

	subscribe(machineId, stepHandler) {
		this.eventRedis.subscribe(getMachineStepKeySpaceEvent(machineId));
		this.subscriptions.set(machineId, Subscription.of(machineId, stepHandler));
	}

	unsubscribe(machineId) {
		this.eventRedis.unsubscribe(getMachineStepKeySpaceEvent(machineId));
		this.subscriptions.delete(machineId);
	}
}

module.exports = RedisConnection;
