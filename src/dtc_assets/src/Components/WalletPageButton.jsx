import React, { useContext, useReducer } from 'react'
import ButtonField from './Fields/Button';
import * as FaIcons from 'react-icons/fa';
import './WalletPageButton.scss';
import journalReducer, {initialState, types} from '../reducers/journalReducer';
import { AppContext } from '../Routes/Wallet';




const WalletPageButtons = () => {
    // const [journalState, dispatch] = useReducer(journalReducer, initialState);
  const {
    journalState,
    dispatch
  } = useContext(AppContext);


  let changeTab=(walletTab)=>{
    dispatch({
      actionType:types.SET_WALLET_TABS,
      payload:walletTab
    })
  }

  

  return (
    <div className='container_wallet_buttons'>
        <ButtonField
        Icon={FaIcons.FaWallet}
        iconSize={25}
        iconColor={'#fff'}
        className={journalState.walletPageTab==='icp_tab'?'walletButtonOne active':'walletButtonOne'}
        onClick={()=>changeTab('icp_tab')}
        withBox={true}
        />
        
        <ButtonField
        Icon={FaIcons.FaEthereum}
        iconSize={25}
        iconColor={'#fff'}
        className={journalState.walletPageTab==='eth_tab'?'walletButtonTwo active':'walletButtonTwo'}
        onClick={()=>changeTab('eth_tab')}
        withBox={true}
        />
        
        <ButtonField
        Icon={FaIcons.FaBitcoin}
        iconSize={25}
        iconColor={'orange'}
        className={journalState.walletPageTab==='btc_tab'?'walletButtonThree active':'walletButtonThree'}
        onClick={()=>changeTab('btc_tab')}
        withBox={true}
        />
       
        <ButtonField
        Icon={FaIcons.FaBitcoin}
        iconSize={25}
        iconColor={'purple'}
        // className={'journalButtonTwo'}
        className={journalState.walletPageTab==='ckBtc_tab'?'walletButtonFour active':'walletButtonFour'}
        onClick={()=>changeTab('ckBtc_tab')}
        withBox={true}
        />
    </div>
    
  )
}

export default WalletPageButtons;