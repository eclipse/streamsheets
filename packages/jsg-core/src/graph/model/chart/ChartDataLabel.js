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

module.exports = class ChartDataLabel {
	constructor() {
		this.format = new ChartFormat();
		this.format.linkNumberFormat = true;
		this.visible = false;
		this.position = 'behindend';
		this.separator = '&lf';
		this.content = {'x': false, y: true};
	}

	save(name, writer) {
		writer.writeStartElement(name);
		writer.writeAttributeString('position', this.position);
		writer.writeAttributeString('separator', this.separator);
		writer.writeAttributeString('content', JSON.stringify(this.content));
		writer.writeAttributeNumber('visible', this.visible ? 1 : 0);
		this.format.save('format', writer);
		writer.writeEndElement();
	}

	read(reader, object) {
		this.position = reader.getAttributeString(object, 'position', 'behindend');
		this.separator = reader.getAttributeString(object, 'separator', '&lf');
		this.visible = reader.getAttributeBoolean(object, 'visible', false);
		try {
			this.content = JSON.parse(reader.getAttributeString(object, 'content', '{"x":false}, "y":true}'));
		} catch (e) {
			this.content = {'x': false, y: true};
		}

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'format':
				this.format = new ChartFormat();
				this.format.read(reader, child);
				break;
			}
		});
	}
};
