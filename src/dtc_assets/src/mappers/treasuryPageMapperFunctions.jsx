import { toHexString } from "../functionsAndConstants/Utils";
export const mapBackendTreasuryDataToFrontEndObj = (props) => {
    const {
        deposits,
        stakes,
        accountId_icp,
        balance_icp
    } = props;
    
    const accountId_icp_ = toHexString(new Uint8Array( [...accountId_icp]));
    const balance_icp_ = parseInt(balance_icp.e8s);
    const deposits_ = deposits.map(([principal, treasuryDeposit ]) => {
        let {icp, icp_staked, eth, btc} = treasuryDeposit;
        return [
            principal, 
            {
                icp: {e8s: parseInt(icp.e8s)},
                icp_staked: {e8s: parseInt(icp_staked.e8s)},
                eth: {e8s: parseInt(eth.e8s)},
                btc: {e8s: parseInt(btc.e8s)}
            }
        ];
    });

    const stakes_ = stakes.map(([principal, userStakes]) => {
        let {icp} = userStakes;
        const icp_ = icp.map(([neuronId, stakeInfo]) => {
            return [neuronId, {
                stake_e8s : parseInt(stakeInfo.stake_e8s),
                voting_power: parseInt(stakeInfo.voting_power),
            }];
        });
        return [principal, {icp: icp_}];
    });

    return {deposits: deposits_, balance_icp: balance_icp_, accountId_icp: accountId_icp_, stakes: stakes_};
};