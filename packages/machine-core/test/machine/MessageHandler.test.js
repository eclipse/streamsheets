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
const MessageHandler = require('../../src/machine/MessageHandler');
const { Message } = require('../..');

const TEST_MSG = new Message({
	productname: 'TestProduct',
	productdata: [
		['Substanz', 'Inhaltsstoff', 'Anteil'],
		['Wollwaschmittel', 'Bleichmittel', 0.355],
		['Wollwaschmittel', 'Tenside', 0.15],
		['Wollwaschmittel', 'Stellmittel', 0.145],
		['Wollwaschmittel', 'Korisionsinhibitoren', 0.0425],
		['Wollwaschmittel', 'Enthärter', 0.3],
		['Wollwaschmittel', 'Vergrauungsinhibitoren', 0.0075]
	],
	producttimes: {
		'2018-09-07 12:45': {
			'1.open': 'open',
			'2.high': 'high',
			'3.low': 'low',
			'4.close': 'close'
		},
		'2018-09-07 12:40': {
			'1.open': 'open',
			'2.high': 'high',
			'3.low': 'low',
			'4.close': 'close'
		},
		'2018-09-07 12:35': {
			'1.open': 'open',
			'2.high': 'high',
			'3.low': 'low',
			'4.close': 'close'
		}
	},
	measurements: [
		{
			"ts": "2020-02-11",
			"series": {
				"time": [0, 23, 24],
				"temperature": [45.4231, 46.4222, 44.2432]
			}
		},
		{
			"ts": "2020-02-12",
			"series": {
				"time": [1, 46, 48],
				"temperature": [90.4231, 92.4222, 88.2432]
			}
		}
	],
}, '1234-567');


describe('MessageHandler', () => {
	it('should be possible to create a MessageHandler', () => {
		const mh = new MessageHandler();
		expect(mh).toBeDefined();
		expect(mh.path).toBe('');
		expect(mh.isEnabled).toBeFalsy();
		expect(mh.message).toBeUndefined();
	});
	it('should be possible to create a MessageHandler with configs', () => {
		const mh = new MessageHandler({ path: '[data][productdata]', enabled: true });
		expect(mh).toBeDefined();
		expect(mh.message).toBeUndefined();
		expect(mh.isEnabled).toBeTruthy();
		expect(mh.path).toBe('[data][productdata]');
	});
	it('should be possible to set a data path', () => {
		const mh = new MessageHandler();
		mh.path = '[data][productdata]';
		expect(mh.path).toBe('[data][productdata]');
	});
	it('should be possible to attach a message', () => {
		const mh = new MessageHandler();
		mh.message = TEST_MSG;
		expect(mh.message).toBe(TEST_MSG);
	});
	it('should be possible to disable loop', () => {
		const mh = new MessageHandler();
		mh.path = '[data][productdata]';
		// attach message:
		mh.message = TEST_MSG;
		mh.isEnabled = true;
		expect(mh.isProcessed).toBeFalsy();
		mh.next();
		expect(mh.isProcessed).toBeFalsy();
		mh.isEnabled = false;
		expect(mh.isProcessed).toBeTruthy();
		mh.isEnabled = true;
		expect(mh.isProcessed).toBeFalsy();
	});
	it('should be possible to step through message data', () => {
		const mh = new MessageHandler({ path: '[data][productdata]', enabled: true });
		// attach message:
		mh.message = TEST_MSG;
		const nxtdata = mh.next();
		expect(nxtdata).toBeDefined();
		expect(nxtdata.length).toBe(3);
		expect(nxtdata[0]).toBe('Substanz');
		expect(nxtdata[1]).toBe('Inhaltsstoff');
		expect(nxtdata[2]).toBe('Anteil');
	});
	it('should be possible to step through message data object', () => {
		const mh = new MessageHandler({ path: '[data][producttimes]', enabled: true });
		// attach message:
		mh.message = TEST_MSG;
		const nxtdata = mh.next();
		expect(nxtdata).toBeDefined();
		expect(nxtdata).toEqual({ '1.open': 'open', '2.high': 'high', '3.low': 'low', '4.close': 'close' });
		expect(mh.next()).toEqual({ '1.open': 'open', '2.high': 'high', '3.low': 'low', '4.close': 'close' });
		expect(mh.next()).toEqual({ '1.open': 'open', '2.high': 'high', '3.low': 'low', '4.close': 'close' });
	});
	it('should return undefined if handle is disabled', () => {
		const mh = new MessageHandler({ path: '[data][productdata]', enabled: false });
		// attach message:
		mh.message = TEST_MSG;
		expect(mh.next()).toBeUndefined();
	});
	it('should return undefined if no more data is available', () => {
		const mh = new MessageHandler({ path: '[data][productdata]', enabled: true });
		// attach message:
		mh.message = TEST_MSG;
		mh.next();
		mh.next();
		mh.next();
		mh.next();
		mh.next();
		mh.next();
		const lastdata = mh.next();
		expect(lastdata).toBeDefined();
		expect(lastdata.length).toBe(3);
		expect(lastdata[0]).toBe('Wollwaschmittel');
		expect(lastdata[1]).toBe('Vergrauungsinhibitoren');
		expect(lastdata[2]).toBe(0.0075);
		expect(mh.next()).toBeUndefined();
		expect(mh.next()).toBeUndefined();
	});
	it('should support getting array key for specified index', () => {
		const mh = new MessageHandler({ path: '[data][measurements]', enabled: true });
		// attach message:
		mh.message = TEST_MSG;
		expect(mh.indexKey).toBe('[0]');
		expect(mh.next()).toEqual({
			ts: '2020-02-11',
			series: { time: [0, 23, 24], temperature: [45.4231, 46.4222, 44.2432] }
		});
		expect(mh.indexKey).toBe('[1]');
		expect(mh.next()).toEqual({
			ts: '2020-02-12',
			series: { time: [1, 46, 48], temperature: [90.4231, 92.4222, 88.2432] }
		});
	});
	it('should support getting object key for specified index', () => {
		const mh = new MessageHandler({ path: '[data][measurements][0][series]', enabled: true });
		// attach message:
		mh.message = TEST_MSG;
		expect(mh.indexKey).toBe('[time]');
		expect(mh.next()).toEqual([0, 23, 24]);
		expect(mh.indexKey).toBe('[temperature]');
		expect(mh.next()).toEqual([45.4231, 46.4222, 44.2432]);
	});
	test('isProcessed returns true if message is completely processed', () => {
		const mh = new MessageHandler({ path: '[data][measurements]', enabled: true });
		// attach message:
		mh.message = TEST_MSG;
		expect(mh.isProcessed).toBeFalsy();
		mh.next();
		expect(mh.isProcessed).toBeFalsy();
		mh.next();
		expect(mh.isProcessed).toBeTruthy();
		mh.next();
		expect(mh.isProcessed).toBeTruthy();
	});
	test('reset() resets MessageHandler with current settings', () => {
		const mh = new MessageHandler({ path: '[data][measurements]', enabled: true });
		// attach message:
		mh.message = TEST_MSG;
		expect(mh.next()).toBeDefined();
		expect(mh.next()).toBeDefined();
		expect(mh.next()).toBeUndefined();
		expect(mh.isProcessed).toBeTruthy();
		mh.reset();
		expect(mh.isProcessed).toBeFalsy();
		expect(mh.next()).toBeDefined();
		expect(mh.next()).toBeDefined();
		expect(mh.next()).toBeUndefined();
	})
	test('isProcessed returns true if message is completely processed with disabled loop', () => {
		const mh = new MessageHandler({ path: '[data][productdata]', enabled: false});
		// attach message:
		mh.message = TEST_MSG;
		// loop is disabled but we need at least one next() to process it!
		expect(mh.isProcessed).toBeFalsy();
		mh.next();
		expect(mh.isProcessed).toBeTruthy();
	});
	test('setProcessed() marks MessageHandler as processed', () => {
		const mh = new MessageHandler({ path: '[data][productdata]', enabled: true});
		// attach message:
		mh.message = TEST_MSG;
		expect(mh.isProcessed).toBeFalsy();
		mh.setProcessed();
		expect(mh.isProcessed).toBeTruthy();
		expect(mh.next()).toBeUndefined();
	});

	describe('IO', () => {
		it('should provide toJSON() function', () => {
			const mh = new MessageHandler();
			expect(mh.toJSON).toBeDefined();
			expect(typeof mh.toJSON).toBe('function');
		});
		it('should store its config to a JSON object', () => {
			const mh = new MessageHandler();
			let json = mh.toJSON();
			expect(json).toBeDefined();
			// check default values:
			expect(json.path).toBe('');
			expect(json.enabled).toBeFalsy();
			expect(json.recursively).toBeFalsy();
			// change config:
			mh.path = 'Kunde.Nummer';
			mh.isEnabled = true;
			mh.isRecursive = true;
			json = mh.toJSON();
			expect(json).toBeDefined();
			expect(json.path).toBe('Kunde.Nummer');
			expect(json.enabled).toBeTruthy();
			expect(json.recursively).toBeTruthy();
		});
		it('should restore from a previous created JSON object', () => {
			const mh = new MessageHandler();
			let restored = new MessageHandler(mh.toJSON());
			expect(restored).toBeDefined();
			expect(restored.path).toBe('');
			expect(restored.isEnabled).toBeFalsy();
			expect(restored.isRecursive).toBeFalsy();
			mh.path = 'Artikel.Hammer';
			mh.isEnabled = false;
			mh.isRecursive = true;
			restored = new MessageHandler(mh.toJSON());
			expect(restored).toBeDefined();
			expect(restored.path).toBe('Artikel.Hammer');
			expect(restored.isEnabled).toBeFalsy();
			expect(restored.isRecursive).toBeTruthy();
		});
	});

	describe('recursive traversal', () => {
		it('should be possible to step through message data recursively', () => {
			// const mh = Traversal.of(TEST_MSG.data.measurements);
			const mh = new MessageHandler({ path: '[data][measurements]', enabled: true, recursively: true });
			// attach message:
			mh.message = TEST_MSG;
			expect(mh.indexKey).toBe('[0]');
			expect(mh.next()).toEqual({
				ts: '2020-02-11',
				series: { time: [0, 23, 24], temperature: [45.4231, 46.4222, 44.2432] }
			});
			expect(mh.indexKey).toBe('[0][ts]');
			expect(mh.next()).toEqual('2020-02-11');
			expect(mh.indexKey).toBe('[0][series]');
			expect(mh.next()).toEqual({ time: [0, 23, 24], temperature: [45.4231, 46.4222, 44.2432] });
			expect(mh.indexKey).toBe('[0][series][time]');
			expect(mh.next()).toEqual([0, 23, 24]);
			expect(mh.indexKey).toBe('[0][series][time][0]');
			expect(mh.next()).toEqual(0);
			expect(mh.indexKey).toBe('[0][series][time][1]');
			expect(mh.next()).toEqual(23);
			expect(mh.indexKey).toBe('[0][series][time][2]');
			expect(mh.next()).toEqual(24);
			expect(mh.indexKey).toBe('[0][series][temperature]');
			expect(mh.next()).toEqual([45.4231, 46.4222, 44.2432]);
			expect(mh.indexKey).toBe('[0][series][temperature][0]');
			expect(mh.next()).toEqual(45.4231);
			expect(mh.indexKey).toBe('[0][series][temperature][1]');
			expect(mh.next()).toEqual(46.4222);
			expect(mh.indexKey).toBe('[0][series][temperature][2]');
			expect(mh.next()).toEqual(44.2432);
			expect(mh.indexKey).toBe('[1]');
			expect(mh.next()).toEqual({
				ts: '2020-02-12',
				series: { time: [1, 46, 48], temperature: [90.4231, 92.4222, 88.2432] }
			});
			expect(mh.indexKey).toBe('[1][ts]');
			expect(mh.next()).toEqual('2020-02-12');
			expect(mh.indexKey).toBe('[1][series]');
			expect(mh.next()).toEqual({ time: [1, 46, 48], temperature: [90.4231, 92.4222, 88.2432] });
			expect(mh.indexKey).toBe('[1][series][time]');
			expect(mh.next()).toEqual([1, 46, 48]);
			expect(mh.indexKey).toBe('[1][series][time][0]');
			expect(mh.next()).toEqual(1);
			expect(mh.indexKey).toBe('[1][series][time][1]');
			expect(mh.next()).toEqual(46);
			expect(mh.indexKey).toBe('[1][series][time][2]');
			expect(mh.next()).toEqual(48);
			expect(mh.indexKey).toBe('[1][series][temperature]');
			expect(mh.next()).toEqual([90.4231, 92.4222, 88.2432]);
			expect(mh.indexKey).toBe('[1][series][temperature][0]');
			expect(mh.next()).toEqual(90.4231);
			expect(mh.indexKey).toBe('[1][series][temperature][1]');
			expect(mh.next()).toEqual(92.4222);
			expect(mh.indexKey).toBe('[1][series][temperature][2]');
			expect(mh.next()).toEqual(88.2432);
			// we key stays on last!
			expect(mh.indexKey).toBe('[1][series][temperature][2]');
			expect(mh.next()).toBeUndefined();
			expect(mh.indexKey).toBe('[1][series][temperature][2]');
			expect(mh.next()).toBeUndefined();
		});
	});
});
