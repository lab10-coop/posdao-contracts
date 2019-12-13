/*
 * Tests emission of epoch rewards to stakers and the sustainability fond in native coins.
 * Distribution to stakers was not touched, thus can rely on existing tests in BlockRewardAuRa.js
 */

const BlockRewardAuRa = artifacts.require('BlockRewardAuRaCoinsMock');
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy');
const RandomAuRa = artifacts.require('RandomAuRaMock');
const ValidatorSetAuRa = artifacts.require('ValidatorSetAuRaMock');
const StakingAuRa = artifacts.require('StakingAuRaCoinsMock');

const ERROR_MSG = 'VM Exception while processing transaction: revert';
const BN = web3.utils.BN;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bn')(BN))
  .should();

contract('BlockRewardAuRa', async accounts => {
  let owner;
  let blockRewardAuRa;
  let randomAuRa;
  let stakingAuRa;
  let validatorSetAuRa;
  let candidateMinStake;
  let delegatorMinStake;
  let nativeRewardUndistributed = new BN(0);

  const COLLECT_ROUND_LENGTH = 114;
  const STAKING_EPOCH_DURATION = 120954;
  const STAKING_EPOCH_START_BLOCK = STAKING_EPOCH_DURATION * 10 + 1;
  const STAKE_WITHDRAW_DISALLOW_PERIOD = 4320;

  const SUSTAINABILITY_POOL = accounts[199];
  const STAKERS_REWARD_PER_EPOCH = web3.utils.toWei(new BN(21600*2), 'ether');
  const POOL_REWARD_PER_EPOCH = web3.utils.toWei(new BN(21600), 'ether');

  describe('reward() [native coin] with epoch rewards enabled', async () => {
    it('network started', async () => {
      owner = accounts[0];

      const initialValidators = accounts.slice(1, 3 + 1); // accounts[1...3]
      const initialStakingAddresses = accounts.slice(4, 6 + 1); // accounts[4...6]
      initialStakingAddresses.length.should.be.equal(3);
      initialStakingAddresses[0].should.not.be.equal('0x0000000000000000000000000000000000000000');
      initialStakingAddresses[1].should.not.be.equal('0x0000000000000000000000000000000000000000');
      initialStakingAddresses[2].should.not.be.equal('0x0000000000000000000000000000000000000000');
      // Deploy BlockRewardAuRa contract
      blockRewardAuRa = await BlockRewardAuRa.new();
      blockRewardAuRa = await AdminUpgradeabilityProxy.new(blockRewardAuRa.address, owner, []);
      blockRewardAuRa = await BlockRewardAuRa.at(blockRewardAuRa.address);
      // Deploy RandomAuRa contract
      randomAuRa = await RandomAuRa.new();
      randomAuRa = await AdminUpgradeabilityProxy.new(randomAuRa.address, owner, []);
      randomAuRa = await RandomAuRa.at(randomAuRa.address);
      // Deploy StakingAuRa contract
      stakingAuRa = await StakingAuRa.new();
      stakingAuRa = await AdminUpgradeabilityProxy.new(stakingAuRa.address, owner, []);
      stakingAuRa = await StakingAuRa.at(stakingAuRa.address);
      // Deploy ValidatorSetAuRa contract
      validatorSetAuRa = await ValidatorSetAuRa.new();
      validatorSetAuRa = await AdminUpgradeabilityProxy.new(validatorSetAuRa.address, owner, []);
      validatorSetAuRa = await ValidatorSetAuRa.at(validatorSetAuRa.address);

      // Initialize ValidatorSetAuRa
      await validatorSetAuRa.initialize(
        blockRewardAuRa.address, // _blockRewardContract
        randomAuRa.address, // _randomContract
        stakingAuRa.address, // _stakingContract
        initialValidators, // _initialMiningAddresses
        initialStakingAddresses, // _initialStakingAddresses
        false // _firstValidatorIsUnremovable
      ).should.be.fulfilled;

      // Initialize StakingAuRa
      await stakingAuRa.initialize(
        validatorSetAuRa.address, // _validatorSetContract
        initialStakingAddresses, // _initialStakingAddresses
        web3.utils.toWei('1', 'ether'), // _delegatorMinStake
        web3.utils.toWei('1', 'ether'), // _candidateMinStake
        STAKING_EPOCH_DURATION, // _stakingEpochDuration
        STAKING_EPOCH_START_BLOCK, // _stakingEpochStartBlock
        STAKE_WITHDRAW_DISALLOW_PERIOD // _stakeWithdrawDisallowPeriod
      ).should.be.fulfilled;

      candidateMinStake = await stakingAuRa.candidateMinStake.call();
      delegatorMinStake = await stakingAuRa.delegatorMinStake.call();

      // Initialize BlockRewardAuRa
      await blockRewardAuRa.initialize(
        validatorSetAuRa.address,
        SUSTAINABILITY_POOL,
        STAKERS_REWARD_PER_EPOCH,
        POOL_REWARD_PER_EPOCH
      ).should.be.fulfilled;

      // Initialize RandomAuRa
      await randomAuRa.initialize(
        COLLECT_ROUND_LENGTH,
        validatorSetAuRa.address
      ).should.be.fulfilled;

      // Start the network
      await setCurrentBlockNumber(STAKING_EPOCH_START_BLOCK);
      await callFinalizeChange();
      (await validatorSetAuRa.validatorSetApplyBlock.call()).should.be.bignumber.equal(new BN(STAKING_EPOCH_START_BLOCK));
    });

    it('staking epoch #0 finished', async () => {
      const stakingEpoch = await stakingAuRa.stakingEpoch.call();
      stakingEpoch.should.be.bignumber.equal(new BN(0));

      const stakingEpochEndBlock = (await stakingAuRa.stakingEpochStartBlock.call()).add(new BN(STAKING_EPOCH_DURATION)).sub(new BN(1));
      await setCurrentBlockNumber(stakingEpochEndBlock);

      const validators = await validatorSetAuRa.getValidators.call();
      for (let i = 0; i < validators.length; i++) {
        await randomAuRa.setSentReveal(validators[i]).should.be.fulfilled;
      }

      (await validatorSetAuRa.emitInitiateChangeCallable.call()).should.be.equal(false);
      await callReward();
      (await stakingAuRa.stakingEpoch.call()).should.be.bignumber.equal(stakingEpoch.add(new BN(1)));
      (await validatorSetAuRa.emitInitiateChangeCallable.call()).should.be.equal(true);
      (await blockRewardAuRa.nativeRewardUndistributed.call()).should.be.bignumber.equal(nativeRewardUndistributed);
    });

    it('staking epoch #1 started', async () => {
      const validators = await validatorSetAuRa.getValidators.call();

      const stakingEpochStartBlock = await stakingAuRa.stakingEpochStartBlock.call();
      stakingEpochStartBlock.should.be.bignumber.equal(new BN(STAKING_EPOCH_START_BLOCK + STAKING_EPOCH_DURATION * 1));
      await setCurrentBlockNumber(stakingEpochStartBlock);

      const {logs} = await validatorSetAuRa.emitInitiateChange().should.be.fulfilled;
      logs[0].event.should.be.equal("InitiateChange");
      logs[0].args.newSet.should.be.deep.equal(validators);

      const validatorsToBeFinalized = await validatorSetAuRa.validatorsToBeFinalized.call();
      validatorsToBeFinalized.miningAddresses.should.be.deep.equal(validators);
      validatorsToBeFinalized.forNewEpoch.should.be.equal(true);

      const currentBlock = stakingEpochStartBlock.add(new BN(Math.floor(validators.length / 2) + 1));
      await setCurrentBlockNumber(currentBlock);

      (await validatorSetAuRa.validatorSetApplyBlock.call()).should.be.bignumber.equal(new BN(0));
      await callFinalizeChange();
      (await validatorSetAuRa.validatorSetApplyBlock.call()).should.be.bignumber.equal(currentBlock);
      (await validatorSetAuRa.getValidators.call()).should.be.deep.equal(validators);

      const emittedRewards = await callReward();
      emittedRewards.receivers.length.should.be.equal(0);
    });

    it('  validators and their delegators place stakes during the epoch #1', async () => {
      const validators = await validatorSetAuRa.getValidators.call();

      for (let i = 0; i < validators.length; i++) {
        const stakingAddress = await validatorSetAuRa.stakingByMiningAddress.call(validators[i]);
        /*
        // Mint some balance for each validator (imagine that each validator got the tokens from a bridge)
        await erc677Token.mint(stakingAddress, candidateMinStake, {from: owner}).should.be.fulfilled;
        candidateMinStake.should.be.bignumber.equal(await erc677Token.balanceOf.call(stakingAddress));
         */

        // Validator places stake on themselves
        await stakingAuRa.stake(stakingAddress, candidateMinStake, {from: stakingAddress, value: candidateMinStake}).should.be.fulfilled;

        const delegatorsLength = 3;
        const delegators = accounts.slice(11 + i * delegatorsLength, 11 + i * delegatorsLength + delegatorsLength);
        for (let j = 0; j < delegators.length; j++) {
          /*
          // Mint some balance for each delegator (imagine that each delegator got the tokens from a bridge)
          await erc677Token.mint(delegators[j], delegatorMinStake, {from: owner}).should.be.fulfilled;
          delegatorMinStake.should.be.bignumber.equal(await erc677Token.balanceOf.call(delegators[j]));
           */

          // Delegator places stake on the validator
          await stakingAuRa.stake(stakingAddress, delegatorMinStake, {from: delegators[j], value: delegatorMinStake}).should.be.fulfilled;
        }
      }
    });

    it('  intermediate block should emit no reward', async () => {
      const stakingEpochEndBlock = await stakingAuRa.stakingEpochEndBlock.call();
      await setCurrentBlockNumber(stakingEpochEndBlock - STAKE_WITHDRAW_DISALLOW_PERIOD - 1);
      const emittedRewards = await callReward();
      emittedRewards.receivers.length.should.be.equal(0);
    });

    it('staking epoch #1 finished', async () => {
      const stakingEpoch = await stakingAuRa.stakingEpoch.call();
      stakingEpoch.should.be.bignumber.equal(new BN(1));

      const stakingEpochEndBlock = (await stakingAuRa.stakingEpochStartBlock.call()).add(new BN(STAKING_EPOCH_DURATION)).sub(new BN(1));
      await setCurrentBlockNumber(stakingEpochEndBlock);

      let validators = await validatorSetAuRa.getValidators.call();
      const blocksCreated = stakingEpochEndBlock.sub(await validatorSetAuRa.validatorSetApplyBlock.call()).div(new BN(validators.length));
      blocksCreated.should.be.bignumber.above(new BN(0));
      for (let i = 0; i < validators.length; i++) {
        await blockRewardAuRa.setBlocksCreated(stakingEpoch, validators[i], blocksCreated).should.be.fulfilled;
        await randomAuRa.setSentReveal(validators[i]).should.be.fulfilled;
      }

      (await validatorSetAuRa.emitInitiateChangeCallable.call()).should.be.equal(false);

      const emittedRewards = await callReward();
      const brIndex = emittedRewards.receivers.indexOf(blockRewardAuRa.address);
      brIndex.should.not.be.equal(-1);
      if(brIndex !== -1) {
        emittedRewards.rewards[brIndex].should.be.bignumber.equal(STAKERS_REWARD_PER_EPOCH);
      }
      const poolIndex = emittedRewards.receivers.indexOf(SUSTAINABILITY_POOL);
      poolIndex.should.not.be.equal(-1);
      if(poolIndex !== -1) {
        emittedRewards.rewards[poolIndex].should.be.bignumber.equal(POOL_REWARD_PER_EPOCH);
      }
    });

    it('staking epoch #2 started', async () => {
      const stakingEpochStartBlock = await stakingAuRa.stakingEpochStartBlock.call();
      stakingEpochStartBlock.should.be.bignumber.equal(new BN(STAKING_EPOCH_START_BLOCK + STAKING_EPOCH_DURATION * 2));
      await setCurrentBlockNumber(stakingEpochStartBlock);

      const emittedRewards = await callReward();
      emittedRewards.receivers.length.should.be.equal(0);
    });

    it('  intermediate block should emit no reward', async () => {
      const stakingEpochEndBlock = await stakingAuRa.stakingEpochEndBlock.call();
      await setCurrentBlockNumber(stakingEpochEndBlock - STAKE_WITHDRAW_DISALLOW_PERIOD + 1);
      const emittedRewards = await callReward();
      emittedRewards.receivers.length.should.be.equal(0);
    });

    it('staking epoch #2 finished', async () => {
      const stakingEpoch = await stakingAuRa.stakingEpoch.call();
      stakingEpoch.should.be.bignumber.equal(new BN(2));

      const stakingEpochEndBlock = (await stakingAuRa.stakingEpochStartBlock.call()).add(new BN(STAKING_EPOCH_DURATION)).sub(new BN(1));
      await setCurrentBlockNumber(stakingEpochEndBlock);

      const emittedRewards = await callReward();
      const brIndex = emittedRewards.receivers.indexOf(blockRewardAuRa.address);
      brIndex.should.not.be.equal(-1);
      if(brIndex !== -1) {
        emittedRewards.rewards[brIndex].should.be.bignumber.equal(STAKERS_REWARD_PER_EPOCH);
      }
      const poolIndex = emittedRewards.receivers.indexOf(SUSTAINABILITY_POOL);
      poolIndex.should.not.be.equal(-1);
      if(poolIndex !== -1) {
        emittedRewards.rewards[poolIndex].should.be.bignumber.equal(POOL_REWARD_PER_EPOCH);
      }
    });
  });

    // ===================================== HELPER FUNCTIONS =====================================

  Array.prototype.sortedEqual = function(arr) {
    [...this].sort().should.be.deep.equal([...arr].sort());
  };

  async function callFinalizeChange() {
    await validatorSetAuRa.setSystemAddress(owner).should.be.fulfilled;
    await validatorSetAuRa.finalizeChange({from: owner}).should.be.fulfilled;
    await validatorSetAuRa.setSystemAddress('0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE').should.be.fulfilled;
  }

  // returns an object { receivers, rewards }
  async function callReward() {
    const validators = await validatorSetAuRa.getValidators.call();
    await blockRewardAuRa.setSystemAddress(owner).should.be.fulfilled;

    const ret = await blockRewardAuRa.reward.call([validators[0]], [0], {from: owner}).should.be.fulfilled;
    console.assert(ret.receiversNative.length === ret.rewardsNative.length);

    await blockRewardAuRa.reward([validators[0]], [0], {from: owner}).should.be.fulfilled;
    await blockRewardAuRa.setSystemAddress('0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE').should.be.fulfilled;
    //console.log(`rewardSend log: ${rewardResult.logs[0].args.receivers}, ${rewardResult.logs[0].args.rewards}`);
    //console.log(`reward result: ${JSON.stringify(rewardResult, null, 2)}`);
    return {
      receivers: ret.receiversNative,
      rewards: ret.rewardsNative
    };
  }

  async function setCurrentBlockNumber(blockNumber) {
    await blockRewardAuRa.setCurrentBlockNumber(blockNumber).should.be.fulfilled;
    await randomAuRa.setCurrentBlockNumber(blockNumber).should.be.fulfilled;
    await stakingAuRa.setCurrentBlockNumber(blockNumber).should.be.fulfilled;
    await validatorSetAuRa.setCurrentBlockNumber(blockNumber).should.be.fulfilled;
  }
});
