const ChartRect = require('./ChartRect');

module.exports = class Chart {
	constructor() {
		this._stacked = false;
		this._relative = false;
		this._dataMode = 'datazero';
		this.template = 'basic';
		this.margins = new ChartRect(200, 200, 200, 200);
	}

	get dataMode() {
		return this._dataMode;
	}

	set dataMode(value) {
		this._dataMode = (value === undefined ? 'datazero' : value);
	}

	get stacked() {
		return this._stacked;
	}

	set stacked(value) {
		this._stacked = (value === undefined ? false : !!Number(value));
	}

	get relative() {
		return this._relative;
	}

	set relative(value) {
		this._relative = (value === undefined ? false : !!Number(value));
	}

	save(writer) {
		writer.writeStartElement('chart');
		writer.writeAttributeString('datamode', this.dataMode);
		writer.writeAttributeString('template', this.template);
		writer.writeAttributeNumber('stacked', this.stacked ? 1 : 0);
		writer.writeAttributeNumber('relative', this.relative ? 1 : 0);
		writer.writeEndElement();
	}

	read(reader, object) {
		this.dataMode = reader.getAttribute(object, 'datamode');
		this.stacked = reader.getAttribute(object, 'stacked');
		this.relative = reader.getAttribute(object, 'relative');
		this.template = reader.getAttribute(object, 'template') ?
			reader.getAttribute(object, 'template') : 'basic';
	}
};
