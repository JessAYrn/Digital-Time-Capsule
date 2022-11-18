import { milisecondsToNanoSeconds } from "../Utils";
import { file1FileIndex, file2FileIndex } from "../Constants";
import { nanoSecondsToMiliSeconds, getDateAsString, dateAisLaterThanOrSameAsDateB } from "../Utils";
import { TEST_DATA_FOR_NOTIFICATIONS } from "../testData/notificationsTestData";


export const mapAndSendJournalPageRequestToApi = async (key, pageData, files, actor) => {

    const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

    let blob1;
    let blob2;

    await files.file1.arrayBuffer().then((arrayBuffer) => {
        blob1 = new Blob([...new Uint8Array(arrayBuffer)], {type: files.file1.type });
    });

    await files.file2.arrayBuffer().then((arrayBuffer) => {
        blob2 = new Blob([...new Uint8Array(arrayBuffer)], {type: files.file2.type });
    });



    const journalEntry = {
        date: pageData.date,
        text: pageData.entry,
        lockTime: pageData.lockTime * 2.592 * 10**15,
        timeTillUnlock: pageData.lockTime * 2.592 * 10**15,
        location: pageData.location,
        entryTitle: "test"
    };

    
    const entry = (journalEntry, {file1: blob1, file2: blob2});
    const entryKey = (key) ? {entryKey: key}: [];
    await actor.updateJournal(entryKey, entry);

};

export const mapApiObjectToFrontEndJournalEntriesObject = (journalDataFromApi) => {
    let journalEntriesForFrontend_ = journalDataFromApi.ok.userJournalData || journalDataFromApi.ok
    let journalEntriesForFrontend = journalEntriesForFrontend_[0].map((arrayWithKeyAndPage) => {
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
        let unlockDate = getDateAsString(unlockTimeInMilliseconds)        
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


    //filtering all of the unread journal entries
    let unreadJournalEntriesForFronten = journalEntriesForFrontend.filter(entry => {
        let today = getDateAsString();
        let notify = !entry.read && entry.capsuled && dateAisLaterThanOrSameAsDateB(today, entry.unlockTime);
        return notify;
    });
    return { allEntries: journalEntriesForFrontend, unreadEntries: unreadJournalEntriesForFronten } ;


}