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
const BaseTrigger = require('./BaseTrigger');

const TYPE_CONF = { type: 'execute' };

class ExecuteTrigger extends BaseTrigger {
	static get TYPE() {
		return TYPE_CONF.type;
	}
	constructor(cfg = {}) {
		super(Object.assign(cfg, TYPE_CONF));
		this._isActive = false;
		// flag to indicate that calculation was stopped, e.g. by return()
		// this._isStopped = false;
		// flag to prevent executing twice on manual stepping if this comes before triggering sheet
		this._isExecuted = false;
		this._resumeFn = undefined;
	}

	preStep(manual) {
		super.preStep(manual);
		// init flags:
		// this._isStopped = false;
		this._isExecuted = false;
	}

	_finishStep() {
		// super._finishStep();
		// if (this._resumeFn && this.sheet.isProcessed && !this.isEndless) this._resumeFn();

		const streamsheet = this._streamsheet;
		if (!this.sheet.isProcessed || !streamsheet.isMessageProcessed()) {
			this._executeStreamSheet(streamsheet);
			// do {
			// 	streamsheet.triggerStep();
			// } while (!this._isStopped && !streamsheet.isMessageProcessed());
		}
		// if (!this._isStopped && this.sheet.isProcessed && this._resumeFn) this._resumeFn();
		if (!this.sheet.isStopped && this.sheet.isProcessed && this._resumeFn) this._resumeFn();

	}


	execute(resumeFn) {
		this._resumeFn = resumeFn;
		// this._isStopped = false;
		this._streamsheet.stats.steps += 1;
		this._isActive = true;
		this.isResumed = false;
		this.trigger();
	}
	cancelExecute() {
		if (!this.sheet.isProcessed) this.stopProcessing();
		this._isActive = false;
		this._resumeFn = undefined;
	}

	step(manual) {
		if (manual && !this._isExecuted && this._isActive && this.isEndless) {
			this.doRepeatStep();
		}
	}

	doCycleStep() {
		if (this.isEndless) this._streamsheet.stats.repeatsteps += 1;
		this._doExecute();
	}
	_startRepeat() {
		// decrease since it is increased on each execute() repetition
		this._streamsheet.stats.steps -= 1;
		super._startRepeat();
	}

	doRepeatStep() {
		this.isResumed = this.isResumed && this.isManualStep;
		if (!this.isResumed) {
			this._streamsheet.stats.repeatsteps += 1;
			this._doExecute();
		}
	}
	_doExecute() {
		if (!this.isResumed && this._isActive) {
			this._isExecuted = true;
			// trigger step as long as message is not processed completely or we are stopped or endless
			if (this.isEndless) {
				this._doExecuteInEndlessMode(this._streamsheet);
			} else {
				this._doExecuteInNormalMode(this._streamsheet);
			}
			// const streamsheet = this._streamsheet;
			// streamsheet.triggerStep();
			// if (!this._isStopped && !this.isEndless && this.sheet.isProcessed && this._resumeFn) this._resumeFn();
			// this._isActive = !this._isStopped && (this.isEndless || this.sheet.isPaused);
			this._isActive = !this.sheet.isStopped && (this.isEndless || this.sheet.isPaused);
		}
	}
	_doExecuteInNormalMode(streamsheet) {
		// do {
		// 	streamsheet.triggerStep();
		// } while (!this._isStopped && !streamsheet.isMessageProcessed());
		this._executeStreamSheet(streamsheet);
		// if (!this._isStopped && this.sheet.isProcessed && this._resumeFn) this._resumeFn();
		if (!this.sheet.isStopped && this.sheet.isProcessed && this._resumeFn) this._resumeFn();
	}
	_doExecuteInEndlessMode(streamsheet) {
		this._executeStreamSheet(streamsheet);
		// if (!this._isStopped && !this.isEndless && this.sheet.isProcessed && this._resumeFn) this._resumeFn();
	}

	_executeStreamSheet(streamsheet) {
		do {
			streamsheet.triggerStep();
		// } while (!this._isStopped && !this.sheet.isPaused && !streamsheet.isMessageProcessed());
		} while (!this.sheet.isHalted && !streamsheet.isMessageProcessed());
		// console.log('executed');
	}

	stopProcessing(retval) {
		super.stopProcessing(retval);
		this._isActive = false;
		// this._isStopped = true;
		if (this._resumeFn) this._resumeFn(retval);
	}

	update(config = {}) {
		if (this.isEndless && config.repeat !== 'endless') this.stopProcessing();
		super.update(config);
	}

	_processStreamsheet(streamsheet) {
		// solange immer wieder triggern bis komplette nachricht processed oder sheet pausiert oder sheet gestopped
		// bei resume muss wieder angefangen werden, falls nachricht oder sheet noch nicht komplett processed
		this._processId = setImmediate();
	}
}
module.exports = ExecuteTrigger;
