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
const BaseConfiguration = require('./BaseConfiguration');
const ProviderConfiguration = require('./ProviderConfiguration');

class ConnectorConfiguration extends BaseConfiguration {
	constructor(config = {}, provider) {
		super(config);
		this.className = ConnectorConfiguration.NAME;
		this.description = config.description || '';
		if (!this.isRef()) {
			if (provider) {
				if (provider instanceof ProviderConfiguration) {
					this._provider = provider;
				} else {
					this._provider = new ProviderConfiguration(provider);
				}
			}
			if (!this._provider) {
				if (!config) {
					this._provider = new ProviderConfiguration();
				} else if (config.provider) {
					this._provider = new ProviderConfiguration(config.provider);
				}
			}
			this.fields = {};
			if (this._provider && this._provider.definition) {
				config = config || {};
				this._provider.definition.connector.forEach((field) => {
					field.value = config[field.id];
					this.fields[field.id] = field.value;
				});
			}
		}
	}

	setFieldValue(fieldId, value) {
		const field = this.provider.definition.connector.find(
			(f) => f.id === fieldId
		);
		if (field) {
			field.value = value;
			this.fields[fieldId] = field.value;
		}
	}

	getFieldValue(fieldId) {
		return this.fields[fieldId];
	}

	hasField(fieldId) {
		return !!this.provider.definition.connector.find(
			(f) => f.id === fieldId
		);
	}

	toJSON() {
		const json = super.toJSON();
		json.provider = this.provider ? this.provider.toReference() : undefined;
		this.provider.definition.connector.forEach((d) => {
			json[d.id] = this.fields[d.id];
		});
		json.description = this.description;
		return json;
	}

	clone() {
		return new ConnectorConfiguration(this.toJSON());
	}

	get provider() {
		return this._provider;
	}

	set provider(value) {
		this._provider = value;
	}
}
ConnectorConfiguration.NAME = 'ConnectorConfiguration';
module.exports = ConnectorConfiguration;
