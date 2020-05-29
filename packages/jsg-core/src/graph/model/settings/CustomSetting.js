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
/**
 * A template which simply defines the methods a CustomSetting must provide.</br>
 * It is not required to extend this class, its methods do nothing.
 *
 * @class CustomSetting
 * @constructor
 */
class CustomSetting {
	/**
	 * Returns a String which is used to create a new instance of this setting object.</br>
	 * <b>Note:</b> the provided String must be fully qualified, i.e. it should include all namespace
	 * objects, and it should reference a parameterless method. E.g <code>CustomSetting</code>
	 * is a valid class String.
	 *
	 * @method getClassString
	 * @return {String} The string used to create an instance of this setting object.
	 */
	getClassString() {
		// return "CustomSetting";
	}

	/**
	 * Called to register given GraphSettings to this object.</br>
	 * This might be useful to send events to all GraphSettings listener. Note that in order to deregister a
	 * previous GraphSettings instance <code>undefined</code> can be passed as parameter too.
	 *
	 * @method setGraphSettings
	 * @param {GraphSettings} graphSettings The GraphSettings instance to register or
	 *     <code>undefined</code>
	 */
	setGraphSettings(graphSettings) {}

	/**
	 * Called to store this CustomSetting.</br>
	 * Here the settings value should be either added to current tag by using
	 * <code>writer.writeAttributeString()</code> or, if it is a more complex setting value, store
	 * under a new tag by calling <code>writer.writeStartElement()</code>
	 *
	 * @method save
	 * @param {Writer} writer Writer object to save to.
	 */
	save(writer) {
		// writer.writeAttributeString("hallo", this._hallo);
		// //alternatively we can start a new tag via writer.writeStartElement("newtagname");
	}

	/**
	 * Reads this CustomSettings.</br>
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	read(reader, object) {
		// this._hallo = reader.getAttribute(object, "hallo");
	}

	// setHallo(hallo) {
	// this._hallo = hallo;
	// };
	// getHallo() {
	// return this._hallo;
	// };
}

module.exports = CustomSetting;
