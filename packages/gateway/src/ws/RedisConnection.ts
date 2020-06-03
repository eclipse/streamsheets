/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
import Redis from 'ioredis';
import LoggerFactory from '../utils/logger';

const logger = LoggerFactory.create({ name: 'ServerConnection' });

const REDIS_HOST = process.env.REDIS_HOST || 'internal-redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '', 10) || 6379;
const STEP_CONFIRMATION_TIMEOUT = 5000;

// currently we ignore redis errors
const logError = (error: any) => logger.warn(error);

const getMachineStepKey = (machineId: string) => `machines.${machineId}.step`;
const getMachineStepKeySpaceEvent = (machineId: string) => `__keyspace@0__:${getMachineStepKey(machineId)}`;
const getMachineIdFromKeySpaceEvent = (msgstr: string) => {
	// string must have following format: __keyspace@0__:machines.<MACHINE_ID>.step
	const last = msgstr.indexOf('.step');
	return last > 0 ? msgstr.substring(24, last) : undefined;
};

type StepHandler = (stepEvent: string | object) => void;

class Subscription {
	static of(machineId: string, stepHandler: StepHandler) {
		return new Subscription(machineId, stepHandler);
	}

	machineId: string;
	isNewStepAvailable: boolean = false;
	stepHandler: any;
	private _confirmationTimoutId: NodeJS.Timeout | null = null;

	constructor(machineId: string, stepHandler: StepHandler) {
		this.machineId = machineId;
		this.stepHandler = stepHandler;
		// this.isNewStepAvailable = false;
		// this._confirmationTimoutId = null;
	}

	get isConfirmationPending() {
		return this._confirmationTimoutId != null;
	}
	onTimeout(cb: () => void) {
		this._confirmationTimoutId = setTimeout(cb, STEP_CONFIRMATION_TIMEOUT);
	}
	clearOnTimeout() {
		this._confirmationTimoutId && clearTimeout(this._confirmationTimoutId);
		this._confirmationTimoutId = null;
	}
}

export default class RedisConnection {
	static connect() {
		const redis = new Redis(REDIS_PORT, REDIS_HOST);
		return new RedisConnection(redis, redis.duplicate());
	}

	subscriptions: Map<string, Subscription>;
	private redis: Redis.Redis;
	private eventRedis: Redis.Redis;

	constructor(redis: Redis.Redis, eventRedis: Redis.Redis) {
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
		if (this.redis.status !== 'end') {
			this.redis.quit();
			this.eventRedis.quit();
		}
	}

	clearTimeouts() {
		this.subscriptions.forEach((subscription) => subscription.clearOnTimeout());
	}

	confirmMachineStep(machineId: string) {
		const subscription = this.subscriptions.get(machineId);
		if (subscription) {
			subscription.clearOnTimeout();
			if (subscription.isNewStepAvailable) {
				subscription.isNewStepAvailable = false;
				this.fetchStep(subscription);
			}
		}
	}

	async fetchStep(subscription: Subscription) {
		// check again to prevent additional fetch & notification if called on confirm and on new message same time
		if (!subscription.isConfirmationPending) {
			subscription.onTimeout(() => {
				this.confirmMachineStep(subscription.machineId);
			});
			const latestStep = await this.getLatestStep(subscription);
			subscription.stepHandler(latestStep);
		}
	}
	async getLatestStep(subscription: Subscription) {
		return this.redis.get(getMachineStepKey(subscription.machineId));
	}

	onRedisMessage(message: string) {
		const machineId = getMachineIdFromKeySpaceEvent(message);
		if (machineId) {
			const subscription = this.subscriptions.get(machineId);
			if (subscription) this.handleStepMessage(subscription);
		}
	}
	// if redis performance gets poor a solution might be to unsubscribe here and subscribe again in fetchStep()....
	handleStepMessage(subscription: Subscription) {
		if (subscription.isConfirmationPending) {
			// inform pending subscription that new step is available
			subscription.isNewStepAvailable = true;
		} else {
			// inform client about latest step
			this.fetchStep(subscription);
		}
	}

	subscribe(machineId: string, stepHandler: StepHandler) {
		this.eventRedis.subscribe(getMachineStepKeySpaceEvent(machineId));
		this.subscriptions.set(machineId, Subscription.of(machineId, stepHandler));
	}

	unsubscribe(machineId: string) {
		this.eventRedis.unsubscribe(getMachineStepKeySpaceEvent(machineId));
		this.subscriptions.delete(machineId);
	}
}
