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
const Field = require('../../src/configurations/Field');

describe('Stream API#Field', () => {
	it('should get valid field value from field type text and value null', () => {
		const field = new Field({
			type: Field.TYPES.TEXT,
			value: null
		});
		expect(field.value).toEqual('');
	});
	it('should get valid field value from field type undefined and value null', () => {
		const field = new Field({
			value: null
		});
		expect(field.value).toEqual('');
	});
	it('should get valid field value from field type INT and value null', () => {
		const field = new Field({
			value: null,
			type: Field.TYPES.INT
		});
		expect(field.value).toEqual(0);
	});
	it('should get valid field value from field type TEXTLIST and value null', () => {
		const field = new Field({
			value: null,
			type: Field.TYPES.TEXTLIST
		});
		expect(field.value).toEqual([]);
	});
});
