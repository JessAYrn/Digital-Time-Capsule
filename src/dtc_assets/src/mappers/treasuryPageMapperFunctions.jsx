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
                icp: {total: parseInt(icp.total.e8s), collateral: parseInt(icp.collateral.e8s)},
                icp_staked: {total: parseInt(icp_staked.total.e8s), collateral: parseInt(icp_staked.collateral.e8s)},
                eth: {total: parseInt(eth.total.e8s), collateral: parseInt(eth.collateral.e8s)},
                btc: {total: parseInt(btc.total.e8s), collateral: parseInt(btc.collateral.e8s)}
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