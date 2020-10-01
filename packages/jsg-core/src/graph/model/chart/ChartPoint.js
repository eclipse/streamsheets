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

const JSONWriter = require('../../../commons/JSONWriter');
const JSONReader = require('../../../commons/JSONReader');
const ChartFormat = require('./ChartFormat');
const ChartMarker = require('./ChartMarker');
const ChartDataLabel = require('./ChartDataLabel');

module.exports = class ChartPoint {
	// constructor() {
		// this.format = new ChartFormat();
		// this.marker = new ChartMarker();
		// this.dataLabel = new ChartDataLabel();
	// }

	copy() {
		const copy = new ChartPoint();

		const writer = new JSONWriter();
		writer.writeStartDocument();
		this.save(writer);
		writer.writeEndDocument();
		const json = writer.flush();

		const reader = new JSONReader(json);
		const root = reader.getObject(reader.getRoot(), 'point');
		copy.read(reader, root);

		return copy;
	}

	save(writer, index) {
		if (!this.format && !this.marker && !this.dataLabel) {
			return;
		}

		writer.writeStartElement('point');
		writer.writeAttributeNumber('index', index);
		if (this.format) {
			this.format.save('format', writer);
		}
		if (this.marker) {
			this.marker.save('marker', writer);
		}
		if (this.dataLabel) {
			this.dataLabel.save('datalabel', writer);
		}
		writer.writeEndElement();
	}

	read(reader, object) {
		const index = reader.getAttributeNumber(object, 'index', 0);

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
			case 'format':
				this.format = new ChartFormat();
				this.format.read(reader, child);
				break;
			case 'marker':
				this.marker = new ChartMarker();
				this.marker.read(reader, child);
				break;
			case 'datalabel':
				this.dataLabel = new ChartDataLabel();
				this.dataLabel.read(reader, child);
				break;
			}
		});

		return index;
	}
};
