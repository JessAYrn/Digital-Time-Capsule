import * as canisterIds from "../../../../canister_ids.json";
import * as dtcFiles from "../../../declarations/dtc"
import * as dtcAssetsFiles from "../../../declarations/dtc_assets";
import { e8sInOneICP, MASTER_COPY_FRONTEND_CANISTER_ID, PERMITTED_USERNAME_CHARACTERS } from "./Constants";


export const toHexString = (byteArray)  =>{
    return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
};

export const fromHexString = (hex) => {
    if (hex.substr(0,2) === "0x") hex = hex.substr(2);
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
};

export const isADigit = (char) => {
  let num = parseInt(char);
  if( num === 0) return true;
  if( num === 1) return true;
  if( num === 2) return true;
  if( num === 3) return true;
  if( num === 4) return true;
  if( num === 5) return true;
  if( num === 6) return true;
  if( num === 7) return true;
  if( num === 8) return true;
  if( num === 9) return true;
  return false;
};

export const isWithin8DecimalPlaces = (number) => {
  let str = number.toString();
  let decimalPlace = 0;
  let decimalFound = false;
  for(let i = 0; i < str.length(); i++){
    let char = str[i];
    if(decimalFound)decimalPlace++;
    if(char === ".") decimalFound = true;
  };
  if(decimalPlace <= 8) return true;
  return false;
}

export const isANumber = (number) => {
  let str = number.toString();
  let numberOfDecimals = 0;
    for(let i = 0; i < str.length; i++){
      let char = str[i];
      if(char === ".")numberOfDecimals++;
      else if(!isADigit(char)) return false;
    };
    if(numberOfDecimals > 1) return false;
    return true;
};

export const isALowerCaseLetter = (char) => {
  let letters = [ "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
  if(letters.includes(char)) return true;
  return false;
};

export const isAHexidecimal = (char) => {
  let charAsString = char.toString();
  const chars = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
  return chars.includes(charAsString.toLowerCase());
}

export const isAnInteger = (number) => {
  let concatenation = parseInt(number);
  if(concatenation === number) return true;
  return false;
}

export const isANaturalNumber = (number) => {
  let isInteger = isAnInteger(number)
  if(isInteger && number > 0) return true;
  return false;
};

export const toE8s = (number) => {
  return parseInt(parseFloat(number) * e8sInOneICP);
}

export const fromE8s = (number) => {
  return parseFloat(number / e8sInOneICP);
}

export const shortenHexString = (hexString) => {
  const shortString = `${hexString.slice(0,4)}...${hexString.slice(-4)}`
  return shortString
}

export const milisecondsToNanoSeconds = (time) => {
  return time * 1000000;
}

export const nanoSecondsToMiliSeconds = (time) => {
  return Math.floor(time / 1000000);
}

export const fileToBlob = async (file) => {

  const buffer = await file.arrayBuffer();
  return [...new Uint8Array(buffer)];
};

export const deviceType = () => {
  const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "tablet";
    }
    else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "mobile";
    }
    return "desktop";
};

export const round2Decimals = (num) => {
  return Math.round(num * 10 ** 2) / ( 10 ** 2 )
};

export const round8Decimals = (num) => {
  return Math.round(num * 10 ** 8) / ( 10 ** 8 )
};

export const inTrillions = (num) => {
  return num / 1000000000000;
}

export const getFileArrayBuffer = (inputFile) => {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
      reader.onload = () => {
          resolve(reader.result);
      }
      reader.readAsArrayBuffer(inputFile)
  
  });
}; 

export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const secondsToHours = (seconds) => {
  return seconds / 3600;
};

export const hoursToDays = (hours) => {
  return hours / 24;
};

export const daysToMonths = (days) => {
  return days / 30;
};

export const getDateInMilliseconds = (date) => {
  let dateArray = date.split('-');
  let year = dateArray[0].slice(2);
  let month = dateArray[1];
  let day = dateArray[2];
  if(month === '01' || month === '1') month = 'January'
  else if(month === '02' || month === '2') month = 'February'
  else if(month === '03' || month === '3') month = 'March'
  else if(month === '04' || month === '4') month = 'April'
  else if(month === '05' || month === '5') month = 'May'
  else if(month === '06' || month === '6') month = 'June'
  else if(month === '07' || month === '7') month = 'July'
  else if(month === '08' || month === '8') month = 'August'
  else if(month === '09' || month === '9') month = 'September'
  else if(month === '10') month = 'October'
  else if(month === '11') month = 'November'
  else if(month === '12') month = 'December'

  let date_ = new Date();
  let hour = date_.getUTCHours();
  let minute = date_.getUTCMinutes();
  let seconds = date_.getUTCSeconds();
  if(hour < 10) hour = '0'+hour;
  if(minute < 10) minute = '0'+minute;
  if(seconds < 10) seconds = '0'+seconds;
  let time = hour+":"+minute+':'+seconds;

  date = month + ' ' + day + ', ' + year + ' ' + time + ' UTC+00:00';
  date = new Date(date);
  time = parseInt(date.getTime());
  return time;
}

export const getDateAsString = (dateInMilliseconds = null) => {
  let date = dateInMilliseconds ? new Date(dateInMilliseconds) : new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  if(month < 10) month = `0${month}`;
  let day = date.getDate();
  if(day < 10) day = `0${day}`;
  date = year + '-' + month + '-' + day; 
  return date;
}

export const getDateAsStringMMDDYYY = (dateInMilliseconds = null) => {
  let date = dateInMilliseconds ? new Date(dateInMilliseconds) : new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  if(month < 10) month = `0${month}`;
  let day = date.getDate();
  if(day < 10) day = `0${day}`;
  date = month + '/'+ day + '/' + year; 
  return date;
}

export const dateAisLaterThanOrSameAsDateB = (a, b) => {
  if(a === b) return true;
  let dateAAsArray = a.split('-');
  let yearA = parseInt(dateAAsArray[0]);
  let monthA = parseInt(dateAAsArray[1]);
  let dayA = parseInt(dateAAsArray[2]);

  let dateBAsArray = b.split('-');
  let yearB = parseInt(dateBAsArray[0]);
  let monthB = parseInt(dateBAsArray[1]);
  let dayB = parseInt(dateBAsArray[2]);

  if(yearA < yearB) return false;
  else if(yearA === yearB && monthA < monthB) return false;
  else if(yearA === yearB && monthA === monthB && dayA < dayB) return false;
  else return true;
};

export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
}

export const scrollTo_X =  (distanceFromLeft = 0) => {
  window.scrollTo({
    top: window.scrollY,
    left: distanceFromLeft,
    behavior: 'smooth'
  });
}

export const scrollTo_Y =  (distanceFromTop = 0) => {
  window.scrollTo({
    top: distanceFromTop,
    left: window.scrollX,
    behavior: 'smooth'
  });
}

export const backendActor = async (activeProvider) => {
  let currentURL = getCurrentURL();
  let dtc_canisterId;
  if(process.env.NODE_ENV === "development") dtc_canisterId = canisterIds.dtc.ic;
  else {
    let frontEndPrincipal = extractCanisterIdFromURL(currentURL);
    let dtcAssetsCanister = dtcAssetsFiles.createActor(frontEndPrincipal, {agentOptions: {host: "https://icp-api.io"}});
    let authorizedPrincipals = await dtcAssetsCanister.list_authorized();
    dtc_canisterId = authorizedPrincipals[0];
  }
  const dtc_idlFactory = dtcFiles.idlFactory;
  let { value: actor } = await activeProvider?.createActor(dtc_canisterId, dtc_idlFactory);
  return actor;
};

export const flattenUint8array = (array) => {
  let length = 0;
  array.forEach(uint8array => {
    length += uint8array.length;
  });
  let uint8stream = new Uint8Array(length);
  let nextUnpopulatedIndex = 0;
  array.forEach(uint8array => {
    uint8stream.set(uint8array, nextUnpopulatedIndex);
    nextUnpopulatedIndex += uint8array.length;
  })
  return uint8stream;
};

export const getCurrentURL = () => {
  return window.location.href
};

export const isLocalHost = () => {
  const url = getCurrentURL();
  if(url.includes("localhost")) return true;
  else false;
}

export const extractCanisterIdFromURL = (URL) => {
  if(process.env.NODE_ENV === "development") return MASTER_COPY_FRONTEND_CANISTER_ID;
  let canisterId = "";
  for(let i = 8; i < URL.length; i++){
    if(URL[i] === ".") break;
    canisterId += URL[i];
  };
  return canisterId;
};

export const allPropertiesInObjectAreDefined = (obj) => {
  for (const [key, value] of Object.entries(obj)) {
    console.log(` ${key} ` + `${value}`);
    if (value === undefined) return false;
  };
  return true;
};

export const objectsAreEqual = (obj1, obj2) => {
  let equal = JSON.stringify(obj1) === JSON.stringify(obj2);
  return equal;
}

export const getHighestEntryKey = (entries) => {
    let max = 0;
    for(let i = 0; i < entries.length; i++){
      const {entryKey} = entries[i];
      if(entryKey > max) max = entryKey;
    };
    return max;
};

export const principalHasProperFormat = (principal) => {
  if(principal.length !== 27 && principal.length !== 63) return false;
  for(let i = 0; i < principal.length; i++){
      const char = principal[i];
      const isADigit_ = isADigit(char);
      const isALowerCaseLetter_ = isALowerCaseLetter(char);
      const isADash = char === '-';
      if(i % 6 === 5 && !isADash) return false;
      if(i % 6 !== 5 && !isADigit_ && !isALowerCaseLetter_) return false;
  };
  return true;
};

export const icpWalletAddressHasProperFormat = (address) => {
  if(address.length !== 64) return false;
  for(let i = 0; i < address.length; i++){
    let char = address[i];
    if(!isAHexidecimal(char)) return false;
  };
  return true;
};

export const userNamePermitted = (userName) => {
  for(let i = 0; i < userName.length; i++){
    let char = userName[i];
    if(!PERMITTED_USERNAME_CHARACTERS.includes(char)) return false;
  };
  return true;
}


