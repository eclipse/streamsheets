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

const { URLUtil } = require('..');

describe('URLUtil', () => {
	describe('isURL', () => {
		it(`should return true for valid URLs`, () => {
			expect(URLUtil.isURL('http://example.org')).toBe(true);
			expect(URLUtil.isURL('https://example.org/')).toBe(true);
			expect(URLUtil.isURL('ws://example.org')).toBe(true);
			expect(URLUtil.isURL('wss://example.org/path?key=value')).toBe(true);
			expect(URLUtil.isURL('mqtts://example.org/path?key=value#hash=value')).toBe(true);
		});
		it(`should return false for invalid URLs`, () => {
			expect(URLUtil.isURL('example.org')).toBe(false);
			expect(URLUtil.isURL('')).toBe(false);
			expect(URLUtil.isURL(null)).toBe(false);
			expect(URLUtil.isURL({})).toBe(false);
		});
	});
});
