import React from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import { FormattedMessage, injectIntl } from 'react-intl';

class ImageUploadDialog extends React.Component {

	handleClose = () => {
		this.props.onClose();
	}

	handleSubmit = () => {
		this.props.onSubmit({
			...this.state
		});
	}

	render() {
		const { open, onClose } = this.props;
		return (
			<Dialog
				open={open}
				onClose={onClose}
				maxWidth={false}
			>
				<DialogTitle>
					<FormattedMessage id="Dialog.MachineImage" defaultMessage="Set machine image"/>
				</DialogTitle>
				<DialogContent
					style={{
						height: '545px',
						minWidth: '500px',
						textAlign: 'center',
					}}
				>
					<div>
						This is a premium feature.						
					</div>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={this.handleClose}
					>
						<FormattedMessage
							id="Cancel"
							defaultMessage="Cancel"
						/>
					</Button>
					<Button
						onClick={this.handleSubmit}
					>
						<FormattedMessage
							id="Ok"
							defaultMessage="Ok"
						/>
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

export default injectIntl(ImageUploadDialog);
