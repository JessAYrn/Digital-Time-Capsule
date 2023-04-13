import React, { useContext } from 'react';
import { NavBar } from '../Components/navigation/NavBar'
// import { NavBar } from "../Components/navigation/NavBar";
import { UI_CONTEXTS } from "../Contexts";
import { AppContext } from "../Routes/App";
import '../SCSS/section.scss';

const EthPage = () => {
  return (
    <>
    <NavBar
    walletLink={false}
    journalLink={true}
    nftLink={true}
    accountLink={true}
    dashboardLink={true}
    notificationIcon={false}
    context={UI_CONTEXTS.WALLET}
/>    
<div className='coming_soon_wallet_page'>
    Coming soon
  </div>
</>
  )
}

export default EthPage;