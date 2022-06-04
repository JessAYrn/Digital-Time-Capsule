import React, {useRef, useState, useEffect, useMemo} from 'react';
import "./FileUpload.scss";
import { useEffect } from '../../../../../dist/dtc_assets';
import { deviceType, getFileArrayBuffer } from '../../Utils';
import { DEVICE_TYPES, MAX_DURATION_OF_VIDEO_IN_SECONDS } from '../../Constants';
import { MODALS_TYPES } from '../../Constants';
import { round2Decimals } from '../../Utils';
import { MAX_NUMBER_OF_BYTES } from '../../Constants';

const forbiddenFileTypes = [
    'application/pdf'
];

const FileUpload = (props) => {
    const {
        label,
        disabled,
        dispatchAction,
        dispatch,
        setModalStatus,
        index,
        value,
        setValue,
        elementId,
        setChangesWereMade
    } = props;
    let inputRef = useRef();

    const [fileSrc, setFileSrc]  = useState("dtc-logo-black.png");
    const [fileType, setFileType] = useState("image/png");
    var uploadedFile;
    var obUrl;
    
    const typeOfDevice = deviceType();

    useEffect( async () => {
        if(value){
            processAndDisplayFile(value);
        }
    },[value]);

    const getDuration = async (file) => {
        obUrl = URL.createObjectURL(file);
       
        return new Promise((resolve) => {
          const audio = document.createElement("audio");
          audio.muted = true;
          const source = document.createElement("source");
          source.src = obUrl; //--> blob URL
          audio.preload= "metadata";
          audio.appendChild(source);
          audio.onloadedmetadata = function(){
             resolve(audio.duration)
          };
        });
       }

    const updateFileMetadataInStore = (file) => {
        dispatch({
            payload: {
                fileName: `${file.name}-${Date.now()}`,
                lastModified: file.lastModified,
                fileType: file.type
            },
            actionType: dispatchAction,
            index: index
        })
        if(!!setChangesWereMade){
            setChangesWereMade(true);
        } 
    };

    const processAndDisplayFile = async (file) => {
        setFileType(file.type);
        let fileAsBuffer = await getFileArrayBuffer(file);
        let videoBlob = new Blob([new Uint8Array(fileAsBuffer)], { type: file.type });
        let url = window.URL.createObjectURL(videoBlob);
        setFileSrc(url);
    };

    const handleUpload = async () => {
        uploadedFile = inputRef.current.files[0] || value;
        
        //check file extension for audio/video type
        //this if statement will ultimately end up triggering the 
        //canPlayThrough() function.
        if(uploadedFile.name.match(/\.(avi|mp3|mp4|mpeg|ogg|webm|mov|MOV)$/i)){
            const duration = await getDuration(uploadedFile);
            if(duration > MAX_DURATION_OF_VIDEO_IN_SECONDS || forbiddenFileTypes.includes(uploadedFile.type)){
                setFileSrc("dtc-logo-black.png");
                setFileType("image/png");
                setModalStatus({
                    show: true, 
                    which: MODALS_TYPES.fileHasError,
                    fileSize : file.size
                });
                URL.revokeObjectURL(obUrl);
            } else {
                processAndDisplayFile(uploadedFile);
                updateFileMetadataInStore(uploadedFile);
                setValue(uploadedFile);
            }
        } else {
            //triggers useEffect which displays the video
            processAndDisplayFile(uploadedFile);
            updateFileMetadataInStore(uploadedFile);
            setValue(uploadedFile);
        }
        
    };

    return(
        <div className={'imageDivContainer'}>
            <div className={'imageDiv'}>   
                    { 
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
            { !disabled &&
                <input 
                    disabled={disabled}
                    id={`uploadedImaged__${elementId}`} 
                    type="file" 
                    className={'imageInputButton'} 
                    ref={inputRef} 
                    onLoad={handleUpload} 
                    onChange={handleUpload}
                /> 
            }
        </div>
    );
}

export default FileUpload;