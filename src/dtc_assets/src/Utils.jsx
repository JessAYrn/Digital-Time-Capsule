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
  const shortString = `${hexString.slice(0,9)} ... ${hexString.slice(-10)}`
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