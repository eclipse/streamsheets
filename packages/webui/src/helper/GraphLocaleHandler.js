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
