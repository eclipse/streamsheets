const nodemailer = require('nodemailer');

const SMTP_SECURITY_OPTIONS = {
	STARTTLS: 'starttls',
	TLS: 'tls',
	NONE: 'none'
};

const create = async (config) => {
	const state = {};
	const { username, password } = config;
	const { host, port, security, allowSelfSigned = false } = config.connector;
	const smtpConfig = {
		host,
		port,
		secure: security === SMTP_SECURITY_OPTIONS.TLS,
		auth: {
			user: username,
			pass: password
		},
		requireTLS: SMTP_SECURITY_OPTIONS.STARTTLS,
		tls: {
			// do not fail on invalid certs
			rejectUnauthorized: !allowSelfSigned
		}
		// proxy?
	};

	const connect = async () => {
		try {
			const connection = nodemailer.createTransport(smtpConfig);
			connection.on('error', () => {
				state.connection = null;
			});
			state.connection = connection;
		} catch (e) {
			throw new Error(`Failed to connect to SMTP server '${host}:${port}'. ${e}`);
		}
	};
	const send = async (message) => {
		const connection = state.connection || await connect();
		await connection.sendMail(message);
	};

	const dispose = async () => {
		if (state.connection) {
			await state.connection.close();
			state.connection = null;
		}
	};

	await connect();
	await state.connection.verify();


	return { send, dispose };
};

module.exports = { create };
