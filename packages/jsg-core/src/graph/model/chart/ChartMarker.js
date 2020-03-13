

module.exports = class ChartMarker {
	get style() {
		return this._style ? this._style : 'none';
	}

	get size() {
		return this._size ? this._size : 3;
	}

	save(name, writer) {
		if (this.lineColor === undefined && this.fillColor === undefined && this._style === undefined && this._size === undefined) {
			return;
		}

		writer.writeStartElement(name);
		if (this.lineColor !== undefined) {
			writer.writeAttributeString('linecolor', this.lineColor);
		}
		if (this.fillColor) {
			writer.writeAttributeString('fillcolor', this.fillColor);
		}
		if (this._style) {
			writer.writeAttributeString('style', this._style);
		}
		if (this._size) {
			writer.writeAttributeString('size', this._size);
		}
		writer.writeEndElement();
	}

	read(reader, object) {
		let val = reader.getAttribute(object, 'linecolor');
		if (val !== undefined) {
			this.lineColor = val;
		}
		val = reader.getAttribute(object, 'fillcolor');
		if (val !== undefined) {
			this.fillColor = val;
		}
		val = reader.getAttribute(object, 'style');
		if (val !== undefined) {
			this._style = val;
		}
		val = reader.getAttribute(object, 'size');
		if (val !== undefined) {
			this._size = Number(val);
		}
	}
};
