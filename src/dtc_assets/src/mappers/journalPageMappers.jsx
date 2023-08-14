import { getDateAsStringMMDDYYY, milisecondsToNanoSeconds } from "../functionsAndConstants/Utils";
import { nanoSecondsToMiliSeconds, getDateAsString, dateAisLaterThanOrSameAsDateB } from "../functionsAndConstants/Utils";
import { TEST_DATA_FOR_NOTIFICATIONS } from "../testData/notificationsTestData";

export const journalPagesTableColumns = [
    { 
        field: 'entryKey', 
        headerName: 'Key', 
        width: 90,
        editable: false
    },
    { 
        field: 'timeStarted', 
        headerName: 'Date Created', 
        width: 200,
        editable: false
    },
    { 
        field: 'timeSubmitted', 
        headerName: 'Date Completed', 
        width: 200,
        editable: false
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 200,
      editable: false,
    },
    {
        field: 'locked',
        headerName: 'Locked',
        width: 200,
        type: 'boolean',
        editable: false,
    },
    {
        field: 'timeOfUnlock',
        headerName: 'Available',
        width: 200,
        editable: false,
    }
];

export const mapRequestsForAccessToTableRows = (journalEntries) => {
    const journalEntries_ = journalEntries.map((page) => {
        return {
            id: page.entryKey,
            entryKey: page.entryKey,
            timeSubmitted: page.timeSubmited[0] ? getDateAsStringMMDDYYY(page.timeSubmite[0]) : null,
            timeStarted: getDateAsStringMMDDYYY(page.timeStarted),
            location: page.location,
            timeOfUnlock: page.timeOfUnlock[0] ? getDateAsStringMMDDYYY(page.timeOfUnlock[0]) : null,
            locked: page.locked
        }
    });
    return journalEntries_;
}


export const mapApiObjectToFrontEndJournalEntriesObject = (journalEntries) => {
    let journalEntriesForFrontend = journalEntries.map((arrayWithKeyAndPage) => {
        const backEndObj = arrayWithKeyAndPage[1];
        const entryKey  = arrayWithKeyAndPage[0];
        const filesMetaData = backEndObj.filesMetaData.map(fileData => {
            return { ...fileData, lastModified : parseInt(fileData.lastModified) };
        });
        
        return { 
            ...backEndObj, 
            filesMetaData: filesMetaData, 
            entryKey: parseInt(entryKey),
            timeOfUnlock: backEndObj.timeOfUnlock[0] ? [nanoSecondsToMiliSeconds(parseInt(backEndObj.timeOfUnlock[0]))] : [],
            timeSubmited : backEndObj.timeSubmited[0] ? [nanoSecondsToMiliSeconds(parseInt(backEndObj.timeSubmited[0]))] : [],
            timeStarted : nanoSecondsToMiliSeconds(parseInt(backEndObj.timeStarted))
         };
    });

    return journalEntriesForFrontend;
};