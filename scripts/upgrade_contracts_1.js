// upgrades contracts deployed on tau1 to the latest version
// some code duplicated from make_spec.js
//
// requires the proxy addresses of contracts to be upgraded via ENV variables.
// example call: TXPERMISSION=0x50AC648440A77C88c743A8d60793CCd5B6dFAa8E RANDOM=0x598b05638fbBD8940C0397f396b909eB2cE7C6Da VALIDATORSET=0x82F41e0979D2BA3daBab0df70fD584104eda930B STAKING=0xC3a32E888bb3D5f999248d27258F5d80AA17Ef8C node scripts/upgrade_contracts_1.js

const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const utils = require('./utils/utils');
const proxyAbi = require('./utils/AdminUpgradeabilityProxy.abi');

const MIN_DEPLOYER_BALANCE_WEI = '1000000000000000000'; // wild guess for gas costs: 1 native token
const GAS_PRICE = process.env.GAS_PRICE || 100000000000; // 100 Gwei
const GAS_LIMIT = process.env.GAS_LIMIT || 6000000; // 6 MGas

main();

async function main() {
  const rpcUrl = process.env.RPC_URL || "http://localhost:8545";
  console.log(`owner is ${process.env.OWNER}`);
  const owner = process.env.OWNER.trim();
  const erc20Restricted = process.env.ERC20_RESTRICTED === 'true';

  const contracts = {
    'TxPermission': {},
    'RandomAuRa': {},
    'ValidatorSetAuRa': {},
    'StakingAuRa': {},
  };

  // proxy addresses of deployment to be upgraded
  contracts.TxPermission.proxyAddress = process.env.TXPERMISSION; // '0x50AC648440A77C88c743A8d60793CCd5B6dFAa8E';
  contracts.RandomAuRa.proxyAddress = process.env.RANDOM; // '0x598b05638fbBD8940C0397f396b909eB2cE7C6Da';
  contracts.ValidatorSetAuRa.proxyAddress = process.env.VALIDATORSET; //'0x82F41e0979D2BA3daBab0df70fD584104eda930B';
  contracts.StakingAuRa.proxyAddress = process.env.STAKING; // '0xC3a32E888bb3D5f999248d27258F5d80AA17Ef8C';

  const specFile = process.env.SPEC_FILE;
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

  const sendOpts = {from: deployerAddr, gasPrice: GAS_PRICE, gas: GAS_LIMIT};

  // compile contracts...
  for (let i = 0; i < Object.keys(contracts).length; i++) {
    const name = Object.keys(contracts)[i];
    let realContractName = name;
    let dir = 'contracts/';

    if (name == 'StakingAuRa') {
      dir = 'contracts/base/';
      if (erc20Restricted) {
        realContractName = 'StakingAuRaCoins';
      } else {
        realContractName = 'StakingAuRaTokens';
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

    console.log(`Deploying ${cname}...`);
    const contract = new web3.eth.Contract(c.compiled.abi);
    const deploy = await contract.deploy({
      data: '0x' + c.compiled.bytecode,
      arguments: []
    });
    c.implementationInstance = await deploy.send(sendOpts);
    c.implementationAddress = c.implementationInstance.options.address;

    c.proxyInstance = c.proxyAddress !== undefined ? new web3.eth.Contract(proxyAbi, c.proxyAddress) : undefined;
  }

  for (let i = 0; i < Object.keys(contracts).length; i++) {
    const cname = Object.keys(contracts)[i];
    const c = contracts[cname];

    if(c.proxyInstance === undefined) {
      console.log(`# WARNING: no address specified for ${cname}, skipping`);
      continue;
    }

    //const adminAddr = await c.proxyInstance.methods.admin().call();

    const oldImplAddr = await c.proxyInstance.methods.implementation().call();

    console.log(`upgrading ${cname}: proxy addr ${c.proxyAddress}, impl addr ${oldImplAddr} -> ${c.implementationAddress}...`);
    c.upgradeReceipt = await c.proxyInstance.methods.upgradeTo(
      c.implementationAddress
    ).send(sendOpts);
  }

  console.log('all done');

  const util = require('util');
  console.log('Logging final state to upgrade_state.log ...');
  fs.writeFileSync(path.join(__dirname, '..', 'upgrade_state.log'), util.inspect(contracts), 'UTF-8');
}


async function compile(dir, contractName) {
  const compiled = await utils.compile(dir, contractName);
  return {abi: compiled.abi, bytecode: compiled.evm.bytecode.object};
}
