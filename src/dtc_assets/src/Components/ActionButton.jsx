import React, {useState, useContext} from "react";
import { AppContext } from "../Context";
import SendIcon from '@mui/icons-material/Send';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RefreshIcon from '@mui/icons-material/Refresh';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import DepositOrWithdrawModal from "./modal/DepositOrWithdraw";
import CreateProposalForm from "./proposals/CreateProposalForm";
import { TREASURY_ACTIONS } from "./proposals/utils";
import { loadAllDataIntoReduxStores } from "../functionsAndConstants/loadingFunctions";
import { types as journalTypes } from "../reducers/journalReducer";
import { walletTypes } from "../reducers/walletReducer";
import { homePageTypes } from "../reducers/homePageReducer";
import { notificationsTypes } from "../reducers/notificationsReducer";
import { treasuryTypes } from "../reducers/treasuryReducer";
import SpeedDialField from "./Fields/SpeedDialField";
import ModalComponent from "./modal/Modal";
import SendCrypto from "./modal/SendCryptoModal";


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

    const openDepositOrWithdrawForm = (action) => {
        let text = action === TREASURY_ACTIONS.DepositIcpToTreasury ? "DEPOSIT ICP TO TREASURY" : "WITHDRAW ICP FROM TREASURY";
        setModalIsOpen(true);
        setModalProps({
            bigText: text,
            components: [
              {
                Component: DepositOrWithdrawModal,
                props: {
                  action,
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
            smallText: "Do not use this feature to send ICP to the treasury. Use the deposit to treasury feature instead.",
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

    const speedDialActions = [
        {name: "Refresh", icon: RefreshIcon, onClick: reloadData},
        {name: "Create Proposal", icon: HowToVoteIcon , onClick: openProposalForm},
        {name: "Withdraw To Wallet", icon: AccountBalanceWalletOutlinedIcon , onClick: () => openDepositOrWithdrawForm(TREASURY_ACTIONS.WithdrawIcpFromTreasury)},
        {name: "Deposit To Treasury", icon: AccountBalanceIcon , onClick: () => openDepositOrWithdrawForm(TREASURY_ACTIONS.DepositIcpToTreasury)},
        {name: "New Transaction", icon: SendIcon , onClick: onSend}
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