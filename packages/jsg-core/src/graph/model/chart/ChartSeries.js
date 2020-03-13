
const Expression = require('../../expr/Expression');
const ChartFormat = require('./ChartFormat');
const ChartMarker = require('./ChartMarker');

module.exports = class ChartSeries {
	constructor(type, formula) {
		this.type = type;
		this.formula = formula;
		this.format = new ChartFormat();
		this.marker = new ChartMarker();
		this.xAxis = 'primary';
		this.yAxis = 'primary';
	}

	set type(type) {
		this._type = type || 'line';
	}

	get type() {
		return this._type;
	}

	save(writer) {
		writer.writeStartElement('series');
		writer.writeAttributeString('type', this.type);
		writer.writeAttributeString('xaxis', this.xAxis);
		writer.writeAttributeString('yaxis', this.yAxis);
		this.formula.save('formula', writer);
		this.format.save('format', writer);
		this.marker.save('marker', writer);
		writer.writeEndElement();
	}

	read(reader, object) {
		this.type = reader.getAttribute(object, 'type');
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
			case 'marker':
				this.marker = new ChartMarker();
				this.marker.read(reader, child);
				break;
			}
		});
	}
};
