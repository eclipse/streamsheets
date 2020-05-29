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
/* eslint-disable react/forbid-prop-types */
import React from 'react';
import { connect } from 'react-redux';
import { Document, Page } from 'react-pdf';
import Grid from '@material-ui/core/Grid';
import DownloadIcon from '@material-ui/icons/VerticalAlignBottom';
import PreviousIcon from '@material-ui/icons/NavigateBefore';
import NextIcon from '@material-ui/icons/NavigateNext';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import FormHelperText from '@material-ui/core/FormHelperText';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Typography from '@material-ui/core/Typography';
import { FormattedMessage } from 'react-intl';
import RegistrationForm from './RegistrationForm';

import { openPage, saveSetup, setLocaleSetup, subscribeNewsletter } from '../../actions/actions';
import theme from '../../theme';

const styles = {
	button: {
	  margin: '5px',
	},
  }

function getSteps() {
	return [
		<FormattedMessage id="Setup.SetupStepRead" defaultMessage="Read license" />,
		<FormattedMessage id="Setup.SetupStepAccept" defaultMessage="Accept license" />,
		<FormattedMessage id="Setup.SetupStepNewsletter" defaultMessage="Register newsletter" />,
	];
}

const steps = getSteps();
class SetupPage extends React.Component {
	static propTypes = {
		classes: PropTypes.object.isRequired,
		subscribeNewsletter: PropTypes.func.isRequired,
	};

	constructor(props) {
		super(props);
		this.state = {
			okEnabled: false,
			activeStep: 0,
			skipped: new Set(),
			localeSetup: 'DE',
			licenseAgreement: {
				version: '1',
				currentPage: 1,
				totalPages: null,
				language: 'DE',
				// TODO: use boolean here
				accepted: 'notaccept',
				file: '/license_DE.pdf'
			},
			user: {
				firstName: '',
				lastName: '',
				email: '',
			}
		};
	}

	onDocumentLoadSuccess = ({ numPages }) => {
		this.setState({
			licenseAgreement: {
				...this.state.licenseAgreement,
				totalPages: numPages
			}
		});
	};

	onPreviousPage = () => {
		const newPage = this.state.licenseAgreement.currentPage - 1;
		if (newPage >= 1) {
			this.setState({ 
				licenseAgreement: {
					...this.state.licenseAgreement,
					currentPage: newPage 
				}
			});
		}
	};

	onNextPage = () => {
		const newPage = this.state.licenseAgreement.currentPage + 1;
		if (newPage <= this.state.licenseAgreement.totalPages) {
			this.setState({ 
				licenseAgreement: {
					...this.state.licenseAgreement,
					currentPage: newPage
				}
			});
		}
		if (newPage === this.state.licenseAgreement.totalPages) {
			this.setState({ okEnabled: true });
		}
	};

	onLicenseAccepted = () => {};

	getStepContent = (step) => {
		const { classes } = this.props;
		const { totalPages, currentPage } = this.state.licenseAgreement;
		switch (step) {
			case 0:
				return (
					<Grid container spacing={8} style={{ height: '100%' }}>
						<Grid item xs={12}>
							<Button
								className={classes.button}
								variant="contained"
								onClick={this.onPreviousPage}
								disabled={!this.isPreviousPageEnabled()}
							>
								<PreviousIcon />
								<FormattedMessage id="Setup.LicenseAgreement.PreviousPage" defaultMessage="Previous page" />
							</Button>
							<Button
								className={classes.button}
								variant="contained"
								onClick={this.onNextPage}
								disabled={!this.isNextPageEnabled()}
							>
								<FormattedMessage id="Setup.LicenseAgreement.NextPage" defaultMessage="Next page" />
								<NextIcon />
							</Button>
							<div>
								<FormattedMessage id="Setup.LicenseAgreement.Page" 
									defaultMessage="Page {currentPage} of {totalPages}"
									values={{ currentPage, totalPages }} />
							</div>
							<Button
								className={classes.button}
								variant="contained"
								href={this.state.licenseAgreement.file}
								download
							>
									<FormattedMessage id="Setup.LicenseAgreement.Download" defaultMessage="Download" />
								<DownloadIcon />
							</Button>
						</Grid>
					</Grid>
				);
			case 1:
				return (
					<FormControl component="fieldset">
						<RadioGroup
							aria-label="license"
							name="license"
							onChange={this.handleChangeLicenseAgreement}
							disabled={!this.state.okEnabled}
							value={this.state.licenseAgreement.accepted}
						>
							<FormControlLabel
								value="accept"
								control={<Radio />}
								label={<FormattedMessage id="Setup.LicenseAgreement.RadioButtonAccept" defaultMessage="I accept the agreement" />}
								disabled={!this.state.okEnabled}
							/>
							<FormControlLabel
								value="notaccept"
								control={<Radio />}
								label={<FormattedMessage id="Setup.LicenseAgreement.RadioButtonDoNotAccept" defaultMessage="I do not accept the agreement" />}
								disabled={!this.state.okEnabled}
							/>
						</RadioGroup>
					</FormControl>
				);
			case 2:
				return (
					<RegistrationForm
						user={this.state.user}
						subscribed={this.state.subscribed}
						onFirstNameUpdate={this.updateFirstName}
						onLastNameUpdate={this.updateLastName}
						onEmailUpdate={this.updateEmail}
						onNewsletterRegistration={this.subscribeNewsletter}
					/>
				);
			default:
				return 'Unknown step';
		}
	};

	setActiveStep = (activeStep) => {
		this.setState({ activeStep });
	};

	setSkipped = (skipped) => {
		this.setState({ skipped });
	};

	isStepOptional = (step) => step === 2;

	isStepSkipped = (step) => this.state.skipped.has(step);

	updateFirstName = (firstName) => {
		this.setState({
			user: {
				...this.state.user,
				firstName,
			}
		});
	}

	updateLastName = (lastName) => {
		this.setState({
			user: {
				...this.state.user,
				lastName,
			}
		});
	}

	updateEmail = (email) => {
		this.setState({
			user: {
				...this.state.user,
				email,
			}
		});
	}

	subscribeNewsletter = async () => {
		const response = await this.props.subscribeNewsletter(this.state.user);
		if (response.status === 200) {
			this.setState({
				subscribed: true
			})
		}
	}

	isPreviousPageEnabled() {
		return this.state.licenseAgreement.currentPage > 1;
	}

	isNextPageEnabled() {
		return this.state.licenseAgreement.totalPages !== null
			&& this.state.licenseAgreement.currentPage < this.state.licenseAgreement.totalPages;
	}

	handleChangeLicenseAgreement = (event) => {
		this.setState({
			licenseAgreement: {
				...this.state.licenseAgreement,
				accepted: event.target.value,
			}
		})
	}

	handleLanguageChange(event) {
		const locale = event.target.value;
		console.log(`/license_${locale}.pdf`);
		this.setState({
			localeSetup: locale,
			licenseAgreement: {
				...this.state.licenseAgreement,
				language: locale,
				file: `/license_${locale}.pdf`
			}
		});
		this.props.setLocaleSetup(locale.toLowerCase());
	}

	handleNext = async () => {
		if (this.state.activeStep < steps.length - 1) {
			// TODO: handle skipped steps later when there are requirements for this
			// let newSkipped = this.state.skipped;
			// if (this.isStepSkipped(this.state.activeStep)) {
			// 	newSkipped = new Set(newSkipped.values());
			// 	newSkipped.delete(this.state.activeStep);
			// }
			this.setActiveStep(this.state.activeStep + 1);
			// this.setSkipped(newSkipped);
		} else {
			const setup = {
				locale: this.state.localeSetup,
				licenseAgreement: {
					...this.state.licenseAgreement,
					date: new Date().toISOString(),
				},
				// user: this.state.user,
			}
			setup.licenseAgreement.accepted = setup.licenseAgreement.accepted === 'accept';
			await this.props.saveSetup(setup);
			await this.props.openPage('/login');
			window.location.reload();
		}
	};

	handleBack = () => {
		this.setActiveStep(this.state.activeStep - 1);
	};

	handleSkip = () => {
		if (!this.isStepOptional(this.state.activeStep)) {
			throw new Error("You can't skip a step that isn't optional.");
		}

		this.setActiveStep(this.state.activeStep + 1);

		this.setSkipped((prevSkipped) => {
			const newSkipped = new Set(prevSkipped.values());
			newSkipped.add(this.state.activeStep);
			return newSkipped;
		});
	};

	handleReset = () => {
		this.setActiveStep(0);
	};

	isNextEnabled = () => {
		switch (this.state.activeStep) {
			case 0: return this.state.okEnabled;
			case 1: return this.state.licenseAgreement.accepted === 'accept';
			case 2: return true;
			// Do not require newsletter registration
			// case 2: return this.state.user.firstName !== null &&
			// 	this.state.user.lastName !== null &&
			// 	this.state.user.email !== null;
			default:
		}
		return false;
	}

	render() {
		const { classes } = this.props;
		const { activeStep } = this.state;
		const { currentPage } = this.state.licenseAgreement;
		// eslint-disable-next-line react/prop-types
		return (
			// <IntlProvider
			// 	locale={this.props.appState.language}
			// 	messages={this.props.appState.translations}
			// >
			<MuiThemeProvider theme={theme}>
				<div
					style={{
						width: '100vw',
						height: '100vh',
						backgroundSize: '100% 100%',
						backgroundImage: 'url(images/mainbg.jpg)',
						textAlign: 'center',
					}}
				>
					<Grid container spacing={8} style={{ height: '100%' }}>
						<Grid item xs={6}>
							<Paper style={{ height: '100%', paddingTop: '20px' }}>
								<Typography variant="h5" component="h2">
									Streamsheets
								</Typography>
								<Typography variant="subtitle1" component="h3">
									Your code-free tool for real-time data stream processing
								</Typography>
								<Stepper activeStep={activeStep}>
									{steps.map((label, index) => {
										const stepProps = {};
										const labelProps = {};
										if (this.isStepOptional(index)) {
											labelProps.optional = (
												<Typography variant="caption">Optional</Typography>
											);
										}
										if (this.isStepSkipped(index)) {
											stepProps.completed = false;
										}
										return (
											<Step key={label} {...stepProps}>
												<StepLabel {...labelProps}>{label}</StepLabel>
											</Step>
										);
									})}
								</Stepper>
								<Paper style={{ height: '100%', padding: '20px' }}>
									{
									// 	this.state.activeStep === steps.length ? (
									// 	<div>
									// 		<Typography>All steps completed - you have finished the setup.</Typography>
									// 		<Button
									// 			className={classes.button}
									// 			onClick={this.handleReset}
									// 		>
									// 				Reset
									// 		</Button>
									// 	</div>
									// ) : 
									(
										<Grid
											container
											irection="column"
											style={{ height: "70%" }}
										>
											<Grid
												item xs={12}
												style={{ height: "80%" }}
											>
												<Typography>
													{this.getStepContent(this.state.activeStep)}
												</Typography>
											</Grid>
											<Grid
												item xs={12}
												style={{ height: "20%" }}
											>
												<FormControl className={classes.formControl}>
													<Select
														value={this.state.localeSetup}
														onChange={event => this.handleLanguageChange(event)}
														input={<Input name="age" id="age-label-placeholder" />}
														displayEmpty
														name="age"
													>
														<MenuItem value="DE" >DE</MenuItem>
														<MenuItem value="EN">EN</MenuItem>
													</Select>
													<FormHelperText>
														<FormattedMessage id="Setup.Language" defaultMessage="Language" />
													</FormHelperText>
												</FormControl>
												<Button
													className={classes.button}
													variant="contained"
													color="primary"
													disabled={this.state.activeStep === 0}
													onClick={this.handleBack}
												>
													<FormattedMessage id="Setup.Back" defaultMessage="Back" />
												</Button>
												{/* {this.isStepOptional(this.state.activeStep) && (
													<Button
														className={classes.button}
														variant="contained"
														color="primary"
														onClick={this.handleSkip}
													>
														<FormattedMessage id="Setup.Skip" defaultMessage="Skip" />
													</Button>
												)} */}

												<Button
													className={classes.button}
													variant="contained"
													color="primary"
													onClick={this.handleNext}
													disabled={!this.isNextEnabled()}
												>
													{this.state.activeStep === steps.length - 1
														? <FormattedMessage id="Setup.Finish" defaultMessage="Finish" />
														: <FormattedMessage id="Setup.Next" defaultMessage="Next" />}
												</Button>
											</Grid>
										</Grid>
									)}
								</Paper>
							</Paper>
						</Grid>
						<Grid item xs={6}>
							<Paper style={{ height: '100%' }}>
								<div style={{ width: 500 }}>
									<Document file={this.state.licenseAgreement.file} onLoadSuccess={this.onDocumentLoadSuccess}>
										<Page height="100%" pageNumber={currentPage} />
									</Document>
								</div>
							</Paper>
						</Grid>
					</Grid>
				</div>
			</MuiThemeProvider>
			// </IntlProvider>
		);
	}
}

SetupPage.propTypes = {
	openPage: PropTypes.func.isRequired,
	saveSetup: PropTypes.func.isRequired,
	setLocaleSetup: PropTypes.func.isRequired,
	subscribeNewsletter: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
	saveSetup,
	setLocaleSetup,
	openPage,
	subscribeNewsletter,
};

export default withStyles(styles)(
	connect(
		null,
		mapDispatchToProps,
	)(SetupPage),
);
