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
import { Arrays } from '@cedalo/jsg-core';
import Interaction from './Interaction';

/**
 * An InteractionDispatcher is an Interaction subclass which is used to dispatch incoming events to
 * multiple registered {{#crossLink "InteractionActivator"}}{{/crossLink}}s.
 * The events to dispatch are not specified and should be implemented by subclasses
 * by overwriting corresponding methods.
 *
 * @example
 *    CustomDispatcher.prototype.onMouseDown = function(event, viewer) {
 *		var i,
 *			activators = this.getActivatorsForFunc("onMouseDown");
 *		for (i = 0; i < activators.length; i++) {
 *			activators[i].onMouseDown(event, viewer, this);
 *			if(event.hasActivated === true) {
 *				break;
 *			}
 *		}
 *	};
 *
 * @class InteractionDispatcher
 * @extends Interaction
 * @constructor
 */
class InteractionDispatcher extends Interaction {
	constructor() {
		super();
		// activators
		this._activators = [];
	}

	/**
	 * Called by {{#crossLink "ControllerViewer"}}{{/crossLink}} if this interaction is registered as a
	 * default interaction.<br/>
	 * Subclasses can overwrite this method. Default implementation does nothing.
	 *
	 * @method initAsDefault
	 * @param {ControllerViewer} viewer The viewer which called this method.
	 */
	initAsDefault(viewer) {}

	/**
	 * Called by {{#crossLink "ControllerViewer"}}{{/crossLink}} if this interaction is deregistered as a
	 * default interaction.<br/>
	 * Subclasses can overwrite this method. Default implementation does nothing.
	 *
	 * @method initAsDefault
	 * @param {ControllerViewer} viewer The viewer which called this method.
	 */
	disposeAsDefault(viewer) {}

	activate(viewer) {
		// function sendInit(key, activator) {
		// 	activator.init(viewer);
		// }
		super.activate(viewer);
		// this._activators.iterate(sendInit);
		this._activators.forEach((el) => {
			el.activator.init(viewer);
		});
	}

	deactivate(viewer) {
		// function sendDispose(key, activator) {
		// 	activator.dispose(viewer);
		// }
		super.deactivate(viewer);
		// this._activators.iterate(sendDispose);
		this._activators.forEach((el) => {
			el.activator.dispose(viewer);
		});
	}

	/**
	 * Returns a list of {{#crossLink "InteractionActivator"}}{{/crossLink}}s
	 * which implement specified function.
	 *
	 * @method getActivatorsForFunc
	 * @param {String} funcstr The function name an InteractionActivator should implement.
	 * @return {Array} A list of InteractionActivators which implement given function.
	 */
	getActivatorsForFunc(funcstr) {
		const activators = [];
		// function filter(key, activator) {
		// 	if(typeof activator[funcstr] === "function") {
		// 		activators.push(activator);
		// 	}
		// }
		// this._activators.iterate(filter);
		this._activators.forEach((el) => {
			if (typeof el.activator[funcstr] === 'function') {
				activators.push(el.activator);
			}
		});
		return activators;
	}

	/**
	 * Registers specified InteractionActivator for given key.</br>
	 * Note: this will replace any InteractionActivator which was registered for same key before.
	 *
	 * @method addActivator
	 * @param {String} key The key to register InteractionActivator for.
	 * @param {InteractionActivator} activator The InteractionActivator to register.
	 */
	addActivator(key, activator) {
		// this._activators.put(key, activator);
		let index = this._getActivatorIndex(key);
		const el = { key, activator };
		if (index < 0) {
			index = this._activators.length;
		} else {
			const act = this._activators[index].activator;
			act.dispose(this.getViewer());
		}
		this._activators[index] = el;
	}

	_getActivatorIndex(key) {
		let index = -1;
		this._activators.some((el, idx) => {
			index = el.key === key ? idx : -1;
			return index !== -1;
		});
		return index;
	}

	/**
	 * Returns the InteractionActivator which is registered for given key.
	 *
	 * @method getActivator
	 * @param {String} key The key which references a registered InteractionActivator.
	 * @return {InteractionActivator} The registered InteractionActivator or
	 *     <code>undefined</code>.
	 */
	getActivator(key) {
		// return this._activators.get(key);
		const index = this._getActivatorIndex(key);
		return index < 0 ? undefined : this._activators[index].activator;
	}

	/**
	 * Returns an <code>Array</code> of all registered InteractionActivators.
	 *
	 * @method getAllActivators
	 * @return {Array} A list of all currently registered InteractionActivators.
	 */
	getAllActivators() {
		// return this._activators.elements();
		const activators = [];
		this._activators.forEach((el) => {
			activators.push(el.activator);
		});
		return activators;
	}

	/**
	 * Removes the InteractionActivator which is registered for given key.
	 *
	 * @method removeActivator
	 * @param {String} key The key which references the InteractionActivator to remove.
	 * @return {InteractionActivator} The removed InteractionActivator or <code>undefined</code>.
	 */
	removeActivator(key) {
		// var activator = this._activators.remove(key);
		// if(activator) {
		// 	activator.dispose(this.getViewer());
		// }
		// return activator;
		const index = this._getActivatorIndex(key);
		let activator;
		if (index >= 0) {
			activator = this._activators[index].activator;
			activator.dispose(this.getViewer());
			Arrays.removeAt(this._activators, index);
		}
		return activator;
	}

	/**
	 * Removes all currently registered InteractionActivators.
	 *
	 * @method removeAllActivators
	 */
	removeAllActivators() {
		const viewer = this.getViewer();
		// function sendDispose(key, activator) {
		// 	activator.dispose(self.getViewer());
		// }
		// this._activators.iterate(sendDispose);
		// this._activators.clear();

		this._activators.forEach((el) => {
			el.activator.dispose(viewer);
		});
		this._activators.length = 0;
	}

	/**
	 * Default condition function which is used to find an affected controller.</br>
	 * This method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>true</code>.
	 *
	 * @method condition
	 * @param {ModelController} controller The controller to apply condition on.
	 * @return {Boolean} <code>true</code> if passed controller matches condition function, <code>false</code> otherwise
	 */
	condition(controller) {
		return true;
	}

	/**
	 * Returns the controller for given location.</br>
	 * Note: the search for a controller is only done once or as often as the result is undefined. On
	 * subsequent method calls the cached search result is returned. To perform a new search caller
	 * should provide a condition function. A controller is cached if no condition function is provided and therefore
	 * the default condition is used, see {{#crossLink
	 * "InteractionDispatcher/condition:method"}}{{/crossLink}}.
	 * </br>
	 * This method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>undefined</code>.
	 *
	 * @method getControllerAt
	 * @param {Point} location The location to search controller at.
	 * @param {Number} [flags] An optional flag mask to use for controller searching. If specified and
	 * different from <code>Shape.FindFlags.AUTOMATIC</code> a new search is performed.
	 * @param {Function} [condition] An optional condition function to use for controller searching. If specified
	 * a new search is performed.
	 * @return {ModelController} The mode controller at given location or
	 * <code>undefined</code> if none could be found.
	 */
	getControllerAt(location, flags, condition) {
		return undefined;
	}

	/**
	 * Returns the currently active handle or <code>undefined</code> if no handle is active.</br>
	 * This method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>undefined</code>.
	 *
	 * @method getActiveHandle
	 * @return {ActionHandle} The currently active handle or <code>undefined</code> if no handle
	 *     is active.
	 */
	getActiveHandle() {
		return undefined;
	}
}

export default InteractionDispatcher;
