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
const idGenerator = require('@cedalo/id-generator');
const logger = require('@cedalo/logger').create({ name: 'DB Migration' });

const COLLECTIONS = {
	MACHINES: 'machines',
	STREAMS: 'streams',
	STREAMS_OLD: 'datasources',
	USERS: 'users',
	USERS_OLD: 'auth_user'
};

class Migration {
	constructor(db) {
		this.db = db;
	}

	async migrateCollections() {
		try {
			logger.info(`Step 1/3: migrate existing streams`);
			await this.migrateStreams();
			logger.info(`Step 1/3: streams collection ready`);
			logger.info(`Step 2/3: migrating existing machines`);
			await this.migrateMachines();
			logger.info(`Step 2/3: machines ready`);
			logger.info(`Step 3/3: migrating existing users`);
			await this.migrateUsers();
			logger.info(`Step 3/3: users ready`);
			logger.info(`Migration Completed Successfully`);
		} catch (e) {
			logger.error(e);
		}
	}

	async migrateStreams() {
		const collections = await this.getExistingCollections();
		if (collections.includes(COLLECTIONS.STREAMS)) {
			logger.info(`Step 1/3: skipped as streams collections is already there`);
			return;
		}
		const allConfigs = await this.getDocuments(COLLECTIONS.STREAMS_OLD);
		if (allConfigs.length > 0) {
			const connectorsAndStreams = allConfigs.filter((c) => c.className !== 'ProviderConfiguration');
			const migrated = this.migrateConnectorsAndStreams(connectorsAndStreams);
			await this.db.collection(COLLECTIONS.STREAMS).insertMany(migrated);
		}
	}

	async migrateMachines() {
		const machines = await this.getDocuments(COLLECTIONS.MACHINES, {}, { _id: 0 });
		const newMachines = machines.map(this.migrateMachine.bind(this)).filter((m) => m.id);
		const updates = newMachines.map((m) => this.updateDocument(COLLECTIONS.MACHINES, m.id, m));
		return Promise.all(updates);
	}

	async migrateUsers() {
		const collections = await this.getExistingCollections();
		if (collections.includes(COLLECTIONS.USERS)) {
			logger.info(`Step 3/3: skipped as users collections is already there`);
			return;
		}
		const users = await this.getDocuments(COLLECTIONS.USERS_OLD);
		if (users.length > 0) {
			const newUsers = users.map(this.migrateUser.bind(this));
			await this.db.collection(COLLECTIONS.USERS).insertMany(newUsers);
		}
	}

	migrateUser(user) {
		const id = user._id.toString();
		const newUser = {
			_id: id === '000000000000000000000000' ? '00000000000000' : idGenerator.generateShortId(),
			username: user.userId,
			email: user.mail || '',
			firstName: user.firstName,
			lastName: user.lastName,
			password: user.password,
			lastModified: user.lastModified || new Date().toISOString(),
			settings: {
				locale: user.settings.locale || 'en'
			}
		};

		return newUser;
	}

	migrateConnectorsAndStreams(configs) {
		const removedProviders = ['dl-feeder-rest', 'dl-feeder-aws'];
		const providerRenames = {
			'dl-feeder-rest-client': '@cedalo/stream-rest-client',
			'stream-rest-client': '@cedalo/stream-rest-client',
			'stream-amqp': '@cedalo/stream-amqp',
			'dl-feeder-rest-server': '@cedalo/rest-server',
			'stream-amqp-azure': '@cedalo/stream-amqp-azure',
			'dl-feeder-file': '@cedalo/stream-file',
			'stream-file': '@cedalo/stream-file',
			'dl-feeder-mail-pop3': '@cedalo/stream-mail-pop3',
			'stream-mail-pop3': '@cedalo/stream-mail-pop3',
			'dl-feeder-mail-smtp': '@cedalo/stream-mail-smtp',
			'stream-mail-smtp': '@cedalo/stream-mail-smtp',
			'dl-feeder-mongodb': '@cedalo/stream-mongodb',
			'stream-mongodb': '@cedalo/stream-mongodb',
			'dl-feeder-kafka': '@cedalo/stream-kafka',
			'stream-kafka': '@cedalo/stream-kafka',
			'stream-mqtt': '@cedalo/stream-mqtt',
			'dl-feeder-opcua': '@cedalo/stream-opcua'
		};

		const connectorMigrations = {
			'dl-feeder-email': (c) => {
				c.provider.id = '@cedalo/stream-mail-pop3';
				c.provider._id = c.provider.id;
				c.host = c.pop3Host;
				delete c.pop3Host;
				c.port = c.pop3Port;
				delete c.pop3Port;
				c.security = c.pop3Security;
				delete c.pop3Security;
			},
			'dl-feeder-mqtt': (c) => {
				c.provider = {
					_id: '@cedalo/stream-mqtt',
					id: '@cedalo/stream-mqtt',
					className: 'ProviderConfiguration',
					isRef: true
				};
				c.protocolVersion = 4;
				const port = c.port ? `:${c.port}` : '';
				c.url = `mqtt://${c.host}${port}`;
				delete c.port;
				delete c.host;
			}
		};

		const newConfigs = [];
		const connectors = configs.filter((c) => c.className === 'ConnectorConfiguration');
		const streams = configs.filter((c) => c.className !== 'ConnectorConfiguration');
		const removedConnectors = [];

		connectors.forEach((configuration) => {
			if (removedProviders.includes(configuration.provider.id)) {
				removedConnectors.push(configuration.id);
				return;
			}
			if (connectorMigrations[configuration.provider.id]) {
				connectorMigrations[configuration.provider.id](configuration);
			} else {
				const newProviderId = providerRenames[configuration.provider.id];
				if (!newProviderId) {
					removedConnectors.push(configuration.id);
					return;
				}
				configuration.provider.id = newProviderId;
				configuration.provider._id = newProviderId;
			}
			configuration.name = configuration.name.replace(' ', '_').replace(/[^a-zA-Z0-9_]/, '');
			newConfigs.push(configuration);
		});
		streams.forEach((configuration) => {
			if (!configuration.connector || removedConnectors.includes(configuration.connector.id)) {
				return;
			}
			configuration.name = configuration.name.replace(' ', '_').replace(/[^a-zA-Z0-9_]/, '');
			if (configuration.className === 'FeederConfiguration') {
				configuration.className = 'ConsumerConfiguration';
			}
			newConfigs.push(configuration);
		});
		return newConfigs;
	}

	migrateMachine(m) {
		if (m) {
			const machine = JSON.parse(JSON.stringify(m));
			if (Array.isArray(machine.transactors)) {
				machine.streamsheets = machine.transactors.slice();
				delete machine.transactors;
			}
			if (Array.isArray(machine.streamSheets)) {
				machine.streamsheets = machine.streamSheets.slice();
				delete machine.streamSheets;
			}
			if (machine.dataSourceProcess) {
				machine.streamProcess = machine.dataSourceProcess;
				delete machine.dataSourceProcess;
			}
			if (Array.isArray(machine.streamsheets)) {
				machine.streamsheets = machine.streamsheets.map((s) => {
					delete s.stats;
					delete s.preferences;
					if (s.inbox && typeof s.inbox.datasource !== 'undefined') {
						s.inbox.stream =
							typeof s.inbox.datasource === 'object' && s.inbox.datasource !== null
								? Object.assign({}, s.inbox.datasource)
								: s.inbox.datasource;
						delete s.inbox.datasource;
					}
					return s;
				});
			}
			delete machine.stats;
			machine.settings = {
				isOPCUA: machine.isOPCUA,
				cycletime: machine.cycletime,
				locale: machine.locale
			};
			delete machine.isOPCUA;
			delete machine.cycletime;
			delete machine.locale;
			delete machine.metadata;
			machine.metadata = {
				owner: machine.owner,
				lastModified: new Date(machine.lastModified).getTime(),
				lastModifiedBy: machine.owner
			};
			delete machine.owner;
			return machine;
		}
		return null;
	}

	updateDocument(collection, docId, update) {
		if (update._id) {
			logger.warn('Updating a documents _id is not allowed, removing it to continue');
			delete update._id;
		}
		const updateObject = {
			$set: update
		};
		return this.db
			.collection(collection)
			.updateOne({ _id: docId }, updateObject)
			.then((resp) => resp.result && resp.result.ok);
	}

	getDocuments(collection, filter = {}, projection = {}, sortCriteria = {}) {
		return this.db
			.collection(collection)
			.find(filter)
			.project(projection)
			.sort(sortCriteria)
			.toArray();
	}

	async getExistingCollections() {
		return new Promise((resolve, reject) => {
			this.db.collections((err, collections) => {
				if (err) {
					return reject(err);
				}
				return resolve(collections.map((c) => c.s.name));
			});
		});
	}
}
module.exports = Migration;
