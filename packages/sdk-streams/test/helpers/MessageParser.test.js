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
const MessageParser = require('../../src/helpers/MessageParser');

const TEST_MSG = {
	productname: 'TestProduct',
	productdata: [
		['Substanz', 'Inhaltsstoff', 'Anteil'],
		['Wollwaschmittel', 'Bleichmittel', 0.355],
		['Wollwaschmittel', 'Tenside', 0.15],
		['Wollwaschmittel', 'Stellmittel', 0.145],
		['Wollwaschmittel', 'Korisionsinhibitoren', 0.0425],
		['Wollwaschmittel', 'Enthärter', 0.3],
		['Wollwaschmittel', 'Vergrauungsinhibitoren', 0.0075]
	]
};

describe('MessageParser', () => {
	it('should parse a label', () => {
		expect(MessageParser.parse('\' message: \' +   productname+ " "+  productdata[0][0]', TEST_MSG))
			.toEqual(` message: ${TEST_MSG.productname} ${TEST_MSG.productdata[0][0]}`);
		expect(MessageParser.parse('"Test my message: " + productname', TEST_MSG))
			.toEqual(`Test my message: ${TEST_MSG.productname}`);
		expect(MessageParser.parse('\' message: \' + productname', TEST_MSG))
			.toEqual(` message: ${TEST_MSG.productname}`);
		expect(MessageParser.parse('\' message: \' +   productname', TEST_MSG))
			.toEqual(` message: ${TEST_MSG.productname}`);
	});
});
