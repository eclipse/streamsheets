/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
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

		this.getFormat().setLineColor(JSG.theme.frame);
		this.getFormat().setFillColor(JSG.theme.header);
		this.getTextFormat().setFontColor(JSG.theme.text);
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
		return 0;
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
			if (data._parent !== undefined) {
				let parent = this._sectionData[data._parent];
				while (parent) {
					if (parent && parent._closed) {
						return 0;
					}
					parent = parent._parent === undefined ? undefined : this._sectionData[parent._parent];
				}
			}
			return data._visible ? data._size : 0;
		}

		return this.getDefaultSectionSize();
	}

	setSectionClosed(index, closed) {
		if (closed === undefined && this._sectionData[index] === undefined) {
			return;
		}

		const section = this.getOrCreateSectionAt(index);
		if (section !== undefined) {
			section._closed = closed ? true : undefined;
			if (!section._closed) {
				const direction = this.getHeaderAttributes().getOutlineDirection().getValue();
				const max = this.getSections();
				let parent;

				if (direction === 'above') {
					for (let i = index + 1; i < max; i += 1) {
						parent = this.getSectionParent(i);
						if (parent === index) {
							this.setSectionVisible(i,true);
						}
					}
				} else {
					for (let i = index - 1; i >= 0; i -= 1) {
						parent = this.getSectionParent(i);
						if (parent === index) {
							this.setSectionVisible(i,true);
						}
					}
				}
			}
		}
	}

	getSectionClosed(index) {
		const data = this._sectionData[index];

		if (data) {
			return data._closed === true;
		}
		return false;
	}

	setSectionSize(index, size) {
		const section = this.getOrCreateSectionAt(index);
		if (section !== undefined) {
			section._size = size < 0 ? 0 : size;
			section._visible = size > 0;
			if (section._parent) {
				const data = this._sectionData[section._parent];
				if (data && data._closed) {
					data._closed = undefined;
				}
			}
		}
	}

	getSectionLevel(index) {
		const data = this._sectionData[index];

		return data ? data.level : 0;
	}

	setSectionLevel(index, level) {
		const section = this.getOrCreateSectionAt(index);
		if (section !== undefined) {
			section.level = Math.max(0, level);
		}
	}

	getSectionParent(index) {
		const data = this._sectionData[index];

		return data ? data.parent : undefined;
	}

	setSectionParent(index, parent) {
		const section = this.getOrCreateSectionAt(index);
		if (section !== undefined) {
			section.parent = parent;
		}
	}

	setSectionVisible(index, visible) {
		const section = this.getOrCreateSectionAt(index);
		if (section !== undefined) {
			section.setVisible(visible);
			if (visible && section.getSize() === 0) {
				section.setSize(this.getDefaultSectionSize());
			}
			if (section._parent !== undefined) {
				const data = this._sectionData[section._parent];
				if (data && data._closed) {
					data._closed = undefined;
				}
			}
		}
	}

	getSectionTitle(index) {
		return undefined;
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

	getMaxLevel() {
		let level = 0;

		this._sectionData.forEach((section) => {
			level = Math.max(section.level, level);
		})

		return level;
	}

	saveCondensed(writer, name) {
		this.updateParents();
		writer.writeStartElement(name);

		writer.writeAttributeString('outline', this.getHeaderAttributes().getOutlineDirection().getValue());

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
			this.getHeaderAttributes().setOutlineDirection(reader.getAttributeString(object, 'outline', 'above'));
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

	updateOutlineOpen(index, direction) {
		const max = this.getSections();
		const level = this.getSectionLevel(index);
		let lev;
		let size = 0;

		if (direction === 'above') {
			lev = this.getSectionLevel(index + 1);
			if (lev > level) {
				let iSub = index + 1;
				size = 0;
				while (iSub < max && lev > level) {
					if (this.getSectionParent(iSub) === index) {
						size += this.getSectionSize(iSub);
					}
					lev = this.getSectionLevel(iSub);
					iSub += 1;
				}

				const closed = size ? undefined : true
				let data = this._sectionData[index];
				if (closed || data) {
					data = this.getOrCreateSectionAt(index);
					data._closed = closed;
				}
			}
		} else {
			if (!index) {
				return;
			}
			lev = this.getSectionLevel(index - 1);
			if (lev > level) {
				let iSub = index - 1;
				size = 0;
				while (iSub > 0 && lev > level) {
					if (this.getSectionParent(iSub) === index) {
						size += this.getSectionSize(iSub);
					}
					lev = this.getSectionLevel(iSub);
					iSub -= 1;
				}

				const closed = size ? undefined : true
				let data = this._sectionData[index];
				if (closed || data) {
					data = this.getOrCreateSectionAt(index);
					data._closed = closed;
				}
			}
		}
	}

	updateParents() {
		let level;
		let lastLevel = 0;
		let j;
		const parent = [];
		const direction = this.getHeaderAttributes().getOutlineDirection().getValue();
		const max = this._sectionData.length + 1;

		if (direction === 'above') {
			for (let i = 0; i < max; i += 1) {
				level = this.getSectionLevel(i);
				if (i === 0 && level > 0) {
					this.setSectionLevel(i, 0);
				}
				parent[level] = i;
				if (level) {
					j = level - 1;
					while (j > 0 && parent[j] === undefined) {
						j -= 1;
					}
					this.setSectionParent(i, i === parent[j] ? undefined : parent[j]);
				} else if (this.getSectionParent(i) !== undefined) {
					this.setSectionParent(i, undefined);
				}
				j = lastLevel;
				while (j > level) {
					parent[j] = undefined;
					j -= 1;
				}
				lastLevel = level;
			}
		} else {
			for (let i = max; i >= 0; i -= 1) {
				level = this.getSectionLevel(i);
				parent[level] = i;
				if (level) {
					j = level - 1;
					while (j > 0 && parent[j] === undefined) {
						j -= 1;
					}
					this.setSectionParent(i, i === parent[j] ? undefined : parent[j]);
				} else if (this.getSectionParent(i) !== undefined) {
					this.setSectionParent(i, undefined);
				}
				j = lastLevel;
				while (j > level) {
					parent[j] = undefined;
					j -= 1;
				}
				lastLevel = level;
			}
		}

		for (let i = 0; i < max; i += 1) {
			if (this.getSectionSize(i)) {
				this.updateOutlineOpen(i, direction);
			}
		}

		return false;
	}

	getInternalSize() {
		return new Point(this.getDefaultSectionSize() * this.getSections(), 1000);
	}
};
