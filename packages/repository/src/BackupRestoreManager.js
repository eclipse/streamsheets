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
module.exports = class BackupRestoreManager {
	
	async backup(/* config */) {
		throw new Error('Method backup() must be implemented in subclass');
	}

	async restore(/* config */) {
		throw new Error('Method restore() must be implemented in subclass');
	}

};
