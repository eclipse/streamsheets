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
const { Operation } = require('..');

test('isTypeOf', () => {
	expect(Operation.get('+').isTypeOf(Operation.TYPE.BINARY)).toBeTruthy();
	expect(Operation.get('-').isTypeOf(Operation.TYPE.BINARY)).toBeTruthy();
	expect(Operation.get('*').isTypeOf(Operation.TYPE.BINARY)).toBeTruthy();
	expect(Operation.get('/').isTypeOf(Operation.TYPE.BINARY)).toBeTruthy();

	expect(Operation.get('!').isTypeOf(Operation.TYPE.UNARY)).toBeTruthy();

	expect(Operation.get('!=').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('=').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('==').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('>').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('>=').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('<').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('<=').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('&').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();
	expect(Operation.get('|').isTypeOf(Operation.TYPE.BOOL)).toBeTruthy();

	expect(Operation.get('?').isTypeOf(Operation.TYPE.CONDITION)).toBeTruthy();
});
