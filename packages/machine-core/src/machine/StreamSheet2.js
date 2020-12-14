const State = require('../State');
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
			if (this._trigger.type === trigger.type) {
				// same trigger but with maybe different setting...
				trigger.isActive = this._trigger.isActive;
			}
			// dispose old trigger:
			if (this._trigger.isEndless && !trigger.isEndless) this.stopProcessing();
			else this._trigger.stop();
			this._trigger.dispose();
			this._trigger.streamsheet = undefined;
		}
		this._trigger = trigger;
		this._trigger.streamsheet = this;
		// TODO: move following to AbstractSheetTrigger set streamsheet() {}
		// apply current state if differ from stop
		if (this.sheet.isPaused) this._trigger.pause();
		else if (this.machine && this.machine.state === State.RUNNING) this._trigger.resume(true);
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
		if (this.trigger.type === StreamSheetTrigger.TYPE.EXECUTE) {
			if (!this.sheet.isProcessed) this.stopProcessing();
			this.trigger.isActive = false;
		}
	}
	stopProcessing(retval) {
		this.trigger.stopProcessing();
		this.sheet.stopProcessing(retval);
		if (this.trigger.isEndless) this._msgHandler.next();
	}
	pauseProcessing() {
		this.sheet.pauseProcessing();
		this.trigger.pause();
	}
	resumeProcessing() {
		this.sheet.resumeProcessing();
		this.trigger.resume();
	}

	// called by machine:
	pause() {
		super.pause();
		this.trigger.pause();
	}
	resume() {
		// not paused by function:
		if (!this.sheet.isPaused) this.trigger.resume();
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
			this.sheet.stopProcessing();
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