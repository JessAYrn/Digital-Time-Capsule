import React, {useRef, useState, useEffect, useMemo} from 'react';
import "./FileUpload.scss";
import { useEffect } from '../../../../../dist/dtc_assets';
import { deviceType } from '../../Utils';
import { DEVICE_TYPES } from '../../Constants';

const MAX_VIDEO_DURATION_IN_SECONDS = 30;

const forbiddenFileTypes = [
    'application/pdf'
];

const FileUpload = (props) => {
    const {
        label,
        disabled,
        dispatchAction,
        toggleErrorAction,
        dispatch,
        index,
        value,
        setValue,
        hasError,
        elementId,
    } = props;
    let inputRef = useRef();

    const [fileSrc, setFileSrc]  = useState("dtc-logo-black.png");
    const [fileType, setFileType] = useState("image/png");
    const [video, setVideo] = useState(null);

    const displayUploadedFile = (inputFile) => {
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = () => {
                resolve(reader.result);
            }
            reader.readAsDataURL(inputFile)
        
        });
    }; 


    useEffect(async () => {
        if(fileType.includes('video')){
            setVideo(document.getElementById(elementId));
            if(video){
                video.addEventListener('loadedmetadata', (event) => {
                    if (video.readyState > 0 && video.duration > MAX_VIDEO_DURATION_IN_SECONDS){
                        dispatch({
                            payload: true,
                            actionType: toggleErrorAction,
                            index: index
                        });
                    } else {
                        dispatch({
                            payload: false,
                            actionType: toggleErrorAction,
                            index: index
                        });
                    }  
                });
            } else {
                dispatch({
                    payload: true,
                    actionType: toggleErrorAction,
                    index: index
                });
            }
        } else {
            if(forbiddenFileTypes.includes(fileType)){
                dispatch({
                    payload: true,
                    actionType: toggleErrorAction,
                    index: index
                });
            } else {
                dispatch({
                    payload: false,
                    actionType: toggleErrorAction,
                    index: index
                });
            }
        }

    }, [fileSrc, video]);

    const typeOfDevice = deviceType();

    useEffect( async () => {
        if(value){
            setFileType(value.type);
            setFileSrc(await displayUploadedFile(value));
        }
    },[value]);

    const handleUpload = async () => {
        const file = inputRef.current.files[0] || value;
        try{
            setFileType(file.type);
            setFileSrc(await displayUploadedFile(file));
            setValue(file);
            dispatch({
                payload: {
                    fileName: `${file.name}-${Date.now()}`,
                    lastModified: file.lastModified,
                    fileType: file.type,
                    hasError: false
                },
                actionType: dispatchAction,
                index: index
            })
        } catch(e) {
            console.warn(e.message);
        }
        if(!!setPageChangesMade){
            setPageChangesMade(true);
        }
    };

    return(
        <div className={'imageDivContainer'}>
            <div className={'imageDiv'}>   
                    { (hasError) ?
                        <img 
                            id={elementId} 
                            src={'file-error.png'} 
                            alt="image preview" 
                            className="imagePreview__image" 
                            autoplay="false" 
                        /> :
                        (fileType.includes("image")) ? 
                            <img 
                                src={fileSrc} 
                                id={elementId}
                                alt="image preview" 
                                className="imagePreview__image" 
                                autoplay="false" 
                            /> :
                            (fileType.includes("quicktime") && (typeOfDevice !== DEVICE_TYPES.desktop)) ?
                            <video 
                                width="330" 
                                height="443" 
                                className="imagePreview__video" 
                                preload
                                id={elementId}
                                style={{borderRadius: 10 + 'px'}}
                                controls
                                muted
                                poster={'video-thumbnail.png'}
                                src={fileSrc}
                            ></video> :
                            <video 
                                width="330" 
                                height="443" 
                                style={{borderRadius: 10 + 'px'}}
                                className="imagePreview__video" 
                                preload="metadata"
                                id={elementId}
                                controls
                                muted
                                playsinline
                            >
                                <source src={fileSrc} type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"'/>
                                <source src={fileSrc} type='video/ogg; codecs="theora, vorbis"'/>
                                <source src={fileSrc} type='video/webm; codecs="vp8, vorbis"'/>
                                <source src={fileSrc} type='video/mpeg'/>
                                Your browser does not support the video tag.
                            </video>  
                    
                    }
                    {
                        !fileSrc && 
                        <span className="imagePreview__default-display">
                            Image Preview
                        </span>   
                    }           
            </div>
            <input 
                disabled={disabled}
                id={'uploadedImaged'} 
                type="file" 
                className={'imageInputButton'} 
                ref={inputRef} 
                onLoad={handleUpload} 
                onChange={handleUpload}
            /> 
        </div>
    );
}

export default FileUpload;