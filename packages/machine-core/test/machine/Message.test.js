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
});
