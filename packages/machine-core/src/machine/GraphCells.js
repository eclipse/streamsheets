const NamedCells = require('./NamedCells');

class GraphCells extends NamedCells {
	constructor(sheet) {
		super();
		this.sheet = sheet;
	}

	set(name, cell) {
		const didIt = super.set(name, cell);
		if (didIt && cell == null) {
			this.sheet.getDrawings().removeGraphItem(name);
		}
		return didIt;
	}
}

module.exports = GraphCells;
