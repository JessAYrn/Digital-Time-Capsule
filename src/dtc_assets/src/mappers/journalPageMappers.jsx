import { milisecondsToNanoSeconds } from "../functionsAndConstants/Utils";
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
        field: 'dateSubmitted', 
        headerName: 'Submitted', 
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
        field: 'available',
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
            dateSubmitted: page.date,
            location: page.location,
            available: page.unlockTime
        }
    });
    return journalEntries_;
}


export const mapApiObjectToFrontEndJournalEntriesObject = (journalEntries) => {
    let journalEntriesForFrontend = journalEntries.map((arrayWithKeyAndPage) => {
        const backEndObj = arrayWithKeyAndPage[1];
        const entryKey  = arrayWithKeyAndPage[0];
        const filesMetaData = backEndObj.filesMetaData.map(fileData => {
            return {
                ...fileData,
                lastModified : parseInt(fileData.lastModified)
            };
        });

        let unlockTimeInNanoseconds = parseInt(backEndObj.unlockTime);
        let unlockTimeInMilliseconds = nanoSecondsToMiliSeconds(unlockTimeInNanoseconds);
        let unlockDate = getDateAsString(unlockTimeInMilliseconds);        
        let submitDate = backEndObj.date;
        let capsuled = false;
        if(dateAisLaterThanOrSameAsDateB(unlockDate, submitDate) && submitDate !== unlockDate) capsuled = true;
        return {
            date: backEndObj.date,
            title: backEndObj.entryTitle,
            location: backEndObj.location,
            capsuled: capsuled,
            unlockTime: unlockDate,
            entry: backEndObj.text,
            emailOne: backEndObj.emailOne,
            emailTwo: backEndObj.emailTwo,
            emailThree: backEndObj.emailThree,
            sent : backEndObj.sent,
            read : backEndObj.read,
            draft: backEndObj.draft,
            filesMetaData: filesMetaData,
            isOpen: false,
            entryKey: parseInt(entryKey)
        };
    });
    //sorting the entries by date of submission.
    journalEntriesForFrontend = journalEntriesForFrontend.sort(function(a,b){
        const dateForAArray = a.date.split('-');
        const yearForA = parseInt(dateForAArray[0]);
        const monthForA = parseInt(dateForAArray[1]);
        const dayForA = parseInt(dateForAArray[2]);

        const dateForBArray = b.date.split('-'); 
        const yearForB = parseInt(dateForBArray[0]);
        const monthForB = parseInt(dateForBArray[1]);
        const dayForB = parseInt(dateForBArray[2]);

        if(yearForA > yearForB){
            return 1;
        } else if(yearForA < yearForB){
            return -1;
        } else {
            if(monthForA > monthForB){
                return 1;
            } else if(monthForA < monthForB){
                return -1;
            } else {
                if(dayForA > dayForB){
                    return 1;
                } else if(dayForA < dayForB){
                    return -1;
                } else {
                    return 0;
                }
            }
        }
    });

    return journalEntriesForFrontend  ;


}