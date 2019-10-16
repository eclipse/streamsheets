'use strict';

// Events
const MACHINE_SERVER_CONNECTED_EVENT = 'machineserver_connected';
const STREAMSHEET_STEP_EVENT = 'streamsheet_step';
const MACHINE_STATE_EVENT = 'machine_state';

// Machine states
const MACHINE_STATE_RUNNING = 'running';
const MACHINE_STATE_STOPPED = 'stopped';
const MACHINE_STATE_PAUSED = 'paused';

// Error codes
const MACHINE_SERVER_NOT_CONNECTED = 'MACHINE_SERVER_NOT_CONNECTED';
const GRAPH_SERVER_NOT_CONNECTED = 'GRAPH_SERVER_NOT_CONNECTED';
const MACHINE_SERVER_AND_GRAPH_SERVER_NOT_CONNECTED = 'MACHINE_SERVER_AND_GRAPH_SERVER_NOT_CONNECTED';

const TEMPLATE_ID = 'sim_machine';

// Check if test is executed in node or browser environment
const GatewayClient = typeof module === 'undefined' ? this['@cedalo/gateway-client'] : require('../../..').NodeGatewayClient;

const shortid = {
	// Mocking shortid method
	generate() {
		return Math.random();
	}
}

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

// This code is necessary to be able to skip tests when the
// test suite is executed in the browser, i.e., using the
// Jasmine framework. The equivalent function for it.skip()
// in Jasmine is xit(). The equivalent function for it.only()
// in Jasmine is fit().
if (typeof xit !== 'undefined') {
	it.skip = xit;
}
if (typeof fit !== 'undefined') {
	it.only = fit;
}

const CONFIG = {
	socketEndpointURL: 'ws://localhost:8088/machineserver-proxy',
	restEndpointURL: 'http://localhost:8080/api/v1.0',
	// eslint-disable-next-line
	token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1Yjg4MTk0Y2Y4NTZmOTAwMTU0OTRjMWQiLCJ1c2VySWQiOiJhZG1pbiIsInBhc3N3b3JkIjoiJDJhJDEwJHZtbE1Ubm1vWVh5cjczcFc5NE5leU90R04weWVwV3dKUVVVV2tpa1E4RzY0ZE1pMnV0Lm15IiwiYWN0aXZlIjp0cnVlLCJsYXN0TG9naW4iOm51bGwsImZpcnN0TmFtZSI6IkNlZGFsbyIsInNlY29uZE5hbWUiOiJBZG1pbiIsIm1haWwiOiJhZG1pbkBjZWRhbG8uY29tIiwicm9sZXMiOlsiYWRtaW4iXSwibGFiZWxzIjpbImFkbWluIl0sImF2YXRhciI6ImltYWdlcy9hdmF0YXIucG5nIiwic2V0dGluZ3MiOnsibG9jYWxlIjoiZW4iLCJkZWJ1ZyI6ZmFsc2UsImRpc3BsYXlNYWNoaW5lcyI6ImdyaWQiLCJkaXNwbGF5RGF0YVNvdXJjZXMiOiJsaXN0Iiwic2hvd05vdGlmaWNhdGlvbnMiOiJwb3B1cCIsImhvbWVQYWdlIjoiL2Rhc2hib2FyZCIsImZvcm1hdFNldHRpbmdzIjp7Im51bWJlckZvcm1hdCI6IiIsImZvbnRTaXplIjoiIiwiZm9udENvbG9yIjoiIiwiYmFja2dyb3VuZENvbG9yIjoiIn19LCJpYXQiOjE1MzYwNzk5NjV9.uYTlWknI95XF1kdXSG-519YVQGC3VvntBs9hiK5tNtU'
};

describe('constructor()', () => {
	it('should create a gateway client with default name', () => {
		const client = new GatewayClient();
		expect(client.name).toBeDefined();
	});
});
describe('connect() and disconnect()', () => {
	it('should connect to and disconnect from the gateway', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		return client.connect(CONFIG)
			.then(() => client.disconnect())
			.then(done);
	});
});
describe('connect()', () => {
	it('should throw an error for wrong URLs', () => {
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
	it('should register a listener for an event', (done) => {
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
	it('should unregister a listener for an event', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		const listener1 = (event) => {};
		const listener2 = (event) => {};
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
describe('getTemplate()', () => {
	it('should return a template for the given id', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
			client.getTemplate(TEMPLATE_ID)
				.then((response) => {
					expect(response.id).toBeDefined();
					expect(response.name).toBeDefined();
					expect(response.isTemplate).toBeDefined();
					expect(response.isTemplate).toBe(true);
					expect(response.streamsheets).toBeDefined();
				})
				.then(() => client.disconnect())
				.then(done);
		});
		return client.connect(CONFIG);
	});
});
describe('getTemplates()', () => {
	it('should return a list of all templates', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
			client.getTemplates()
				.then((templates) => {
					expect(templates).toBeDefined();
					expect(templates.length).toBeGreaterThan(0);
					templates.forEach((template) => {
						expect(template.id).toBeDefined();
						expect(template.name).toBeDefined();
						expect(template.isTemplate).toBeDefined();
						expect(template.isTemplate).toBe(true);
					});
				})
				.then(done);
		});
		return client.connect(CONFIG);
	});
});
describe('getMachineDefinitions()', () => {
	it('should return a list of all machines', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, async () => {
			await client.loadMachine(TEMPLATE_ID);
			const machines = await client.getMachineDefinitions();
			expect(machines).toBeDefined();
			expect(machines.length).toBeGreaterThan(0);
			machines.forEach((machine) => {
				expect(machine.id).toBeDefined();
				expect(machine.name).toBeDefined();
				expect(machine.state).toBeDefined();
			});
			done();
		});
		return client.connect(CONFIG);
	});
});
describe('getMachineDefinitions(query)', () => {
	it.only('should return a list of machines based on the given GraphQL query', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, async () => {
			await client.loadMachine(TEMPLATE_ID);
			const graphQLQuery = `{
				machines {
					id
				}
			}`;
			const machines = await client.getMachineDefinitions(graphQLQuery);
			expect(machines.length).toBeGreaterThan(0);
			machines.forEach((machine) => {
				expect(machine.id).toBeDefined();
				expect(machine.name).toBeUndefined();
				expect(machine.state).toBeUndefined();
			});
			done();
		});
		return client.connect(CONFIG);
	});
});
describe('getMachineDefinitions(query)', () => {
	it.only('should return a list of machines based on the given GraphQL query', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, async () => {
			await client.loadMachine(TEMPLATE_ID);
			const graphQLQuery = `{
				machines {
					id,
					name
				}
			}`;
			const machines = await client.getMachineDefinitions(graphQLQuery);
			expect(machines.length).toBeGreaterThan(0);
			machines.forEach((machine) => {
				expect(machine.id).toBeDefined();
				expect(machine.name).toBeDefined();
				expect(machine.state).toBeUndefined();
			});
			done();
		});
		return client.connect(CONFIG);
	});
});
describe('getMachineDefinitions(query)', () => {
	it.only('should return a list of machines based on the given GraphQL query', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, async () => {
			await client.loadMachine(TEMPLATE_ID);
			const graphQLQuery = `{
				machines {
					id,
					name,
					state
				}
			}`;
			const machines = await client.getMachineDefinitions(graphQLQuery);
			expect(machines.length).toBeGreaterThan(0);
			machines.forEach((machine) => {
				expect(machine.id).toBeDefined();
				expect(machine.name).toBeDefined();
				expect(machine.state).toBeDefined();
			});
			done();
		});
		return client.connect(CONFIG);
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
describe('getMachineDefinition()', () => {
	it('should return a machine definition for the given id', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
			client.getMachineDefinitions()
				.then(machines => machines[0])
				.then(machine => client.getMachineDefinition(machine.id))
				.then((response) => {
					expect(response.id).toBeDefined();
					expect(response.name).toBeDefined();
					expect(response.isTemplate).toBeDefined();
					expect(response.isTemplate).toBe(false);
					expect(response.state).toBeDefined();
					expect(response.streamsheets).toBeDefined();
				})
				.then(() => client.disconnect())
				.then(done);
		});
		return client.connect(CONFIG);
	});
});
describe('saveMachineDefinition()', () => {
	it.skip('should save a machine', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
			const id = shortid.generate();
			const machine = {
				id: shortid.generate(),
				name: `machine-${id}`,
				state: 'stopped',
				isTemplate: false,
				streamsheets: []
			};
			client.saveMachineDefinition(machine)
				.then((response) => {
					console.error(response);
				})
				.then(() => client.disconnect())
				.then(done);
		});
		return client.connect(CONFIG);
	});
});
describe('updateMachineDefinition()', () => {
	it('should update a machine definition', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
			client.getMachineDefinitions()
				.then(machines => machines[0])
				.then((machine) => {
					const randomName = `machine-${Math.random()}`;
					machine.name = randomName;
					return client.updateMachineDefinition(machine.id, machine)
						.then((updatedMachine) => {
							expect(updatedMachine.id).toBeDefined();
							expect(updatedMachine.name).toBeDefined();
							expect(updatedMachine.name).toBe(machine.name);
							expect(updatedMachine.state).toBeDefined();
							expect(updatedMachine.isTemplate).toBeDefined();
							expect(updatedMachine.streamsheets).toBeDefined();
						});
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
	it('should increase the numnber of all machines', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
			client.getMachineDefinitions()
				.then((machines) => {
					client.loadMachine(TEMPLATE_ID)
						.then(() => client.getMachineDefinitions())
						.then((updatedMachines) => {
							expect(updatedMachines.length).toBe(machines.length + 1);
						})
						.then(() => client.disconnect())
						.then(done);
				});
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
describe('exportMachineDefinition()', () => {
	it('should export a machine definition', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, async () => {
			const response = await client.loadMachine(TEMPLATE_ID);
			const machine = response.machineserver.machine;
			const exportResponse = await client.exportMachineDefinition(machine.id);
			expect(exportResponse.machine).toBeDefined();
			expect(exportResponse.machine.id).toBeDefined();
			expect(exportResponse.machine.name).toBeDefined();
			expect(exportResponse.machine.isTemplate).toBeDefined();
			expect(exportResponse.machine.isTemplate).toBe(false);
			expect(exportResponse.machine.state).toBeDefined();
			expect(exportResponse.machine.streamsheets).toBeDefined();
			expect(exportResponse.graph).toBeDefined();
			expect(exportResponse.graph.id).toBeDefined();
			expect(exportResponse.graph.graphdef).toBeDefined();
			expect(exportResponse.graph.machineId).toBeDefined();
			await client.disconnect();
			done();
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
			client.getMachineDefinitions()
				.then(machines => machines[0])
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
			client.getMachineDefinitions()
				.then(machines => machines[0])
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
			client.getMachineDefinitions()
				.then(machines => machines[0])
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
			.then(() => client.getMachineDefinitions())
			.then(machines => machines[0])
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
describe('getGraphs()', () => {
	it('should return a list of all graphs', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
			client.getGraphs()
				.then((graphs) => {
					expect(graphs).toBeDefined();
					expect(graphs.length).toBeGreaterThan(0);
					const graph = graphs[0];
					expect(graph.id).toBeDefined();
					expect(graph.href).toBeDefined();
				})
				.then(() => client.disconnect())
				.then(done);
		});
		return client.connect(CONFIG);
	});
});
describe('saveGraph()', () => {
	// TODO: activate test
	// const graph = require('./payloads/graph_001.json');
	it.skip('should create a graph', () => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		return client.connect(CONFIG)
			.then(() => client.saveGraph(graph))
			.then(response => expect(response).toBeDefined())
			.then(() => client.disconnect());
	});
});
describe('getGraph()', () => {
	it('should return the graph for the specified id', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, async () => {
			await client.loadMachine(TEMPLATE_ID);
			client.getGraphs()
				.then(graphs => graphs[0].id)
				.then(id => client.getGraph(id))
				.then((graph) => {
					expect(graph).toBeDefined();
					expect(graph.id).toBeDefined();
					expect(graph.graphdef).toBeDefined();
					expect(graph.machineId).toBeDefined();
				})
				.then(() => client.disconnect())
				.then(done);
		});
		return client.connect(CONFIG);
	});
	it('should return an error if no graph was found for the specified id', (done) => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
			client.getGraph(4711)
				.catch((error) => {
					expect(error).toBeDefined();
					expect(error.message).toBe('GRAPH_NOT_FOUND');
					done();
				});
		});
		return client.connect(CONFIG);
	});
});
describe('loadGraph()', () => {
	it.skip('should return the graph for the specified id', () => {
		const client = new GatewayClient({ name: 'Test gateway client' });
		client.on(MACHINE_SERVER_CONNECTED_EVENT, () => {
			client.getGraphs()
				.then(graphs => graphs[0].id)
				.then(id => client.loadGraph(id))
				.then(graph => expect(graph).toBeDefined())
				.then(() => client.disconnect());
		});
		return client.connect(CONFIG);
	});
});
describe('Admin API', () => {
	const now = new Date();
	const dummyProvider = {
		id: 'AWSIOT',
		name: 'AWS IoT (MQTT)',
		className: 'ProviderConfiguration',
		fields: ['provider', 'host', 'port', 'clientId', 'CACertificate', 'clientCertificate', 'privateKey']
	};
	const client = new GatewayClient({ name: 'Test gateway client' });
	it('should save an connector and get find it in the list of configurations', (done) => {
		client.connect(CONFIG)
			.then(() => client.saveConfiguration(dummyProvider)
				.then((r) => {
					expect(r.ok).toEqual(1);
				})
			)
			.then(() => client.getConfigurationById(dummyProvider.id))
			.then(config => expect(config.id).toEqual(dummyProvider.id))
			.then(() => client.disconnect())
			.then(done);
	});
	it('should get a list of configurations', (done) => {
		client.connect(CONFIG)
			.then(() => client.getAllConfigurations()
				.then((r) => {
					expect(r.length > 0);
				})
			)
			.then(() => client.disconnect())
			.then(done);
	});
});
describe('Process Settings API', () => {
	const now = new Date();
	const dummy = {
		_id: 'setting1',
		stream: 'SkU3wkNAW',
		streamProcess: 'P1',
		ejectData: false,
		loopIdentifier: 'Loop',
		loopType: 'single',
		machineId: 'S1CxSiE0W',
		settingsId: 'ByDVaCN0-',
		showDataSamples: false,
		triggerInterval: 0,
		triggerPeriod: 0,
		triggerType: 'arrival',
		uniqueIdentifier: 'Unique'
	};
	dummy.machineId = now.getMilliseconds();
	dummy._id = now.getMilliseconds();
	const client = new GatewayClient({ name: 'Test gateway client' });
	it('should save a process settings and  find it in the list settings', () => {
		client.connect(CONFIG)
			.then(() => client.saveMachineProcessSettings(dummy)
				.then((r) => {
					expect(r.ok).toEqual(1);
				})
			)
			.then(() => client.getMachineProcessSettings(dummy.machineId))
			.then(s => expect(s.id).toEqual(s.id))
			.then(() => client.disconnect());
	});
});
