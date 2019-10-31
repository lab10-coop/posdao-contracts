pragma solidity 0.5.9;

// implements the ValidatorSet Interface as specified in https://wiki.parity.io/Validator-Set.html#non-reporting-contract
// takes a set of validators on initialization and just keeps those.

contract ValidatorSetDummy {
    address[] internal validators;

    event InitiateChange(bytes32 indexed parentHash, address[] newSet);

    /// @dev Ensures the caller is the SYSTEM_ADDRESS. See https://wiki.parity.io/Validator-Set.html
    modifier onlySystem() {
        require(msg.sender == 0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE);
        _;
    }

    constructor(address[] memory initialValidators) public {
        require(initialValidators.length > 0, "no initial validators given");
        validators = initialValidators;
    }

    function getValidators() public view returns(address[] memory) {
        return validators;
    }

    function finalizeChange() external onlySystem {
        // we don't care
    }
}
