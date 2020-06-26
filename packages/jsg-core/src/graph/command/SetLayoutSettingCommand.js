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
const ObjectFactory = require('../../ObjectFactory');
const { readObject, writeJSON } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const Settings = require('../../layout/Settings');


const restoreSettings = (settingsData) => {
	const settings = ObjectFactory.create(settingsData.type);
	return readObject('settings', settingsData.json, settings);
};
const writeSettings = (settings) => ({
	type: settings.getClassName(),
	json: writeJSON('settings', settings)
});

/**
 * Command to change a layout setting or all settings.<br/>
 * <b>Note:<b/> this command expects that the current item {{#crossLink "Layout"}}{{/crossLink}} use
 * a settings object of type {{#crossLink "Settings"}}{{/crossLink}}. For more information about
 * layouts please refer to {{#crossLink "Layout"}}{{/crossLink}} and
 * {{#crossLink "LayoutFactory"}}{{/crossLink}}.
 *
 * @class SetLayoutSettingCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item <code>GraphItem</code> which provides the <code>Layout</code> to change the
 *     setting of.
 * @param {String|Settings} key Either a valid settings key or a <code>Settings</code> object.
 * @param {Object} [value] The new setting value. Can only be set if a valid <code>key</code> string is given.
 * @since 2.0.22.8
 */
class SetLayoutSettingCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		if (item) {
			const newvalue = restoreSettings(data.newvalue);
			const key = data.key || newvalue;
			cmd = new SetLayoutSettingCommand(
				item,
				key,
				newvalue
			).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, key, value) {
		super(item);
		if (key instanceof Settings) {
			this.newvalue = key;
			this.oldvalue = item.getLayoutSettings();
		} else {
			this.key = key;
			this.newvalue = value;
			this.oldvalue = item.getLayoutSettings().get(key);
		}
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd.oldvalue = restoreSettings(data.oldvalue);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.key = this.key;
		data.newvalue = writeSettings(this.newvalue);
		data.oldvalue = writeSettings(this.oldvalue);
		return data;
	}

	undo() {
		this.applySetting(this.oldvalue);
	}

	redo() {
		this.applySetting(this.newvalue);
	}

	applySetting(value) {
		if (this.key) {
			this._graphItem.getLayoutSettings().set(this.key, value);
		} else {
			this._graphItem
				.getLayout()
				.registerSettings(this._graphItem, value);
		}
	}
}

module.exports = SetLayoutSettingCommand;
