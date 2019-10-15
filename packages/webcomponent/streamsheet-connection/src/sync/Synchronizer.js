class Synchronizer {

	constructor() {
		this.pending = 0;
		this.callbacks = [];
		this._executeCallbacks = this._executeCallbacks.bind(this);
	}

	sync(func, cb) {
		this.pending += 1;
		this.callbacks.push(cb);
		setImmediate(() => {
			func();
			this.pending -= 1;
			this._executeCallbacks();
		});
	}
	
	_executeCallbacks() {
		if (this.pending < 1) {
			this.pending = 0;
			this.callbacks.forEach((cb) => cb());
			this.callbacks.length = 0;
		}
	}
}

// singleton:
export default new Synchronizer();