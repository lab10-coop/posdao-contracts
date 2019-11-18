pragma solidity 0.5.10;
pragma experimental ABIEncoderV2;

import './ValidatorSetHbbft.sol';

/// @dev mock contract
contract ValidatorSetHbbftMock is ValidatorSetHbbft {

    struct ValidatorHbbftData {
        bytes32 pubkey_high;
        bytes32 pubkey_low;
    }

    mapping(address => ValidatorHbbftData) public validatorPubkeys;

    function finalizeChange() external onlySystem {
        _currentValidators = _pendingValidators;
        delete _pendingValidators;
    }

    constructor(address[] memory _validators, ValidatorHbbftData[] memory _pubkeys) public {
        _currentValidators = _validators;
        for (uint256 i = 0; i < _validators.length; i++) {
            validatorPubkeys[_validators[i]] = _pubkeys[i];
        }
    }

    // =============================================== Setters ========================================================


    // =============================================== Getters ========================================================

    function getValidators() public view returns(address[] memory) {
        return _currentValidators;
    }

    function getPendingValidators() public view returns(address[] memory) {
        return _pendingValidators;
    }

    // =============================================== Internal ========================================================

    function _setPendingValidators(address[] memory _stakingAddresses) internal {
        _pendingValidators = _stakingAddresses;
    }

}
