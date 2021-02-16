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

class ProducerConfiguration extends BaseConfiguration {
	constructor(config, connector, provider) {
		super(config);
		this.className = ProducerConfiguration.NAME;
		this.disabled = true;
		this.description = config.description || '';
		this.connector = connector;
		this.provider = provider;
		if (!this.isRef()) {
			if (!this.connector || !this.provider) {
				throw Error('Invalid producer config');
			}
			this.fields = {};
			if (this.provider.definition) {
				this.provider.definition.producer.forEach((d) => {
					this.fields[d.id] = config[d.id];
				});
			}
			this.disabled = config.disabled;
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
			this.provider.definition.producer.forEach((field) => {
				field.value = config[field.id];
				this.fields[field.id] = field.value;
			});
		}
	}

	setFieldValue(fieldId, value) {
		const field = this.provider.definition.producer.find(
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
			disabled: this.disabled,
			description: this.description,
			connector: this._connector.toReference(),
			providerId: this.provider.id,
			samplePayloads: this.samplePayloads || undefined,
			mimeType: this.mimeType || 'auto'
		});
		if (this.provider && this.provider.definition) {
			this.provider.definition.producer.forEach((d) => {
				json[d.id] = this.fields[d.id];
			});
		}
		return json;
	}

	clone() {
		return new ProducerConfiguration(this.toJSON());
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

	get disabled() {
		return this._disabled;
	}

	set disabled(value) {
		this._disabled = value === true;
	}

	get mimeType() {
		return this._mimeType;
	}

	set mimeType(value) {
		this._mimeType = value;
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
ProducerConfiguration.NAME = 'ProducerConfiguration';
module.exports = ProducerConfiguration;
