/*
 * Tests specific for native coin staking for functionality not covered in StakingAuRa.js
 */

const BlockRewardAuRa = artifacts.require('BlockRewardAuRaCoinsMock');
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy');
//const RandomAuRa = artifacts.require('RandomAuRaMock');
const RandomAuRa =  artifacts.require('RandomAuRa');
const ValidatorSetAuRa = artifacts.require('ValidatorSetAuRaMock');
const StakingAuRaCoins = artifacts.require('StakingAuRaCoinsMock');

const ERROR_MSG = 'VM Exception while processing transaction: revert';
const BN = web3.utils.BN;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bn')(BN))
  .should();

contract('StakingAuRa', async accounts => {
  let owner;
  let initialValidators;
  let initialStakingAddresses;
  let blockRewardAuRa;
  let randomAuRa;
  let stakingAuRa;
  let validatorSetAuRa;

  beforeEach(async () => {
    owner = accounts[0];
    initialValidators = accounts.slice(1, 3 + 1); // accounts[1...3]
    initialStakingAddresses = accounts.slice(4, 6 + 1); // accounts[4...6]
    initialStakingAddresses.length.should.be.equal(3);
    initialStakingAddresses[0].should.not.be.equal('0x0000000000000000000000000000000000000000');
    initialStakingAddresses[1].should.not.be.equal('0x0000000000000000000000000000000000000000');
    initialStakingAddresses[2].should.not.be.equal('0x0000000000000000000000000000000000000000');
    // Deploy BlockReward contract
    blockRewardAuRa = await BlockRewardAuRa.new();
    blockRewardAuRa = await AdminUpgradeabilityProxy.new(blockRewardAuRa.address, owner, []);
    blockRewardAuRa = await BlockRewardAuRa.at(blockRewardAuRa.address);

    // Deploy Random contract
    randomAuRa = await RandomAuRa.new();
    randomAuRa = await AdminUpgradeabilityProxy.new(randomAuRa.address, owner, []);
    randomAuRa = await RandomAuRa.at(randomAuRa.address);

    // Deploy Staking contract
    stakingAuRa = await StakingAuRaCoins.new();
    stakingAuRa = await AdminUpgradeabilityProxy.new(stakingAuRa.address, owner, []);
    stakingAuRa = await StakingAuRaCoins.at(stakingAuRa.address);
    // Deploy ValidatorSet contract
    validatorSetAuRa = await ValidatorSetAuRa.new();
    validatorSetAuRa = await AdminUpgradeabilityProxy.new(validatorSetAuRa.address, owner, []);
    validatorSetAuRa = await ValidatorSetAuRa.at(validatorSetAuRa.address);
    // Initialize ValidatorSet
    await validatorSetAuRa.initialize(
      blockRewardAuRa.address, // _blockRewardContract
      randomAuRa.address, // _randomContract
      stakingAuRa.address, // _stakingContract
      initialValidators, // _initialMiningAddresses
      initialStakingAddresses, // _initialStakingAddresses
      false // _firstValidatorIsUnremovable
    ).should.be.fulfilled;
  });

  describe('addPool() [native coins]', async () => {
    let candidateMiningAddress;
    let candidateStakingAddress;
    let stakeUnit = new BN(web3.utils.toWei('1', 'ether'));

    beforeEach(async () => {
      candidateMiningAddress = accounts[7];
      candidateStakingAddress = accounts[8];

      // Initialize StakingAuRa
      await stakingAuRa.initialize(
        validatorSetAuRa.address, // _validatorSetContract
        initialStakingAddresses, // _initialStakingAddresses
        web3.utils.toWei('1', 'ether'), // _delegatorMinStake
        web3.utils.toWei('1', 'ether'), // _candidateMinStake
        120954, // _stakingEpochDuration
        0, // _stakingEpochStartBlock
        4320 // _stakeWithdrawDisallowPeriod
      ).should.be.fulfilled;

      // Emulate block number
      await stakingAuRa.setCurrentBlockNumber(2).should.be.fulfilled;
      await validatorSetAuRa.setCurrentBlockNumber(2).should.be.fulfilled;
    });

    it('should create a new pool', async () => {
      false.should.be.equal(await stakingAuRa.isPoolActive.call(candidateStakingAddress));
      await stakingAuRa.addPool(0, candidateMiningAddress, {
        from: candidateStakingAddress,
        value: stakeUnit.mul(new BN(1))
      }).should.be.fulfilled;
      true.should.be.equal(await stakingAuRa.isPoolActive.call(candidateStakingAddress));
    });
  });
});
