/* eslint-disable react/prop-types */
/* eslint-disable no-bitwise */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import IconPlugins from '@material-ui/icons/Build';

import { MenuGroup, MenuEntry } from '@cedalo/webui-components';

// eslint-disable-next-line react/prefer-stateless-function
export class AdminNavigationExtensions extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<MenuGroup
				open={this.props.open}
				onClick={() => this.props.setPluginsOpen(!this.props.open)}
				label={<FormattedMessage id="Dashboard.plugins" defaultMessage="Plugins" />}
				icon={<IconPlugins />}
			>
					<FormattedMessage id="Dashboard.database" defaultMessage="Database" />
				<MenuEntry href="/administration/plugins/opcua" selected={this.props.isSelected('plugins')}>
				</MenuEntry>
			</MenuGroup>
		);
	}
}

function mapStateToProps(state) {
	return {
		appState: state.appState,
	};
}

export default connect(
	mapStateToProps,
)(AdminNavigationExtensions);
