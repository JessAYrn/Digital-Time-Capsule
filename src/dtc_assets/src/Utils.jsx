import { e8sInOneICP } from "./Constants";

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

export const toE8s = (number) => {
  return number * e8sInOneICP
}

export const fromE8s = (number) => {
  return number / e8sInOneICP
}

export const shortenHexString = (hexString) => {
  const shortString = `${hexString.slice(0,4)} ... ${hexString.slice(-4)}`
  return shortString
}

export const milisecondsToNanoSeconds = (time) => {
  return time * 1000000;
}

export const nanoSecondsToMiliSeconds = (time) => {
  return Math.floor(time / 1000000);
}

export const mapFileToNFT = (actor, file) => {
  
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
  return Math.round(num * 100) / 100
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
  let unlockDate = new Date(date);
  let unlockTime = parseInt(unlockDate.getTime());
  return unlockTime;
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

export const scrollToBottom = () => {
  window.scrollTo({
    top: document.body.scrollHeight,
    left: 0,
    behavior: 'smooth'
  });
}