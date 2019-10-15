const MessageBox = require('./MessageBox');

const DEF_CONF = () => ({
	max: 20, // -1, to signal no bounds...
	type: 'Inbox'
});

class Inbox extends MessageBox {
	constructor(cfg = {}) {
		cfg = Object.assign(DEF_CONF(), cfg);
		super(cfg);
		this._isSubcribed = false;
		this._stream = null;
	}

	toJSON() {
		const json = super.toJSON();
		json.stream = this._stream;
		return json;
	}

	load(conf = {}) {
		// TODO: Think of way to migrate when DEF_CONF changes
		conf.max = DEF_CONF().max;
		super.load(conf);
		this.stream = conf.stream && conf.stream.id ? conf.stream : null;
	}

	update(conf) {
		this.load(conf);
	}

	dispose() {
		this.unsubscribe();
		this.clear();
	}

	set stream(source) {
		if (source && source.id) {
			const wasSubscribed = this._isSubcribed;
			this.unsubscribe();
			this._stream = source.id !== 'none' ? source : null;
			if (wasSubscribed) {
				this.subscribe();
			}
		}
	}

	get full() {
		return this.messages.length >= this.max;
	}

	subscribe() {
		this._isSubcribed = true;
		if (this._stream) {
			this._emitter.emit('subscribe', this._stream.id);
		}
	}

	unsubscribe() {
		this._isSubcribed = false;
		if (this._stream) {
			this._emitter.emit('unsubscribe', this._stream.id);
		}
	}
}
module.exports = Inbox;
