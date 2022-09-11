import React, {useContext} from 'react';
import { MODALS_TYPES } from '../../Constants';
import { UI_CONTEXTS } from '../../Contexts';
import { AppContext as AccountContext } from '../../Account';
import { AppContext as WalletContext} from '../../Wallet';
import { AppContext as HomePageContext} from '../../HomePage';
import { AppContext as NftContext} from '../../NFTs';
import { AppContext as JournalContext} from '../../App';

import "./ModalContentOnSubmit.scss";
import { types } from '../../reducers/journalReducer';

const ModalContentSubmit = (props) => {

    const {
        closePage,
        context
    } = props;

    let AppContext;
    if(context === UI_CONTEXTS.JOURNAL){
        AppContext = JournalContext;
    }
    if(context === UI_CONTEXTS.NFT){
        AppContext = NftContext
    }
    if(context === UI_CONTEXTS.HOME_PAGE){
        AppContext = HomePageContext;
    }
    if(context === UI_CONTEXTS.WALLET){
        AppContext = WalletContext
    }
    if(context === UI_CONTEXTS.ACCOUNT_PAGE){
        AppContext = AccountContext;
    }

    const { journalState, dispatch } = useContext(AppContext);


    const onClick = () => {
        if(closePage){
            closePage();
        }
        dispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: false, which: MODALS_TYPES.onSubmit}
        });
    };

    return(
        <div className={'onSubmitModalContentDiv'}>
            { journalState.modalStatus.success ? 
                <div className={"submitSucessful"}> 
                    <h1>
                        Submit Successful
                    </h1>
                    <img className={'checkMarkImg'} src="check-mark.png" alt="Check Mark" />
                </div> 
                :
                <div className={"submitFailed"}> 
                    <h1>
                        Submit Failed:
                    </h1>
                    <h4>
                        An error occured while attempting to submit your journal entry
                    </h4>
                </div>
            }
            <div className={'buttonDiv'}>
                <button className='button' onClick={onClick}> OK </button> 
            </div>       
                    

        </div>
    )

};

export default ModalContentSubmit;