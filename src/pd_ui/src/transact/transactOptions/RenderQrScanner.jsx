import React from 'react';
import { QrReader } from 'react-qr-reader';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import ButtonField from '../../components/Button';

const QrReaderContent = (props) => {

    const { onCloseQrReader } = props;

    const onResult = (result, error) => {
        if (!!result) {
            console.log(result)
            onCloseQrReader({recipientAddress: result?.text})
        }   

        if (!!error)  console.log(error);
        
    }
    

    return(
        <Grid width={"100%"} display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
            <QrReader
                constraints = {{ facingMode: "rear" }}
                onResult={onResult}
                videoStyle={{ height: '275px', width: '275px' }}
                containerStyle={{ width: '275px' }}
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