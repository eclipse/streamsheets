
const ChartFormat = require('./ChartFormat');

module.exports = class ChartElement {
	constructor() {
		this.format = new ChartFormat();
		this.visible = false;
	}

	save(name, writer) {
		writer.writeStartElement(name);
		writer.writeAttributeNumber('visible', this.visible ? 1 : 0);
		this.format.save('format', writer);
		writer.writeEndElement();
	}

	read(reader, object) {
		this.visible = reader.getAttributeBoolean(object, 'visible', false);

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'format':
				this.format = new ChartFormat();
				this.format.read(reader, child);
				break;
			}
		});
	}
};
