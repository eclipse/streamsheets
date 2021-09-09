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
 import React from 'react';
 import License from '../components/Admin/license/License';
 import { intl } from '../helper/IntlGlobalProvider';
 import { AdminPageLayout } from '../layouts/AdminPageLayout';
 

 export const LicensePage = () => (
	 <AdminPageLayout page="license" documentTitle={intl.formatMessage({ id: 'Administration' })}>
		 <div
			 style={{
				 position: 'relative',
				 height: '100%',
				 outline: 'none',
				 overflow: 'hidden'
			 }}
		 >
			<License />
		 </div>
	 </AdminPageLayout>
 );
 