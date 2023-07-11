import React, { useContext } from 'react';
import { NavBar } from '../../Components/navigation/NavBar'
// import { NavBar } from "../Components/navigation/NavBar";
import { UI_CONTEXTS } from "../../functionsAndConstants/Contexts";
import { AppContext } from "../App";
import '../../SCSS/section.scss';

const BtcPage = () => {
  const { journalState, journalDispatch} = useContext(AppContext);
  return (
    <>
<NavBar
    walletLink={false}
    journalLink={true}
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

export default BtcPage;