/********************************************************************************
 * Copyright (c) 2010 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const Notification = require('../../notifications/Notification');
const NotificationCenter = require('../../notifications/NotificationCenter');
const WorksheetNode = require('../../model/WorksheetNode');
const { applyPropertiesDefinitions /* , toServerProperties */ } = require('../../model/utils');
const RequestCommand = require('./RequestCommand');

const setProperties = (props, sheet) => {
	const { clear, properties = {} } = props;
	applyPropertiesDefinitions(sheet, props, properties, clear);
};
const copyProperties = (properties) => properties ? { ...properties.getMap() } : undefined;

class SetCellsPropertiesCommand extends RequestCommand {
	// if no attributes, formats or textformats are given, we clear completely => IMPROVE!!!
	constructor(sheet, cellsColRows = {}, { attributes, formats, textFormats } = {}) {
		super(sheet);

		this._oldProperties = undefined;
		this._newProperties = cellsColRows;
		this._newProperties.clear = !(attributes || formats || textFormats);
		this._newProperties.properties = {
			attributes: copyProperties(attributes),
			formats: copyProperties(formats),
			textFormats: copyProperties(textFormats)
		};
		// toServerProperties({
		// 	attributes: attributes ? attributes.getMap() : undefined,
		// 	formats: formats ? formats.getMap() : undefined,
		// 	textFormats: textFormats ? textFormats.getMap() : undefined
		// });
	}

	_createRequest(info) {
		return this.createRequest('command.server.SetCellsPropertiesCommand', info);
	}
	getExecuteRequest() {
		// setProperties(this._newProperties, this.sheet);
		return this._createRequest(this._newProperties);
	}
	getRedoRequest() {
		// setProperties(this._newProperties, this.sheet);
		return this._createRequest(this._newProperties);
	}
	getUndoRequest() {
		// setProperties(this._oldProperties, this.sheet);
		return this._createRequest(this._oldProperties);
	}

	handleResult(result) {
		const { newProperties, oldProperties = {} } = result;
		if(!this._oldProperties) this._oldProperties = oldProperties;
		if (newProperties) {
			setProperties(newProperties, this.sheet);
			// tmp. send a notification to update any open dialogs... => TODO: IMPROVE
			NotificationCenter.getInstance().send(
				new Notification(WorksheetNode.SELECTION_CHANGED_NOTIFICATION, {
					item: this.sheet,
					updateFinal: true
				})
			);
		}
		// const { changedProperties = {} } = result;
		// this._oldProperties = this._oldProperties || changedProperties;
	}
}
module.exports = SetCellsPropertiesCommand;
