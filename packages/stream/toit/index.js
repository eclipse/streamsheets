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
const ToitProvider = require('./src/ToitProvider');
const ToitProviderConfiguration = require('./src/ToitProviderConfiguration');
const ToitConsumer = require('./src/ToitConsumer');
const ToitConsumerConfiguration = require('./src/ToitConsumerConfiguration');

module.exports = {
	Provider: ToitProvider,
	ToitConsumer,
	ToitConsumerConfiguration,
	ToitProviderConfiguration
};
