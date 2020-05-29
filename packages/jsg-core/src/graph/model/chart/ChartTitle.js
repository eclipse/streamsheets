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

const ChartFormat = require('./ChartFormat');
const ChartRect = require('./ChartRect');
const Expression = require('../../expr/Expression');

module.exports = class ChartTitle {
	constructor(formula, visible = true) {
		this.formula = formula;
		this.position = new ChartRect();
		this.format = new ChartFormat();
		this.size = 700;
		this.align = 'center';
		this.visible = visible;
	}

	save(name, writer) {
		writer.writeStartElement(name);
		writer.writeAttributeString('align', this.align);
		writer.writeAttributeNumber('visible', this.visible ? 1 : 0);
		this.formula.save('formula', writer);
		this.format.save('format', writer);
		writer.writeEndElement();
	}

	read(reader, object) {
		this.visible =
			reader.getAttribute(object, 'visible') === undefined
				? true
				: !!Number(reader.getAttribute(object, 'visible')) ;
		this.align = reader.getAttributeString(object, 'align', 'center');

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
			}
		});
	}
};
