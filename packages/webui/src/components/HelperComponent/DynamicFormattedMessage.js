import React from 'react';
import { FormattedMessage } from 'react-intl';

// Workaround for Babel restriction, see https://github.com/yahoo/babel-plugin-react-intl/issues/119
export function DynamicFormattedMessage(props) {
	return <FormattedMessage {...props} />;
}
