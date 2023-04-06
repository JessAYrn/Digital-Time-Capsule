import React, { useContext, useReducer } from 'react'
import ButtonField from './Fields/Button';
import * as FaIcons from 'react-icons/fa';
import './WalletPageButton.scss';
import journalReducer, {initialState, types} from '../reducers/journalReducer';
import { AppContext } from '../Routes/Wallet';
import { WALLET_TABS } from '../Constants';




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
        className={journalState.walletPageTab===WALLET_TABS.icpTab?'walletButtonOne active':'walletButtonOne'}
        onClick={()=>changeTab(WALLET_TABS.icpTab)}
        withBox={true}
        />
        
        <ButtonField
        Icon={FaIcons.FaEthereum}
        iconSize={25}
        iconColor={'#fff'}
        className={journalState.walletPageTab===WALLET_TABS.ethTab?'walletButtonTwo active':'walletButtonTwo'}
        onClick={()=>changeTab(WALLET_TABS.ethTab)}
        withBox={true}
        />
        
        <ButtonField
        Icon={FaIcons.FaBitcoin}
        iconSize={25}
        iconColor={'orange'}
        className={journalState.walletPageTab===WALLET_TABS.btcTab?'walletButtonThree active':'walletButtonThree'}
        onClick={()=>changeTab(WALLET_TABS.btcTab)}
        withBox={true}
        />
       
        <ButtonField
        Icon={FaIcons.FaBitcoin}
        iconSize={25}
        iconColor={'purple'}
        // className={'journalButtonTwo'}
        className={journalState.walletPageTab===WALLET_TABS.ckBtcTab?'walletButtonFour active':'walletButtonFour'}
        onClick={()=>changeTab(WALLET_TABS.ckBtcTab)}
        withBox={true}
        />
    </div>
    
  )
}

export default WalletPageButtons;