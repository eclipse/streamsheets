'use strict';

const supertest = require('supertest');
const before = require('../helper/BeforeHook');

let defaultApp;
// const dummyProvider = {
// 	id: 'AWSIOT',
// 	name: 'AWS IoT (MQTT)',
// 	className: 'ProviderConfiguration',
// 	fields: ['provider', 'host', 'port', 'clientId', 'CACertificate', 'clientCertificate', 'privateKey']
// };

const dummyConnector = {
	id: 'Some id',
	name: 'AWS Central Europe 1',
	host: 'amazoneaws.com',
	port: '8883',
	clientId: 'DummyConnector',
	CACertificate: '',
	CACertificatePayload: '',
	clientCertificate: '',
	privateKey: '',
	privateKeyPayload: '',
	providerConfig: {
		id: 'AWSIOT',
		name: 'AWS IoT (MQTT)',
		fields: ['provider', 'host', 'port', 'clientId', 'CACertificate', 'clientCertificate', 'privateKey']
	}
};

beforeAll(() => before.getApp().then((res) => {
	defaultApp = res.defaultApp;
}));

const postConfig = config => supertest(defaultApp.app)
		.post('/api/v1.0/admin/configuration')
		.send(JSON.stringify(config))
		.set('Accept', 'application/json')
		.set('Content-Type', 'application/json');
const randomizeConfig = config => Object.assign({}, config, {
	id: new Date().getMilliseconds().toString(),
	_id: `id${new Date().getMilliseconds().toString()}`
});
const configs = [];
describe('AdminRoutes /admin/configurations', () => {
	it('should insert a configuration (POST, 201)', () => {
		const config = randomizeConfig(dummyConnector);
		configs.push(config);
		return postConfig(config)
		.expect(201)
		.then((result) => {
			expect(result.ok).toEqual(true);
		});
	});

	it('should get all configurations (GET, 200)', () => supertest(defaultApp.app)
		.get('/api/v1.0/admin/configurations')
		.set('Accept', 'application/json')
		.expect(200)
		.then((response) => {
			expect(response.body.length > 0);
		})
	);

	it('should get configurations by type (GET, 200)', () => supertest(defaultApp.app)
		.get(`/api/v1.0/admin/configurations/${configs[0].className}`)
		.set('Accept', 'application/json')
		.expect(200)
		.then((response) => {
			expect(response.body[0].className).toEqual(configs[0].className);
		})
	);
	it('should get a configuration by id (GET, 200)', () => supertest(defaultApp.app)
		.get(`/api/v1.0/admin/configuration/${configs[0].id}`)
		.set('Accept', 'application/json')
		.expect(200)
		.then((response) => {
			expect(response.body.id).toEqual(configs[0].id);
		})
	);

	it('should del a configuration (GET, 200)', () => supertest(defaultApp.app)
		.del(`/api/v1.0/admin/configuration/${configs.pop()._id}`)
		.set('Accept', 'application/json')
		.expect(200)
		.then((response) => {
			expect(response.body).toEqual(1);
		})
	);
});
