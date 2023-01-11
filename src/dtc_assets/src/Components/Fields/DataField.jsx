import React, {useCallback} from "react";
import { inTrillions, round2Decimals, shortenHexString } from "../../Utils";
import { copyWalletAddressHelper } from "../walletFunctions/CopyWalletAddress";
import * as FaIcons from 'react-icons/fa';
import ButtonField from "./Button";
import "./DataField.scss";

const DataField = (props) => {
    const {
        text,
        label,
        className,
        isCycles,
        isPrincipal
    } = props;
    
    let text_;
    if(isCycles) text_ = round2Decimals(inTrillions(text));
    else if(isPrincipal) text_ = shortenHexString(text);
    else text_ = text;

    const copyPrincipal = () => copyWalletAddressHelper(text);

    return(
        <div className={`canisterDataDiv ${className ? className : ' '}`}>
            <div className={'section'}>
                <h5 className={'lebelH5'}>
                    {label} 
                </h5>
            </div>
            <div className={'section'}>
                <h5 className={'h5DataField'}>
                    {(text_) ? text_ : 'Loading...'} {(isCycles && text_) ? "T" : ''} 
                    {isPrincipal && 
                        <ButtonField
                            Icon={FaIcons.FaCopy}
                            iconSize={17.5}
                            onClick={copyPrincipal}
                            withBox={false}
                        />
                    }
                </h5>
            </div>
        </div>
    )
};

export default DataField;