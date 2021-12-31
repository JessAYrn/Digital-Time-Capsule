

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

    console.log(entry);

    await actor.updateJournal(entryKey, entry).then((result) => {
        console.log(result);
    });

};

export const mapApiObjectToFrontEndObject = (backEndObj) => {
    return {
        date: backEndObj.date,
        title: backEndObj.entryTitle,
        location: backEndObj.location,
        lockTime: backEndObj.lockTime,
        entry: backEndObj.text,
        emailOne: backEndObj.emailOne,
        emailTwo: backEndObj.emailTwo,
        emailThree: backEndObj.emailThree
    }
}