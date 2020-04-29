const ChartRect = require('./ChartRect');
const Expression = require('../../expr/Expression');

module.exports = class Chart {
	constructor() {
		this._period = false;
		this._stacked = false;
		this._relative = false;
		this._dataMode = 'datazero';
		this.rotation = Math.PI_2;
		this.startAngle = 0;
		this.endAngle = Math.PI * 2;
		this.hole = 0.5;
		this.template = 'basic';
		this.tooltips = false;
		this.margins = new ChartRect(200, 200, 200, 200);
		this.coharentData = true;
		this.firstCategoryLabels = true;
		this.firstSeriesLabels = true;
		this.dataInRows = true;
		this.formula = new Expression('');
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

	get period() {
		return this._period;
	}

	set period(value) {
		this._period = (value === undefined ? false : !!Number(value));
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
		writer.writeAttributeNumber('coharent', this.coharentData ? 1 : 0);
		writer.writeAttributeNumber('firstcategories', this.firstCategoryLabels ? 1 : 0);
		writer.writeAttributeNumber('firstseries', this.firstSeriesLabels ? 1 : 0);
		writer.writeAttributeNumber('datainrows', this.dataInRows ? 1 : 0);
		writer.writeAttributeNumber('stacked', this.stacked ? 1 : 0);
		writer.writeAttributeNumber('relative', this.relative ? 1 : 0);
		writer.writeAttributeNumber('period', this.period ? 1 : 0);
		writer.writeAttributeNumber('tooltips', this.tooltips ? 1 : 0);
		writer.writeAttributeNumber('rotation', this.rotation);
		writer.writeAttributeNumber('startangle', this.startAngle);
		writer.writeAttributeNumber('endangle', this.endAngle);
		writer.writeAttributeNumber('hole', this.hole);
		this.formula.save('formula', writer);
		writer.writeEndElement();
	}

	read(reader, object) {
		this.dataMode = reader.getAttribute(object, 'datamode');
		this.stacked = reader.getAttribute(object, 'stacked');
		this.relative = reader.getAttribute(object, 'relative');
		this.period = reader.getAttribute(object, 'period');
		this.coharentData = reader.getAttributeBoolean(object, 'coharent', true);
		this.firstCategoryLabels = reader.getAttributeBoolean(object, 'firstcategories', true);
		this.firstSeriesLabels = reader.getAttributeBoolean(object, 'firstseries', true);
		this.dataInRows = reader.getAttributeBoolean(object, 'datainrows', true);
		this.tooltips = reader.getAttributeBoolean(object, 'tooltips', true);
		this.rotation = reader.getAttributeNumber(object, 'rotation', 0);
		this.startAngle = reader.getAttributeNumber(object, 'startangle', 0);
		this.endAngle = reader.getAttributeNumber(object, 'endangle', Math.PI * 2);
		this.hole = reader.getAttributeNumber(object, 'hole', 0.5);
		this.template = reader.getAttribute(object, 'template') ?
			reader.getAttribute(object, 'template') : 'basic';
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'formula':
				this.formula = new Expression(0);
				this.formula.read(reader, child);
				break;
			}
		});
	}
};
