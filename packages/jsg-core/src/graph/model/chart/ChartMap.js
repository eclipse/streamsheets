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

const Expression = require('../../expr/Expression');

module.exports = class ChartMap {
	constructor() {
		this.items = new Expression('');
		this.name = 'world.json';
		this.label = 'name';
		this.displayType = 'color';
	}
	save(name, writer) {
		writer.writeStartElement(name);

		writer.writeAttributeString('name', this.name);
		writer.writeAttributeString('label', this.label);
		writer.writeAttributeString('display', this.displayType);
		this.items.save('items', writer);

		writer.writeEndElement();
	}

	read(reader, object) {
		this.name = reader.getAttributeString(object, 'name', 'world.json');
		this.label = reader.getAttributeString(object, 'label', 'name');
		this.displayType = reader.getAttributeString(object, 'displayType', 'color');

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'items':
					this.items = new Expression(0);
					this.items.read(reader, child);
					break;
			}
		});
	}
};
