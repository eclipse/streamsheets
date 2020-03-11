
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
		this.formatGrid = new ChartFormat();
		this.title = new ChartTitle(new Expression('Title', ''), false);
		this.gridVisible = true;
		this.autoZero = true;
	}

	isVertical() {
		return this.align === 'left' || this.align === 'right';
	}


	save(writer, name) {
		writer.writeStartElement(name);

		writer.writeAttributeString('align', this.align);
		writer.writeAttributeString('type', this.type);
		writer.writeAttributeString('name', this.name);
		writer.writeAttributeNumber('gridvisible', this.gridVisible ? 1 : 0);
		writer.writeAttributeNumber('autozero', this.autoZero ? 1 : 0);
		writer.writeAttributeString('position', this.position.toString());
		this.formula.save('formula', writer);
		this.format.save('format', writer);
		this.formatGrid.save('formatGrid', writer);
		this.title.save('axistitle', writer);

		writer.writeEndElement();
	}

	read(reader, object) {
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
		this.autoZero =
			reader.getAttribute(object, 'autozero') === undefined
				? true
				: !!Number(reader.getAttribute(object, 'autozero')) ;

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
			case 'formatGrid':
				this.formatGrid = new ChartFormat();
				this.formatGrid.read(reader, subChild);
				break;
			case 'axistitle':
				this.title = new ChartTitle(new Expression('Title', ''), false);
				this.title.read(reader, subChild);
				break;
			}
		});
	}
};
