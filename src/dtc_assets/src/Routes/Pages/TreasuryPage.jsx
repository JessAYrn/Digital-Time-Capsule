import { NavBar } from "../../Components/navigation/NavBar";
import React, { Component, useContext, useState } from 'react';
import { UI_CONTEXTS } from "../../functionsAndConstants/Contexts";
import { AppContext } from "../Treasury";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Paper } from "@mui/material";
import { copyText } from "../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import { shortenHexString } from "../../functionsAndConstants/Utils";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DataField from "../../Components/Fields/DataField";
import SpeedDialField from "../../Components/Fields/SpeedDialField";
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ModalComponent from "../../Components/modal/Modal";
import ButtonField from "../../Components/Fields/Button";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreateProposalForm from "../../Components/proposals/CreateProposalForm";
import DepositToTreasuryModal from "../../Components/modal/DepositToTreasuryModal";
import Graph from "../../Components/Fields/Chart";
import './TreasuryPage.scss'
import { CHART_TYPES } from "../../functionsAndConstants/Constants";

const TreasuryPage = (props) => {
  const { treasuryState, homePageState, actorState } = useContext(AppContext);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [modalProps, setModalProps] = useState({});

  const modalForm_depositToTreasury = [
    {
      Component: DepositToTreasuryModal,
      props: {
        context: UI_CONTEXTS.TREASURY, 
        setModalIsOpen, 
        setModalProps, 
        setIsLoadingModal
      }
    }
  ]

  const modalForm_createProposal = [
    {
      Component: CreateProposalForm,
      props: {context: UI_CONTEXTS.TREASURY, setModalIsOpen, setModalProps, setIsLoadingModal}
    }
  ];

  const openProposalForm = () => {
    setModalIsOpen(true);
    setModalProps({
        components: modalForm_createProposal,
        handleClose: () => setModalIsOpen(false)
    });
  };

  const openDepositForm = () => {
    setModalIsOpen(true);
    setModalProps({
        components: modalForm_depositToTreasury,
        handleClose: () => setModalIsOpen(false)
    });
  };

  const speedDialActions = [
    {name: "Create Proposal", icon: HowToVoteIcon , onClick: openProposalForm}
  ];

  return (
    <Grid 
      container 
      columns={12} 
      xs={12} 
      rowSpacing={8} 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      flexDirection={"column"}
      className={"container_treasury"}
    > 
      <NavBar context={UI_CONTEXTS.TREASURY} />
      <Grid 
        columns={12}
        xs={11}  
        md={9}
        rowSpacing={0} 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        flexDirection={"column"}
        marginTop={"60px"}
      >
        <Graph type={CHART_TYPES.line}/>
        <Paper className='treasury paper'>
        <DataField
          label={'Balance($ICP): '}
          text={treasuryState.treasuryData.balance_icp}
          disabled={true}
        />
        <DataField
          label={'Treasury Account ID($ICP):'}
          text={`${shortenHexString(treasuryState.treasuryData.accountId_icp)}`}
          buttonIcon={ContentCopyIcon}
          onClick={ () => copyText(treasuryState.treasuryData.accountId_icp)}
        />
        </Paper>
        {homePageState.canisterData.isAdmin && 
          <Grid 
            columns={12} 
            xs={6} 
            width={"100%"} 
            display={"flex"} 
            justifyContent={"right"} 
            alignItems={"center"}
            marginTop={"20px"}
          >
              <Grid xs={6} width={"210px"}>
                  <ButtonField
                      Icon={AccountBalanceIcon}
                      active={homePageState.canisterData.isAdmin}
                      text={'Deposit to treasury'}
                      onClick={openDepositForm}
                  />
              </Grid>
          </Grid>
        }
      </Grid>
      <SpeedDialField actions={speedDialActions} position={"right"}/>
      <ModalComponent 
                {...modalProps}
                open={modalIsOpen} 
                isLoading={isLoadingModal} 
            /> 
    </Grid>
    
  );
};

export default TreasuryPage;