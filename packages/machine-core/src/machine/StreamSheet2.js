const StreamSheet = require('./StreamSheet');
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
		this._triggerCounter = 0;
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
		// const doIt = this.trigger.type === StreamSheetTrigger.TYPE.EXECUTE;
		// this.executeCallback = callback;
		// if (doIt) {
		// 	const stepdata = { cmd: 'execute' };
		// 	message = !this._reuseMessage() ? getMessage(message, selector, this.inbox) : undefined;
		// 	this._doStep(stepdata, message);
		// } else {
		// 	this._notifyResumeCallback(false);
		// }
		// return doIt;
	}
	// TODO maybe rename => called only by return function
	stopProcessing(retval) {
		this.trigger.stop();
		this.sheet.stopProcessing(retval);
		this.trigger.stopRepeat();
		// if (this.trigger.isEndless) {
		// 	this._msgHandler.next();
		// 	this.trigger.stopRepeat();
		// }
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
			this.sheet.stopProcessing();
			this.sheet.getPendingRequests().clear();
		}
		return stopped;
	}

	step(manual) {
		// TODO: here we check if machine is paused or sheet is waiting etc. if not we can go on...
		try {
			// this._doStep(manual);
			// if we stopped on return() we start again...
			// if (this.sheet.isStopped) this.sheet.startProcessing();
			this.trigger.step(manual);
			// if (this.sheet.isProcessing) this.sheet.stopProcessing();
		} catch (err) {
			console.error(err);
		}
	}
	// _doStep(manual) {
	// 	this._attachMessage2();
	// 	const result = this.trigger.step(manual);
	// 	if (this.sheet.isFinished) {
	// 		if (!this.trigger.isEndless) this._msgHandler.next();
	// 		this._detachMessage2();
	// 	}
	// 	return result;
	// }

	// called by trigger
	triggerStepORG() {
		// TODO: should we do this on step() ???
		this._attachMessage2();
		const result = this.sheet.startProcessing();
		if (this.sheet.isProcessed) {
			if (!this.trigger.isEndless) this._msgHandler.next();
			this._detachMessage2();
		}
		return result;
	}
	triggerStep() {
		this._triggerCounter += 1;
		if (this.sheet.isReady || this.sheet.isProcessed) this._attachMessage3();
		const result = this.sheet.process();
		if (this.sheet.isProcessed) {
			// on endless we reuse message
			if (!this.trigger.isEndless) this._msgHandler.next();
			this._detachMessage2();
		}
		return result;
	}
	_attachMessage3() {
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
	_attachMessage(message) {
		if (message) {
			this.stats.messages += 1;
			this._msgHandler.message = message;
			this._emitMessageEvent('message_attached', message);
		}
	}
	_attachMessage2(message) {
		// get new message if old one is processed and a new one exists
		if (this._msgHandler.isProcessed) {
			let newMessage;
			const oldMessage = this._msgHandler.message;
			if (this.inbox.size > 1) {
				if (oldMessage) this.inbox.pop(oldMessage.id);
				newMessage = this.inbox.peek();
			}
			if (message) newMessage = message;
			if (newMessage) {
				this.stats.messages += 1; // newMessage ? 1 : 0;
				this._msgHandler.message = newMessage;
				this._emitMessageEvent('message_attached', newMessage);
			}
		}
	}
	// _attachMessage(message) {
	// 	this.stats.messages += message ? 1 : 0;
	// 	this._msgHandler.message = message;
	// 	this._emitMessageEvent('message_attached', message);
	// }
	_detachMessage2() {
		// get mark message as detached if its processed
		if (this._msgHandler.isProcessed) {
			// only send event, message will be popped from inbox on attach, so it still can be queried !!
			this._emitMessageEvent('message_detached', this._msgHandler.message);
		}
	}
}

module.exports = StreamSheet2;