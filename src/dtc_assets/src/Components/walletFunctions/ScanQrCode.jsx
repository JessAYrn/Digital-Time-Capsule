import React from 'react';
import { QrReader } from 'react-qr-reader';

export const QrReaderContent = (props) => {

    const {
        setRecipientAddress,
        setShowQrReader,
        showQrReader
    } = props;

    return(
        <>
            <div className="cameraDiv">
            <QrReader
                constraints = {{ facingMode: "environment" }}
                onResult={(result, error) => {
                    if (!!result) {
                        setRecipientAddress(result?.text);
                        setShowQrReader(!showQrReader)
                    }

                    if (!!error) {
                        console.info(error);
                    }
                    }}
                    style={{ height: '50%' }}
            />
            </div>
            <div className="qrCancelButtonDiv" >
                <button className='button' onClick={() => setShowQrReader(!showQrReader)}> Cancel </button>
            </div>
        </>
    )
}