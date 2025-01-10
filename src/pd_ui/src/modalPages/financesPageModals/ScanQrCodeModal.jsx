import React from 'react';
import { QrReader } from 'react-qr-reader';
import ButtonField from '../../Components/Fields/Button';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { Typography } from '@mui/material';

const QrReaderContent = (props) => {

    const {
        setRecipientAddress,
        setShowQrReader
    } = props;

    return(
        <Grid width={"100%"}>
            <Typography display={"flex"} justifyContent={"center"} alignItems={"center"}>Scan QR Code</Typography>
            <QrReader
                constraints = {{ facingMode: "environment" }}
                onResult={(result, error) => {
                    if (!!result) {
                        setRecipientAddress(result?.text);
                        setShowQrReader(false)
                    }

                    if (!!error) {
                        console.info(error);
                    }
                    }}
                    style={{ height: '50%' }}
            />
            <ButtonField
                text={'Cancel'}
                className={'qrCancelButtonDiv'}
                onClick={() => setShowQrReader(false)}
            />
        </Grid>
    )
};

export default QrReaderContent;