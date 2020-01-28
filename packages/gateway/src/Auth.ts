import passport from 'passport';
import passportJWT from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { LoggerFactory } from '@cedalo/logger';

const logger = LoggerFactory.createLogger('gateway - Auth', process.env.STREAMSHEETS_LOG_LEVEL || 'info');
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

class Auth {
	private jwtOptions: passportJWT.StrategyOptions = {
		jwtFromRequest: () => '',
		secretOrKey: ''
	};

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

	set jwtSecret(secret: string) {
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

	getToken(payload: object) {
		return jwt.sign(payload, this.jwtOptions.secretOrKey, {
			expiresIn: process.env.JWT_TOKEN_TTL || '365 days'
		});
	}

	async parseToken(token: string): Promise<User> {
		// if (process.env.NODE_ENV === 'develop' && token === 'develop') {
		// 	logger.warn('DEBUG!! Ignore invalid token!! REMOVE IT!!!');
		// 	return Promise.resolve({});
		// }
		return new Promise((resolve, reject) => {
			jwt.verify(token, this.jwtOptions.secretOrKey, (err, decoded) => {
				if (err) {
					return reject(err);
				}
				// TODO: Check that we actually got a user object
				return resolve(<User>decoded);
			});
		});
	}
}

export default new Auth();
