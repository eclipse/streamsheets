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
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { connect } from 'react-redux';
import { graphManager } from '../GraphManager';

const LocaleConsumer = (props) => {
	const { locale } = props;
	useEffect(() => {
		if (locale) {
			graphManager.setUILanguage(locale);
		}
	}, [locale]);

	return null;
};

LocaleConsumer.propTypes = {
	locale: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
	locale: state.locales.locale,
});

export default connect(mapStateToProps)(LocaleConsumer);
