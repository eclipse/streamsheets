const jsonpath = require('../functions/jsonpath');

const DEF = {
	path: '',
	enabled: false
};

const loopElement = (message, datapath) => {
	const element = { keys: undefined, loop: undefined };
	if (message) {
		const path = datapath && jsonpath.parse(datapath);
		const rootpath = path && path.length ? path.shift().toLowerCase() : undefined;
		// const looppath = path.length ? jsonpath.toString(path) : '';
		// eslint-disable-next-line no-nested-ternary
		element.loop = rootpath
			? rootpath === 'data'
				? message.getDataAt(path)
				: message.getMetaDataAt(path)
			: undefined;
		// DL-1159: loop should support objects!
		if (element.loop) {
			element.keys = Object.keys(element.loop);
			element.loop = Array.isArray(element.loop) ? element.loop : element.keys.map((key) => element.loop[key]);
		}
	}
	return element;
};
const indexFromPath = (pathstr) => {
	const parts = jsonpath.parse(pathstr);
	const index = parseInt(parts[0], 10);
	return !isNaN(index) && isFinite(index) ? Math.max(index, 0) : 0;
};

const isLoopDefined = (handler) => handler.isEnabled && !!handler._loopElement.loop;

const getKeyForIndex = (index, keys) => (keys ? keys[Math.max(0, index)] : '0');

class MessageHandler {
	constructor(cfg = {}) {
		this.config = Object.assign({}, DEF, cfg);
		this._index = 0;
		this._used = false; // REVIEW: to track if a message was used at all, e.g. if it has no loop-element. improve!!
		// this._loop = undefined;
		this._message = undefined;
		this._loopElement = { keys: undefined, loop: undefined };
	}

	toJSON() {
		return Object.assign({}, this.config);
	}

	update(cfg = {}) {
		Object.assign(this.config, cfg);
		this.reset();
	}

	get path() {
		return this.config.path;
	}
	set path(path) {
		this.config.path = path;
		this.reset();
	}

	get index() {
		// DL-712: we keep last loop element...
		const last = this._loopElement.loop ? this._loopElement.loop.length - 1 : 0;
		return Math.max(0, Math.min(this._index, last));
	}

	get indexKey() {
		// return '0' by default to match legacy behaviour which returned 0 as default...
		return this._loopElement.keys ? this._loopElement.keys[this.index] : '0';
	}

	get message() {
		return this._message;
	}
	set message(message) {
		this._message = message;
		this.reset();
	}

	get isEnabled() {
		return this.config.enabled;
	}

	set isEnabled(doIt) {
		this.config.enabled = !!doIt;
	}

	get isProcessed() {
		return !this._message || (this._used && !this.hasNext());
	}

	hasLoop() {
		return !!this._loopElement.loop;
	}

	getLoopCount() {
		return this._loopElement.loop != null ? this._loopElement.loop.length : -1;
	}

	setLoopIndexFromPath(path) {
		const looppath = this.path;
		const pathIdx = path.indexOf(looppath);
		this._index = pathIdx >= 0 ? indexFromPath(path.substr(pathIdx + looppath.length)) : 0;
	}

	reset() {
		this._index = 0;
		this._used = false;
		// this._loop = this._message ? loopElement(this._message, this.config.path) : undefined;
		this._loopElement = loopElement(this._message, this.config.path);
	}

	prefix(/* pref */) {
		const curridx = Math.max(0, this._index);
		return `${this.path}[${curridx}]`;
	}

	pathForIndex(index) {
		return `${this.path}[${getKeyForIndex(index, this._loopElement.keys)}]`;
	}

	hasNext() {
		return isLoopDefined(this) && this._index < this._loopElement.loop.length;
	}

	hasPrevious() {
		return isLoopDefined(this) && this._index > 0;
	}

	next() {
		// we handle only 2D data...
		const nxtdata = isLoopDefined(this) ? this._loopElement.loop[this._index] : undefined;
		this._index = nxtdata != null ? Math.min(this._index + 1, this._loopElement.loop.length) : this._index;
		this._used = true;
		return nxtdata;
	}

	previous() {
		const prevdata = isLoopDefined(this) ? this._loopElement.loop[this._index - 2] : undefined;
		this._index = prevdata != null ? Math.max(this._index - 1, 0) : this._index;
		return prevdata;
	}
}

module.exports = MessageHandler;
