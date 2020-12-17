const StreamSheet = require('./StreamSheet');
const SheetProcessor2 = require('./SheetProcessor2');
const TriggerFactory = require('./sheettrigger/TriggerFactory');


class StreamSheet2 extends StreamSheet {
	// STATS:
	// this.stats = {
	// 	messages: 0,
	// 	steps: 0,
	// 	executesteps: 0,
	// 	repeatsteps: 0
	// }
	constructor(conf = {}) {
		super(conf);
		// exchange sheet processor:
		this.sheet.processor = new SheetProcessor2(this.sheet);
		this.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.CONTINUOUSLY });
	}

	get trigger() {
		return this._trigger;
	}
	set trigger(trigger) {
		if (!trigger) trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.NONE });
		if (trigger.type === this._trigger.type) {
			// simply update settings:
			this._trigger.update(trigger.config);
			// same trigger but with maybe different setting...
			// if (this._trigger.type === trigger.type) trigger.isActive = this._trigger.isActive;
			// this._trigger.dispose();
		} else {
			this._trigger.dispose();
			// register new trigger:
			this._trigger = trigger;
			this._trigger.streamsheet = this;
		}
	}

	hasNewMessage() {
		return this.inbox.size > 1 || !this._msgHandler.isProcessed;
		// const isEmpty = this.inbox.size <= 1;
		// const hasMessage = !!this._msgHandler.message;
		// const isProcessed = this._msgHandler.isProcessed;
		// return this.inbox.size > 1 || !isProcessed; // || (!this.inbox.isEmpty() && !this._msgHandler.message);
		// return !this.inbox.isEmpty() && (!isEmpty || !hasMessage || !isProcessed);
		// NOTE: no message, means we will use next message if inbox is not empty!
		// return (
		// 	!this.inbox.isEmpty() && (this.inbox.size > 1 || !this._msgHandler.message || !this._msgHandler.isProcessed)
		// );
	}


	// called by sheet functions:
	execute(message, repetitions, callingSheet) {
		if (this.trigger.type === TriggerFactory.TYPE.EXECUTE) {
			// attach message?
			if (message) this._attachExecuteMessage(message);
			this.trigger.execute(repetitions, callingSheet);
			return true;
		}
		return false;
	}
	cancelExecute() {
		if (this.trigger.type === TriggerFactory.TYPE.EXECUTE) this.trigger.cancelExecute();
	}
	stopProcessing(retval) {
		this.trigger.stopProcessing(retval);
		if (this.trigger.isEndless) this._msgHandler.next();
	}
	pauseProcessing() {
		this.trigger.pauseProcessing();
	}
	resumeProcessing() {
		this.trigger.resumeProcessing();
	}
	// ~

	// called by machine:
	pause() {
		super.pause();
		this.trigger.pause();
	}
	resume() {
		this.trigger.resume();
	}
	start() {
		super.start();
		this.trigger.start();
	}
	stop() {
		const stopped = this.trigger.stop();
		if (stopped) {
			this.reset();
			this.inbox.unsubscribe();
			this.sheet.getPendingRequests().clear();
		}
		return stopped;
	}

	preStep(manual) {
		this.trigger.preStep(manual);
	}
	step(manual) {
		this.trigger.step(manual);
	}
	postStep(manual) {
		this.trigger.postStep(manual);
	}

	// TODO: think .. - replace with pre-/postTriggerStep (willTrigger, didTrigger or similar)
	triggerStep() {
		if (this.sheet.isReady || this.sheet.isProcessed) this._attachMessage3();
		const result = this.sheet.startProcessing();
		if (this.sheet.isProcessed) {
			// on endless we reuse message
			if (!this.trigger.isEndless) this._msgHandler.next();
			this._detachMessage2();
		}
		this._emitter.emit('step', this);
		return result;
	}

	_attachMessage2() {
		if (this._msgHandler.isProcessed) {
			let newMessage;
			const oldMessage = this._msgHandler.message;
			if (this.inbox.size > 1) {
				if (oldMessage) this.inbox.pop(oldMessage.id);
				newMessage = this.inbox.peek();
			}
			if (newMessage) {
				this.stats.messages += 1; // newMessage ? 1 : 0;
				this._msgHandler.message = newMessage;
				this._emitMessageEvent('message_attached', newMessage);
			}
		}
	}
	_attachMessage3(message) {
		if (this._msgHandler.isProcessed) {
			const currmsg = this._msgHandler.message;
			if (currmsg) {
				if (currmsg === message) {
					this._msgHandler.reset();
				} else if (this.inbox.size > 1) {
					this.inbox.pop(currmsg.id);
					this._msgHandler.message = undefined;
				}
			}
		}
		if (!this._msgHandler.message) {
			this._attachMessage4(message || this.inbox.peek());
		}
	}
	_attachMessage4(message) {
		this.stats.messages += message ? 1 : 0;
		this._msgHandler.message = message;
		this._emitMessageEvent('message_attached', message);
	}
	_attachExecuteMessage(message) {
		// attach or reuse:
		if (message === this._msgHandler.message && !this._msgHandler.isProcessed) this._msgHandler.reset();
		else this._attachMessage(message);
	}
	_detachMessage2() {
		// get mark message as detached if its processed
		if (this._msgHandler.isProcessed) {
			// only send event, message will be popped from inbox on attach, so it still can be queried !!
			this._emitMessageEvent('message_detached', this._msgHandler.message);
		}
	}
}

module.exports = StreamSheet2;