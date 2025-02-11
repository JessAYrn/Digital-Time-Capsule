import { USER_TABS,} from "../functionsAndConstants/Constants"

export const userTypes = {
    SET_ENTIRE_REDUX_STATE: "SET_ENTIRE_REDUX_STATE",
    SET_USER_DATA: "SET_USER_DATA",
    SET_USER_TAB:"SET_USER_TAB",
    SET_NOTIFICATIONS:"SET_NOTIFICATIONS",
    SET_BIO: "SET_BIO",
    SET_DATA_HAS_BEEN_LOADED: "SET_DATA_HAS_BEEN_LOADED",
    SET_IS_LOADING:"SET_IS_LOADING",
    SET_USER_META_DATA: "SET_USER_META_DATA",
    CHANGE_LOCATION: "CHANGE_LOCATION",
    CHANGE_TEXT: "CHANGE_TEXT",
    CHANGE_UNLOCK_TIME: "CHANGE_UNLOCK_TIME",
    ADD_JOURNAL_ENTRY_FILE: "ADD_JOURNAL_ENTRY_FILE",
    CHANGE_DOB: "CHANGE_DOB",
    CHANGE_POB: "CHANGE_POB",
    CHANGE_PREFACE: "CHANGE_PREFACE",
    CHANGE_DEDICATIONS: "CHANGE_DEDICATIONS",
    CHANGE_NAME: "CHANGE_NAME",
    ADD_COVER_PHOTO: "ADD_COVER_PHOTO",
    MARK_COVER_PHOTO_AS_DELETED: "MARK_COVER_PHOTO_AS_DELETED",
    CHANGE_ENTRY_TITLE: "CHANGE_ENTRY_TITLE",
    CHANGE_FILE_METADATA: "CHANGE_FILE_METADATA",
    CHANGE_FILE_METADATA_JOURNAL_COVER_PAGE: "CHANGE_FILE_METADATA_JOURNAL_COVER_PAGE",
    CHANGE_FILE_LOAD_STATUS: "CHANGE_FILE_LOAD_STATUS",
    CHANGE_FILE_LOAD_STATUS_JOURNAL_COVER_PAGE: "CHANGE_FILE_LOAD_STATUS_JOURNAL_COVER_PAGE",
    CHANGE_PAGE_IS_OPEN: "CHANGE_PAGE_IS_OPEN",
    MARK_JOURNAL_ENTRY_AS_DELETED: "MARK_JOURNAL_ENTRY_AS_DELETED",
}



export const initialState = {
    dataHasBeenLoaded: undefined,
    userPageTab: USER_TABS.diaryTab,
    bio: {
        name: '',
        dob: [],
        pob: '',
        dedications: '',
        preface:'',
        email: '',
        photos: []
    },
    userMetaData: {
        userPrincipal: "",
        cyclesBalance: 0,
        rootCanisterPrincipal: ""
    },
    userData: [],
    notifications:[],
    isLoading: false,
};
export const defaultFileMetaData = {
    fileName: null,
    lastModified: 0,
    fileType: null,
    file: null,
    isLoading: false,
    error: false,
};

const changeValue = (state = initialState, action) => {

    const {actionType, payload, index, fileIndex } = action;
    let updatedFileMetaData;
    let updatedJournalPage;
    let updatedFilesMetaDataArry;
    let updatedPhotos;

    switch (actionType){
        case userTypes.SET_ENTIRE_REDUX_STATE:
            state = payload;
            return {
                ...state
            }
        case userTypes.SET_USER_DATA:
            state.userData = payload;
            return {
                ...state
            }
        case userTypes.SET_IS_LOADING:
            state.isLoading = payload;
            return {
                ...state
            }
        case userTypes.SET_USER_TAB:
            state.userPageTab=payload;
            return{
                ...state
            }
       
        case userTypes.SET_NOTIFICATIONS:
        state.notifications = payload;

        return {
            ...state
        }
        case userTypes.SET_BIO:
            state.bio = payload;
            return {
                ...state
            }
        case userTypes.SET_DATA_HAS_BEEN_LOADED:
        state.dataHasBeenLoaded = payload
        return {
            ...state
        }
        case userTypes.SET_USER_META_DATA:
        state.userMetaData = payload;
        return {
            ...state
        }
        case userTypes.CHANGE_ENTRY_TITLE:
            updatedJournalPage = {
                ... state.userData[index],
                title: payload
            }
            state.userData[index] = updatedJournalPage;
            return {
                ...state
            }
        case userTypes.CHANGE_PAGE_IS_OPEN:
        updatedJournalPage = {
            ... state.userData[index],
            isOpen: payload
        }
        state.userData[index] = updatedJournalPage;
        return {
            ...state
        }
        case userTypes.CHANGE_LOCATION:
            updatedJournalPage = {
                ... state.userData[index],
                location: payload
            }
            state.userData[index] = updatedJournalPage;
            return {
                ...state
            }
        case userTypes.ADD_JOURNAL_ENTRY_FILE:
            updatedFilesMetaDataArry = [...state.userData[index].filesMetaData];
            updatedFilesMetaDataArry.push(defaultFileMetaData);
            state.userData[index].filesMetaData = updatedFilesMetaDataArry;
            return {
                ...state
            }
        case userTypes.MARK_JOURNAL_ENTRY_AS_DELETED:
            updatedFilesMetaDataArry = state.userData[index].filesMetaData.map((metaData, i) => {
                if(i === fileIndex) return null;
                return metaData;
            });
            state.userData[index].filesMetaData = updatedFilesMetaDataArry;
            return {
                ...state
            }
        case userTypes.CHANGE_FILE_METADATA:
            updatedFileMetaData = {
                ...state.userData[index].filesMetaData[fileIndex],
                fileName: payload.fileName,
                lastModified: payload.lastModified,
                fileType: payload.fileType,
                file: payload.file
            };
            updatedFilesMetaDataArry = [...state.userData[index].filesMetaData];
            updatedFilesMetaDataArry[fileIndex] = updatedFileMetaData;
            state.userData[index].filesMetaData = updatedFilesMetaDataArry;
            return {
                ...state
            }
        case userTypes.CHANGE_FILE_METADATA_JOURNAL_COVER_PAGE:
            updatedFileMetaData = {
                ...state.bio.photos[fileIndex],
                fileName: payload.fileName,
                lastModified: payload.lastModified,
                fileType: payload.fileType,
                file: payload.file
            };
            updatedFilesMetaDataArry = [...state.bio.photos];
            updatedFilesMetaDataArry[fileIndex] = updatedFileMetaData;
            state.bio.photos = updatedFilesMetaDataArry;
            return {
                ...state
            }
        case userTypes.CHANGE_FILE_LOAD_STATUS:
            updatedFileMetaData = {
                ...state.userData[index].filesMetaData[fileIndex],
                isLoading: payload,
            };
            updatedFilesMetaDataArry = [...state.userData[index].filesMetaData];
            updatedFilesMetaDataArry[fileIndex] = updatedFileMetaData;
            state.userData[index].filesMetaData = updatedFilesMetaDataArry;
            return {
                ...state
            }
        case userTypes.CHANGE_FILE_LOAD_STATUS_JOURNAL_COVER_PAGE:
            updatedFileMetaData = { ...state.bio.photos[fileIndex], isLoading: payload };
            updatedFilesMetaDataArry = [...state.bio.photos];
            updatedFilesMetaDataArry[fileIndex] = updatedFileMetaData;
            state.bio.photos = updatedFilesMetaDataArry;
            return {
                ...state
            } 
        case userTypes.CHANGE_TEXT:
            updatedJournalPage = {
                ... state.userData[index],
                text: payload
            }
            state.userData[index] = updatedJournalPage;
            return {
                ...state
            }
        case userTypes.CHANGE_UNLOCK_TIME:
            updatedJournalPage = {
                ... state.userData[index],
                timeOfUnlock: payload
            }
            state.userData[index] = updatedJournalPage;
            return {
                ...state
            }
        case userTypes.CHANGE_NAME:
            state.bio = {
                ...state.bio,
                name: payload
            }
            return {
                ...state
            }
        case userTypes.ADD_COVER_PHOTO:
            state.bio.photos.push(defaultFileMetaData);
            state.bio.photos = [...state.bio.photos];
            return {
                ...state
            }
        case userTypes.MARK_COVER_PHOTO_AS_DELETED:
            updatedPhotos = state.bio.photos.map((metaData, i) =>  {
                if(i === fileIndex) return null;
                return metaData
            });
            state.bio.photos =  updatedPhotos
            return {
                ...state
            }
        case userTypes.CHANGE_DOB:
            state.bio = {
                ...state.bio,
                dob: payload
            }
            return {
                ...state
            }
        case userTypes.CHANGE_POB:
            state.bio = {
                ...state.bio,
                pob: payload
            }
            return {
                ...state
            }
        case userTypes.CHANGE_PREFACE:
            state.bio = {
                ...state.bio,
                preface: payload
            }
            return {
                ...state
            }
        case userTypes.CHANGE_DEDICATIONS:
        state.bio = {
            ...state.bio,
            dedications: payload
        }
        return {
            ...state
        }
        default:
            return {
                 ...state
            }

    }

}

export default changeValue;