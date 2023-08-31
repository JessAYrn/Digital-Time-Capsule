import React, {useCallback, useContext, useEffect, useState} from 'react';
import QRCode from 'qrcode';

export const generateQrCode = async (walletAddress) => {
    try{
        const response = await QRCode.toDataURL(walletAddress);
        
        return response;
     } catch (error){
     }
};

export const RenderQrCode = (props) => {
    const {
        imgUrl
    } = props;
    return(
        imgUrl &&
        <div className={'imgDiv'} style={{margin: "25px"}}>
            <img className='img' src={imgUrl} alt='Wallet QR Code'/>
        </div>
    )
}
