// prepares a spec of a chain using a ValidatorSet contract and a BlockReward contract

const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("https://dai.poa.network"));
const utils = require('./utils/utils');

main();

async function main() {
  const networkName = process.env.NETWORK_NAME;
  const networkID = process.env.NETWORK_ID;
  const owner = process.env.OWNER.trim();
  let initialValidators = process.env.INITIAL_VALIDATORS.split(',');
  for (let i = 0; i < initialValidators.length; i++) {
    initialValidators[i] = initialValidators[i].trim();
  }

  const contracts = [
    'ValidatorSetDummy',
    'BlockRewardDummy'
  ];

  let spec = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'templates', 'pre-upgrade-spec.json'), 'UTF-8'));

  spec.name = networkName;
  spec.params.networkID = networkID;

  let contractsCompiled = {};
  for (let i = 0; i < contracts.length; i++) {
    const contractName = contracts[i];
    let realContractName = contractName;
    let dir = 'contracts/';

    if (contractName.endsWith('Dummy')) {
      dir = 'contracts/dummies/';
    }

    console.log(`Compiling ${contractName}...`);
    const compiled = await compile(
      path.join(__dirname, '..', dir),
      realContractName
    );
    contractsCompiled[contractName] = compiled;
  }

  let contract;
  let deploy;

  // Build ValidatorSetDummy contract
  contract = new web3.eth.Contract(contractsCompiled['ValidatorSetDummy'].abi);
  deploy = await contract.deploy({data: '0x' + contractsCompiled['ValidatorSetDummy'].bytecode, arguments: [
      initialValidators
    ]});
  // assumes spec.engine.params.validators.multi.0 already being set accordingly
  spec.accounts['0x1000000000000000000000000000000000000000'] = {
    balance: '0',
    constructor: await deploy.encodeABI()
  };

  // Build BlockRewardDummy contract
  contract = new web3.eth.Contract(contractsCompiled['BlockRewardDummy'].abi);
  deploy = await contract.deploy({data: '0x' + contractsCompiled['BlockRewardDummy'].bytecode});
  // assumes spec.engine.params.blockRewardContractTransitions.0 already being set accordingly
  spec.accounts['0x2000000000000000000000000000000000000000'] = {
    balance: '0',
    constructor: await deploy.encodeABI()
  };

  console.log('Saving pre-upgrade-spec.json file ...');
  fs.writeFileSync(path.join(__dirname, '..', 'pre-upgrade-spec.json'), JSON.stringify(spec, null, '  '), 'UTF-8');
  // copy to spec.json which is the filename expected by the copy script of posdao-test-setup
  fs.copyFileSync(path.join(__dirname, '..', 'pre-upgrade-spec.json'), path.join(__dirname, '..', 'spec.json'));
  console.log('Done');
}

async function compile(dir, contractName) {
  const compiled = await utils.compile(dir, contractName);
  return {abi: compiled.abi, bytecode: compiled.evm.bytecode.object};
}
