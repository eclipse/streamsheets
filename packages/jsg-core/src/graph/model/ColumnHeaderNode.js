const Point = require('../../geometry/Point');
const HeaderNode = require('./HeaderNode');
const CellRange = require('./CellRange');

const HEIGHT = 500;

/**
 * @class ColumnHeaderNode
 * @extends Node
 * @constructor
 */
module.exports = class ColumnHeaderNode extends HeaderNode {
	newInstance() {
		return new ColumnHeaderNode();
	}

	getDefaultSectionSize() {
		return 2000;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);
		file.writeAttributeString('type', 'columnheadernode');
	}

	_assignName(id) {
		this.setName(`ColumnHeader${id}`);
	}

	setInitialSection(index) {
		const sheet = this.getSheet();
		const data = sheet.getDataProvider();
		const initialSection = this.getInitialSection();

		if (index < initialSection) {
			this.insertSectionsAt(0, initialSection - index);
			data.insertColumnsAt(new CellRange(0, 0, initialSection - index, 1));
		} else if (index > initialSection) {
			this.removeSectionsAt(0, index - initialSection);
			data.removeColumnsAt(0, index - initialSection);
		}

		super.setInitialSection(index);
	}

	getSections() {
		if (this.getParent()) {
			return this.getParent()
				.getParent()
				.getColumnCount();
		}
		return 50;
	}

	getSectionSize(index) {
		const sheet = this.getSheet();
		const formulas = sheet && sheet.isShowFormulas();

		let size = super.getSectionSize(index);

		if (formulas) {
			size *= 1.5;
		}

		return size;
	}

	setSectionSize(index, size) {
		const sheet = this.getSheet();
		const formulas = sheet && sheet.isShowFormulas();

		if (formulas) {
			size /= 1.5;
		}

		super.setSectionSize(index, size);
	}

	getInternalSize() {
		return new Point(this.getSectionsSize(), this.getInternalHeight());
	}

	getInternalHeight() {
		return this.isItemVisible() === false ? 0 : ColumnHeaderNode.HEIGHT;
	}

	getSectionFromReference(ref) {
		let colVal = 0;

		switch (ref) {
			case 'COMMENT':
				break;
			case 'IF':
				colVal = 1;
				break;
			default:
				for (let j = 0; j < ref.length; j += 1) {
					colVal =
						26 * colVal +
						ref
							.charAt(j)
							.toUpperCase()
							.charCodeAt(0) -
						65 +
						1; // 65 -> 'A'
				}
				colVal += 1;
				break;
		}

		return this.getOrCreateSectionAt(colVal);
	}

	static get HEIGHT() {
		return HEIGHT;
	}
};
