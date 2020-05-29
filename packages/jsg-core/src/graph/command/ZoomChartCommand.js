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
const CompoundCommand = require('./CompoundCommand');

class ZoomChartCommand extends CompoundCommand {
	static createFromObject(data = {}, context) {
		return new ZoomChartCommand().initWithObject(data, context);
	}

	constructor() {
		super();
		// no undo/redo for zooming charts => done via button/mouse...
		this.isVolatile = true;
	}
}

module.exports = ZoomChartCommand;
