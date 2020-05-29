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
'use strict';

const sinon = require('sinon');
const GatewayClient = require('../../..').NodeGatewayClient;

const {
	getStreamSheetContainer,
	getSheetId,
	JSONToGraph
} = require('../helper/helper');
const {
	MoveNodeCommand,
	Point
} = require('@cedalo/jsg-core');

// const shortid = {
// 	// Mocking shortid method
// 	generate() {
// 		return Math.random();
// 	}
// }

const CONFIG = require('../config/config.json');

// Events
const COMMAND_EVENT = 'command';
const MACHINE_SERVER_CONNECTED_EVENT = 'machineserver_connected';
const STREAMSHEET_STEP_EVENT = 'streamsheet_step';
const MACHINE_STATE_EVENT = 'machine_state';
const MESSAGE_PUT_EVENT = 'message_put';
const MESSAGE_POP_EVENT = 'message_pop';

// Machine states
const MACHINE_STATE_RUNNING = 'running';
const MACHINE_STATE_STOPPED = 'stopped';
const MACHINE_STATE_PAUSED = 'paused';

// Error codes
const MACHINE_SERVER_NOT_CONNECTED = 'MACHINE_SERVER_NOT_CONNECTED';
const GRAPH_SERVER_NOT_CONNECTED = 'GRAPH_SERVER_NOT_CONNECTED';
const MACHINE_SERVER_AND_GRAPH_SERVER_NOT_CONNECTED = 'MACHINE_SERVER_AND_GRAPH_SERVER_NOT_CONNECTED';

const TEMPLATE_ID = 'sim_machine';

// eslint-disable-next-line
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

describe('GatewayClient', () => {
	describe('constructor()', () => {
		it.only('should create a gateway client with default name', () => {
			const client = new GatewayClient();
			expect(client.name).toBeDefined();
		});
	});
	describe('connect() and disconnect()', () => {
		it.only('should connect to and disconnect from the gateway', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			return client.connect(CONFIG)
				.then(() => client.disconnect())
				.then(done);
		});
	});
	describe('connect()', () => {
		it.only('should throw an error for wrong URLs', () => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			const wrongConfiguration = {
				socketEndpointURL: 'URL',
				restEndpointURL: 'URL',
				token: 'TOKEN'
			};
			return client.connect(wrongConfiguration)
				.catch(error => expect(error).toBeDefined());
		});
	});
	describe('on()', () => {
		it.only('should register a listener for an event', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on('example', (event) => {
				expect(event).toBeDefined();
				expect(event.type).toBeDefined();
				expect(event.type).toBe('example');
				client.disconnect()
					.then(done);
			});
			return client.connect(CONFIG)
				.then(() => client._handleEvent({
					type: 'example'
				}));
		});
	});
	describe('off()', () => {
		it.only('should unregister a listener for an event', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			const listener1 = () => {};
			const listener2 = () => {};
			client.on('example', listener1);
			client.on('example', listener2);
			expect(client._eventListeners.get('example').length).toBe(2);
			return client.connect(CONFIG)
				.then(() => {
					client.off('example', listener1);
					expect(client._eventListeners.get('example').length).toBe(1);
					client.off('example', listener2);
					expect(client._eventListeners.get('example').length).toBe(0);
					done();
				});
		});
	});
	describe('waitUntilAllServersAreConnected()', () => {
		it('should wait until machine server and graph server are connected', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			return client.connect(CONFIG)
				.then(() => client.waitUntilAllServersAreConnected())
				.then(done);
		});
		// Activate with it.only() to test when machine server is not connected
		it.skip('should return an error if machine server was not connected before the given timeout', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			return client.connect(CONFIG)
				.then(() => client.waitUntilAllServersAreConnected(1500))
				.catch((error) => {
					expect(error).toBeDefined();
					expect(error.code).toBe(MACHINE_SERVER_NOT_CONNECTED);
					done();
				});
		});
		// Activate with it.only() to test when graph server is not connected
		it.skip('should return an error if graph server was not connected before the given timeout', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			return client.connect(CONFIG)
				.then(() => client.waitUntilAllServersAreConnected(1500))
				.catch((error) => {
					expect(error).toBeDefined();
					expect(error.code).toBe(GRAPH_SERVER_NOT_CONNECTED);
					done();
				});
		});
		// Activate with it.only() to test when machine server and graph server are not connected
		it.skip('should return an error if machine server and graph server were not connected before the given timeout',
		(done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			return client.connect(CONFIG)
				.then(() => client.waitUntilAllServersAreConnected(1500))
				.catch((error) => {
					expect(error).toBeDefined();
					expect(error.code).toBe(MACHINE_SERVER_AND_GRAPH_SERVER_NOT_CONNECTED);
					done();
				});
		});
	});
	describe('getMachine()', () => {
		it('should return a machine for the given id', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.loadMachine(TEMPLATE_ID)
					.then(response => response.machineserver.machine)
					.then(machine => client.getMachine(machine.id))
					.then((response) => {
						expect(response.type).toBe('response');
						expect(response.requestId).toBeDefined();
						expect(response.requestType).toBe('machine_get');
						expect(response.machineserver.machine.id).toBeDefined();
						expect(response.machineserver.machine.name).toBeDefined();
						expect(response.machineserver.machine.isTemplate).toBeDefined();
						expect(response.machineserver.machine.state).toBeDefined();
						expect(response.machineserver.machine.streamsheets).toBeDefined();
						expect(response.graphserver).toBeDefined();
						expect(response.graphserver.graph).toBeDefined();
						expect(response.graphserver.graph.id).toBeDefined();
						expect(response.graphserver.graph.graphdef).toBeDefined();
					})
					.then(() => client.disconnect())
					.then(done);
			});
			return client.connect(CONFIG);
		});
	});
	describe('loadMachine()', () => {
		it('should create a machine when a template id was provided', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.loadMachine(TEMPLATE_ID)
					.then((response) => {
						expect(response.type).toBe('response');
						expect(response.requestId).toBeDefined();
						expect(response.machineserver).toBeDefined();
						expect(response.machineserver.templateId).toBeDefined();
						expect(response.machineserver.templateId).toBe(TEMPLATE_ID);
						expect(response.machineserver.machine.id).toBeDefined();
						expect(response.machineserver.machine.name).toBeDefined();
						expect(response.machineserver.machine.state).toBe(MACHINE_STATE_STOPPED);
						expect(response.machineserver.machine.isTemplate).toBeDefined();
						expect(response.machineserver.machine.isTemplate).toBe(false);
						expect(response.machineserver.machine.streamsheets).toBeDefined();
						expect(response.graphserver).toBeDefined();
						expect(response.graphserver.graph.id).toBeDefined();
						expect(response.graphserver.graph.graphdef).toBeDefined();
						expect(response.graphserver.graph.machineId).toBeDefined();
						expect(response.graphserver.graph.machineId).toBe(response.machineserver.machine.id);
					})
					.then(() => client.disconnect())
					.then(done);
			});
			return client.connect(CONFIG);
		});
		it.only('should set the streamsheet id as process sheet id', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.loadMachine(TEMPLATE_ID)
					.then((response) => {
						const streamsheet = response.machineserver.machine.streamsheets[0];
						const processSheetContainer = getStreamSheetContainer(response.graphserver.graph.graphdef);
						const sheetId = getSheetId(processSheetContainer);
						expect(sheetId).toBeDefined();
						expect(sheetId).toBe(streamsheet.id);
					})
					.then(() => client.disconnect())
					.then(done);
			});
			return client.connect(CONFIG);
		});
	});
	describe('deleteMachine()', () => {
		it('should delete a machine', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.loadMachine(TEMPLATE_ID)
					.then(response => response.machineserver.machine.id)
					.then(machineId => client.deleteMachine(machineId))
					.then((response) => {
						expect(response.type).toBe('response');
						expect(response.requestId).toBeDefined();
						expect(response.machineserver).toBeDefined();
						expect(response.machineserver.machine.id).toBeDefined();
						expect(response.machineserver.machine.deleted).toBe(true);
						expect(response.graphserver).toBeDefined();
						expect(response.graphserver.graph).toBeDefined();
						expect(response.graphserver.graph.id).toBeDefined();
						expect(response.graphserver.graph.deleted).toBe(true);
					})
					.then(() => client.disconnect())
					.then(done);
			});
			return client.connect(CONFIG);
		});
	});
	describe('loadMachine()', () => {
		it('should load the machine for the given id', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.loadMachine(TEMPLATE_ID)
					.then(response => response.machineserver.machine.id)
					.then(machineId => client.loadMachine(machineId))
					.then((response) => {
						expect(response.type).toBe('response');
						expect(response.requestId).toBeDefined();
						expect(response.machineserver.machine.id).toBeDefined();
						expect(response.machineserver.machine.name).toBeDefined();
						expect(response.machineserver.machine.isTemplate).toBeDefined();
						expect(response.machineserver.machine.state).toBeDefined();
						expect(response.machineserver.machine.streamsheets).toBeDefined();
						expect(response.graphserver).toBeDefined();
						expect(response.graphserver.graph).toBeDefined();
						expect(response.graphserver.graph.id).toBeDefined();
						expect(response.graphserver.graph.graphdef).toBeDefined();
					})
					.then(() => client.disconnect())
					.then(done);
			});
			return client.connect(CONFIG);
		});
	});
	describe('startMachine()', () => {
		it('should start the machine for the given id', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.graphql('{machines{id}}')
					.then(({machines}) => machines[0])
					.then(machine => client.startMachine(machine.id))
					.then((response) => {
						expect(response.type).toBe('response');
						expect(response.requestId).toBeDefined();
						expect(response.machineserver).toBeDefined();
						expect(response.machineserver.machine).toBeDefined();
						expect(response.machineserver.machine.id).toBeDefined();
						expect(response.machineserver.machine.state).toBe(MACHINE_STATE_RUNNING);
						expect(response.machineserver.machine.name).toBeDefined();
						expect(response.graphserver).toBeUndefined();
					})
					.then(() => client.disconnect())
					.then(done);
			});
			return client.connect(CONFIG);
		});
	});
	describe('stopMachine()', () => {
		it('should stop the machine for the given id', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.graphql('{machines{id}}')
					.then(({machines}) => machines[0])
					.then(machine => client.stopMachine(machine.id))
					.then((response) => {
						expect(response.type).toBe('response');
						expect(response.requestId).toBeDefined();
						expect(response.machineserver).toBeDefined();
						expect(response.machineserver.machine).toBeDefined();
						expect(response.machineserver.machine.id).toBeDefined();
						expect(response.machineserver.machine.state).toBe(MACHINE_STATE_STOPPED);
						expect(response.machineserver.machine.name).toBeDefined();
						expect(response.graphserver).toBeUndefined();
					})
					.then(() => client.disconnect())
					.then(done);
			});
			return client.connect(CONFIG);
		});
	});
	describe('pauseMachine()', () => {
		it('should pause the machine for the given id', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.graphql('{machines{id}}')
					.then(({machines}) => machines[0])
					.then(machine => client.pauseMachine(machine.id))
					.then((response) => {
						expect(response.type).toBe('response');
						expect(response.requestId).toBeDefined();
						expect(response.machineserver).toBeDefined();
						expect(response.machineserver.machine).toBeDefined();
						expect(response.machineserver.machine.id).toBeDefined();
						expect(response.machineserver.machine.state).toBe(MACHINE_STATE_PAUSED);
						expect(response.machineserver.machine.name).toBeDefined();
						expect(response.graphserver).toBeUndefined();
					})
					.then(() => client.disconnect())
					.then(done);
			});
			return client.connect(CONFIG);
		});
	});
	describe('renameMachine()', () => {
		it('should rename the machine for the given id', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.loadMachine(TEMPLATE_ID)
					.then((response) => {
						const machineId = response.machineserver.machine.id;
						const machineName = response.machineserver.machine.name;
						const newName = `Renamed ${machineName}`;
						client.renameMachine(machineId, newName)
							.then((renameResponse) => {
								expect(renameResponse.type).toBe('response');
								expect(renameResponse.requestId).toBeDefined();
								expect(renameResponse.requestType).toBe('machine_rename');
								expect(renameResponse.machineserver).toBeDefined();
								expect(renameResponse.machineserver.machine.id).toBeDefined();
								expect(renameResponse.machineserver.machine.name).toBeDefined();
								expect(renameResponse.machineserver.machine.name).toBe(newName);
							})
							.then(() => client.disconnect())
							.then(done);
					});
			});
			return client.connect(CONFIG);
		});
	});
	describe('stepMachine()', () => {
		it('should step the machine for the given id', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			return client.connect(CONFIG)
				.then(() => client.graphql('{machines{id}}'))
				.then(({machines}) => machines[0])
				.then(machine => client.pauseMachine(machine.id))
				.then(response => client.stepMachine(response.machineserver.machine.id))
				.then((response) => {
					expect(response.type).toBe('response');
					expect(response.requestId).toBeDefined();
					expect(response.requestType).toBe('machine_step');
					expect(response.machineserver).toBeDefined();
					expect(response.machineserver.machine.id).toBeDefined();
					expect(response.machineserver.machine.state).toBe(MACHINE_STATE_PAUSED);
					expect(response.machineserver.machine.name).toBeDefined();
				})
				.then(() => client.disconnect())
				.then(done);
		});
	});

	describe('startMachines()', () => {
		it('should start all machines', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.startMachines()
					.then((response) => {
						expect(response).toBeDefined();
						expect(response.type).toBe('response');
						expect(response.requestId).toBeDefined();
						expect(response.machineserver).toBeDefined();
						expect(response.machineserver.machines).toBeDefined();
						response.machineserver.machines.forEach((machine) => {
							expect(machine.id).toBeDefined();
							expect(machine.name).toBeDefined();
							expect(machine.state).toBe(MACHINE_STATE_RUNNING);
						});
					})
					.then(() => client.disconnect())
					.then(done);
			});
			return client.connect(CONFIG);
		});
	});

	describe('stopMachines()', () => {
		it('should stop all machines', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.startMachines()
					.then(() => client.stopMachines())
					.then((response) => {
						expect(response).toBeDefined();
						expect(response.type).toBe('response');
						expect(response.requestId).toBeDefined();
						expect(response.machineserver).toBeDefined();
						expect(response.machineserver.machines).toBeDefined();
						response.machineserver.machines.forEach((machine) => {
							expect(machine.id).toBeDefined();
							expect(machine.name).toBeDefined();
							expect(machine.state).toBe(MACHINE_STATE_STOPPED);
						});
					})
					.then(() => client.disconnect())
					.then(done);
			});
			return client.connect(CONFIG);
		});
	});
	describe('subscribeMachine()', () => {
		it('should subscribe to a machine', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.loadMachine(TEMPLATE_ID)
					.then(response => response.machineserver.machine)
					.then((machine) => {
						client.subscribeMachine(machine.id)
							.then((response) => {
								expect(response.type).toBe('response');
								expect(response.requestId).toBeDefined();
								expect(response.machineserver).toBeDefined();
								expect(response.machineserver.machine).toBeDefined();
								expect(response.machineserver.machine.id).toBe(machine.id);
								expect(response.machineserver.machine.state).toBe(MACHINE_STATE_STOPPED);
								expect(response.machineserver.machine.subscribed).toBe(true);
								expect(response.graphserver).toBeDefined();
								expect(response.graphserver.graph).toBeDefined();
								expect(response.graphserver.graph.id).toBeDefined();
								expect(response.graphserver.graph.subscribed).toBe(true);
							})
							.then(() => client.disconnect())
							.then(done);
					});
			});
			return client.connect(CONFIG);
		});
		it('should subscribe to a machine and listen for machine step events', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.loadMachine(TEMPLATE_ID)
				.then(response => response.machineserver.machine)
				.then((machine) => {
					client.startMachine(machine.id)
						.then(() => {
							client.on(STREAMSHEET_STEP_EVENT, (event) => {
								expect(event.type).toBe(STREAMSHEET_STEP_EVENT);
								expect(event.src).toBe('streamsheet');
								client.unsubscribeMachine(machine.id)
									.then(done);
							});
							client.subscribeMachine(machine.id);
						});
				});
			});
			return client.connect(CONFIG);
		});
		/**
		 * (1) Client 1 and client 2 connect to the gateway
		 * (2) Client 1 creates a machine
		 * (3) Client 2 subscribes to the machine
		 * (4) Client 1 starts the machine
		 * (5) Client 2 receives the event
		 */
		it('should subscribe to a machine and receive events when machine has started', (done) => {
			const client1 = new GatewayClient({ name: 'Test gateway client 1' });
			const client2 = new GatewayClient({ name: 'Test gateway client 2' });
			Promise.all([
				client1.waitUntilAllServersAreConnected(),
				client2.waitUntilAllServersAreConnected()
			])
				.then(() => client1.loadMachine(TEMPLATE_ID))
				.then((response) => {
					const machine = response.machineserver.machine;
					client2.on(MACHINE_STATE_EVENT, (event) => {
						expect(event.type).toBe(MACHINE_STATE_EVENT);
						expect(event.src).toBe('machine');
						expect(event.srcId).toBe(machine.id);
						expect(event.state).toBe(MACHINE_STATE_RUNNING);
						done();
					});
					return client2.subscribeMachine(machine.id)
						.then(() => client1.startMachine(machine.id));
				});
			return Promise.all([
				client1.connect(CONFIG),
				client2.connect(CONFIG)
			]);
		});
		/**
		 * (1) Client 1 and client 2 connect to the gateway
		 * (2) Client 1 creates a machine
		 * (3) Client 1 starts the machine
		 * (4) Client 2 subscribes to the machine
		 * (5) Client 1 stops the machine
		 * (6) Client 2 receives the event
		 */
		it('should subscribe to a machine and receive events when machine has stopped', (done) => {
			const client1 = new GatewayClient({ name: 'Test gateway client 1' });
			const client2 = new GatewayClient({ name: 'Test gateway client 2' });
			Promise.all([
				client1.waitUntilAllServersAreConnected(),
				client2.waitUntilAllServersAreConnected()
			])
				.then(() => client1.loadMachine(TEMPLATE_ID))
				.then((response) => {
					const machine = response.machineserver.machine;
					return client1.startMachine(machine.id)
						.then(() => {
							client2.on(MACHINE_STATE_EVENT, (event) => {
								expect(event.type).toBe(MACHINE_STATE_EVENT);
								expect(event.src).toBe('machine');
								expect(event.srcId).toBe(machine.id);
								expect(event.state).toBe(MACHINE_STATE_STOPPED);
								done();
							});
							return client2.subscribeMachine(machine.id)
								.then(() => client1.stopMachine(machine.id));
						})
						.then(() => client2.subscribeMachine(machine.id));
				});
			return Promise.all([
				client1.connect(CONFIG),
				client2.connect(CONFIG)
			]);
		});
		/**
		 * (1) Client 1 and client 2 connect to the gateway
		 * (2) Client 1 creates a machine
		 * (3) Client 2 subscribes to the machine
		 * (4) Client 1 pauses the machine
		 * (5) Client 2 receives the event
		 */
		it('should subscribe to a machine and receive events when machine has paused', (done) => {
			const client1 = new GatewayClient({ name: 'Test gateway client 1' });
			const client2 = new GatewayClient({ name: 'Test gateway client 2' });
			Promise.all([
				client1.waitUntilAllServersAreConnected(),
				client2.waitUntilAllServersAreConnected()
			])
				.then(() => client1.loadMachine(TEMPLATE_ID))
				.then((response) => {
					const machine = response.machineserver.machine;
					client2.on(MACHINE_STATE_EVENT, (event) => {
						expect(event.type).toBe(MACHINE_STATE_EVENT);
						expect(event.src).toBe('machine');
						expect(event.srcId).toBe(machine.id);
						expect(event.state).toBe(MACHINE_STATE_PAUSED);
						done();
					});
					return client2.subscribeMachine(machine.id)
						.then(() => client1.pauseMachine(machine.id));
				});
			return Promise.all([
				client1.connect(CONFIG),
				client2.connect(CONFIG)
			]);
		});
	});
	describe('unsubscribeMachine()', () => {
		it('should unsubscribe from a machine', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.loadMachine(TEMPLATE_ID)
				.then(response => response.machineserver.machine)
				.then((machine) => {
					client.startMachine(machine.id)
						.then(() => {
							client.on(STREAMSHEET_STEP_EVENT, (event) => {
								expect(event.type).toBe(STREAMSHEET_STEP_EVENT);
								expect(event.src).toBe('streamsheet');
								client.unsubscribeMachine(machine.id)
									.then((response) => {
										expect(response.type).toBe('response');
										expect(response.requestId).toBeDefined();
										expect(response.machineserver).toBeDefined();
										expect(response.machineserver.machine).toBeDefined();
										expect(response.machineserver.machine.id).toBe(machine.id);
										expect(response.machineserver.machine.state).toBe(MACHINE_STATE_RUNNING);
										// TODO: reload machine on machine server when
										// it has been updated in the repository
										// expect(response.machineserver.machine.name).toBe(machine.name);
										expect(response.machineserver.machine.subscribed).toBe(false);
										expect(response.graphserver).toBeDefined();
										expect(response.graphserver.graph).toBeDefined();
										expect(response.graphserver.graph.id).toBeDefined();
										expect(response.graphserver.graph.subscribed).toBe(false);
									})
									.then(() => client.disconnect())
									.then(done);
							});
							client.subscribeMachine(machine.id);
						});
				});
			});
			return client.connect(CONFIG);
		});
	});
	describe('sendCommand()', () => {
		it('should send a command', (done) => {
			const client = new GatewayClient({ name: 'Test gateway client' });
			client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
				client.loadMachine(TEMPLATE_ID)
					.then((response) => {
						const machineId = response.machineserver.machine.id;
						const graphId = response.graphserver.graph.id;
						const graphJSON = response.graphserver.graph.graphdef;
						const graphInstance = JSONToGraph(JSON.stringify(graphJSON));
						const item = graphInstance.getItemAt(0);
						const command = new MoveNodeCommand(item, new Point(7000, 9000));
						return client.sendCommand(machineId, graphId, command.toObject());
					})
					.then((response) => {
						expect(response.type).toBe('response');
						expect(response.requestId).toBeDefined();
						expect(response.requestType).toBe('command');
						expect(response.machineserver).toBeDefined();
						expect(response.graphserver).toBeDefined();
						expect(response.graphserver.graph).toBeDefined();
						expect(response.graphserver.graph.id).toBeDefined();
						expect(response.graphserver.command).toBeDefined();
						expect(response.graphserver.command.id).toBeDefined();
						expect(response.graphserver.command.name).toBeDefined();
						expect(response.graphserver.executed).toBe(true);
					})
					.then(() => client.disconnect())
					.then(done);
			});
			return client.connect(CONFIG);
		});
		/**
		 * (1) Client 1 and client 2 connect to the gateway
		 * (2) Client 1 creates a machine
		 * (3) Client 2 subscribes to the machine
		 * (4) Client 1 sends a command
		 * (5) Client 2 receives the command
		 */
		it('should send a command and raise an event on all clients that have subscribed', (done) => {
			const client1 = new GatewayClient({ name: 'Test gateway client 1' });
			const client2 = new GatewayClient({ name: 'Test gateway client 2' });
			Promise.all([
				client1.waitUntilAllServersAreConnected(),
				client2.waitUntilAllServersAreConnected()
			])
				.then(() => client1.loadMachine(TEMPLATE_ID))
				.then((response) => {
					// eslint-disable-next-line no-console
					console.error(response);
					const machineId = response.machineserver.machine.id;
					const graphId = response.graphserver.graph.id;
					const graphJSON = response.graphserver.graph.graphdef;
					const graphInstance = JSONToGraph(JSON.stringify(graphJSON));
					const item = graphInstance.getItemAt(0);
					const command = new MoveNodeCommand(item, new Point(7000, 9000));
					const commandObject = command.toObject();
					client2.on(COMMAND_EVENT, (event) => {
						expect(event.graphId).toBeDefined();
						expect(event.data).toBeDefined();
						expect(event.data).toEqual(commandObject);
						expect(event.type).toBeDefined();
						expect(event.type).toBe(COMMAND_EVENT);
						done();
					});
					client2.subscribeMachine(machineId)
						.then(() => client1.sendCommand(machineId, graphId, commandObject));
				});
			return Promise.all([
				client1.connect(CONFIG),
				client2.connect(CONFIG)
			]);
		});
		/**
		 * (1) Client 1, client 2 and client 3 connect to the gateway
		 * (2) Client 1 creates a machine
		 * (3) Client 2 subscribes to the machine
		 * (4) Client 1 sends a command
		 * (5) Only client 2 receives the command
		 */
		it('should send a command and not raise an event on clients that do not have subscribed', (done) => {
			const client1 = new GatewayClient({ name: 'Test gateway client 1' });
			const client2 = new GatewayClient({ name: 'Test gateway client 2' });
			const client3 = new GatewayClient({ name: 'Test gateway client 3' });

			Promise.all([
				client1.waitUntilAllServersAreConnected(),
				client2.waitUntilAllServersAreConnected(),
				client3.waitUntilAllServersAreConnected()
			])
				.then(() => client1.loadMachine(TEMPLATE_ID))
				.then((response) => {
					const machineId = response.machineserver.machine.id;
					const graphId = response.graphserver.graph.id;
					const graphJSON = response.graphserver.graph.graphdef;
					const graphInstance = JSONToGraph(JSON.stringify(graphJSON));
					const item = graphInstance.getItemAt(0);
					const command = new MoveNodeCommand(item, new Point(7000, 9000));
					const commandObject = command.toObject();

					const spyClient2 = sinon.spy();
					const spyClient3 = sinon.spy();
					client2.on(COMMAND_EVENT, spyClient2);
					client3.on(COMMAND_EVENT, spyClient3);

					client2.subscribeMachine(machineId)
						.then(() => client1.sendCommand(machineId, graphId, commandObject));
					setTimeout(() => {
						expect(spyClient2.callCount).toBe(1);
						expect(spyClient3.callCount).toBe(0);
						done();
					}, 1500);
				});
			return Promise.all([
				client1.connect(CONFIG),
				client2.connect(CONFIG),
				client3.connect(CONFIG)
			]);
		});
		/**
		 * (1) Client 1, client 2 and client 3 connect to the gateway
		 * (2) Client 1 creates a machine
		 * (3) Client 2 and client 3 subscribe to the machine
		 * (4) Client 1 sends a command
		 * (5) Both client 2 and client 3 receive the command
		 */
		it('should send a command and raise an event on all clients that have subscribed', (done) => {
			const client1 = new GatewayClient({ name: 'Test gateway client 1' });
			const client2 = new GatewayClient({ name: 'Test gateway client 2' });
			const client3 = new GatewayClient({ name: 'Test gateway client 3' });

			Promise.all([
				client1.waitUntilAllServersAreConnected(),
				client2.waitUntilAllServersAreConnected(),
				client3.waitUntilAllServersAreConnected()
			])
				.then(() => client1.loadMachine(TEMPLATE_ID))
				.then((response) => {
					const machineId = response.machineserver.machine.id;
					const graphId = response.graphserver.graph.id;
					const graphJSON = response.graphserver.graph.graphdef;
					const graphInstance = JSONToGraph(JSON.stringify(graphJSON));
					const item = graphInstance.getItemAt(0);
					const command = new MoveNodeCommand(item, new Point(7000, 9000));
					const commandObject = command.toObject();

					const spyClient2 = sinon.spy();
					const spyClient3 = sinon.spy();
					client2.on(COMMAND_EVENT, spyClient2);
					client3.on(COMMAND_EVENT, spyClient3);

					client2.subscribeMachine(machineId)
						.then(() => client3.subscribeMachine(machineId))
						.then(() => client1.sendCommand(machineId, graphId, commandObject));
					setTimeout(() => {
						expect(spyClient2.callCount).toBe(1);
						expect(spyClient3.callCount).toBe(1);
						done();
					}, 1500);
				});
			return Promise.all([
				client1.connect(CONFIG),
				client2.connect(CONFIG),
				client3.connect(CONFIG)
			]);
		});
		/**
		 * (1) Client 1, client 2 and client 3 connect to the gateway
		 * (2) Client 1 creates a machine
		 * (3) Client 2 and client 3 subscribe to the machine
		 * (4) Client 2 unsubscribes again
		 * (5) Client 1 sends a command
		 * (6) Only client 3 receives the command
		 */
		it('should send a command and not raise an event on clients that have unsubscribed', (done) => {
			const client1 = new GatewayClient({ name: 'Test gateway client 1' });
			const client2 = new GatewayClient({ name: 'Test gateway client 2' });
			const client3 = new GatewayClient({ name: 'Test gateway client 3' });

			Promise.all([
				client1.waitUntilAllServersAreConnected(),
				client2.waitUntilAllServersAreConnected(),
				client3.waitUntilAllServersAreConnected()
			])
				.then(() => client1.loadMachine(TEMPLATE_ID))
				.then((response) => {
					const machineId = response.machineserver.machine.id;
					const graphId = response.graphserver.graph.id;
					const graphJSON = response.graphserver.graph.graphdef;
					const graphInstance = JSONToGraph(JSON.stringify(graphJSON));
					const item = graphInstance.getItemAt(0);
					const command = new MoveNodeCommand(item, new Point(7000, 9000));
					const commandObject = command.toObject();

					const spyClient2 = sinon.spy();
					const spyClient3 = sinon.spy();
					client2.on(COMMAND_EVENT, spyClient2);
					client3.on(COMMAND_EVENT, spyClient3);

					client2.subscribeMachine(machineId)
						.then(() => client3.subscribeMachine(machineId))
						.then(() => client2.unsubscribeMachine(machineId))
						.then(() => client1.sendCommand(machineId, graphId, commandObject));
					setTimeout(() => {
						expect(spyClient2.callCount).toBe(0);
						expect(spyClient3.callCount).toBe(1);
						done();
					}, 1500);
				});
			return Promise.all([
				client1.connect(CONFIG),
				client2.connect(CONFIG),
				client3.connect(CONFIG)
			]);
		});
	});
	// TODO: this unit test relies on the simulated machine to send messages
	// to the inbox every 2000 milliseconds
	describe('on message put event', () => {
		const messageTimeout = 2500;
		it('should raise one message put event for every connected client', async (done) => {
			const client1 = new GatewayClient({ name: 'Test gateway client 1' });
			const client2 = new GatewayClient({ name: 'Test gateway client 2' });
			const client3 = new GatewayClient({ name: 'Test gateway client 3' });
			await client1.connect(CONFIG);
			await client2.connect(CONFIG);
			await client3.connect(CONFIG);
			const response = await client1.loadMachine(TEMPLATE_ID);
			const machine = response.machineserver.machine;
			await client1.subscribeMachine(machine.id);
			await client2.subscribeMachine(machine.id);
			await client3.subscribeMachine(machine.id);
			const putEventSpy1 = sinon.spy();
			const putEventSpy2 = sinon.spy();
			const putEventSpy3 = sinon.spy();
			client1.on(MESSAGE_PUT_EVENT, putEventSpy1);
			client2.on(MESSAGE_PUT_EVENT, putEventSpy2);
			client3.on(MESSAGE_PUT_EVENT, putEventSpy3);
			setTimeout(async () => {
				expect(putEventSpy1.callCount).toBe(1);
				expect(putEventSpy2.callCount).toBe(1);
				expect(putEventSpy3.callCount).toBe(1);
				await client1.disconnect();
				await client2.disconnect();
				await client3.disconnect();
				done();
			}, messageTimeout);
			await client1.startMachine(machine.id);
		});
		// TODO: remove because no commands are send anymore on new message
		it.skip('should raise one command event for every connected client', async (done) => {
			const addSheetRowCommands = call => call.args[0].data.name === 'command.AddSheetRowCommand';
			const client1 = new GatewayClient({ name: 'Test gateway client 1' });
			const client2 = new GatewayClient({ name: 'Test gateway client 2' });
			const client3 = new GatewayClient({ name: 'Test gateway client 3' });
			await client1.connect(CONFIG);
			await client2.connect(CONFIG);
			await client3.connect(CONFIG);
			const response = await client1.loadMachine(TEMPLATE_ID);
			const machine = response.machineserver.machine;
			await client1.subscribeMachine(machine.id);
			await client2.subscribeMachine(machine.id);
			await client3.subscribeMachine(machine.id);
			const commandEventSpy1 = sinon.spy();
			const commandEventSpy2 = sinon.spy();
			const commandEventSpy3 = sinon.spy();
			client1.on(COMMAND_EVENT, commandEventSpy1);
			client2.on(COMMAND_EVENT, commandEventSpy2);
			client3.on(COMMAND_EVENT, commandEventSpy3);
			setTimeout(async () => {
				// TODO: the command should only be send once
				const addSheetRowCommands1 = commandEventSpy1.getCalls().filter(addSheetRowCommands);
				const addSheetRowCommands2 = commandEventSpy2.getCalls().filter(addSheetRowCommands);
				const addSheetRowCommands3 = commandEventSpy3.getCalls().filter(addSheetRowCommands);
				expect(addSheetRowCommands1.length).toBe(1);
				expect(addSheetRowCommands2.length).toBe(1);
				expect(addSheetRowCommands3.length).toBe(1);
				await client1.disconnect();
				await client2.disconnect();
				await client3.disconnect();
				done();
			}, messageTimeout);
			await client1.startMachine(machine.id);
		});
	});
	// TODO: this unit test relies on the simulated machine to send messages
	// to the inbox every 2000 milliseconds
	describe('on message pop event', () => {
		const messageTimeout = 2500;
		it('should raise one message pop event for every connected client', async (done) => {
			const client1 = new GatewayClient({ name: 'Test gateway client 1' });
			const client2 = new GatewayClient({ name: 'Test gateway client 2' });
			const client3 = new GatewayClient({ name: 'Test gateway client 3' });
			await client1.connect(CONFIG);
			await client2.connect(CONFIG);
			await client3.connect(CONFIG);
			const response = await client1.loadMachine(TEMPLATE_ID);
			const machine = response.machineserver.machine;
			await client1.subscribeMachine(machine.id);
			await client2.subscribeMachine(machine.id);
			await client3.subscribeMachine(machine.id);
			const popEventSpy1 = sinon.spy();
			const popEventSpy2 = sinon.spy();
			const popEventSpy3 = sinon.spy();
			client1.on(MESSAGE_POP_EVENT, popEventSpy1);
			client2.on(MESSAGE_POP_EVENT, popEventSpy2);
			client3.on(MESSAGE_POP_EVENT, popEventSpy3);
			setTimeout(async () => {
				expect(popEventSpy1.callCount).toBe(1);
				expect(popEventSpy2.callCount).toBe(1);
				expect(popEventSpy3.callCount).toBe(1);
				await client1.disconnect();
				await client2.disconnect();
				await client3.disconnect();
				done();
			}, messageTimeout);
			await client1.startMachine(machine.id);
		});
	});
});
