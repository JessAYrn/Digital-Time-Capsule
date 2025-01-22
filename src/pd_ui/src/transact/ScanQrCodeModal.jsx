import React from 'react';
import { QrReader } from 'react-qr-reader';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import ButtonField from '../components/Button';
import { Typography } from '@mui/material';

const QrReaderContent = (props) => {

    const { onCloseQrReader } = props;

    return(
        <Grid width={"100%"} display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
            <Typography display={"flex"} justifyContent={"center"} alignItems={"center"}>Scan QR Code</Typography>
            <QrReader
                constraints = {{ facingMode: "environment" }}
                onResult={(result, error) => {
                    if (!!result) { onCloseQrReader({recipientAddress: result?.text}); }
                    if (!!error) { console.info(error); }
                }}
                style={{ height: '50%' }}
                />
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} position={"fixed"} bottom={"10px"}>
                    <ButtonField
                        text={'Cancel'}
                        onClick={onCloseQrReader}
                    />
                </Grid>
        </Grid>
    )
};

export default QrReaderContent;