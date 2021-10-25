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
const sdk = require('@cedalo/sdk-streams');
const url = require('url');
const ToitConsumer = require('./ToitConsumer');
const ToitProviderConfiguration = require('./ToitProviderConfiguration');

module.exports = class ToitProvider extends sdk.Provider {
	constructor() {
		super(new ToitProviderConfiguration());
	}

	get Consumer() {
		return ToitConsumer;
	}

  get canProduce() {
		return false;
	}
};
