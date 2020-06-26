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
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { messages } from '../languages/translations';

const mapStateToProps = ({ locales: { locale } }) => ({
	locale,
	messages: messages[locale],
});

export default connect(mapStateToProps)(IntlProvider);
