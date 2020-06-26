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
/* eslint-disable react/prop-types,jsx-a11y/click-events-have-key-events
 */

import React from 'react';
import PropTypes from 'prop-types';
import NavigationPrompt from 'react-router-navigation-prompt';
import ConfirmDialog from '../confirmDialog/ConfirmDialog';

const getDialog = (title, message) => (props) => {
	const { isActive, onCancel, onConfirm } = props;
	if (isActive) {
		return (
			<ConfirmDialog
				onCancel={onCancel}
				onConfirm={onConfirm}
				open
				title={title}
				content={message}
			 />
		);
	}
	return null;
};

class CustomPrompt extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			allow: false
		}
	}

	componentWillUnmount() {
		this.setState({allow: false})
	}

	onCancel = () => {
		const { onCancel } = this.props;
		this.setState({allow: false})
		if(typeof onCancel === 'function') {
			return onCancel();
		}
		return false;
	};

	isDirty = () => {
		const { when } = this.props;
		return this.state.allow || when;
	};

	render() {
		const { message, afterConfirm, title } = this.props;
		return (
			<NavigationPrompt
				afterCancel={this.onCancel}
				afterConfirm={afterConfirm}
				// Children will be rendered even if props.when is falsey and isActive is false:
				renderIfNotActive
				// Confirm navigation if going to a path that does not start with current path:
				when={this.isDirty()}
			>
				{getDialog(title, message)}
			</NavigationPrompt>
		);
	}
}

CustomPrompt.propTypes = {
	when: PropTypes.bool.isRequired,
	title: PropTypes.string,
	message: PropTypes.string.isRequired,
	afterConfirm: PropTypes.func,
	onCancel: PropTypes.func,
};

CustomPrompt.defaultProps = {
	afterConfirm: () => {},
	title: 'Confirm leaving without saving',
	onCancel: () => {},
};

export default (CustomPrompt);
