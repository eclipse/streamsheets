const convict = require('convict');
const path = require('path');
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'Gateway - Config',
);
const env = process.env.NODE_ENV;
let APP_URL = process.env.STREAMSHEETS_APP_URL || 'http://localhost:3000';
if (env === 'production') {
	APP_URL = process.env.STREAMSHEETS_APP_URL || 'http://localhost:8081';
}
const AUTH_API_URL =
	process.env.STREAMSHEETS_AUTH_API_URL ||
	'http://localhost:8080/api/v1.0/auth/';
const config = convict({
	app: {
		appUrl: {
			format: 'url',
			default: APP_URL,
			env: 'STREAMSHEETS_APP_URL',
			arg: 'STREAMSHEETS_APP_URL'
		},
		authProviders: {
			format: '*',
			default: 'openid',
			env: 'AUTHENTICATION_PROVIDERS',
			arg: 'AUTHENTICATION_PROVIDERS'
		},
	},
	http: {
		port: {
			doc: 'The port to bind.',
			format: 'port',
			default: 8080,
			env: 'GATEWAY_HTTP_PORT',
			arg: 'GATEWAY_HTTP_PORT'
		},
		ipaddress: {
			doc: 'The port to bind.',
			format: 'url',
			default: 'localhost',
			env: 'GATEWAY_HTTP_HOST',
			arg: 'GATEWAY_HTTP_HOST'
		},
		secure: {
			format: 'Boolean',
			default: false
		}
	},
	socket: {
		port: {
			doc: 'The port to bind.',
			format: 'port',
			default: 8088,
			env: 'WS_PORT',
			arg: 'WS_PORT'
		},
		host: {
			doc: 'The port to bind.',
			format: 'url',
			default: '0.0.0.0',
			env: 'WS_HOST',
			arg: 'WS_HOST'
		},
		secure: {
			format: 'Boolean',
			default: false
		}
	},
	auth: {
		jwtSecret: {
			format: String,
			default: '',
			env: 'JWT_SECRET',
			arg: 'JWT_SECRET'
		},
		strategies: {
			github: {
				callbackURL: {
					format: 'url',
					default: `${AUTH_API_URL}github/callback`,
					env: 'STREAMSHEETS_GITHUB_REDIRECT_URI'
				},
				clientID: {
					format: String,
					default: 'clientId',
					env: 'STREAMSHEETS_GITHUB_CLIENT_ID'
				},
				clientSecret: {
					format: String,
					default: 'clientSecret',
					env: 'STREAMSHEETS_GITHUB_CLIENT_SECRET'
				}
			},
			openid: {
				issuerHost: {
					format: 'url',
					default: 'https://splicex.ibm-garage.com/oidc/endpoint/I4P',
					env: 'STREAMSHEETS_OPENID_ISSUER_HOST'
				},
				redirect_uri: {
					format: 'url',
					default: `${AUTH_API_URL}openid/callback'`,
					env: 'STREAMSHEETS_OPENID_REDIRECT_URI'
				},
				client_id: {
					format: String,
					default: 'clientId',
					env: 'STREAMSHEETS_OPENID_CLIENT_ID'
				},
				client_secret: {
					format: String,
					default: 'clientSecret',
					env: 'STREAMSHEETS_OPENID_CLIENT_SECRET'
				},
				scope: {
					format: String,
					default: 'openid',
					env: 'STREAMSHEETS_OPENID_SCOPE'
				}
			},
			google: {
				passReqToCallback: {
					format: 'Boolean',
					default: true,
					env: 'STREAMSHEETS_GOOGLE_PASS_REQ_TO_CALLBACK'
				},
				callbackURL: {
					format: 'url',
					default: `${AUTH_API_URL}google/callback`,
					env: 'STREAMSHEETS_GOOGLE_REDIRECT_URI'
				},
				clientID: {
					format: String,
					default: 'clientId',
					env: 'STREAMSHEETS_GOOGLE_CLIENT_ID'
				},
				clientSecret: {
					format: String,
					default: 'clientSecret',
					env: 'STREAMSHEETS_GOOGLE_CLIENT_SECRET'
				},
				scope: {
					format: '*',
					default: [
						'https://www.googleapis.com/auth/userinfo.email',
						'https://www.googleapis.com/auth/userinfo.profile'
					],
					env: 'STREAMSHEETS_GOOGLE_SCOPE'
				}
			},
			oauth2: {
				authorizationURL: {
					format: 'url',
					default: `http://test.me`,
					env: 'STREAMSHEETS_OAUTH2_AUTHORIZATION_URL'
				},
				tokenURL: {
					format: 'url',
					default: `http://test.me`,
					env: 'STREAMSHEETS_OAUTH2_TOKEN_URL'
				},
				callbackURL: {
					format: 'url',
					default: `${AUTH_API_URL}oauth2/callback`,
					env: 'STREAMSHEETS_OAUTH2_REDIRECT_URI'
				},
				clientID: {
					format: String,
					default: 'id',
					env: 'STREAMSHEETS_OAUTH2_CLIENT_ID'
				},
				clientSecret: {
					format: String,
					default: 'secret',
					env: 'STREAMSHEETS_OAUTH2_CLIENT_SECRET'
				},
				scope: {
					format: '*',
					default: '',
					env: 'STREAMSHEETS_OAUTH2_SCOPE'
				}
			},
			ldap: {
				passReqToCallback: {
					format: 'Boolean',
					default: true,
					env: 'STREAMSHEETS_LDAP_PASS_REQ_TO_CALLBACK'
				},
				callbackURL: {
					format: 'url',
					default: `${AUTH_API_URL}oauth2/callback`,
					env: 'STREAMSHEETS_LDAP_REDIRECT_URI'
				},
				clientID: {
					format: String,
					default: '',
					env: 'STREAMSHEETS_LDAP_CLIENT_ID'
				},
				clientSecret: {
					format: String,
					default: '',
					env: 'STREAMSHEETS_LDAP_CLIENT_SECRET'
				},
				url: {
					format: String,
					default: `ldap://127.0.0.1:389`,
					env: 'STREAMSHEETS_LDAP_AUTHORIZATION_URL'
				},
				bindDN: {
					format: String,
					default: 'dc=example,dc=org',
					env: 'STREAMSHEETS_LDAP_SCOPE'
				},
				bindCredentials: {
					format: String,
					default: 'secret',
					env: 'STREAMSHEETS_LDAP_SCOPE'
				},
				searchBase: {
					format: String,
					default: 'dc=example,dc=org',
					env: 'STREAMSHEETS_LDAP_SCOPE'
				},
				searchFilter: {
					format: String,
					default: '(uid={{cn}})',
					env: 'STREAMSHEETS_LDAP_SCOPE'
				}
			}
		},
		redirectSuccessUrl: `${APP_URL}/login`,
		redirectLogoutUrl: `${APP_URL}/logout`,
		redirectFailUrl: `${APP_URL}/login`
	}
});

// Load environment dependent configuration
let filePath = '';
try {
	if (env === 'production') {
		filePath = process.env.STREAMSHEETS_GATEWAY_CONFIGURATION_PATH || 'config/config-production.json';
	} else {
		filePath = process.env.STREAMSHEETS_GATEWAY_CONFIGURATION_PATH ||
			path.join(__dirname, '../', 'config', `config-development.json`);
	}
	config.loadFile(filePath);
	config.validate({ allowed: 'strict' });
	logger.info('Config loaded.')
} catch (e) {
	logger.warn(e.message);
}
module.exports = config;
