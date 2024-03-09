import { NavBar } from "../../Components/navigation/NavBar";
import React, { useContext, useState } from 'react';
import { UI_CONTEXTS } from "../../functionsAndConstants/Contexts";
import { AppContext } from "../Treasury";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { Paper, Typography } from "@mui/material";
import { copyText } from "../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import { fromE8s, shortenHexString } from "../../functionsAndConstants/Utils";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SpeedDialField from "../../Components/Fields/SpeedDialField";
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ModalComponent from "../../Components/modal/Modal";
import ButtonField from "../../Components/Fields/Button";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CreateProposalForm from "../../Components/proposals/CreateProposalForm";
import DepositOrWithdrawModal from "../../Components/modal/DepositOrWithdraw";
import Graph from "../../Components/Fields/Chart";
import './TreasuryPage.scss'
import { CHART_TYPES, GRAPH_DISPLAY_CURRENCIES } from "../../functionsAndConstants/Constants";
import { TREASURY_ACTIONS } from "../../Components/proposals/utils";

const TreasuryPage = (props) => {
  const { treasuryState, homePageState, actorState } = useContext(AppContext);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [modalProps, setModalProps] = useState({});

  const openProposalForm = () => {
    setModalIsOpen(true);
    setModalProps({
        components: [
          {
            Component: CreateProposalForm,
            props: {context: UI_CONTEXTS.TREASURY, setModalIsOpen, setModalProps, setIsLoadingModal}
          }
        ],
        handleClose: () => setModalIsOpen(false)
    });
  };

  const openDepositOrWithdrawForm = (action) => {
    setModalIsOpen(true);
    setModalProps({
        components: [
          {
            Component: DepositOrWithdrawModal,
            props: {
              action,
              context: UI_CONTEXTS.TREASURY, 
              setModalIsOpen, 
              setModalProps, 
              setIsLoadingModal,
            }
          }
        ],
        handleClose: () => setModalIsOpen(false)
    });
  };

  const displayTreasuryAccountId = () => {
    setModalProps({
        flexDirection: "column",
        bigText: "Treasury Account ID ($ICP):",
        smallText: `${shortenHexString(treasuryState.treasuryData.accountId_icp)}`,
        components: [
          {
            Component: ButtonField,
            props: {
              text: "Copy To Clipboard",
              onClick: () => copyText(treasuryState.treasuryData.accountId_icp),
              iconSize: 'small',
              Icon: ContentCopyIcon,
            }
          },
          {
            Component: ButtonField,
            props: {
              text: "Close",
              onClick: () => setModalIsOpen(false),
              iconSize: 'small'
            }
          }
        ],
        handleClose: () => setModalIsOpen(false)
    });
  };

  const openTreasuryAccountIdModal = () => {  
    setModalIsOpen(true);
    setModalProps({
        flexDirection: "column",
        bigText: "Be Careful!",
        smallText: "Sending ICP directly to this treasury account ID without using the 'Deposit To Treasury' button will result in no treasury contribution being recorded from you account. In other words, you're essentially donating to the treasury without receiving any credit. If you're not sure what you're doing, please don't proceed. If you're sure, please proceed. If you mean receive credit for your deposit to the treasury, please use the 'Deposit To Treasury' button.",
        Icon: WarningAmberIcon,
        components: [
          {
            Component: ButtonField,
            props: {
              text: "I understand, proceed",
              onClick: displayTreasuryAccountId,
              iconSize: 'small'
            }
          },
          {
            Component: ButtonField,
            props: {
              text: "Cancel",
              onClick: () => setModalIsOpen(false),
              iconSize: 'small'
            }
          }
        ],
        handleClose: () => setModalIsOpen(false)
    });
  };

  const speedDialActions = [
    {name: "Create Proposal", icon: HowToVoteIcon , onClick: openProposalForm},
    {name: "Withdraw To Wallet", icon: AccountBalanceWalletOutlinedIcon , onClick: () => openDepositOrWithdrawForm(TREASURY_ACTIONS.WithdrawIcpFromTreasury)},
    {name: "Deposit To Treasury", icon: AccountBalanceIcon , onClick: () => openDepositOrWithdrawForm(TREASURY_ACTIONS.DepositIcpToTreasury)}
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
        <Grid xs={12} width={"100%"} display={"flex"} justifyContent={"left"} alignItems={"center"}>
          <Grid xs={12} display={"flex"} justifyContent={"left"} alignItems={"left"} flexDirection={"column"}>
            <Typography>Treasury Balances:</Typography>
            <Typography variant="h4">{`${fromE8s(treasuryState.treasuryData.balance_icp)}`} ICP</Typography>
          </Grid>
        </Grid>
        <Graph type={CHART_TYPES.line} inputData={treasuryState.balancesData} defaultLabel={GRAPH_DISPLAY_CURRENCIES.icp}/>
        <ButtonField
          text={"View Treasury Account ID"}
          onClick={openTreasuryAccountIdModal}
          iconSize={'large'}
        />
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