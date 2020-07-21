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
const { Message } = require('../..');

describe('Message', () => {
	it('should have an id', () => {
		const msg = new Message();
		expect(msg).toBeDefined();
		expect(msg.id).toBeDefined();
	});
	it('should have a data property', () => {
		const msg = new Message();
		expect(msg).toBeDefined();
		expect(msg.data).toBeDefined();
	});
	it('should set passed object as data property', () => {
		const data = { sensor: 'sensor-name', protocol: 'mqtt' };
		const msg = new Message(data);
		expect(msg.data.sensor).toBe('sensor-name');
		expect(msg.data.protocol).toBe('mqtt');
	});
	it('should use NOW function to determine arrival time', () => {
		const msg = new Message({});
		const arrivaltime = msg.metadata.arrivalTime;
		expect(arrivaltime).toBeGreaterThan(0);
		expect(arrivaltime.toString().indexOf('.')).toBeGreaterThan(-1);
	});
	it('should convert data if it is no object or array', () => {
		expect(new Message(true).data.value).toBe(true);
		expect(new Message(2345).data.value).toBe(2345);
		expect(new Message('hello').data.value).toBe('hello');
	});
});
