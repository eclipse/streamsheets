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
const { runFunction } = require('../../utils');
const { convert } = require('@cedalo/commons');

const bar = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.run(() => {
			let result = '';
			terms.forEach((term) => {
				result += `${convert.toString(term.value)};`;
			});
			return result;
		});
bar.displayName = true;

module.exports = bar;
