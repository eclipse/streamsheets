class EventCountingMap {
	constructor() {
		this._map = new Map();
	}

	add(event) {
		const id = performance.now();
		this._map.set(id, event);
		setTimeout(() => {
			this._map.delete(id);
		}, 1000);
	}

	get size() {
		return this._map.size;
	}
}

export default EventCountingMap;
