import React from 'react';
import { QrReader } from 'react-qr-reader';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import ButtonField from '../../components/Button';

const QrReaderContent = (props) => {

    const { onCloseQrReader } = props;

    return(
        <>
            <QrReader
                constraints = {{ facingMode: "rear" }}
                onResult={(result, error) => {
                    if (!!result) { onCloseQrReader({recipientAddress: result?.text}); }
                    if (!!error) { console.log(error); }
                }}
                style={{ height: '50%' }}
            />
                <Grid display={"flex"} justifyContent={"center"} alignItems={"center"} width={"100%"} position={"fixed"} bottom={"10px"}>
                    <ButtonField
                        text={'Cancel'}
                        onClick={onCloseQrReader}
                    />
                </Grid>
        </>
    )
};

export default QrReaderContent;