const POP3Client = require('poplib');

const promisify = (client, f) =>
	(...args) =>
		new Promise((resolve, reject) => {
			client.once(f, (status, ...rest) => {
				if (status) {
					resolve(rest);
				} else {
					reject(rest[rest.length - 1]);
				}
			});
			client[f](...args);
		});


const createConnection = (client) => {
	const connection = {};
	const addToConnection = (f, index) => {
		const pf = promisify(client, f);
		connection[f] = (...args) =>
			pf(...args)
				// eslint-disable-next-line no-confusing-arrow
				.then(res => index !== undefined ? res[index] : res);
	};
	addToConnection('quit');
	addToConnection('login');
	addToConnection('list', 0);
	addToConnection('retr', 1);
	addToConnection('dele');
	addToConnection('rset');
	connection.on = client.on;
	return connection;
};

// eslint-disable-next-line
const create = (port, host, options) =>
	({
		connect() {
			return new Promise((resolve, reject) => {
				const client = new POP3Client(port, host, options);
				client.on('connect', () => resolve(createConnection(client)));
				client.on('error', reject);
			});
		}
	});

module.exports = create;
