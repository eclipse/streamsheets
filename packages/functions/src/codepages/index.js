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
const cp1252 = require('./cp1252');
const UniCodeMapper = require('./UniCodeMapper');

const mapper = {
	'cp1252': UniCodeMapper.of(cp1252),
};

// 
const getCodePage = (str) => {
	switch (str) {
		case 'ansi':
		case 'cp1252':
			return mapper.cp1252;
		default:
			return undefined;
	}
};

module.exports = {
	getCodePage
}