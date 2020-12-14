const StreamSheet = require('./StreamSheet');
const SheetProcessor2 = require('./SheetProcessor2');
const StreamSheetTrigger = require('./StreamSheetTrigger');


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
	}

	get trigger() {
		return this._trigger;
	}
	set trigger(trigger) {
		if (this._trigger) {
			// same trigger but with maybe different setting...
			if (this._trigger.type === trigger.type) trigger.isActive = this._trigger.isActive;
			// dispose old trigger:
			// TODO: move following to trigger itself:
			if (this._trigger.isEndless && !trigger.isEndless) this.stopProcessing();
			else this._trigger.stop(true);
			this._trigger.dispose();
		}
		// register new trigger:
		this._trigger = trigger;
		this._trigger.streamsheet = this;
	}


	// called by sheet functions:
	execute(message, repetitions, callingSheet) {
		if (this.trigger.type === StreamSheetTrigger.TYPE.EXECUTE) {
			// attach message?
			if (message) this._attachExecuteMessage(message);
			this.trigger.execute(repetitions, callingSheet);
			return true;
		}
		return false;
	}
	cancelExecute() {
		if (this.trigger.type === StreamSheetTrigger.TYPE.EXECUTE) this.trigger.cancelExecute();
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
		if (this.sheet.isReady || this.sheet.isProcessed) this._attachMessage2();
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