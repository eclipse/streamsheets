
const Expression = require('../../expr/Expression');
const ChartFormat = require('./ChartFormat');

module.exports = class ChartSeries {
	constructor(type, formula) {
		this._stacked = false;
		this._relative = false;
		this._dataMode = 'datazero';
		this.type = type;
		this.formula = formula;
		this.format = new ChartFormat();
		this.xAxis = 'primary';
		this.yAxis = 'primary';
	}

	set type(type) {
		if (type === undefined) {
			return;
		}

		this._stacked = type.indexOf('stacked') !== -1;
		this._relative = type.indexOf('100') !== -1;

		switch(type) {
		case 'areastacked':
		case 'areastacked100':
			this._type = 'area';
			break;
		case 'columnstacked':
		case 'columnstacked100':
			this._type = 'column';
			break;
		case 'linestacked':
		case 'linestacked100':
			this._type = 'line';
			break;
		default:
			this._type = type || 'line';
			break;
		}
	}

	get type() {
		return this._type;
	}

	get stacked() {
		return this._stacked;
	}

	set stacked(value) {
		if (value === undefined || value === 'false') {
			this._stacked = false;
		} else {
			this._stacked = !!Number(value);
		}
	}

	get relative() {
		return this._relative;
	}

	set relative(value) {
		this._relative = (value === undefined ? false : !!Number(value));
	}

	get dataMode() {
		return this._dataMode;
	}

	set dataMode(value) {
		this._dataMode = (value === undefined ? 'datazero' : value);
	}

	save(writer) {
		writer.writeStartElement('series');
		writer.writeAttributeString('type', this.type);
		writer.writeAttributeNumber('stacked', this.stacked ? 1 : 0);
		writer.writeAttributeNumber('relative', this.relative ? 1 : 0);
		writer.writeAttributeString('datamode', this.dataMode);
		writer.writeAttributeString('xaxis', this.xAxis);
		writer.writeAttributeString('yaxis', this.yAxis);
		this.formula.save('formula', writer);
		this.format.save('format', writer);
		writer.writeEndElement();
	}

	read(reader, object) {
		this.type = reader.getAttribute(object, 'type');
		this.stacked = reader.getAttribute(object, 'stacked');
		this.relative = reader.getAttribute(object, 'relative');
		this.dataMode = reader.getAttribute(object, 'datamode');
		this.xAxis =
			reader.getAttribute(object, 'xaxis') === undefined
				? 'primary'
				: reader.getAttribute(object, 'xaxis');
		this.yAxis =
			reader.getAttribute(object, 'yaxis') === undefined
				? 'primary'
				: reader.getAttribute(object, 'yaxis');

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'formula':
				this.formula = new Expression(0);
				this.formula.read(reader, child);
				break;
			case 'format':
				this.format = new ChartFormat();
				this.format.read(reader, child);
				break;
			}
		});
	}
};
