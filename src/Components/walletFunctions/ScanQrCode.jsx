import React from 'react';
import { QrReader } from 'react-qr-reader';
import ButtonField from '../Fields/Button';

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
            <ButtonField
                text={'Cancel'}
                className={'qrCancelButtonDiv'}
                onClick={() => setShowQrReader(!showQrReader)}
                withBox={true}
            />
        </>
    )
}