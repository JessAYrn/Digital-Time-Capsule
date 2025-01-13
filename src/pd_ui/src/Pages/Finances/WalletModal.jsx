import React, { useState} from 'react'
import Grid from '@mui/material/Unstable_Grid2'
import {FormControlLabel} from '@mui/material'
import {FormGroup} from '@mui/material'
import {Checkbox} from '@mui/material'
import RenderDisplayUserData from './DisplayUserData'
import RenderSendCrypto from './SendCryptoModal'
import RenderBuyCrypto from './RenderBuyCrypto'

export const actions = { send: "send", receive: "receive", buy: "buy" };

const TransactWithWalletModal = (props) => {
const [action, setAction] = useState(actions.receive);

    return (
        <Grid columns={12} xs={12} display="flex" justifyContent="center" alignItems="center" flexDirection={'column'}>
            <Grid columns={12} xs={12} display="flex" justifyContent="center" alignItems="center" > 
                <FormGroup sx={{marginBottom: "20px"}}>
                    <FormControlLabel 
                        label = {"Receive"}
                        labelPlacement="end"
                        color="white"
                        control={ <Checkbox style={{color: "white"}} checked={action === actions.receive} onChange={ (e) => {setAction(e.target.checked ? actions.receive : null) } }/> }
                    />
                </FormGroup>
                <FormGroup sx={{marginBottom: "20px"}}>
                    <FormControlLabel 
                        label = {"Send"}
                        labelPlacement="end"
                        color="white"
                        control={ <Checkbox style={{color: "white"}} checked={action === actions.send} onChange={ (e) => { setAction(e.target.checked ? actions.send : null) } }/> }
                    />
                </FormGroup>
                <FormGroup sx={{marginBottom: "20px"}}>
                    <FormControlLabel 
                        label = {"Buy"}
                        labelPlacement="end"
                        color="white"
                        control={ <Checkbox style={{color: "white"}} checked={action === actions.buy} onChange={ (e) => { setAction(e.target.checked ? actions.buy : null) } }/> }
                    />
                </FormGroup>
            </Grid>
            { action === actions.receive && <RenderDisplayUserData/> }
            { action === actions.send && <RenderSendCrypto/> }
            { action === actions.buy && <RenderBuyCrypto/> }
        </Grid>
    )

};

export default TransactWithWalletModal;