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
                icp: parseInt(icp.e8s),
                icp_staked: parseInt(icp_staked.e8s), 
                eth: parseInt(eth.e8s), 
                btc: parseInt(btc.e8s) 
            }
        ];
    })

    return {contributions: contributions_, balance_icp: balance_icp_, accountId_icp: accountId_icp_};
};