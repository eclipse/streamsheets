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
const Field = require('./Field');
const { ERRORS } = require('../Constants');
const BaseConfiguration = require('./BaseConfiguration');

const PARAMS = {
	TARGET: {
		id: 'target',
		label: {
			en: 'Target',
			de: 'Ziel'
		},
		description: {
			en: '=INBOX(), =OUTBOX("MsgID") or a cell range, e.g. =A1:B3',
			de: '=INBOX(), =OUTBOX("MsgID") oder ein Zellbereich, z.B. =A1:B3'
		},
		internal: true
	},
	RESULT_KEYS: {
		id: 'resultKeys',
		label: {
			en: 'Result Keys',
			de: 'Result Keys'
		},
		description: {
			en: 'Limits the result to the specified JSON Keys',
			de: 'Schränkt die Antwort auf die JSON Keys ein'
		},
		type: {
			name: 'list',
			type: { name: 'string' }
		},
		optional: true,
		internal: true
	},
	TIMEOUT: {
		id: 'timeout',
		label: {
			en: 'Timeout',
			de: 'Timeout'
		},
		description: {
			en: '',
			de: ''
		},
		type: {
			name: 'integer'
		},
		optional: true,
		internal: true
	},
	REQUEST_ID: {
		id: 'requestId',
		label: {
			en: 'Request ID',
			de: 'Request ID'
		},
		description: {
			en: '',
			de: ''
		},
		optional: true,
		internal: true
	}
};

class ProviderConfiguration extends BaseConfiguration {
	constructor(config = {}) {
		super(config);
		this.className = ProviderConfiguration.NAME;
		this._definition = {
			connector: [],
			consumer: [],
			producer: [],
			functions: []
		};
		this.canConsume = config.canConsume;
		this.canProduce = config.canProduce;
		if (config.definition) {
			if (
				config.definition.connector &&
				Array.isArray(config.definition.connector)
			) {
				config.definition.connector.map((d) =>
					this.addConnectorDefinition(d)
				);
			}
			if (
				config.definition.consumer &&
				Array.isArray(config.definition.consumer)
			) {
				config.definition.consumer.map((d) =>
					this.addConsumerDefinition(d)
				);
			}
			if (
				config.definition.producer &&
				Array.isArray(config.definition.producer)
			) {
				config.definition.producer.map((d) =>
					this.addProducerDefinition(d)
				);
			}
			if (
				config.definition.functions &&
				Array.isArray(config.definition.functions)
			) {
				config.definition.functions.map((d) =>
					this.addFunctionDefinition(d)
				);
			}
		}
		this.messages = config.messages;
		if (!this.isValid()) {
			throw new Error(ERRORS.INVALID_CONFIG);
		}
	}

	toJSON() {
		return {
			_id: this.id,
			id: this.id,
			name: this.name,
			className: this.className,
			canProduce: this.canProduce,
			canConsume: this.canConsume,
			definition: {
				connector: this._definition.connector.map((d) => d.toJSON()),
				consumer: this._definition.consumer.map((d) => d.toJSON()),
				producer: this._definition.producer.map((d) => d.toJSON()),
				functions: this._definition.functions
			}
		};
	}

	isValid() {
		if (this.isRef()) {
			return super.isValid();
		}
		return (
			super.isValid() &&
			this.className === 'ProviderConfiguration' &&
			this.definition &&
			this.definition.connector &&
			Array.isArray(this.definition.connector) &&
			this.definition.consumer &&
			Array.isArray(this.definition.consumer) &&
			this.definition.producer &&
			Array.isArray(this.definition.producer) &&
			this.definition.functions &&
			Array.isArray(this.definition.functions)
		);
	}

	clone() {
		return new ProviderConfiguration(this.toJSON());
	}

	addConnectorDefinition(def) {
		if (def && def.id) {
			this._definition.connector = this._definition.connector.filter(
				(d) => d.id !== def.id
			);
			if (def instanceof Field) {
				this._definition.connector.push(def);
			} else {
				this._definition.connector.push(new Field(def));
			}
		}
	}

	addConsumerDefinition(def) {
		if (
			def &&
			def.id &&
			!this._definition.consumer.find((d) => d.id === def.id)
		) {
			if (def instanceof Field) {
				this._definition.consumer.push(def);
			} else {
				this._definition.consumer.push(new Field(def));
			}
		}
	}

	addProducerDefinition(def) {
		if (
			def &&
			def.id &&
			!this._definition.producer.find((d) => d.id === def.id)
		) {
			if (def instanceof Field) {
				this._definition.producer.push(def);
			} else {
				this._definition.producer.push(new Field(def));
			}
		}
	}

	addFunctionDefinition(def) {
		if (
			def &&
			def.name &&
			!this._definition.functions.find((d) => d.name === def.name)
		) {
			this._definition.functions.push(def);
		}
	}

	requestFunction(f) {
		return f(PARAMS.TARGET, PARAMS.RESULT_KEYS, PARAMS.TIMEOUT);
	}

	respondFunction(f) {
		return f(PARAMS.REQUEST_ID);
	}

	get name() {
		return this._name;
	}

	set name(value) {
		this._name = value;
	}

	get canProduce() {
		if (typeof this._canProduce === 'undefined') return true;
		return this._canProduce;
	}

	set canProduce(value) {
		this._canProduce = value;
	}

	get canConsume() {
		if (typeof this._canConsume === 'undefined') return true;
		return this._canConsume;
	}

	set canConsume(value) {
		this._canConsume = value;
	}

	get fields() {
		return this._fields;
	}

	set fields(value) {
		this._fields = value;
	}

	get definition() {
		return this._definition;
	}

	set definition(value) {
		this._definition = value;
	}
}

ProviderConfiguration.FIELDTYPES = Field.TYPES;
ProviderConfiguration.NAME = 'ProviderConfiguration';

module.exports = ProviderConfiguration;
