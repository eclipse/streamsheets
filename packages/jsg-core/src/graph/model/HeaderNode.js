const JSG = require('../../JSG');
const Arrays = require('../../commons/Arrays');
const ItemAttributes = require('../attr/ItemAttributes');
const Node = require('./Node');
const Point = require('../../geometry/Point');
const HeaderSection = require('./HeaderSection');
const HeaderAttributes = require('../attr/HeaderAttributes');

/**
 * @class HeaderNode
 *
 * @extends JSG.g raph.model.Node
 * @constructor
 */
module.exports = class HeaderNode extends Node {
	constructor() {
		super();

		this.addAttribute(new HeaderAttributes());

		this._sectionData = [];

		this.getFormat().setLineColor('#AAAAAA');
		this.getFormat().setFillColor('#F2F2F2');
		this.getItemAttributes().setSelectionMode(ItemAttributes.SelectionMode.NONE);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);
	}

	newInstance() {
		return new HeaderNode();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy._sectionData = [];

		this._sectionData.forEach((section, index) => {
			if (section !== undefined) {
				copy._sectionData[index] = section.copy();
			}
		});

		return copy;
	}

	getSheet() {
		return this.getParent() ? this.getParent().getParent() : undefined;
	}

	clear() {
		this._sectionData = [];
	}

	getMinSize() {
		return 0;
	}

	getSections() {
		return 100;
	}

	getSectionData() {
		return this._sectionData;
	}

	setSectionData(data) {
		this._sectionData = data;
	}

	getInitialSection() {
		return this.getHeaderAttributes()
			.getInitialSection()
			.getValue();
	}

	setInitialSection(index) {
		return this.getHeaderAttributes().setInitialSection(index);
	}

	insertSectionsAt(index, num, max) {
		Arrays.insertEmpty(this._sectionData, index, num, max);
	}

	removeSectionsAt(index, num) {
		Arrays.removeElements(this._sectionData, index, num);
	}

	getSectionsSize() {
		let i;
		let pos = 0;

		for (i = 0; i < this.getSections(); i += 1) {
			pos += this.getSectionSize(i);
		}

		return pos;
	}

	getHeaderAttributes() {
		return this.getModelAttributes().getAttribute(HeaderAttributes.NAME);
	}

	getDefaultSectionSize() {
		return this.getHeaderAttributes()
			.getDefaultSectionSize()
			.getValue();
	}

	setDefaultSectionSize(size) {
		return this.getHeaderAttributes().setDefaultSectionSize(size);
	}

	getSectionSize(index) {
		const data = this._sectionData[index];

		if (data) {
			return data._visible ? data._size : 0;
		}

		return this.getDefaultSectionSize();
	}

	setSectionSize(index, size) {
		const section = this.getOrCreateSectionAt(index);
		if (section !== undefined) {
			section._size = size < 0 ? 0 : size;
			section._visible = size > 0;
		}
	}

	setSectionVisible(index, visible) {
		const section = this.getOrCreateSectionAt(index);
		if (section !== undefined) {
			section.setVisible(visible);
		}
	}

	getSectionTitle(index) {
		const data = this._sectionData[index];
		if (data) {
			return data._title;
		}
		return undefined;
	}

	setSectionTitle(index, title) {
		const section = this.getOrCreateSectionAt(index);
		if (section !== undefined) {
			section._title = title;
		}
	}

	getSectionFormat(index) {
		const data = this._sectionData[index];
		if (data) {
			return data._format;
		}
		return undefined;
	}

	getOrCreateSectionFormat(index) {
		const section = this.getOrCreateSectionAt(index);
		return section.getOrCreateFormat();
	}

	setSectionFormat(index, format) {
		const data = this._sectionData[index];
		if (data) {
			data._format = format;
		}
	}

	getSectionTextFormat(index) {
		const data = this._sectionData[index];
		if (data) {
			return data._textFormat;
		}
		return undefined;
	}

	getOrCreateSectionTextFormat(index) {
		const section = this.getOrCreateSectionAt(index);
		return section.getOrCreateTextFormat();
	}

	setSectionTextFormat(index, format) {
		const data = this._sectionData[index];
		if (data) {
			data._textFormat = format;
		}
	}

	getSectionAttributes(index) {
		const data = this._sectionData[index];
		if (data) {
			return data._attributes;
		}
		return undefined;
	}

	getOrCreateSectionAttributes(index) {
		const section = this.getOrCreateSectionAt(index);
		return section.getOrCreateAttributes();
	}

	setSectionAttributes(index, format) {
		const data = this._sectionData[index];
		if (data) {
			data._attributes = format;
		}
	}

	getSectionAt(index) {
		if (index >= 0) {
			return this._sectionData[index];
		}
		return undefined;
	}

	setSectionAt(index, data) {
		this._sectionData[index] = data;
	}

	getOrCreateSectionAt(index) {
		let section = this.getSectionAt(index);
		if (section === undefined) {
			section = new HeaderSection();
			section._size = this.getDefaultSectionSize();
			this._sectionData[index] = section;
		}

		return section;
	}

	getSection(pos) {
		let current;
		let index = 0;

		current = 0;
		while (pos >= current) {
			current += this.getSectionSize(index);
			index += 1;
		}

		return Math.max(0, index - 1);
	}

	getSectionPos(index) {
		let pos = 0;
		let i;
		let size;

		for (i = 0; i < index; i += 1) {
			size = this.getSectionSize(i);
			pos += size;
		}

		return pos;
	}

	getSectionSplit(pos) {
		const tolerance = JSG.findRadius / 2;
		const section = this.getSection(pos);
		let sectionPos = this.getSectionPos(section);

		if (Math.abs(pos - sectionPos) < tolerance) {
			if (section > 0) {
				return section - 1;
			}
		}

		sectionPos += this.getSectionSize(section);

		if (Math.abs(sectionPos - pos) < tolerance) {
			return section;
		}

		return undefined;
	}

	enumerateSections(callback) {
		const defSection = new HeaderSection();
		let section;
		let i;
		let ret;
		const n = this.getSections();

		defSection.setSize(this.getDefaultSectionSize());

		for (i = 0; i < n; i += 1) {
			section = this._sectionData[i];
			if (section) {
				ret = callback(section, i);
			} else {
				ret = callback(defSection, i);
			}
			if (ret === false) {
				break;
			}
		}
	}

	enumerateSectionsStartEnd(start, end, callback) {
		const defSection = new HeaderSection();
		let section;
		let i;
		let ret;
		const n = this.getSections();

		defSection.setSize(this.getDefaultSectionSize());

		for (i = start; i < end; i += 1) {
			section = this._sectionData[i];
			if (section) {
				ret = callback(section, i);
			} else {
				ret = callback(defSection, i);
			}
			if (ret === false) {
				break;
			}
		}
	}

	saveCondensed(writer, name) {
		writer.writeStartElement(name);
		writer.writeStartArray('section');

		this._sectionData.forEach((data, index) => {
			data.save(writer, index);
		});

		writer.writeEndArray('section');
		writer.writeEndElement();
	}

	saveContent(writer, absolute) {
		super.saveContent(writer, absolute);

		writer.writeAttributeString('type', 'headernode');

		writer.writeStartElement('sections');
		writer.writeStartArray('section');

		this._sectionData.forEach((data, index) => {
			data.save(writer, index);
		});

		writer.writeEndArray('section');
		writer.writeEndElement();
	}

	_assignName(id) {
		this.setName(`Header + ${id}`);
	}

	read(reader, object) {
		let sections;

		if (reader.version >= 1) {
			sections = object;
		} else {
			super.read(reader, object);
			sections = reader.getObject(object, 'sections');
			if (sections === undefined) {
				return;
			}
		}

		reader.iterateObjects(sections, (name, child) => {
			switch (name) {
				case 'section': {
					const index = reader.getAttribute(child, 'index');
					if (index !== undefined) {
						const section = new HeaderSection();
						section._size = this.getDefaultSectionSize();
						section.read(reader, child);
						if (!section.isDefault(this.getDefaultSectionSize())) {
							this._sectionData[Number(index)] = section;
						}
					}
					break;
				}
				default:
					break;
			}
		});

		// overwrite old settings
		this.getFormat().setFillColor('#F2F2F2');
	}

	assignProperties(data) {
		if (data === undefined) {
			return;
		}

		let section;

		Object.entries(data).forEach(([ref, props]) => {
			section = this.getSectionFromReference(ref);
			if (section) {
				const { attributes = {} } = props;
				if (attributes.size !== undefined) {
					section.setSize(Number(attributes.size));
				}
				if (attributes.visible !== undefined) {
					section.setVisible(attributes.visible === '1');
				}
				section.properties = props;
			}
		});
	}

	getInternalSize() {
		return new Point(this.getDefaultSectionSize() * this.getSections(), 1000);
	}
};
