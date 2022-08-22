import React from 'react';
import { nanoSecondsToMiliSeconds, 
    shortenHexString, 
    toHexString, 
    fromE8s 
} from "../../Utils";
export const Transaction = (props) => {

    const {
        balanceDelta,
        increase,
        recipient,
        timeStamp,
        source
    } = props;

    const unavailble = 'unavailble';
    const date = timeStamp ? new Date(nanoSecondsToMiliSeconds(parseInt(timeStamp))).toString() : unavailble;
    const sourceOfTx = source ? shortenHexString(toHexString(source)) : unavailble;
    const recipientOfTx = recipient ? shortenHexString(toHexString(recipient)) : unavailble;

    return(
            <div className='transactionHistoryDiv' >
                <div className="balanceDeltaDiv">
                    <h4 className="balanceDeltaText">
                        Change in balance: 
                    </h4>
                    <p className={`balanceDeltaValue${increase ? " increase" : " decrease"}`}> 
                        {` ${increase ? "+ " : "- "}  ${fromE8s(parseInt(balanceDelta))} ICP`} 
                    </p>
                </div>
                {
                    (recipientOfTx !== unavailble) ? 
                    <div className="balanceDeltaDiv">
                        <h4 className="balanceDeltaText">
                            Recipient Address: 
                        </h4>
                        <p className={`balanceDeltaValue${increase ? " increase" : " decrease"}`}> 
                            {recipientOfTx} 
                        </p>
                    </div> : null 
                }
                <div className="dateDiv">
                    <h4 className="dateText">
                        Date: 
                    </h4>
                    <p className={`dateValue${increase ? " increase" : " decrease"}`}> 
                        {date} 
                    </p>
                </div>
                <div className="balanceDeltaDiv">
                    <h4 className="balanceDeltaText">
                        Source Address: 
                    </h4>
                    <p className={`balanceDeltaValue${increase ? " increase" : " decrease"}`}> 
                        {sourceOfTx} 
                    </p>
                </div>
            </div>                
    )
};