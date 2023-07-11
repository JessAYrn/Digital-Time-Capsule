import { milisecondsToNanoSeconds } from "../functionsAndConstants/Utils"

export const TEST_DATA_FOR_NOTIFICATIONS =[
    {
        date: 'today',
        title: 'test',
        location: 'test',
        entry: 'test',
        lockTime: '3',
        unlockTime: milisecondsToNanoSeconds(1654266267113),
        emailOne: '',
        emailTwo: '',
        emailThree: '', 
        read: false,
        draft: false,
        file1MetaData:{
            fileName: 'null',
            lastModified: 0,
            fileType: 'null',
            errorStatus: {hasError: false, fileSize: 0}
        },
        file2MetaData:{
            fileName: 'null',
            lastModified: 0,
            fileType: 'null',
            errorStatus: {hasError: false, fileSize: 0}
        }
    },
    {
        date: '',
        title: '',
        location: '',
        entry: '',
        lockTime: '3',
        read: false,
        unlockTime: milisecondsToNanoSeconds(1654266267113),
        emailOne: '',
        emailTwo: '',
        emailThree: '', 
        draft: false,
        file1MetaData:{
            fileName: 'null',
            lastModified: 0,
            fileType: 'null',
            errorStatus: {hasError: false, fileSize: 0}
        },
        file2MetaData:{
            fileName: 'null',
            lastModified: 0,
            fileType: 'null',
            errorStatus: {hasError: false, fileSize: 0}
        }
    }
]