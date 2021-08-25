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
const functions = require('../src/functions');
const { SheetParser } = require('@cedalo/machine-core');

// FOR TESTs we do not use persistent outbox
process.env.OUTBOX_PERSISTENT = false;

// some simple functions for testing purpose
const loopIndices = (sheet /* , ...terms */) => {
	const context = loopIndices.context;
	if (sheet.isProcessing) {
		if (!context.initialized) {
			context.initialized = true;
			context.result = [];
		}
		const loopIndex = sheet.streamsheet.getLoopIndex();
		context.result.push(loopIndex);
	}
	return context.result ? context.result.join(',') : '';
};

const helperFunctions = {
	LOOPINDICES: loopIndices
};

// setup parser and its context...
SheetParser.context.updateFunctions(Object.assign({}, functions, helperFunctions));

