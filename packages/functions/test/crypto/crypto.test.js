/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { FunctionErrors } = require('@cedalo/error-codes');
const { StreamSheet } = require('@cedalo/machine-core');
const { createTerm } = require('../utilities');

const ERROR = FunctionErrors.code;

const expectValue = (value) => ({
	isDefinedString: () => expect(value != null && typeof value === 'string').toBeTruthy()
});

describe('hash', () => {
	it(`should return ${ERROR.ARGS} if called with too few or too many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('crypto.hash()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('crypto.hash("hello","sha256",)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('crypto.hash("hello","sha256","too many")', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if passed term has no value`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('crypto.hash(,)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('crypto.hash(A1)', sheet).value).toBe(ERROR.VALUE);
	});
	it(`should return ${ERROR.VALUE} if passed algorithm is unknown`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('crypto.hash("hello", "")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('crypto.hash("hello", "algo")', sheet).value).toBe(ERROR.VALUE);
	});
	it('should hash a given string', () => {
		const sheet = new StreamSheet().sheet;
		expectValue(createTerm('crypto.hash("")', sheet).value).isDefinedString();
		expectValue(createTerm('crypto.hash("hello world")', sheet).value).isDefinedString();
		expectValue(createTerm('crypto.hash("1234567890")', sheet).value).isDefinedString();
		expectValue(createTerm('crypto.hash("üöäÜÖÄß")', sheet).value).isDefinedString();
		expectValue(createTerm('crypto.hash("!°§$%&/()=?`")', sheet).value).isDefinedString();
	});
	it('should hash a given string with specified algorithm', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('crypto.hash("", "sha1")', sheet).value).toBeDefined();
		expect(createTerm('crypto.hash("hello world","sha512")', sheet).value).toBeDefined();
		expect(createTerm('crypto.hash("1234567890","md5")', sheet).value).toBeDefined();
		expect(createTerm('crypto.hash("üöäÜÖÄß","sha256")', sheet).value).toBeDefined();
		expect(createTerm('crypto.hash("!°§$%&/()=?`","rsa-md5")', sheet).value).toBeDefined();
	});
	test('hash of same string is always equal', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('crypto.hash("")', sheet).value).toBe(createTerm('crypto.hash("")', sheet).value);
		expect(createTerm('crypto.hash("hello")', sheet).value).toBe(createTerm('crypto.hash("hello")', sheet).value);
		expect(createTerm('crypto.hash("§$6 ü")', sheet).value).toBe(createTerm('crypto.hash("§$6 ü")', sheet).value);
	});
});

describe('hmac', () => {
	it(`should return ${ERROR.ARGS} if called with too few or too many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('crypto.hmac()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('crypto.hmac("hello")', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('crypto.hmac("hello","secret","sha256",)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('crypto.hmac("hello","secret","sha256","too many")', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if passed text or secret has no value`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('crypto.hmac(,)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('crypto.hmac(,,)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('crypto.hmac(A1,"secret")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('crypto.hmac("hello","")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('crypto.hmac("hello",A1)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('crypto.hmac("hello","secret",A1)', sheet).value).toBe(ERROR.VALUE);
	});
	it(`should return ${ERROR.VALUE} if passed algorithm is unknown`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('crypto.hmac("hello","secret","")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('crypto.hmac("hello","secret","algo")', sheet).value).toBe(ERROR.VALUE);
	});
	it('should create an hmac for given string and secret', () => {
		const sheet = new StreamSheet().sheet;
		expectValue(createTerm('crypto.hmac("","secret")', sheet).value).isDefinedString();
		expectValue(createTerm('crypto.hmac("hello world",1235)', sheet).value).isDefinedString();
		expectValue(createTerm('crypto.hmac("1234567890","üäöß")', sheet).value).isDefinedString();
		expectValue(createTerm('crypto.hmac("üöäÜÖÄß","^°!$%&§/()=?")', sheet).value).isDefinedString();
		expectValue(createTerm('crypto.hmac("!°§$%&/()=?`","hello secret")', sheet).value).isDefinedString();
	});
	it('should create an hmac for given string, secret and algorithm', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('crypto.hmac("","secure","sha1")', sheet).value).toBeDefined();
		expect(createTerm('crypto.hmac("hello world","****","sha512")', sheet).value).toBeDefined();
		expect(createTerm('crypto.hmac("1234567890","###-:;","md5")', sheet).value).toBeDefined();
		expect(createTerm('crypto.hmac("üöäÜÖÄß","<<##>>","sha256")', sheet).value).toBeDefined();
		expect(createTerm('crypto.hmac("!°§$%&/()=?`","lock it","rsa-md5")', sheet).value).toBeDefined();
	});
	test('hmac of same string and secret is always equal', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('crypto.hmac("","secret")', sheet).value).toBe(
			createTerm('crypto.hmac("","secret")', sheet).value
		);
		expect(createTerm('crypto.hmac("hello","secure hello")', sheet).value).toBe(
			createTerm('crypto.hmac("hello","secure hello")', sheet).value
		);
		expect(createTerm('crypto.hmac("§$6 ü","top secret")', sheet).value).toBe(
			createTerm('crypto.hmac("§$6 ü","top secret")', sheet).value
		);
	});
});
