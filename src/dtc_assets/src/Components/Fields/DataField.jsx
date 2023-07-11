import React, {useCallback} from "react";
import { inTrillions, round2Decimals, shortenHexString } from "../../functionsAndConstants/Utils";
import { copyWalletAddressHelper } from "../../functionsAndConstants/walletFunctions/CopyWalletAddress";
import * as FaIcons from 'react-icons/fa';
import ButtonField from "./Button";
import "./DataField.scss";
import '../../SCSS/section.scss'

const DataField = (props) => {
    const {
        text,
        label,
        onClick_0,
        onClick_1,
        buttonIcon_0,
        buttonIcon_1,
        className,
        isCycles,
        isPrincipal,
        vertical
    } = props;
    
    let text_;
    if(isCycles) text_ = round2Decimals(inTrillions(text));
    else if(isPrincipal) text_ = shortenHexString(text);
    else text_ = text;

    const copyPrincipal = () => copyWalletAddressHelper(text);

    return(
        <div className={`canisterDataDiv ${className ? className : ' '} ${vertical ? 'vertical' : ' '}`}>
            {buttonIcon_0 &&
            <ButtonField
                Icon={buttonIcon_0}
                iconSize={25}
                className={'section'}
                onClick={onClick_0}
            />}
            {label && <div className={'section'}>
                <h5 className={'lebelH5'}>
                    {label} 
                </h5>
            </div>}
            <div className={'section'}>
                <h5 className={'h5DataField'}>
                    {(text_) ? text_ : 'Loading...'} {(isCycles && text_) ? "T" : ''} 
                </h5>
                {isPrincipal && 
                    <ButtonField
                        Icon={FaIcons.FaCopy}
                        iconSize={17.5}
                        onClick={copyPrincipal}
                        withBox={false}
                    />
                }
            </div>
            {buttonIcon_1 &&
            <ButtonField
                Icon={buttonIcon_1}
                iconSize={25}
                className={'section'}
                onClick={onClick_1}
            />}
        </div>
    )
};

export default DataField;