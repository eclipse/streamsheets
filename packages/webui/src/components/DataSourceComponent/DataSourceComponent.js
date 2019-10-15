import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';

import SortSelector from '../base/sortSelector/SortSelector';
import StreamHelper from '../../helper/StreamHelper';

const getPlaceholder = () => (
	<ListItem>
		<ListItemText
			primary={<FormattedMessage id="" defaultMessage="Not Available" />}
		/>
	</ListItem>);
const buildList = (streams, onClick) => streams.map(stream => (
	<React.Fragment>
		<ListItem onClick={() => onClick(stream)} button>
			<ListItemText primary={`${stream.name}`} />
			<img style={{float: 'right'}} width={15} height={15} src={StreamHelper.getStreamStateIcon(stream)} alt="state"/>
		</ListItem>
		<Divider />
	</React.Fragment>
));
export class StreamList extends Component {

	constructor(props) {
		super(props);
		this.state = {
			sortedResources: SortSelector.sort(props.consumers, 'name_asc'),
			filter: '',
		}
	}

	handleSort = (event, sortedResources, sortQ, filter) => {
		this.setState({
			sortedResources,
			filter,
		});
	};

	render() {
		const { consumers, onItemClick = () => { } } = this.props;
		const {sortedResources, filter} = this.state;
		return <div style={{
					margin: '20px 0px 0px 0px',
					textAlign: 'right'
				}}>
					<div>
						<SortSelector
							onSort={this.handleSort}
							getResources={() => consumers}
						/>
					</div>
					<List dense style={{
						height: '350px',
						overflowY: 'auto',
					}}>
							{filter.length>0 ? null :
								<ListItem onClick={onItemClick} button>
									<ListItemText>
										<FormattedMessage
											id="DialogNew.noStream"
											defaultMessage="None"
										/>
									</ListItemText>
								</ListItem>
							}
							<Divider />
						{
							!sortedResources ? getPlaceholder() :
								buildList(sortedResources, onItemClick)
						}
					</List>
				</div>;
	}


}
StreamList.propTypes = {
	consumers: PropTypes.arrayOf(PropTypes.object).isRequired,
	onItemClick: PropTypes.func,
};
StreamList.defaultProps = {
	onItemClick: () => {},
};

function mapStateToProps(state) {
	return { consumers: state.streams.consumers };
}
export default connect(mapStateToProps)(StreamList);
