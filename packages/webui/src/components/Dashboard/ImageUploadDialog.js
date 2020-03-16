import React from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import { FormattedMessage, injectIntl } from 'react-intl';
import Dropzone from 'react-dropzone';
import ReactCrop from 'react-image-crop';

import './styles.css';

const imageMaxSize = 1000000000 // bytes
const acceptedFileTypes = 'image/x-png, image/png, image/jpg, image/jpeg, image/gif';
const acceptedFileTypesArray = acceptedFileTypes.split(",").map((item) => {return item.trim()});

// const extractImageFileExtensionFromBase64 = (base64Data) => {
// 	return base64Data.substring('data:image/'.length, base64Data.indexOf(';base64'))
// }

const image64toCanvasRef = (canvasRef, image64, pixelCrop) => {
	const canvas = canvasRef;
	canvas.width = pixelCrop.width;
	canvas.height = pixelCrop.height;
	const ctx = canvas.getContext('2d');
	const image = new Image();
	image.src = image64;
	image.onload = () => {
	  ctx.drawImage(
		image,
		pixelCrop.x,
		pixelCrop.y,
		pixelCrop.width,
		pixelCrop.height,
		0,
		0,
		pixelCrop.width,
		pixelCrop.height
	  )
	}
  }

class ImageUploadDialog extends React.Component {

	constructor(props) {
		super(props);
		this.imagePreviewCanvasRef = React.createRef();
        this.fileInputRef = React.createRef();
        this.state = {
            imgSrc: null,
            // imgSrcExt: null,
            crop: {
                aspect: 16 / 9
            }
        };
	}

	verifyFile = (files) => {
        if (files && files.length > 0){
            const currentFile = files[0]
            const currentFileType = currentFile.type
            const currentFileSize = currentFile.size
            if(currentFileSize > imageMaxSize) {
				// TODO: show warning
                return false;
            }
            if (!acceptedFileTypesArray.includes(currentFileType)) {
				// TODO: show warning
                return false;
            }
            return true;
		}
		return false;
    }
	
	handleOnDrop = (files, rejectedFiles) => {
        if (rejectedFiles && rejectedFiles.length > 0){
            this.verifyFile(rejectedFiles)
        }

        if (files && files.length > 0){
             const isVerified = this.verifyFile(files);
             if (isVerified) {
                 const currentFile = files[0];
                 const fileReader = new FileReader();
                 fileReader.addEventListener('load', ()=>{
                     const result = fileReader.result;
                     this.setState({
                         imgSrc: result,
                        //  imgSrcExt: extractImageFileExtensionFromBase64(result)
                     })
                 }, false)
                 fileReader.readAsDataURL(currentFile);
             }
        }
	}

	handleImageLoaded = (/* image */) => {
	}
	
    handleOnCropChange = (crop) => {
        this.setState({
			crop
		});
	}
	
    handleOnCropComplete = (crop, pixelCrop) =>{
        const canvasRef = this.imagePreviewCanvasRef.current;
        const { imgSrc }  = this.state;
        image64toCanvasRef(canvasRef, imgSrc, pixelCrop);
	}
	
	handleClearToDefault = (event) =>{
        if (event) {
			event.preventDefault();
		}
		const canvas = this.imagePreviewCanvasRef.current;
		if (canvas) {
			const ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
	
			this.setState({
				imgSrc: null,
				// imgSrcExt: null,
				crop: {
					aspect: 16 / 9
				}
			})
			this.fileInputRef.current.value = null;
		}
    }
	
	handleClose = () => {
		this.handleClearToDefault();
		this.props.onClose();
	}

	handleSubmit = () => {
		this.setState({
			image: this.imagePreviewCanvasRef.current.toDataURL('image/png')
		});
		this.props.onSubmit({
			...this.state
		});
		this.handleClearToDefault();
	}

	render() {
		const { imgSrc } = this.state;
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
					}}
				>
					<div>
						<input
							ref={this.fileInputRef}
							type='file'
							accept={acceptedFileTypes}
							multiple={false}
							onChange={this.handleFileSelect}
							style={{
								visibility: 'hidden'
							}}
						/>
						{imgSrc !== null ? 
							<div>
								<ReactCrop 
									src={imgSrc} 
									crop={this.state.crop} 
									onImageLoaded={this.handleImageLoaded}
									onComplete = {this.handleOnCropComplete}
									onChange={this.handleOnCropChange}
								/>
								<br/>
								<canvas
									ref={this.imagePreviewCanvasRef}
								/>
							</div>

						: 

							<Dropzone
								onDrop={this.handleOnDrop}
								accept={acceptedFileTypes}
								multiple={false}
								maxSize={imageMaxSize}
								// style={{"width" : "100%", "height" : "500px", "border" : "1px dotted black"}}
								style={{
									width: "100%",
									height: "450px",
									borderWidth: "2px",
									borderColor: "rgb(102, 102, 102)",
									borderStyle: "dashed",
									borderRadius: "5px",
									textAlign: "center",
								}}
							>
									Drop image here or click to upload
							</Dropzone>
						}
						
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
							id="DialogNew.add"
							defaultMessage="Add"
						/>
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

export default injectIntl(ImageUploadDialog);
