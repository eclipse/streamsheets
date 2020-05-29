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
const { MessagingService } = require('@cedalo/service-core');
const { GatewayMessagingProtocol, Topics } = require('@cedalo/protocols');
const IdGenerator = require('@cedalo/id-generator');

const config = require('../../config');
const { SocketServer } = require('../../ws/SocketServer');

const RestServer = require('../../rest/start');
const MachineServiceMessageRouter = require('./MachineServiceMessageRouter');
const Auth = require('../../Auth').default;

const licenseInfoEvent = (licenseInfo) => ({
	type: 'event',
	event: { type: GatewayMessagingProtocol.EVENTS.LICENSE_INFO_EVENT, licenseInfo }
});

module.exports = class GatewayService extends MessagingService {
	constructor(metadata, globalContext) {
		super(metadata);
		this.globalContext = globalContext;
		this.globalContext.gatewayService = this;
		this.machineRouter = new MachineServiceMessageRouter(this);
		this._services = new Map();
		this._licenseInfo = {};
		this.configRepo = globalContext.repositories.configurationRepository;
	}

	async prepareJWT() {
		let jwtToken;
		let jwtSecret = config.get('auth.jwtSecret') || '';
		const jwtConfig = await this.configRepo.getJWT();
		if (jwtConfig && typeof jwtConfig.secret === 'string') {
			jwtSecret = jwtConfig.secret;
			jwtToken = jwtConfig.token;
		}
		if (!jwtConfig || (typeof jwtConfig.secret === 'string' && jwtSecret.length < 1)) {
			jwtSecret = IdGenerator.generateUUID();
		}
		Auth.jwtSecret = jwtSecret;
		jwtToken =
			// jwtToken ||
			Auth.getToken({
				service: 'internal',
				issuer: 'Cedalo'
			});
		this.publishMessage(
			Topics.CONFIG_JWT,
			{
				jwt: {
					secret: jwtSecret,
					token: jwtToken
				}
			},
			{ retain: true, qos: 2 }
		);
		this.configRepo.saveJWT({ secret: jwtSecret, token: jwtToken });
	}

	async _preStart() {
		await super._preStart();
		await this.prepareJWT();
	}
	
	async _doStart() {
		this.restServer = await RestServer.start(this.globalContext);
		this.socketServer = new SocketServer(this, this.restServer);
		await this.socketServer.start();
	}

	async _postStart() {
		await super._postStart();
		this.messagingClient.subscribe(`${Topics.LICENSE_INFO}`);
		this.messagingClient.subscribe(`${Topics.SERVICES_STATUS}/#`);
		this.messagingClient.on('message', (topic, message) => {
			if (topic.startsWith(`${Topics.SERVICES_STATUS}/`)) {
				const serviceName = topic.substring(topic.lastIndexOf('/') + 1);
				const serviceInformation = JSON.parse(message.toString());
				this._updateServices(serviceName, serviceInformation);
				this.broadcastEvent(serviceName, serviceInformation);
			} else if (topic === Topics.LICENSE_INFO) {
				const licenseInfo = JSON.parse(message.toString());
				this._licenseInfo = { ...licenseInfo };
				this.socketServer.broadcast(licenseInfoEvent(licenseInfo));
			}
		});
	}

	notifySendMessageToClient() {
		if (this._messagesCounter) {
			this._messagesCounter.inc();
		}
	}

	_updateServices(serviceName, serviceInformation) {
		if (!this._services.get(serviceName)) {
			this._services.set(serviceName, {
				instances: new Map()
			});
		}
		const serviceContainer = this._services.get(serviceName);
		serviceContainer.instances.set(serviceInformation.id, serviceInformation);
		// if the service instance was stopped
		if (serviceInformation.status === 'stopped') {
			// delete the stopped service instance from the service registry
			serviceContainer.instances.delete(serviceInformation.id);
		}
	}

	get services() {
		const services = {};
		// eslint-disable-next-line
		for (const [serviceName, serviceContainerMap] of this._services) {
			const serviceContainer = {};
			const instances = {};
			// eslint-disable-next-line
			for (const [serviceID, serviceInformation] of serviceContainerMap.instances) {
				// TODO: improve this
				serviceContainer.name = serviceInformation.name;
				serviceContainer.description = serviceInformation.description;
				serviceContainer.provider = serviceInformation.provider;
				serviceContainer.buildNumber = serviceInformation.buildNumber;
				serviceContainer.version = serviceInformation.version;
				instances[serviceID] = {
					id: serviceInformation.id,
					os: serviceInformation.os,
					status: serviceInformation.status
				};
			}
			serviceContainer.instances = instances;
			services[serviceName] = serviceContainer;
		}
		return services;
	}

	getMetaInfo() {
		return { services: this.services, licenseInfo: this._licenseInfo };
	}
	getServiceStatus(service) {
		const serviceInformation = this._services.get(service);
		if (serviceInformation) {
			const instances = Array.from(serviceInformation.instances);
			// TODO: get status for different instances
			if (instances && instances[0] && instances[0][1]) {
				return this.convertToEvent(service, instances[0][1]);
			}
		}
		return {};
	}

	getServicesByType(type) {
		return this.services[type];
	}

	convertToEvent(service, message) {
		let event = null;
		let type = '';
		// TODO: handle graph service and machine service like other service
		// this here is only done because of backward compability
		if (service === 'graphs') {
			type = message.status === 'running' ? 'graphserver_connected' : 'graphserver_disconnected';
		} else if (service === 'machines') {
			type = message.status === 'running' ? 'machineserver_connected' : 'machineserver_disconnected';
		} else {
			// eslint-disable-next-line
			if (message.status === 'running') {
				type = 'service_connected';
			} else if (message.status === 'stopped') {
				type = 'service_disconnected';
			}
		}
		event = {
			type: 'event',
			event: {
				type,
				service: message
			}
		};
		return event;
	}

	broadcastEvent(service, message) {
		const event = this.convertToEvent(service, message);
		if (event) {
			this.socketServer.broadcast(event);
		}
	}

	_getKeepAliveTopic() {
		return Topics.SERVICES_GATEWAY_EVENTS;
	}

	_getKeepAliveMessage() {
		return { type: 'connect', server: 'gateway-service' };
	}
};
