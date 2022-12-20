import React, {useState, useEffect, useMemo} from "react";
import FileUpload from "./FileUpload";
import { UI_CONTEXTS } from "../../../Contexts";
import { PAGES } from "../../../Constants";
import "./fileCarousel.scss";
import * as RiIcons from 'react-icons/ri';
import * as AiIcons from 'react-icons/ai';
import * as BiIcons from 'react-icons/bi';
import * as MdIcons from 'react-icons/md';
import ButtonField from "../Button";
import { NULL_STRING_ALL_LOWERCASE } from "../../../Constants";
import { types } from "../../../reducers/journalReducer";

const FileCarousel = (props) => {

    const {
        filesMetaDataArray,
        dispatch,
        dispatchActionToAddFile,
        journalState,
        dispatchActionToDeleteFile,
        setChangesWereMade
    } = props;

    const [editMode, setEditMode] = useState(false);

    const toggleEditMode = async () => {
        let updatedEditMode = !editMode
        setEditMode(updatedEditMode);
        if(!updatedEditMode){
            let photos = journalState.bio.photos.filter((metaData, i) =>  metaData.fileName !== NULL_STRING_ALL_LOWERCASE);
            photos = photos.map(metaData => {
                return {
                    fileName: metaData.fileName,
                    lastModified: metaData.lastModified,
                    fileType: metaData.fileType,
                };
            });
            let result = await journalState.actor.updatePhotos(photos);
            result = result.ok;
            dispatch({
                actionType: types.SET_BIO,
                payload: result
            });
            result = await journalState.actor.submitFiles();
        } else {
            let result = await journalState.actor.clearUnsubmittedFiles();
        }
    };

    const addFile = () => {
        dispatch({
            actionType: dispatchActionToAddFile
        });
    };

    const deleteFile = async (fileIndex, fileMetaData) => {
        let fileIsUnsubmitted = fileMetaData.fileIsUnsubmitted;
        let fileName = fileMetaData.fileName;
        dispatch({
            actionType: dispatchActionToDeleteFile,
            fileIndex: fileIndex
        });
        if(fileIsUnsubmitted){
            let result = await journalState.actor.deleteUnsubmittedFile(fileName);
        } else {
            dispatch({
                actionType: types.SET_IS_LOADING,
                payload: true
            });
            let result = await journalState.actor.deleteSubmittedFile(fileName);
            if("ok" in result) result = await journalState.actor.updateBio({
                dob: journalState.bio.dob,
                pob: journalState.bio.pob,
                name: journalState.bio.name,
                dedications: journalState.bio.dedications,
                preface: journalState.bio.preface,
                photos: journalState.bio.photos
            });
            dispatch({
                actionType: types.SET_BIO,
                payload: result.ok
            });
            dispatch({
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

    return (
        <div className={'photoCarouselContainer'}>
            <div className={'photoCarouselDiv'} id={'photoCarouselDiv'}>
                {filesMetaDataArray.map((fileMetaData, fileIndex) => {
                    let forceDisplayDefaultFileSrc = (fileMetaData.fileName === NULL_STRING_ALL_LOWERCASE) ? true : false;
                    let displayRemoveButton = (editMode && !hasUnsubmittedFiles) || 
                    (editMode &&  hasUnsubmittedFiles && fileIndex === filesMetaDataArray.length-1);
                    return(
                        <div className = {'fileContainer'}>
                            <FileUpload
                                label={`file_${fileIndex}`}
                                elementId={`file_${fileIndex}`}
                                disabled={!editMode}
                                fileIndex={fileIndex}
                                key={fileIndex}
                                forceDisplayDefaultFileSrc={forceDisplayDefaultFileSrc}
                                context={UI_CONTEXTS.JOURNAL}
                                page={PAGES.JOURNAL_COVER}
                                setChangesWereMade={setChangesWereMade}
                            />
                            {displayRemoveButton && <ButtonField
                                Icon={RiIcons.RiDeleteBin2Line}
                                iconSize={25}
                                iconColor={'red'}
                                className={'removeFileDiv'}
                                onClick={() => deleteFile(fileIndex, fileMetaData)}
                                withBox={false}
                            />}
                        </div>
                    )
                })}
            </div>
            {editMode && lastFileIsPopulated && <ButtonField
                Icon={BiIcons.BiImageAdd}
                iconSize={25}
                className={'addFileDiv'}
                onClick={addFile}
                withBox={false}
            />}
            <ButtonField
                Icon={(editMode) ? MdIcons.MdOutlineCancelPresentation : RiIcons.RiImageEditFill}
                iconSize={25}
                className={'editFileCarousel'}
                onClick={toggleEditMode}
                withBox={false}
            />
        </div>
    )
};

export default FileCarousel;