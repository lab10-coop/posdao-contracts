pragma solidity 0.5.10;

import "./BlockRewardAuRaBase.sol";
import "../interfaces/IBlockRewardAuRaCoins.sol";


contract BlockRewardAuRaCoins is BlockRewardAuRaBase, IBlockRewardAuRaCoins {

    // =============================================== Setters ========================================================

    /// @dev Called by the `StakingAuRa.claimReward` function to transfer native coins
    /// from the balance of the `BlockRewardAuRa` contract to the specified address as a reward.
    /// @param _nativeCoins The amount of native coins to transfer as a reward.
    /// @param _to The target address to transfer the amounts to.
    function transferReward(uint256 _nativeCoins, address payable _to) external onlyStakingContract {
        _transferNativeReward(_nativeCoins, _to);
    }

    // =============================================== Getters ========================================================

    /// @dev Returns the reward amount in native coins for
    /// some delegator with the specified stake amount placed into the specified
    /// pool before the specified staking epoch. Used by the `StakingAuRa.claimReward` function.
    /// @param _delegatorStake The stake amount placed by some delegator into the `_poolMiningAddress` pool.
    /// @param _stakingEpoch The serial number of staking epoch.
    /// @param _poolMiningAddress The pool mining address.
    /// @return `uint256 nativeReward` - the reward amount in native coins.
    function getDelegatorReward(
        uint256 _delegatorStake,
        uint256 _stakingEpoch,
        address _poolMiningAddress
    ) external view returns(uint256 nativeReward) {
        uint256 validatorStake = snapshotPoolValidatorStakeAmount[_stakingEpoch][_poolMiningAddress];
        uint256 totalStake = snapshotPoolTotalStakeAmount[_stakingEpoch][_poolMiningAddress];

        nativeReward = delegatorShare(
            _stakingEpoch,
            _delegatorStake,
            validatorStake,
            totalStake,
            epochPoolNativeReward[_stakingEpoch][_poolMiningAddress]
        );
    }

    /// @dev Returns the reward amount in native coins for
    /// the specified validator and for the specified staking epoch.
    /// Used by the `StakingAuRa.claimReward` function.
    /// @param _stakingEpoch The serial number of staking epoch.
    /// @param _poolMiningAddress The pool mining address.
    /// @return `uint256 nativeReward` - the reward amount in native coins.
    function getValidatorReward(
        uint256 _stakingEpoch,
        address _poolMiningAddress
    ) external view returns(uint256 nativeReward) {
        uint256 validatorStake = snapshotPoolValidatorStakeAmount[_stakingEpoch][_poolMiningAddress];
        uint256 totalStake = snapshotPoolTotalStakeAmount[_stakingEpoch][_poolMiningAddress];

        nativeReward = validatorShare(
            _stakingEpoch,
            validatorStake,
            totalStake,
            epochPoolNativeReward[_stakingEpoch][_poolMiningAddress]
        );
    }

    // ============================================== Internal ========================================================

    function _distributeTokenRewards(
        address, uint256, uint256, uint256, address[] memory, uint256[] memory, uint256
    ) internal {
    }

    // override: adds the stakers reward per epoch
    function _distributeNativeRewards(
        uint256 _stakingEpoch,
        uint256 _totalRewardShareNum,
        uint256 _totalRewardShareDenom,
        address[] memory _validators,
        uint256[] memory _blocksCreatedShareNum,
        uint256 _blocksCreatedShareDenom
    ) internal returns(uint256) {
        uint256 totalReward = bridgeNativeFee + nativeRewardUndistributed;

        // add the epoch reward for stakers
        totalReward += stakersRewardPerEpoch;

        if (totalReward == 0) {
            return 0;
        }

        bridgeNativeFee = 0;

        uint256 rewardToDistribute = 0;
        uint256 distributedAmount = 0;

        if (_blocksCreatedShareDenom != 0 && _totalRewardShareDenom != 0) {
            rewardToDistribute = totalReward * _totalRewardShareNum / _totalRewardShareDenom;

            if (rewardToDistribute != 0) {
                for (uint256 i = 0; i < _validators.length; i++) {
                    uint256 poolReward =
                    rewardToDistribute * _blocksCreatedShareNum[i] / _blocksCreatedShareDenom;
                    epochPoolNativeReward[_stakingEpoch][_validators[i]] = poolReward;
                    distributedAmount += poolReward;
                    if (poolReward != 0) {
                        _epochsPoolGotRewardFor[_validators[i]].push(_stakingEpoch);
                    }
                }
            }
        }

        nativeRewardUndistributed = totalReward - distributedAmount;

        return distributedAmount;
    }

    // override: adds the sustainability fund reward at every epoch end
    function _mintNativeCoins(
        uint256 _nativeTotalRewardAmount,
        uint256 _queueLimit,
        bool _isEpochEndBlock
    ) internal returns(address[] memory receivers, uint256[] memory rewards) {
        (address[] memory receiversTmp, uint256[] memory rewardsTmp) =
            super._mintNativeCoins(_nativeTotalRewardAmount, _queueLimit, _isEpochEndBlock);

        if (fundRewardPerEpoch > 0 && _isEpochEndBlock) {
            // TODO: maybe Solidity allows to do this a bit more concisely
            receivers = new address[](receiversTmp.length + 1);
            rewards = new uint256[](rewardsTmp.length + 1);
            // copy over all elements
            for (uint256 i = 0; i < receiversTmp.length; i++) {
                receivers[i] = receiversTmp[i];
                rewards[i] = rewardsTmp[i];
            }
            // add the pool
            receivers[receivers.length-1] = sustainabilityFund;
            rewards[rewards.length-1] = fundRewardPerEpoch;
        } else {
            receivers = receiversTmp;
            rewards = rewardsTmp;
        }
        return (receivers, rewards);
    }
}
