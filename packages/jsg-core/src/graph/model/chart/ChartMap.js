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
		this.name = '';
		this.label = 'name';
		this.displayType = ['color'];
		this.chartType = 'pie';
	}
	save(name, writer) {
		writer.writeStartElement(name);

		writer.writeAttributeString('name', this.name);
		writer.writeAttributeString('label', this.label);
		writer.writeAttributeString('display', this.displayType.join(';'));
		writer.writeAttributeString('chart', this.chartType);

		writer.writeEndElement();
	}

	read(reader, object) {
		this.name = reader.getAttributeString(object, 'name', '');
		this.label = reader.getAttributeString(object, 'label', 'name');
		const displayType = reader.getAttributeString(object, 'display', ['color']);
		this.displayType = displayType === '' ? [] : displayType.split(';');
		this.chartType = reader.getAttributeString(object, 'chart', 'pie');
	}
};
