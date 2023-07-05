import React , {useContext}from "react";
import { retrieveContext } from "../../Contexts";
import { AppContext as AccountContext} from '../../Routes/Account';
import { AppContext as HomePageContext} from '../../Routes/HomePage';
import { AppContext as JournalContext} from '../../Routes/App';
import { AppContext as WalletContext} from '../../Routes/Wallet';
import { AppContext as TreasuryContext} from '../../Routes/Treasury';
import { AppContext as GroupJournalContext} from '../../Routes/GroupJournal';
import { types } from "../../reducers/journalReducer";
import { MODALS_TYPES } from "../../Constants";
import ButtonField from "../Fields/Button";
import "./DateOutOfRange.scss"

const DateOutOfRange = (props) => {
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
        <div className="contentDiv__dateOutOfRange">

            <h3 className='h3Texts'>
                { journalState.modalStatus.beyondMax ? 
                    'You may only select dates as late as the current date.' :
                    'The unlock date must be at least one month in the future.'
                }
            </h3>
            <ButtonField
                text={'OK'}
                className={'button'}
                onClick={onClick}
                withBox={true}
            />
        </div>
    )
};
export default DateOutOfRange;