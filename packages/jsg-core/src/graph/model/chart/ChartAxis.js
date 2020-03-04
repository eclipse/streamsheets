
const Expression = require('../../expr/Expression');
const ChartFormat = require('./ChartFormat');
const ChartRect = require('./ChartRect');
const ChartTitle = require('./ChartTitle');

module.exports = class ChartAxis {
	constructor(name, type, align, size) {
		this.type = type;
		this.name = name;
		this.position = new ChartRect();
		this.size = size;
		this.align = align;
		this.formula = new Expression(0, 'AXIS()');
		this.format = new ChartFormat();
		this.title = new ChartTitle(new Expression('Title', ''), false);
		this.gridVisible = true;
	}

	save(writer, name) {
		writer.writeStartElement(name);

		writer.writeAttributeNumber('size', this.size, 0);
		writer.writeAttributeString('align', this.align);
		writer.writeAttributeString('type', this.type);
		writer.writeAttributeString('name', this.name);
		writer.writeAttributeNumber('gridvisible', this.gridVisible ? 1 : 0);
		writer.writeAttributeString('position', this.position.toString());
		this.formula.save('formula', writer);
		this.format.save('format', writer);
		this.title.save('axistitle', writer);

		writer.writeEndElement();
	}

	read(reader, object) {
		this.size =
			reader.getAttribute(object, 'size') === undefined
				? 500
				: Number(reader.getAttribute(object, 'size'));
		this.align =
			reader.getAttribute(object, 'align') === undefined
				? 'left'
				: reader.getAttribute(object, 'align');
		this.type =
			reader.getAttribute(object, 'type') === undefined
				? 'linear'
				: reader.getAttribute(object, 'type');
		this.name =
			reader.getAttribute(object, 'name') === undefined
				? 'primary'
				: reader.getAttribute(object, 'name');
		this.position = ChartRect.fromString(reader.getAttribute(object, 'position'));
		this.gridVisible =
			reader.getAttribute(object, 'gridvisible') === undefined
				? true
				: !!Number(reader.getAttribute(object, 'gridvisible')) ;

		reader.iterateObjects(object, (subName, subChild) => {
			switch (subName) {
			case 'formula':
				this.formula = new Expression(0);
				this.formula.read(reader, subChild);
				break;
			case 'format':
				this.format = new ChartFormat();
				this.format.read(reader, subChild);
				break;
			case 'axistitle':
				this.title = new ChartTitle(new Expression('Title', ''), false);
				this.title.read(reader, subChild);
				break;
			}
		});
	}
};
