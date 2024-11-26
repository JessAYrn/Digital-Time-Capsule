import React, { useContext} from "react";
import { AppContext } from "../Context";
import RefreshIcon from '@mui/icons-material/Refresh';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import TransactWithTreasuryModal from "./modal/TransactWithTreasury";
import CreateProposalForm from "./modal/proposals/CreateProposalForm";
import { loadAllDataIntoReduxStores } from "../functionsAndConstants/loadingFunctions";
import { types as journalTypes } from "../reducers/journalReducer";
import { walletTypes } from "../reducers/walletReducer";
import { homePageTypes } from "../reducers/homePageReducer";
import { notificationsTypes } from "../reducers/notificationsReducer";
import { treasuryTypes } from "../reducers/treasuryReducer";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SpeedDialField from "./Fields/SpeedDialField";
import PaymentIcon from '@mui/icons-material/Payment';
import BuyCrypto from "./modal/proposals/proposalModalComponentTypes/BuyCrypto";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TransactWithWalletModal from "./modal/WalletModal";

const ActionButton = (props) => {

    const { 
        actorState,
        treasuryDispatch,
        walletDispatch, 
        homePageDispatch,
        journalDispatch,
        notificationsDispatch,
        setModalProps,
        setModalIsOpen,
        setModalIsLoading
    } = useContext(AppContext);
    
    const dispatches = { homePageDispatch, treasuryDispatch, walletDispatch, notificationsDispatch, journalDispatch};
    const types = { journalTypes, walletTypes, homePageTypes, notificationsTypes, treasuryTypes};

    const openTransactWithTreasuryForm = () => {
        setModalIsOpen(true);
        setModalProps({
            bigText: "TRANSACT WITH TREASURY",
            components: [ { Component: TransactWithTreasuryModal } ],
        });
    };

    const openTransactWithWallerForm = () => {
      setModalIsOpen(true);
      setModalProps({
          bigText: "TRANSACT WITH WALLET",
          components: [ {Component: TransactWithWalletModal}],
      });
  };

    const openProposalForm = () => {
        setModalIsOpen(true);
        setModalProps({ 
          components: [ { Component: CreateProposalForm }] 
        });
    };


    const speedDialActions = [
        {name: "Create Proposal", icon: HowToVoteIcon , onClick: openProposalForm},
        {name: "Treasury Transaction", icon: AccountBalanceIcon, onClick: () => openTransactWithTreasuryForm()},
        {name: "Wallet Transaction", icon: AccountBalanceWalletIcon , onClick: () => openTransactWithWallerForm()},
    ]

    
    return (
    <SpeedDialField actions={speedDialActions} position={"right"}/>
)
};
export default ActionButton;