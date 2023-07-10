import React, {useState, useEffect, useMemo} from "react";
import FileUpload from "./FileUpload";
import { UI_CONTEXTS } from "../../../functionsAndConstants/Contexts";
import "./fileCarousel.scss";
import * as RiIcons from 'react-icons/ri';
import * as BiIcons from 'react-icons/bi';
import * as MdIcons from 'react-icons/md';
import ButtonField from "../Button";
import { NULL_STRING_ALL_LOWERCASE } from "../../../functionsAndConstants/Constants";
import { types } from "../../../reducers/journalReducer";

const FileCarousel = (props) => {

    const {
        filesMetaDataArray,
        journalDispatch,
        actorDispatch,
        dispatchActionToAddFile,
        journalState,
        actorState,
        dispatchActionToDeleteFile,
        setChangesWereMade,
        classNameMod,
        editModeDefault,
        disabled,
        index,
        dispatchActionToChangeFileMetaData,
        dispatchActionToChangeFileLoadStatus,
        videoHeight,
        withoutButtons
    } = props;

    const [editMode, setEditMode] = useState(editModeDefault);

    const toggleEditMode = async () => {
        let updatedEditMode = !editMode
        setEditMode(updatedEditMode);
        if(!updatedEditMode){
            journalDispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let photos = journalState.bio.photos.filter((metaData, i) =>  metaData.fileName !== NULL_STRING_ALL_LOWERCASE);
            photos = photos.map(metaData => {
                return {
                    fileName: metaData.fileName,
                    lastModified: metaData.lastModified,
                    fileType: metaData.fileType,
                };
            });
            let result = await actorState.backendActor.updatePhotos(photos);
            result = result.ok;
            journalDispatch({
                actionType: types.SET_BIO,
                payload: result
            });
            result = await actorState.backendActor.submitFiles();
            journalDispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });
        } else {
            let result = await actorState.backendActor.clearUnsubmittedFiles();
        }
    };

    const addFile = () => {
        journalDispatch({
            actionType: dispatchActionToAddFile
        });
    };

    const deleteFile = async (fileIndex, fileMetaData) => {
        let fileIsUnsubmitted = fileMetaData.fileIsUnsubmitted;
        let fileName = fileMetaData.fileName;
        journalDispatch({
            actionType: dispatchActionToDeleteFile,
            index: index,
            fileIndex: fileIndex
        });
        if(fileIsUnsubmitted){
            let result = await actorState.backendActor.deleteUnsubmittedFile(fileName);
        } else {
            journalDispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let result = await actorState.backendActor.deleteSubmittedFile(fileName);
            if("ok" in result) result = await actorState.backendActor.updateBio({
                dob: journalState.bio.dob,
                pob: journalState.bio.pob,
                name: journalState.bio.name,
                dedications: journalState.bio.dedications,
                preface: journalState.bio.preface,
                photos: journalState.bio.photos
            });
            journalDispatch({
                actionType: types.SET_BIO,
                payload: result.ok
            });
            journalDispatch({
                actionType: types.SET_IS_LOADING,
                payload: false
            });
        };
    };

    let hasUnsubmittedFiles = useMemo(() => {
        let unsubmittedFile = false;
        filesMetaDataArray.forEach(file => {
            if(file.fileIsUnsubmitted) unsubmittedFile = true;
        });
        return unsubmittedFile;
    },[filesMetaDataArray])

    useEffect(() => {
        let carouselDiv = document.getElementById('photoCarouselDiv');
        carouselDiv.scrollLeft = carouselDiv.scrollWidth;
    },[filesMetaDataArray]);
    let lastFileIsPopulated = filesMetaDataArray[filesMetaDataArray.length-1].fileName !== NULL_STRING_ALL_LOWERCASE;
    let maxNumberOfFilesReached = filesMetaDataArray.length >= 4;

    return (
        <div className={'photoCarouselContainer'}>
            <div className={'photoCarouselDiv'} id={'photoCarouselDiv'}>
                {filesMetaDataArray.map((fileMetaData, fileIndex) => {
                    let forceDisplayDefaultFileSrc = (fileMetaData.fileName === NULL_STRING_ALL_LOWERCASE) ? true : false;
                    let displayRemoveButton = (editMode && !hasUnsubmittedFiles) || 
                    (editMode &&  hasUnsubmittedFiles && fileIndex === filesMetaDataArray.length-1);
                    return(
                        <div className = {'fileContainer'}>
                            {displayRemoveButton && !disabled && <ButtonField
                                Icon={RiIcons.RiDeleteBin2Line}
                                iconSize={25}
                                iconColor={'red'}
                                className={'removeFileDiv'}
                                onClick={() => deleteFile(fileIndex, fileMetaData)}
                                withBox={false}
                            />}
                            <FileUpload
                                label={`file_${fileIndex}`}
                                elementId={`file_${fileIndex}`}
                                disabled={!editMode || disabled}
                                index={index}
                                fileIndex={fileIndex}
                                key={fileIndex}
                                forceDisplayDefaultFileSrc={forceDisplayDefaultFileSrc}
                                context={UI_CONTEXTS.JOURNAL}
                                setChangesWereMade={setChangesWereMade}
                                classNameMod={classNameMod}
                                dispatch={journalDispatch}
                                dispatchActionToChangeFileMetaData={dispatchActionToChangeFileMetaData}
                                dispatchActionToChangeFileLoadStatus={dispatchActionToChangeFileLoadStatus}
                                fileData={fileMetaData}
                                videoHeight={videoHeight}
                            />
                        </div>
                    )
                })}
            </div>
            {editMode && lastFileIsPopulated && !maxNumberOfFilesReached && !withoutButtons &&
                <ButtonField
                Icon={BiIcons.BiImageAdd}
                iconSize={25}
                iconColor={'white'}
                className={'addFileDiv'}
                onClick={addFile}
            />}
            {!withoutButtons && <ButtonField
                Icon={(editMode) ? MdIcons.MdOutlineCancelPresentation : RiIcons.RiImageEditFill}
                iconSize={25}
                iconColor={'white'}
                className={'editFileCarousel'}
                onClick={toggleEditMode}
            />}
        </div>
    )
};

export default FileCarousel;