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
const IdGenerator = require('@cedalo/id-generator');

class BaseConfiguration {
	constructor(config = {}) {
		const id = IdGenerator.generate();
		this._isRef = config.isRef;
		this.id = config.id || id;
		this._id = this.id;
		this.name = config.name;
		this.owner = config.owner;
		this.scope = config.scope;
		this._disabled = config.disabled;
		this._className = this.constructor.name;
		if (this._className !== 'ProviderConfiguration') {
			if (!isNaN(Date.parse(config.lastModified))) {
				this.lastModified = new Date(config.lastModified);
			} else {
				this.lastModified = new Date();
			}
			if (!isNaN(Date.parse(config.lastAccessed))) {
				this.lastAccessed = new Date(config.lastAccessed);
			} else {
				this.lastAccessed = new Date();
			}
		}
	}

	toJSON() {
		return {
			_id: this._id,
			id: this._id,
			name: this.name,
			scope: this.scope,
			owner: this.owner,
			disabled: this.disabled,
			className: this.className,
			lastModified:
				this.lastModified && this.lastModified instanceof Date
					? this.lastModified.toISOString()
					: undefined,
			lastAccessed:
				this.lastAccessed && this.lastAccessed instanceof Date
					? this.lastAccessed.toISOString()
					: undefined
		};
	}

	toReference() {
		return {
			_id: this.id,
			id: this.id,
			className: this.className,
			owner: this.owner,
			disabled: this.disabled,
			lastModified:
				this.lastModified && this.lastModified instanceof Date
					? this.lastModified.toISOString()
					: undefined,
			lastAccessed:
				this.lastAccessed && this.lastAccessed instanceof Date
					? this.lastAccessed.toISOString()
					: undefined,
			isRef: true
		};
	}

	isRef() {
		return !!this._isRef;
	}

	isValid() {
		if (this.isRef()) {
			return this._id && this.id && this.className;
		}
		return this.name && this.id && this.name.length > 0 && this.id;
	}

	get id() {
		return this._id;
	}

	set id(value) {
		this._id = value;
	}

	get name() {
		return this._name;
	}

	set name(value) {
		this._name = value;
	}

	get className() {
		return this._className;
	}

	set className(value) {
		this._className = value;
	}

	get disabled() {
		return this._disabled;
	}

	set disabled(value) {
		this._disabled = value === true;
	}
}

module.exports = BaseConfiguration;
