import { NavBar } from "../../Components/navigation/NavBar";
import React, { useContext } from 'react';
import { UI_CONTEXTS } from "../../functionsAndConstants/Contexts";
import { AppContext } from "../App";
import './TreasuryPage.scss'

const TreasuryPage = (props) => {
  const { homePageState } = useContext(AppContext);
  return (
    <div>
      <NavBar context={UI_CONTEXTS.TREASURY} />
      <div className='treasuryPage_container'>
        coming soon
      </div>
    </div> 
    
  );
};

export default TreasuryPage;