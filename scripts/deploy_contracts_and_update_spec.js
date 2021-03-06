// this is a copy of make_spec.js, modified such that contracts aren't deployed in the genesis block,
// but on a running chain - as is needed for upgrading an existing chain to POSDAO.
// Requires an unlocked and funded account provided by the connected RPC node.

const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const utils = require('./utils/utils');

const MIN_DEPLOYER_BALANCE_WEI = '1000000000000000000'; // wild guess for gas costs: 1 native token
const GAS_PRICE = process.env.GAS_PRICE || 100000000000; // 100 Gwei
const GAS_LIMIT = process.env.GAS_LIMIT || 6000000; // 6 MGas

main();

async function main() {
  const rpcUrl = process.env.RPC_URL || "http://localhost:8545";
  console.log(`owner is ${process.env.OWNER}`);
  const owner = process.env.OWNER.trim();
  let initialValidators = process.env.INITIAL_VALIDATORS.split(',');
  for (let i = 0; i < initialValidators.length; i++) {
    initialValidators[i] = initialValidators[i].trim();
  }
  let stakingAddresses = process.env.STAKING_ADDRESSES.split(',');
  for (let i = 0; i < stakingAddresses.length; i++) {
    stakingAddresses[i] = stakingAddresses[i].trim();
  }
  const firstValidatorIsUnremovable = process.env.FIRST_VALIDATOR_IS_UNREMOVABLE === 'true';
  const stakingEpochDuration = process.env.STAKING_EPOCH_DURATION;
  const stakeWithdrawDisallowPeriod = process.env.STAKE_WITHDRAW_DISALLOW_PERIOD;
  const collectRoundLength = process.env.COLLECT_ROUND_LENGTH;
  const erc20Restricted = process.env.ERC20_RESTRICTED === 'true';
  console.assert(collectRoundLength % 2 === 0, 'COLLECT_ROUND_LENGTH not even');
  console.assert(stakingEpochDuration % collectRoundLength === 0, `STAKING_EPOCH_DURATION (${stakingEpochDuration}) is not a multiple of COLLECT_ROUND_LENGTH (${collectRoundLength})`);

  const candidateMinStake = process.env.CANDIDATE_MIN_STAKE || '1';
  const delegatorMinStake = process.env.DELEGATOR_MIN_STAKE || '1';
  console.assert(parseInt(candidateMinStake) > 0, `CANDIDATE_MIN_STAKE (${candidateMinStake}) not valid`);
  console.assert(parseInt(delegatorMinStake) > 0, `DELEGATOR_MIN_STAKE (${delegatorMinStake}) not valid`);

  const maxValidatorsWanted = parseInt(process.env.MAX_VALIDATORS) || undefined;

  if(maxValidatorsWanted) {
    console.assert((maxValidatorsWanted - 1) % 3 === 0, `MAX_VALIDATORS (${maxValidatorsWanted}) is not 3f + 1 for any f`);
    console.assert(collectRoundLength % maxValidatorsWanted === 0, `COLLECT_ROUND_LENGTH (${collectRoundLength}) is not a multiple of MAX_VALIDATORS ${maxValidatorsWanted}`);
  } else {
    console.log('skipping check of MAX_VALIDATORS (not set in env)');
  }

  const specFile = process.env.SPEC_FILE;
  const forkBlock = parseInt(process.env.FORK_BLOCK);
  // implies forkBlock % collectRoundLength === 0
  console.assert(forkBlock % stakingEpochDuration === 0, `FORK_BLOCK (${forkBlock}) is not a multiple of COLLECT_ROUND_LENGTH (${collectRoundLength})`);

  const sustainabilityFund = process.env.SUSTAINABILITY_FUND || '0x0000000000000000000000000000000000000000';
  const stakersRewardPerBlock = process.env.STAKERS_REWARD_PER_EPOCH || 0;
  const fundRewardPerBlock = process.env.FUND_REWARD_PER_EPOCH || 0;
  console.assert(parseInt(stakersRewardPerBlock) >= 0, `STAKERS_REWARD_PER_EPOCH (${stakersRewardPerBlock}) not valid`);
  console.assert(parseInt(fundRewardPerBlock) >= 0, `FUND_REWARD_PER_EPOCH (${fundRewardPerBlock}) not valid`);

  const contracts = {
    ValidatorSetAuRa: { withProxy: true},
    StakingAuRa: { withProxy: true},
    BlockRewardAuRa: { withProxy: true},
    RandomAuRa: { withProxy: true},
    TxPermission: { withProxy: true},
    Certifier: { withProxy: true},
    Registry: { withProxy: false, getDeployArgs: () => [contracts.Certifier.proxyAddress, owner] },

    AdminUpgradeabilityProxy: { skipDeploy: true},
    InitializerAuRa: { skipDeploy: true},
  };

  let spec = JSON.parse(fs.readFileSync(path.join(__dirname, '..', specFile), 'UTF-8'));
  const networkId = spec.params.networkID;

  const web3 = new Web3(rpcUrl);

  // preliminary checks: can connect, networkID matches, primary account set, unlocked and funded
  const connectedNetworkId = await web3.eth.net.getId();
  if (connectedNetworkId !== parseInt(networkId)) {
    console.error(`networkId mismatch: configured for ${networkId}, connected rpc node reports ${connectedNetworkId}. Aborting.`);
    process.exit(1);
  }
  const nodeAccs = await web3.eth.getAccounts();
  if (nodeAccs === undefined || nodeAccs.length === 0) {
    console.error('no account found on connected node');
    process.exit(2);
  }
  const deployerAddr = process.env.DEPLOYER_ADDR || nodeAccs[0];
  const deployerBalanceWei = await web3.eth.getBalance(deployerAddr);
  const deployerBalanceEth = web3.utils.fromWei(deployerBalanceWei);
  if (parseInt(deployerBalanceWei) < parseInt(MIN_DEPLOYER_BALANCE_WEI)) {
    console.log(`deployer account ${deployerAddr} has insufficient balance ${deployerBalanceEth} ETH - minimum is ${web3.utils.fromWei(MIN_DEPLOYER_BALANCE_WEI)} ETH`);
    process.exit(3);
  }

  console.log(`testing if deployer account ${deployerAddr} is unlocked.\nIf it gets stuck here, it probably is not!`);
  // didn't find a more reasonable way to test this :-(
  await web3.eth.sign('testmsg', deployerAddr);

  const sendOpts = { from: deployerAddr, gasPrice: GAS_PRICE, gas: GAS_LIMIT };

  // compile contracts...
  for (let i = 0; i < Object.keys(contracts).length; i++) {
    const name = Object.keys(contracts)[i];
    let realContractName = name;
    let dir = 'contracts/';

    if (name == 'AdminUpgradeabilityProxy') {
      dir = 'contracts/upgradeability/';
    } else if (name == 'StakingAuRa') {
      dir = 'contracts/base/';
      if (erc20Restricted) {
        realContractName = 'StakingAuRaCoins';
      } else {
        realContractName = 'StakingAuRaTokens';
      }
    } else if (name == 'BlockRewardAuRa') {
      dir = 'contracts/base/';
      if (erc20Restricted) {
        realContractName = 'BlockRewardAuRaCoins';
      } else {
        realContractName = 'BlockRewardAuRaTokens';
      }
    }

    console.log(`Compiling ${realContractName}...`);
    const compiled = await compile(
      path.join(__dirname, '..', dir),
      realContractName
    );
    contracts[name].compiled = compiled;
  }

  // deploy contracts...
  for (let i = 0; i < Object.keys(contracts).length; i++) {
    const cname = Object.keys(contracts)[i];
    const c = contracts[cname];

    if (c.skipDeploy) {
      continue;
    }

    console.log(`Deploying ${cname}...`);
    const contract = new web3.eth.Contract(c.compiled.abi);
    const deploy = await contract.deploy({
      data: '0x' + c.compiled.bytecode,
      arguments: c.getDeployArgs ? c.getDeployArgs() : []
    });
    c.implementationInstance = await deploy.send(sendOpts);
    c.implementationAddress = c.implementationInstance.options.address;

    if (c.withProxy) {
      console.log(`Deploying Storage Proxy for ${cname}...`);
      const contract = new web3.eth.Contract(contracts.AdminUpgradeabilityProxy.compiled.abi);
      const deploy = await contract.deploy({
        data: '0x' + contracts.AdminUpgradeabilityProxy.compiled.bytecode,
        arguments: [
          c.implementationAddress, // logic address
          owner, // admin
          [] // no data
        ]
      });
      c.proxyInstance = await deploy.send(sendOpts);
      c.proxyAddress = c.proxyInstance.options.address;
      // this will come in handy when initializing the proxied contract
      c.proxiedImplementationInstance = new web3.eth.Contract(c.compiled.abi, c.proxyAddress);
    }
  }

  // complement chain spec
  spec.engine.authorityRound.params.validators.multi[forkBlock] = {
    "contract": contracts['ValidatorSetAuRa'].proxyAddress
  };
  spec.engine.authorityRound.params.posdaoTransition = forkBlock;
  spec.engine.authorityRound.params.blockRewardContractTransitions[forkBlock] = contracts['BlockRewardAuRa'].proxyAddress;
  spec.engine.authorityRound.params.blockGasLimitContractTransitions = {}; // assumes it doesn't exist yet
  // this is included in the TxPermission contract
  spec.engine.authorityRound.params.blockGasLimitContractTransitions[forkBlock] = contracts['TxPermission'].proxyAddress;
  spec.engine.authorityRound.params.randomnessContractAddress = {}; // assumes it doesn't exist yet
  spec.engine.authorityRound.params.randomnessContractAddress[forkBlock] = contracts['RandomAuRa'].proxyAddress;
  spec.params.transactionPermissionContract = contracts['TxPermission'].proxyAddress;
  spec.params.transactionPermissionContractTransition = forkBlock;
  spec.params.registrar = contracts['Registry'].proxyAddress;

  console.log('Saving spec.json file ...');
  fs.writeFileSync(path.join(__dirname, '..', 'spec.json'), JSON.stringify(spec, null, '  '), 'UTF-8');

  // initialize the contracts...
  // This replicates the actions of the InitializerAuRa contract
  console.log('initializing deployed contracts...');
  console.log(`ValidatorSetAuRa: ${contracts.BlockRewardAuRa.proxyAddress}, ${contracts.RandomAuRa.proxyAddress}, ${contracts.StakingAuRa.proxyAddress}, ${initialValidators}, ${stakingAddresses}, ${firstValidatorIsUnremovable}`);
  contracts.ValidatorSetAuRa.initReceipt = await contracts.ValidatorSetAuRa.proxiedImplementationInstance.methods.initialize(
    contracts.BlockRewardAuRa.proxyAddress,
    contracts.RandomAuRa.proxyAddress,
    contracts.StakingAuRa.proxyAddress,
    initialValidators,
    stakingAddresses,
    firstValidatorIsUnremovable
  ).send(sendOpts);
  if (maxValidatorsWanted) {
    const maxValidatorsDeployed = parseInt(await contracts.ValidatorSetAuRa.proxiedImplementationInstance.methods.MAX_VALIDATORS().call());
    console.assert(maxValidatorsDeployed === maxValidatorsWanted, `deployed MAX_VALIDATORS (${maxValidatorsDeployed}) not equal specified MAX_VALIDATORS (${maxValidatorsWanted}). Check the contract source!`);
  }

  console.log('StakingAuRa...');
  contracts.StakingAuRa.initReceipt = await contracts.StakingAuRa.proxiedImplementationInstance.methods.initialize(
    contracts.ValidatorSetAuRa.proxyAddress,
    stakingAddresses,
    web3.utils.toWei(delegatorMinStake, 'ether'), // _delegatorMinStake
    web3.utils.toWei(candidateMinStake, 'ether'), // _candidateMinStake
    stakingEpochDuration,
    forkBlock, // _stakingEpochStartBlock
    stakeWithdrawDisallowPeriod
  ).send(sendOpts);

  console.log('BlockRewardAuRa...');
  contracts.BlockRewardAuRa.initReceipt = await contracts.BlockRewardAuRa.proxiedImplementationInstance.methods.initialize(
    contracts.ValidatorSetAuRa.proxyAddress,
    sustainabilityFund,
    web3.utils.toWei(stakersRewardPerBlock),
    web3.utils.toWei(fundRewardPerBlock)
  ).send(sendOpts);

  console.log('RandomAuRa...');
  contracts.RandomAuRa.initReceipt = await contracts.RandomAuRa.proxiedImplementationInstance.methods.initialize(
    collectRoundLength,
    contracts.ValidatorSetAuRa.proxyAddress
  ).send(sendOpts);

  contracts.TxPermission.initReceipt = await contracts.TxPermission.proxiedImplementationInstance.methods.initialize(
    [owner],
    contracts.ValidatorSetAuRa.proxyAddress
  ).send(sendOpts);

  contracts.Certifier.initReceipt = await contracts.Certifier.proxiedImplementationInstance.methods.initialize(
    [owner],
    contracts.ValidatorSetAuRa.proxyAddress
  ).send(sendOpts);

  // would probably be better to render as JSON, but there's circular dependencies in that object
  const util = require('util');
  console.log('Logging final state to state.log ...');
  fs.writeFileSync(path.join(__dirname, '..', 'state.log'), util.inspect(contracts), 'UTF-8');
}

async function compile(dir, contractName) {
  const compiled = await utils.compile(dir, contractName);
  return {abi: compiled.abi, bytecode: compiled.evm.bytecode.object};
}

// in order to deploy posdao on a chain represented by localhost:8545 - with the fork block 100 blocks in the future:
// source .env
// FORK_BLOCK=$((`scripts/current_block.sh`+100)) node scripts/deploy_contracts_and_make_spec.js
