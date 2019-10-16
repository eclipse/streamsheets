const noopPromise = (reason = { code: 'NOT_IMPLEMENTED' }) =>
	Promise.reject(reason);

/* eslint no-unused-vars: "off" */
/**
 * An abstract class representing a repository to access configurations.
 *
 * @class AbstractConfigurationRepository
 * @public
 */
module.exports = class AbstractConfigurationRepository {
	/**
	 * A method to get the setup configuration.
	 *
	 * @method getSetup
	 * @public
	 * @return {Promise} Resolves with setup configuration.
	 */
	getSetup() {
		return noopPromise();
	}
	/**
	 * A method to save a setup configuration.
	 *
	 * @method saveSetup
	 * @public
	 * @return {Promise} Resolves with setup configuration.
	 */
	saveSetup(setup) {
		return noopPromise();
	}
};
