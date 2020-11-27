class AbstractStreamSheetTrigger {
	constructor(config = {}) {
		this.config = Object.assign({}, config);
		this.isActive = false;
		this._streamsheet = undefined;
		this._repeat = this.config.repeat || 'once';
	}

	toJSON() {
		return Object.assign({}, this.config);
	}

	get type() {
		return this.config.type;
	}

	get isEndless() {
		return this._repeat === 'endless';
	}

	set streamsheet(streamsheet) {
		this._streamsheet = streamsheet;
	}

	// called by streamsheet. signals that it will be removed. trigger should perform clean up here...
	dispose() {}

	update(config = {}) {
		this.config = Object.assign(this.config, config);
		this._repeat = this.config.repeat || 'once';
	}

	preProcess() {}

	isTriggered() {
		return this.isEndless;
	}

	postProcess() {}

	// DL-654
	stop() {
		this.isActive = false;
		return true;
	}
}

module.exports = AbstractStreamSheetTrigger;