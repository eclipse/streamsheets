import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { messages } from '../languages/translations';

const mapStateToProps = ({ locales: { locale } }) => ({
	locale,
	messages: messages[locale],
});

export default connect(mapStateToProps)(IntlProvider);
