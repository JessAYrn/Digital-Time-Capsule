import { JOURNAL_TABS,} from "../functionsAndConstants/Constants"

export const types = {
    SET_ENTIRE_REDUX_STATE: "SET_ENTIRE_REDUX_STATE",
    SET_JOURNAL: "SET_JOURNAL",
    SET_JOURNAL_TAB:"SET_JOURNAL_TAB",
    SET_NOTIFICATIONS:"SET_NOTIFICATIONS",
    SET_BIO: "SET_BIO",
    SET_DATA_HAS_BEEN_LOADED: "SET_DATA_HAS_BEEN_LOADED",
    SET_IS_AUTHENTICATED: "SET_IS_AUTHENTICATED",
    SET_IS_LOADING:"SET_IS_LOADING",
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
    REMOVE_COVER_PHOTO: "REMOVE_COVER_PHOTO",
    CHANGE_ENTRY_TITLE: "CHANGE_ENTRY_TITLE",
    CHANGE_FILE_METADATA: "CHANGE_FILE_METADATA",
    CHANGE_FILE_METADATA_JOURNAL_COVER_PAGE: "CHANGE_FILE_METADATA_JOURNAL_COVER_PAGE",
    CHANGE_FILE_LOAD_STATUS: "CHANGE_FILE_LOAD_STATUS",
    CHANGE_FILE_LOAD_STATUS_JOURNAL_COVER_PAGE: "CHANGE_FILE_LOAD_STATUS_JOURNAL_COVER_PAGE",
    CHANGE_PAGE_IS_OPEN: "CHANGE_PAGE_IS_OPEN",
    REMOVE_JOURNAL_ENTRY_FILE: "REMOVE_JOURNAL_ENTRY_FILE",
}



export const initialState = {
    dataHasBeenLoaded: undefined,
    journalPageTab: JOURNAL_TABS.diaryTab,
    bio: {
        name: '',
        dob: [],
        pob: '',
        dedications: '',
        preface:'',
        email: '',
        photos: []
    },
    journal: [],
    notifications:[],
    isAuthenticated: false,
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

    const {actionType, payload, index, fileIndex, blockReload } = action;
    let updatedFileMetaData;
    let updatedJournalPage;
    let updatedFilesMetaDataArry;
    let updatedPhotos;

    switch (actionType){
        case types.SET_ENTIRE_REDUX_STATE:
            state = payload;
            return {
                ...state
            }
        case types.SET_JOURNAL:
            state.journal = payload;
            return {
                ...state
            }
        case types.SET_IS_AUTHENTICATED:
            state.isAuthenticated = payload;
            return {
                ...state
            }
        case types.SET_IS_LOADING:
            state.isLoading = payload;
            return {
                ...state
            }
        case types.SET_JOURNAL_TAB:
            state.journalPageTab=payload;
            return{
                ...state
            }
       
        case types.SET_NOTIFICATIONS:
        state.notifications = payload;

        return {
            ...state
        }
        case types.SET_BIO:
            state.bio = payload;
            return {
                ...state
            }
        case types.SET_DATA_HAS_BEEN_LOADED:
        state.dataHasBeenLoaded = payload
        return {
            ...state
        }
        case types.CHANGE_ENTRY_TITLE:
            updatedJournalPage = {
                ... state.journal[index],
                title: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.CHANGE_PAGE_IS_OPEN:
        updatedJournalPage = {
            ... state.journal[index],
            isOpen: payload
        }
        state.journal[index] = updatedJournalPage;
        return {
            ...state
        }
        case types.CHANGE_LOCATION:
            updatedJournalPage = {
                ... state.journal[index],
                location: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.ADD_JOURNAL_ENTRY_FILE:
            updatedFilesMetaDataArry = [...state.journal[index].filesMetaData];
            updatedFilesMetaDataArry.push(defaultFileMetaData);
            state.journal[index].filesMetaData = updatedFilesMetaDataArry;
            return {
                ...state
            }
        case types.REMOVE_JOURNAL_ENTRY_FILE:
            updatedFilesMetaDataArry = [...state.journal[index].filesMetaData];
            updatedFilesMetaDataArry.pop();
            state.journal[index].filesMetaData = updatedFilesMetaDataArry;
            return {
                ...state
            }
        case types.CHANGE_FILE_METADATA:
            updatedFileMetaData = {
                ...state.journal[index].filesMetaData[fileIndex],
                fileName: payload.fileName,
                lastModified: payload.lastModified,
                fileType: payload.fileType,
                file: payload.file
            };
            updatedFilesMetaDataArry = [...state.journal[index].filesMetaData];
            updatedFilesMetaDataArry[fileIndex] = updatedFileMetaData;
            state.journal[index].filesMetaData = updatedFilesMetaDataArry;
            return {
                ...state
            }
        case types.CHANGE_FILE_METADATA_JOURNAL_COVER_PAGE:
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
        case types.CHANGE_FILE_LOAD_STATUS:
            updatedFileMetaData = {
                ...state.journal[index].filesMetaData[fileIndex],
                isLoading: payload,
            };
            updatedFilesMetaDataArry = blockReload ? state.journal[index].filesMetaData : [...state.journal[index].filesMetaData];
            updatedFilesMetaDataArry[fileIndex] = updatedFileMetaData;
            state.journal[index].filesMetaData = updatedFilesMetaDataArry;
            return {
                ...state
            }
        case types.CHANGE_FILE_LOAD_STATUS_JOURNAL_COVER_PAGE:
            updatedFileMetaData = {
                ...state.bio.photos[fileIndex],
                isLoading: payload,
            };
            updatedFilesMetaDataArry = blockReload ? state.bio.photos : [...state.bio.photos];
            updatedFilesMetaDataArry[fileIndex] = updatedFileMetaData;
            state.bio.photos = updatedFilesMetaDataArry;
            return {
                ...state
            } 
        case types.CHANGE_TEXT:
            updatedJournalPage = {
                ... state.journal[index],
                text: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.CHANGE_UNLOCK_TIME:
            updatedJournalPage = {
                ... state.journal[index],
                timeOfUnlock: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.CHANGE_NAME:
            state.bio = {
                ...state.bio,
                name: payload
            }
            return {
                ...state
            }
        case types.ADD_COVER_PHOTO:
            state.bio.photos.push(defaultFileMetaData);
            state.bio.photos = [...state.bio.photos];
            return {
                ...state
            }
        case types.REMOVE_COVER_PHOTO:
            updatedPhotos = state.bio.photos.filter((metaData, i) =>  i !== fileIndex);
            state.bio.photos =  updatedPhotos
            return {
                ...state
            }
        case types.CHANGE_DOB:
            state.bio = {
                ...state.bio,
                dob: payload
            }
            return {
                ...state
            }
        case types.CHANGE_POB:
            state.bio = {
                ...state.bio,
                pob: payload
            }
            return {
                ...state
            }
        case types.CHANGE_PREFACE:
            state.bio = {
                ...state.bio,
                preface: payload
            }
            return {
                ...state
            }
        case types.CHANGE_DEDICATIONS:
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