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
const ConnectorConfiguration = require('./ConnectorConfiguration');
const ProviderConfiguration = require('./ProviderConfiguration');
const BaseConfiguration = require('./BaseConfiguration');

class ConsumerConfiguration extends BaseConfiguration {
	constructor(config, connector, provider) {
		super(config);
		this.className = ConsumerConfiguration.NAME;
		this.description = config.description || '';
		this.connector = connector;
		this.provider = provider;
		if (!this.isRef()) {
			if (!this.connector || !this.provider) {
				throw Error('Invalid consumer config');
			}
			this.fields = {};
			if (this.provider.definition) {
				this.provider.definition.consumer.forEach((d) => {
					this.fields[d.id] = config[d.id];
				});
			}
		}
		if (config.filter) {
			this.filter = config.filter;
		}
		if (config.labelAttribute) {
			this.labelAttribute = config.labelAttribute;
		}
		if (config.idAttribute) {
			this.idAttribute = config.idAttribute;
		}
		if (config.samplePayloads) {
			this.samplePayloads = config.samplePayloads;
		}
		if (config.mimeType) {
			this.mimeType = config.mimeType || 'auto';
		}
		if (this.provider && this.provider.definition) {
			config = config || {};
			this.fields = this.fields || {};
			this.provider.definition.consumer.forEach((field) => {
				field.value = config[field.id];
				this.fields[field.id] = field.value;
			});
		}
	}

	setFieldValue(fieldId, value) {
		const field = this.provider.definition.consumer.find(
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
		return !!this.provider.definition.connector.find((f) => f.id === fieldId);
	}

	toJSON() {
		const json = Object.assign({}, super.toJSON(), {
			connector: this._connector.toReference(),
			description: this.description,
			filter: this.filter || undefined,
			labelAttribute: this.labelAttribute || undefined,
			idAttribute: this.idAttribute || undefined,
			samplePayloads: this.samplePayloads || undefined,
			providerId: this.provider.id,
			mimeType: this.mimeType || 'auto'
		});
		if (this.provider && this.provider.definition) {
			this.provider.definition.consumer.forEach((d) => {
				json[d.id] = this.fields[d.id];
			});
		}
		return json;
	}

	clone() {
		return new ConsumerConfiguration(this.toJSON());
	}

	set connector(value) {
		if (value instanceof ConnectorConfiguration) {
			this._connector = value;
		} else {
			this._connector = new ConnectorConfiguration(value);
		}
	}

	get connector() {
		return this._connector;
	}

	set provider(value) {
		if (value) {
			if (value instanceof ProviderConfiguration) {
				this._provider = value;
			} else {
				this._provider = new ProviderConfiguration(value);
			}
		}
	}

	get provider() {
		return this._provider;
	}

	get filter() {
		return this._filter;
	}

	set filter(value) {
		this._filter = value;
	}

	get labelAttribute() {
		return this._labelAttribute;
	}

	set labelAttribute(value) {
		this._labelAttribute = value;
	}

	get mimeType() {
		return this._mimeType;
	}

	set mimeType(value) {
		this._mimeType = value;
	}

	get idAttribute() {
		return this._idAttribute;
	}

	set idAttribute(value) {
		this._idAttribute = value;
	}

	get samplePayloads() {
		return this._samplePayloads;
	}

	set samplePayloads(value) {
		if (value && Array.isArray(value)) {
			this._samplePayloads = value.map((v) => {
				if (v.data && typeof v.data === 'string') {
					try {
						v.data = JSON.parse(v.data);
						return v;
					} catch (e) {
						return v;
					}
				}
				return v;
			});
		}
	}
}
ConsumerConfiguration.NAME = 'ConsumerConfiguration';
module.exports = ConsumerConfiguration;
