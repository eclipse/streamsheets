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
const Logger = require('..');

describe('constructor()', () => {
	it('should create a logger instance', () => {
		const logger = Logger.create();
		expect(logger).toBeDefined();
	});
	it('should create a logger instance with a info() method', () => {
		const logger = Logger.create();
		expect(logger.info).toBeDefined();
		expect(typeof logger.info).toEqual('function');
	});
	it('should create a logger instance with a error() method', () => {
		const logger = Logger.create();
		expect(logger.error).toBeDefined();
		expect(typeof logger.error).toEqual('function');
	});
	it('should create a logger instance with a warn() method', () => {
		const logger = Logger.create();
		expect(logger.warn).toBeDefined();
		expect(typeof logger.warn).toEqual('function');
	});
	it('should create a logger instance with a debug() method', () => {
		const logger = Logger.create();
		expect(logger.debug).toBeDefined();
		expect(typeof logger.debug).toEqual('function');
	});
	it('should create a logger instance with a trace() method', () => {
		const logger = Logger.create();
		expect(logger.trace).toBeDefined();
		expect(typeof logger.trace).toEqual('function');
	});
	it('should create a logger instance with a fatal() method', () => {
		const logger = Logger.create();
		expect(logger.fatal).toBeDefined();
		expect(typeof logger.fatal).toEqual('function');
	});
});
describe('info()', () => {
	it('should output an info message', () => {
		const logger = Logger.create();
		const message = 'Example';
		logger.info(message);
	});
});
describe('error()', () => {
	it('should output an error message', () => {
		const logger = Logger.create();
		const message = 'Example';
		logger.error(message);
	});
});
describe('warn()', () => {
	it('should output an warn message', () => {
		const logger = Logger.create();
		const message = 'Example';
		logger.warn(message);
	});
});
describe('debug()', () => {
	it('should output a debug message', () => {
		const logger = Logger.create();
		const message = 'Example';
		logger.debug(message);
	});
});
describe('trace()', () => {
	it('should output a trace message', () => {
		const logger = Logger.create();
		const message = 'Example';
		logger.trace(message);
	});
});
describe('fatal()', () => {
	it('should output a fatal message', () => {
		const logger = Logger.create();
		const message = 'Example';
		logger.fatal(message);
	});
});
