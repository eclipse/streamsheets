const passport = require('passport');
const passportJWT = require('passport-jwt');
const jwt = require('jsonwebtoken');
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'gateway - Auth',
	process.env.STREAMSHEETS_LOG_LEVEL
);
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

class Auth {
	initStrategies() {
		passport.use(
			'jwt',
			new JwtStrategy(this.jwtOptions, (jwtPayload, next) => {
				// TODO: validate every request against db user?
				if (jwtPayload) {
					next(null, jwtPayload);
				} else {
					next(null, false);
				}
			})
		);
	}

	set jwtSecret(secret) {
		this.jwtOptions = {
			jwtFromRequest: ExtractJwt.fromAuthHeader(),
			secretOrKey: secret
		};
	}

	initialize() {
		this.initStrategies();
		passport.serializeUser((user, done) => {
			done(null, user);
		});
		passport.deserializeUser((user, done) => {
			done(null, user);
		});
		return passport.initialize();
	}

	getToken(payload) {
		return jwt.sign(payload, this.jwtOptions.secretOrKey, {
			expiresIn: process.env.JWT_TOKEN_TTL || '365 days'
		});
	}

	parseToken(token) {
		if (process.env.NODE_ENV === 'develop' && token === 'develop') {
			logger.warn('DEBUG!! Ignore invalid token!! REMOVE IT!!!');
			return Promise.resolve({});
		}
		return new Promise((resolve, reject) => {
			jwt.verify(token, this.jwtOptions.secretOrKey, (err, decoded) => {
				if (err) {
					return reject(err);
				}
				return resolve(decoded);
			});
		});
	}
}

module.exports = new Auth();
