import React, {useContext, useEffect} from 'react';
import { AppContext } from '../Wallet';
import './WalletPage.scss';

const WalletPage = (props) => {

    const {
        journalState,
        dispatch
    } = props;

    const { actor, authClient } = useContext(AppContext);

    useEffect(async () => {
        const journal = await actor.readJournal();
        console.log(journal);
        if("err" in journal){
            actor.create({
                userName: "admin",
                email: "admin@test.com"
        }).then((result) => {
                console.log(result);
            });
        } else {
            const walletData = { balance : journal.ok.userJournalData[2].balance, addressame: journal.ok.userJournalData[2].address };
            
            dispatch({
                payload: walletData,
                actionType: types.SET_WALLET_ADDRESS
            });
        }
    },[actor, authClient]);



    return (
        <div className={"container"}>
            <div className="background center">
                <div className='scrollable'>
                    <div className={'transparentDiv'}>
                        <div className='infoDiv' >
                            <div className="balanceDiv">
                                Wallet Balance: {journalState.walletData.balance}
                            </div>
                            <div className='walletAddressDiv'>
                                Wallet Address: {journalState.walletData.address}
                            </div>
                        </div>                
                    </div>
                </div>
            </div>
        </div>
    );
} 
export default WalletPage;