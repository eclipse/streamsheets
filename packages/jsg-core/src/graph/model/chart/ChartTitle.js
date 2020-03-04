
const ChartFormat = require('./ChartFormat');
const ChartRect = require('./ChartRect');
const Expression = require('../../expr/Expression');

module.exports = class ChartTitle {
	constructor(formula) {
		this.formula = formula;
		this.position = new ChartRect();
		this.format = new ChartFormat();
		this.size = 700;
		this.visible = true;
	}

	save(writer) {
		writer.writeStartElement('title');
		writer.writeAttributeNumber('visible', this.visible ? 1 : 0);
		this.formula.save('formula', writer);
		this.format.save('format', writer);
		writer.writeEndElement();
	}

	read(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'title': {
				this.visible =
					reader.getAttribute(child, 'visible') === undefined
						? true
						: !!Number(reader.getAttribute(child, 'visible')) ;
				reader.iterateObjects(child, (subName, subChild) => {
					switch (subName) {
					case 'formula':
						this.formula = new Expression(0);
						this.formula.read(reader, subChild);
						break;
					case 'format':
						this.format = new ChartFormat();
						this.format.read(reader, subChild);
						break;
					}
				});
				break;
			}
			}
		});
	}
};
