import { JOURNAL_TABS, MODALS_TYPES, NULL_STRING_ALL_LOWERCASE, NULL_STRING_CAPITALIZED} from "../functionsAndConstants/Constants"
import { getDateAsString } from "../functionsAndConstants/Utils";

export const types = {
    SET_ENTIRE_REDUX_STATE: "SET_ENTIRE_REDUX_STATE",
    SET_AUTHENTICATE_FUNCTION_CALL_COUNT: "SET_AUTHENTICATE_FUNCTION_CALL_COUNT",
    SET_CREATE_ACTOR_FUNCTION_CALL_COUNT: "SET_CREATE_ACTOR_FUNCTION_CALL_COUNT",
    SET_IS_LOGGING_IN: "SET_IS_LOGGING_IN",
    SET_JOURNAL: "SET_JOURNAL",
    SET_JOURNAL_TAB:"SET_JOURNAL_TAB",
    SET_NOTIFICATIONS:"SET_NOTIFICATIONS",
    SET_BIO: "SET_BIO",
    SET_METADATA: "SET_METADATA",
    SET_MODAL_STATUS: "SET_MODAL_STATUS",
    SET_DATA_HAS_BEEN_LOADED: "SET_DATA_HAS_BEEN_LOADED",
    SET_IS_AUTHENTICATED: "SET_IS_AUTHENTICATED",
    SET_IS_LOADING:"SET_IS_LOADING",
    CHANGE_DRAFT: "CHANGE_DRAFT",
    CHANGE_DATE: "CHANGE_DATE",
    CHANGE_LOCATION: "CHANGE_LOCATION",
    CHANGE_CAPSULED: "CHANGE_CAPSULED",
    CHANGE_ENTRY: "CHANGE_ENTRY",
    CHANGE_UNLOCK_TIME: "CHANGE_UNLOCK_TIME",
    ADD_JOURNAL_PAGE: "ADD_JOURNAL_PAGE",
    ADD_JOURNAL_ENTRY_FILE: "ADD_JOURNAL_ENTRY_FILE",
    CHANGE_DOB: "CHANGE_DOB",
    CHANGE_POB: "CHANGE_POB",
    CHANGE_PREFACE: "CHANGE_PREFACE",
    CHANGE_DEDICATIONS: "CHANGE_DEDICATIONS",
    CHANGE_NAME: "CHANGE_NAME",
    ADD_COVER_PHOTO: "ADD_COVER_PHOTO",
    REMOVE_COVER_PHOTO: "REMOVE_COVER_PHOTO",
    CHANGE_ENTRY_TITLE: "CHANGE_ENTRY_TITLE",
    CHANGE_RECIPIENT_EMAIL_ONE: "CHANGE_RECIPIENT_EMAIL_ONE",
    CHANGE_RECIPIENT_EMAIL_TWO: "CHANGE_RECIPIENT_EMAIL_TWO",
    CHANGE_RECIPIENT_EMAIL_THREE: "CHANGE_RECIPIENT_EMAIL_THREE",
    CHANGE_PAGE_IS_DISABLED_STATUS: "CHANGE_PAGE_IS_DISABLED_STATUS",
    CHANGE_FILE_METADATA: "CHANGE_FILE_METADATA",
    SET_FILE: "SET_FILE",
    CHANGE_FILE_METADATA_JOURNAL_COVER_PAGE: "CHANGE_FILE_METADATA_JOURNAL_COVER_PAGE",
    SET_FILE_JOURNAL_COVER_PAGE: "CHANGE_FILE_JOURNAL_COVER_PAGE",
    CHANGE_FILE_ERROR_STATUS: "CHANGE_FILE_ERROR_STATUS",
    CHANGE_FILE_LOAD_STATUS: "CHANGE_FILE_LOAD_STATUS",
    CHANGE_FILE_LOAD_STATUS_JOURNAL_COVER_PAGE: "CHANGE_FILE_LOAD_STATUS_JOURNAL_COVER_PAGE",
    CHANGE_PAGE_IS_OPEN: "CHANGE_PAGE_IS_OPEN",
    REMOVE_UNSUBMITTED_PAGE: "REMOVE_UNSUBMITTED_PAGE",
    REMOVE_JOURNAL_ENTRY_FILE: "REMOVE_JOURNAL_ENTRY_FILE",
}



export const initialState = {
    authenticateFunctionCallCount: 0,
    createActorFunctionCallCount: 0,
    dataHasBeenLoaded: undefined,
    journalCount: 0,
    journalPageTab:JOURNAL_TABS.diaryTab,
    canisterData: {
        profilesMetaData: [],
        journalCount: 0,
        backEndCyclesBurnRatePerDay: 1,
        backEndPrincipal: NULL_STRING_CAPITALIZED,
        frontEndPrincipal: NULL_STRING_CAPITALIZED,
        lastRecordedBackEndCyclesBalance: 1,
        currentCyclesBalance_backend: 1,
        currentCyclesBalance_frontend: 1,
        nftOwner: NULL_STRING_CAPITALIZED,
        isOwner: false,
        nftId: NULL_STRING_CAPITALIZED,
        supportMode: false,
        cycleSaveMode: false,
        acceptingRequests: false,
        requestsForApproval: []
    },
    isLoggingIn: false,
    bio: {
        name: '',
        dob: '',
        pob: '',
        dedications: '',
        preface:'',
        email: '',
        photos: []
    },
    journal: [],
    notifications:[],
    reloadStatuses: {
        walletData: true,
        journalData: true,
        canisterData: true
    },
    isAuthenticated: false,
    isLoading: false,
    modalStatus: {
        show: false, 
        which: MODALS_TYPES.onSubmit
    }
};
const defaultFileMetaData = {
    fileName: NULL_STRING_ALL_LOWERCASE,
    lastModified: 0,
    fileType: NULL_STRING_ALL_LOWERCASE,
    file: null,
    isLoading: false,
    error: false,
    fileIsUnsubmitted: true
};

const freshPage = {
    date: getDateAsString(Date.now()),
    title: '',
    location: '',
    entry: '',
    unlockTime: getDateAsString(Date.now()),
    emailOne: '',
    emailTwo: '',
    emailThree: '', 
    draft: true,
    isDisabled: false,
    isOpen: true,
    capsuled: false,
    filesMetaData: []
}

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
        case types.SET_AUTHENTICATE_FUNCTION_CALL_COUNT:
        state.authenticateFunctionCallCount = payload;
        return {
            ...state
        }
        case types.SET_CREATE_ACTOR_FUNCTION_CALL_COUNT:
        state.createActorFunctionCallCount = payload;
        return {
            ...state
        }
        case types.SET_IS_LOGGING_IN:
        state.isLoggingIn = payload;
        return {
            ...state
        }
        case types.SET_MODAL_STATUS:
            state.modalStatus = payload;
            return {
                ...state
            }
        case types.SET_JOURNAL:
            state.journal = payload;
            return {
                ...state
            }
        case types.REMOVE_UNSUBMITTED_PAGE:
            state.journal.pop();
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
            while(state.bio.photos.length < 3) state.bio.photos.push(defaultFileMetaData);
            state.bio.photos
            return {
                ...state
            }
        case types.SET_METADATA:
        state.metaData = payload;
        return {
            ...state
        }
        case types.SET_DATA_HAS_BEEN_LOADED:
        state.dataHasBeenLoaded = payload
        return {
            ...state
        }
        case types.CHANGE_DATE:
            updatedJournalPage = {
                ... state.journal[index],
                date: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.CHANGE_PAGE_IS_DISABLED_STATUS:
        updatedJournalPage = {
            ... state.journal[index],
            isDisabled: payload
        }
        state.journal[index] = updatedJournalPage;
        return {
            ...state
        }
        case types.CHANGE_DRAFT:
        updatedJournalPage = {
            ... state.journal[index],
            draft: payload
        }
        state.journal[index] = updatedJournalPage;
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
        case types.CHANGE_RECIPIENT_EMAIL_ONE:
            updatedJournalPage = {
                ... state.journal[index],
                emailOne: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.CHANGE_RECIPIENT_EMAIL_TWO:
            updatedJournalPage = {
                ... state.journal[index],
                emailTwo: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.CHANGE_RECIPIENT_EMAIL_THREE:
            updatedJournalPage = {
                ... state.journal[index],
                emailThree: payload
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
        case types.CHANGE_CAPSULED:
            updatedJournalPage = {
                ... state.journal[index],
                capsuled: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.ADD_JOURNAL_ENTRY_FILE:
            updatedFilesMetaDataArry = [...state.journal[index].filesMetaData];
            updatedFilesMetaDataArry.push(defaultFileMetaData);
            while(updatedFilesMetaDataArry.length < 3) updatedFilesMetaDataArry.push(defaultFileMetaData);
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
        case types.SET_FILE:
            updatedFileMetaData = {
                ...state.journal[index].filesMetaData[fileIndex],
                file: payload
            };
            updatedFilesMetaDataArry =  blockReload ? state.journal[index].filesMetaData : [...state.journal[index].filesMetaData];
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
        case types.SET_FILE_JOURNAL_COVER_PAGE:
            updatedFileMetaData = {
                ...state.bio.photos[fileIndex],
                file: payload
            };
            updatedFilesMetaDataArry = blockReload ? state.bio.photos : [...state.bio.photos];
            updatedFilesMetaDataArry[fileIndex] = updatedFileMetaData;
            state.bio.photos = updatedFilesMetaDataArry;
            return {
                ...state
            }
        case types.CHANGE_FILE_ERROR_STATUS:
            updatedFileMetaData = {
                ...state.journal[index].filesMetaData[fileIndex],
                error: payload,
            };
            updatedFilesMetaDataArry = [...state.journal[index].filesMetaData];
            updatedFilesMetaDataArry[fileIndex] = updatedFileMetaData;
            state.journal[index].filesMetaData = updatedFilesMetaDataArry;
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
        case types.CHANGE_ENTRY:
            updatedJournalPage = {
                ... state.journal[index],
                entry: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.CHANGE_UNLOCK_TIME:
            updatedJournalPage = {
                ... state.journal[index],
                unlockTime: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.ADD_JOURNAL_PAGE:
            state.journal.push({
                ...freshPage,
                filesMetaData : []
            });
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
            if(!updatedPhotos.length) updatedPhotos.push(defaultFileMetaData);
            state.bio = {
                ...state.bio,
                photos: [...updatedPhotos]
            }
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