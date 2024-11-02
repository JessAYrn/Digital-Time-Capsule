import React, {useState, useContext} from "react";
import { AppContext } from "../Context";
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import TransactWithTreasuryModal, {actions} from "./modal/TransactWithTreasury";
import CreateProposalForm from "./modal/proposals/CreateProposalForm";
import { loadAllDataIntoReduxStores } from "../functionsAndConstants/loadingFunctions";
import { types as journalTypes } from "../reducers/journalReducer";
import { walletTypes } from "../reducers/walletReducer";
import { homePageTypes } from "../reducers/homePageReducer";
import { notificationsTypes } from "../reducers/notificationsReducer";
import { treasuryTypes } from "../reducers/treasuryReducer";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SpeedDialField from "./Fields/SpeedDialField";
import ModalComponent from "./modal/Modal";
import SendCrypto from "./modal/SendCryptoModal";
import PaymentIcon from '@mui/icons-material/Payment';
import BuyCrypto from "./modal/proposals/proposalModalComponentTypes/BuyCrypto";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const ActionButton = (props) => {

    const { 
        actorState,
        treasuryDispatch,
        walletDispatch, 
        homePageDispatch,
        journalDispatch,
        notificationsDispatch,
    } = useContext(AppContext);
    
    const dispatches = { homePageDispatch, treasuryDispatch, walletDispatch, notificationsDispatch, journalDispatch};
    const types = { journalTypes, walletTypes, homePageTypes, notificationsTypes, treasuryTypes};

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [isLoadingModal, setIsLoadingModal] = useState(false);

    const openTransactWithTreasuryForm = () => {
        setModalIsOpen(true);
        setModalProps({
            bigText: "TRANSACT WITH TREASURY",
            components: [
              {
                Component: TransactWithTreasuryModal,
                props: {
                  setModalIsOpen, 
                  setModalProps, 
                  setIsLoadingModal,
                }
              }
            ],
            handleClose: () => setModalIsOpen(false)
        });
    };

    const openProposalForm = () => {
        setModalIsOpen(true);
        setModalProps({
            components: [
              {
                Component: CreateProposalForm,
                props: { setModalIsOpen, setModalProps, setIsLoadingModal}
              }
            ],
            handleClose: () => setModalIsOpen(false)
        });
    };

    const reloadData = async () => {
        setIsLoadingModal(true);
        setModalIsOpen(true);
        await loadAllDataIntoReduxStores(actorState, dispatches, types);
        setModalIsOpen(false);
        setIsLoadingModal(false);
      };

      const onSend = () => {
        setModalProps({
            bigText: "SEND ICP TO ANOTHER ADDRESS",
            components: [{
                Component: SendCrypto,
                props: {
                    onClickCancel: () => {setModalIsOpen(false); () => setModalProps({})},
                    setModalProps,
                    setModalIsOpen,
                    setIsLoadingModal
                }
            }]
        });
        setModalIsOpen(true);
    };

    const openBuyCrypto = () => {
        setModalIsOpen(true);
        setModalProps({
            bigText: "BUY CRYPTO",
            smallText:"This decentralized application requires users to stake $ICP in order to receive voting power, rewards and loans. You are being redirected to a third party service to purchase $ICP that will be sent automatically to your wallet here within this application upon completion of purchase.",
            components: [
              {
                Component: BuyCrypto,
                props: { handleClose: () => setModalIsOpen(false)},
              }
            ],
            handleClose: () => setModalIsOpen(false)
        });
    };

    const openWalletModal = () => {
      //TODO: Create and Implement Wallet Modal
      //Modal should allow users to view their wallet balance, 
      //view their wallet address & principal and transfer funds from their wallet.
    };

    const speedDialActions = [
        {name: "Refresh", icon: RefreshIcon, onClick: reloadData},
        {name: "Create Proposal", icon: HowToVoteIcon , onClick: openProposalForm},
        {name: "Buy $ICP", icon: PaymentIcon, onClick: openBuyCrypto},
        {name: "Treasury Transaction", icon: AccountBalanceIcon, onClick: () => openTransactWithTreasuryForm()},
        {name: "Wallet Transaction", icon: AccountBalanceWalletIcon , onClick: () => openWalletModal()},
        // {name: "New Transaction", icon: SendIcon , onClick: onSend}
    ]

    
    return (
    <>
        <SpeedDialField actions={speedDialActions} position={"right"}/>
        <ModalComponent 
            {...modalProps}
            open={modalIsOpen} 
            isLoading={isLoadingModal} 
        /> 
    </>
)
};
export default ActionButton;