const ChartRect = require('./ChartRect');

module.exports = class Chart {
	constructor() {
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

	save(writer) {
		writer.writeStartElement('chart');
		writer.writeAttributeString('datamode', this.dataMode);
		writer.writeAttributeString('template', this.template);
		writer.writeEndElement();
	}

	read(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'chart':
				this.dataMode = reader.getAttribute(child, 'datamode');
				this.template = reader.getAttribute(child, 'template') ?
					reader.getAttribute(child, 'template') : 'basic';
				break;
			}
		});
	}
};
