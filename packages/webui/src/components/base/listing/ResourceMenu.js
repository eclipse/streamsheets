/* eslint-disable react/forbid-prop-types, jsx-a11y/click-events-have-key-events */
import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu/Menu';
import MenuItem from '@material-ui/core/MenuItem/MenuItem';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import { FormattedMessage } from 'react-intl';

const DEF_STYLES = {
	icon: {
		width: '25px',
		height: '30px',
		color: 'white',
		padding: '0px',
	},
};
export default class ResourceMenu extends React.Component {
	static propTypes = {
		menuOptions: PropTypes.array,
		onMenuSelect: PropTypes.func,
		resourceId: PropTypes.string,
		styles: PropTypes.object,
	};
	static defaultProps = {
		styles: DEF_STYLES,
		onMenuSelect: () => {},
		menuOptions: undefined,
		resourceId: undefined,
	};

	constructor(props) {
		super(props);
		this.state = {
			anchorEl: null,
		};
	}

	handleClose = () => {
		this.setState({ anchorEl: null });
	};

	handleMenuSelect = (index) => {
		const { onMenuSelect, resourceId, menuOptions } = this.props;
		onMenuSelect(index, resourceId, menuOptions);
		this.setState({ anchorEl: null });
	};

	handleOpenMenu = (event) => {
		this.setState({
			anchorEl: event.currentTarget,
		});
	};

	render() {
		const { anchorEl } = this.state;
		const { menuOptions, resourceId, styles } = this.props;
		const rStyles = { ...DEF_STYLES, ...styles };
		if (!menuOptions) return null;
		return menuOptions.length < 1 ? null : (
			<React.Fragment>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id="Tooltip.MenuOptions" defaultMessage="Options" />}
				>
					<div
						style={{
							display: 'inline',
						}}
					>
						<IconButton onClick={this.handleOpenMenu} style={rStyles.icon}>
							<MoreVertIcon />
						</IconButton>
					</div>
				</Tooltip>
				<Menu
					id="long-menu"
					anchorEl={this.state.anchorEl}
					open={Boolean(anchorEl)}
					onClose={this.handleClose}
					PaperProps={{
						style: {
							width: 'auto',
						},
					}}
				>
					{menuOptions.map((option, index) => {
						if (typeof option === 'string') {
							return option === 'divider' ? (
								<Divider key={option} />
							) : (
								<MenuItem key={option} onClick={() => this.handleMenuSelect(index, resourceId)}>
									{option}
								</MenuItem>
							);
						}
						return (
							<MenuItem
								key={option.value}
								onClick={() => this.handleMenuSelect(option.value, resourceId)}
							>
								{option.label}
							</MenuItem>
						);
					})}
				</Menu>
			</React.Fragment>
		);
	}
}
