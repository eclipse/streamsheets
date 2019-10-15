const passport = require('passport');
const passportJWT = require('passport-jwt');
const jwt = require('jsonwebtoken');
const config = require('./config');
// const { Errors, CODES } = require('@cedalo/error-codes');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const LdapStrategy = require('passport-ldapauth');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const OpenId2Strategy = require('passport-openid-connect').Strategy;
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'gateway - Auth',
	process.env.STREAMSHEETS_LOG_LEVEL
);
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

class Auth {
	constructor() {
		this.locals = {};
		this.config = config.get('auth');
		this.onSuccess.bind(this);
		this.onSuccessGoogle.bind(this);
	}

	getProvider(id) {
		return (
			this.config[id] || {
				id: 'internal',
				provider: 'InternalProvider',
				config: {}
			}
		);
	}

	onSuccess(accessToken, refreshToken, profile, done) {
		logger.debug(profile);
		done(null, profile);
	}

	onSuccessGoogle(req, accessToken, refreshToken, profile, done) {
		logger.debug(profile);
		done(null, profile);
	}

	initStrategies() {
		const { strategies } = this.config;
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
		passport.use(
			'openid',
			new OpenId2Strategy(strategies.openid, this.onSuccess)
		);
		passport.use(
			'github',
			new GitHubStrategy(strategies.github, this.onSuccess)
		);
		passport.use(
			'google',
			new GoogleStrategy(strategies.google, this.onSuccessGoogle)
		);
		passport.use(
			'oauth2',
			new OAuth2Strategy(strategies.oauth2, this.onSuccess)
		);
		passport.use(
			'ldap',
			new LdapStrategy({
				server: strategies.ldap
			})
		);
	}

	set jwtSecret(secret) {
		this.jwtOptions = {
			jwtFromRequest: ExtractJwt.fromAuthHeader(),
			secretOrKey: secret
		};
	}

	initialize(app) {
		this.locals = app.locals;
		this.initStrategies();
		passport.serializeUser((user, done) => {
			done(null, user);
		});
		passport.deserializeUser((user, done) => {
			done(null, user);
		});
		return passport.initialize();
	}

	get passport() {
		return passport;
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
