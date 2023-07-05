import React , {useContext}from "react";
import { AppContext as AccountContext} from '../../Routes/Account';
import { AppContext as HomePageContext} from '../../Routes/HomePage';
import { AppContext as JournalContext} from '../../Routes/App';
import { AppContext as WalletContext} from '../../Routes/Wallet';
import { AppContext as TreasuryContext} from '../../Routes/Treasury';
import { AppContext as GroupJournalContext} from '../../Routes/GroupJournal';
import { retrieveContext } from "../../Contexts";
import './RegistrationResponseModal.scss';
import { types } from "../../reducers/journalReducer";
import { MODALS_TYPES } from "../../Constants";
import ButtonField from "../Fields/Button";

const RegistrationResponse = (props) => {
    const {
        context
    } = props;

    let contexts = {
        WalletContext,
        JournalContext,
        HomePageContext,
        AccountContext,
        TreasuryContext,
        GroupJournalContext
    };

    let AppContext = retrieveContext(contexts, context);
    const {journalState, journalDispatch} = useContext(AppContext);

    const onClick = () => {
        journalDispatch({
            actionType: types.SET_MODAL_STATUS,
            payload: {show: false, which: MODALS_TYPES.onSubmit}
    });
    }

    return(
        <div className="contentDiv__registrationResponse">
            { journalState.modalStatus.success ? 
                <>
                    <h3 className='success'>
                        Action successfully executed.
                    </h3>
                </> :
                <>
                    <h3 className='fail'>
                        Failed to update. Only the owner of the corresponding NFT may perform this action.
                    </h3>
                </>
            }
            <ButtonField
                text={'OK'}
                className={'button'}
                onClick={onClick}
                withBox={true}
            />
        </div>
    )
};
export default RegistrationResponse;