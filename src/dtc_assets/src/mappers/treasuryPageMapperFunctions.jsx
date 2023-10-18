import { toHexString } from "../functionsAndConstants/Utils";
export const mapBackendTreasuryDataToFrontEndObj = (props) => {
    const {
        contributions,
        accountId_icp,
        balance_icp
    } = props;
    
    const accountId_icp_ = toHexString(new Uint8Array( [...accountId_icp]));
    const balance_icp_ = parseInt(balance_icp.e8s);
    const contributions_ = contributions.map(([principal, treasuryContributions ]) => {
        let {icp, icp_staked, eth, btc} = treasuryContributions;
        return [
            principal, 
            {
                icp: parseInt(icp),
                icp_staked: parseInt(icp_staked), 
                eth: parseInt(eth), 
                btc: parseInt(btc) 
            }
        ];
    })

    return {contributions: contributions_, balance_icp: balance_icp_, accountId_icp: accountId_icp_};
};