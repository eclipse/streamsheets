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
import { intlShape } from 'react-intl';

// ======================================================
// React intl passes the messages and format functions down the component
// tree using the 'context' scope. the injectIntl HOC basically takes these out
// of the context and injects them into the props of the component. To be able to
// import this translation functionality as a module anywhere (and not just inside react components),
// this function inherits props & context from its parent and exports a singleton that'll
// expose all that shizzle.
// ======================================================
let INTL;
const IntlGlobalProvider = (props, context) => {
	INTL = context.intl;
	return props.children;
};

IntlGlobalProvider.contextTypes = {
	intl: intlShape.isRequired,
};

// ======================================================
// Class that exposes translations
// ======================================================
let instance;
class IntlTranslator {
	// Singleton
	constructor() {
		if (!instance) {
			instance = this;
		}
		return instance;
	}

	// ------------------------------------
	// Formatting Functions
	// ------------------------------------
	formatMessage(message, values = {}) {
		return INTL.formatMessage(message, values);
	}
}

export const intl = new IntlTranslator();
export default IntlGlobalProvider;
