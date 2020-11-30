const State = require('../State');
const StreamSheet = require('./StreamSheet');

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
		this._myStopProcessCounter = 0;
	}

	// TODO rename => called by return function
	stopProcessing(retval) {
		this._myStopProcessCounter += 1;
		// this.trigger.stop(retval); // return should deactivate trigger!
		this.trigger.onReturn(retval);
		if (this.trigger.isEndless) this._msgHandler.next();
		// this.sheet.stopProcessing(retval);
		// const handler = this._msgHandler;
		// if (this._state === State.ACTIVE && this.trigger.isEndless && hasLoop(handler)) {
		// 	this._useNextLoopElement = true;
		// }
	}

	// machine paused:
	pause() {
		super.pause();
		this.trigger.pause();
		this._state = State.PAUSED;
	}

	start() {
		super.start();
		if (this._state === State.PAUSED) {
			this.trigger.resume();
		} else {
			this.trigger.start();
		}
		this._state = State.ACTIVE;
	}

	step(manual) {
		// TODO: here we check if machine is paused or sheet is waiting etc. if not we can go on...
		try {
			this._doStep(manual);
		} catch (err) {
			console.error(err);
		}
	}

	_doStep(manual) {
		this._attachMessage2();
		const result = this.trigger.step(manual);
		if (this.sheet.isFinished) {
			if (!this.trigger.isEndless) this._msgHandler.next();
			this._detachMessage2();
		}
		return result;
	}

	_attachMessage2() {
		// get new message if old one is processed and a new one exists
		if (this._msgHandler.isProcessed) {
			let newMessage;
			const oldMessage = this._msgHandler.message;
			if (this.inbox.size > 1) {
				if (oldMessage) this.inbox.pop(oldMessage.id);
				newMessage = this.inbox.peek();
			}
			if (newMessage) {
				this._msgHandler.message = newMessage;
				this._emitMessageEvent('message_attached', newMessage);
			}
		}
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