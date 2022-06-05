import { dayInNanoSeconds, monthInDays } from "../Constants"


export const types = {
    SET_JOURNAL: "SET_JOURNAL",
    SET_BIO: "SET_BIO",
    SET_METADATA: "SET_METADATA",
    SET_WALLET_DATA: "SET_WALLET_DATA",
    SET_NFT_DATA: "SET_NFT_DATA",
    CHANGE_DRAFT: "CHANGE_DRAFT",
    CHANGE_DATE: "CHANGE_DATE",
    CHANGE_LOCATION: "CHANGE_LOCATION",
    CHANGE_ENTRY: "CHANGE_ENTRY",
    CHANGE_LOCK_TIME: "CHANGE_LOCK_TIME",
    ADD_JOURNAL_PAGE: "ADD_JOURNAL_PAGE",
    CHANGE_DOB: "CHANGE_DOB",
    CHANGE_POB: "CHANGE_POB",
    CHANGE_PREFACE: "CHANGE_PREFACE",
    CHANGE_DEDICATIONS: "CHANGE_DEDICATIONS",
    CHANGE_NAME: "CHANGE_NAME",
    CHANGE_ENTRY_TITLE: "CHANGE_ENTRY_TITLE",
    CHANGE_EMAIL: "CHANGE_EMAIL",
    CHANGE_USERNAME: "CHANGE_USERNAME",
    CHANGE_RECIPIENT_EMAIL_ONE: "CHANGE_RECIPIENT_EMAIL_ONE",
    CHANGE_RECIPIENT_EMAIL_TWO: "CHANGE_RECIPIENT_EMAIL_TWO",
    CHANGE_RECIPIENT_EMAIL_THREE: "CHANGE_RECIPIENT_EMAIL_THREE",
    CHANGE_FILE1_METADATA: "CHANGE_FILE1_METADATA",
    CHANGE_FILE2_METADATA: "CHANGE_FILE2_METADATA"

}

export const initialState = {
    metaData: {
        email: [],
        userName: []
    },
    walletData: {
        balance:'',
        address:''
    },
    nftData:[
        { 
            nftCollectionKey: 0,
            tokenId: 0, 
            tokenMetadataArraySize: 0
        }
    ],
    bio: {
        name: '',
        dob: '',
        pob: '',
        dedications: '',
        preface:'',
        email: ''
    },
    journal: [
        {
            date: '',
            title: 'Loading...',
            location: 'Loading...',
            entry: 'Loading...',
            lockTime: '3',
            unlockTime: `${Date.now() * 1000000}`,
            emailOne: '',
            emailTwo: '',
            emailThree: '', 
            draft: true,
            file1MetaData:{
                fileName: 'null',
                lastModified: 0,
                fileType: 'null'
            },
            file2MetaData:{
                fileName: 'null',
                lastModified: 0,
                fileType: 'null'
            }
        }
    ]

}

const freshPage = {
    date: '',
    title: '',
    location: '',
    entry: '',
    lockTime: '3',
    unlockTime: `${Date.now()}`,
    emailOne: '',
    emailTwo: '',
    emailThree: '', 
    draft: true,
    file1MetaData:{
        fileName: 'null',
        lastModified: 0,
        fileType: 'null'
    },
    file2MetaData:{
        fileName: 'null',
        lastModified: 0,
        fileType: 'null'
    }
}

const changeValue = (state = initialState, action) => {

    const {actionType, payload, index } = action;

    let updatedJournalPage;
    

    switch (actionType){
        case types.SET_JOURNAL:
            state.journal = payload;
            return {
                ...state
            }
        case types.SET_BIO:
            state.bio = payload;
            return {
                ...state
            }
        case types.SET_METADATA:
        state.metaData = payload;
        return {
            ...state
        }
        case types.SET_WALLET_DATA:
        state.walletData = payload;
        return {
            ...state
        }
        case types.SET_NFT_DATA:
        state.nftData = payload;
        return {
            ...state
        }
        case types.CHANGE_EMAIL:
            state.bio = {
                ...state.bio,
                email: payload
            }
            state.metaData = {
                ...state.metaData,
                email: [payload]
            }
            return{
                ...state
            }
        case types.CHANGE_USERNAME:
            state.metaData = {
                ...state.metaData,
                userName: [payload]
            }
            return{
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
        case types.CHANGE_FILE1_METADATA:
            updatedJournalPage = {
                ... state.journal[index],
                file1MetaData: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.CHANGE_FILE2_METADATA:
        updatedJournalPage = {
            ... state.journal[index],
            file2MetaData: payload
        }
        state.journal[index] = updatedJournalPage;
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
        case types.CHANGE_LOCK_TIME:
            updatedJournalPage = {
                ... state.journal[index],
                lockTime: payload
            }
            state.journal[index] = updatedJournalPage;
            return {
                ...state
            }
        case types.ADD_JOURNAL_PAGE:
            state.journal.push(freshPage);
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