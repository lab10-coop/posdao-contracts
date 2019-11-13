pragma solidity 0.5.10;

// implements the Blockreward Interface as specified in https://wiki.parity.io/Block-Reward-Contract.html
// does nothing except making sure that calls of the reward function don't fail.
contract BlockRewardDummy {
    // produce rewards for the given benefactors,
    // with corresponding reward codes.
    // only callable by `SYSTEM_ADDRESS`
    function reward(address[] calldata, uint16[] calldata)
        external
        pure
        returns(address[] memory receiversNative, uint256[] memory rewardsNative)
    {
        return (new address[](0), new uint256[](0));
    }
}
