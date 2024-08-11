const { ethers } = require("hardhat");
require("dotenv").config();
const axios = require('axios');

const callChatGPT = async (apiKey, content) => {
  const url = 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: content }],
    max_tokens: 150,
  });

  const response = await axios.post(url, body, { headers });
  return response.data.choices[0].message.content;
};

async function main() {
  const deployer = (await ethers.getSigners())[0];
  const agent = (await ethers.getSigners())[1];
  const owner = (await ethers.getSigners())[2];
  console.log(`Deployer: ${deployer.address}, ${await ethers.provider.getBalance(deployer.address)}`);
  console.log(`Agent: ${agent.address}, ${await ethers.provider.getBalance(deployer.address)}`);

  const entryPoint = await ethers.getContractAt("IEntryPoint",
    "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
  );
  const nonceManager = await ethers.getContractAt("INonceManager",
    entryPoint.address
  )
  console.log(`EntryPoint: ${entryPoint.address}`);

  const factory = await ethers.getContractAt("WalletFactory",
    "0x49411A1ED6fb13F949d0D84a5a62EE7F6202177b"
  );
  console.log(`WalletFactory: ${factory.address}`);

  /* Governance */
  const governor = await ethers.getContractAt("IGovernor",
    "0xAb563D95Aeb44aA2aa4FD49Bb7915E7C55CdEeB9"
  );
  const Governor = await ethers.getContractFactory("Daao");
  console.log(`Governor: ${governor.address}`);

  let proposalId = "111134705310451494109840545734947311922435586555267546077576967244701272523419";

  // // Propose
  // const proposeTx = await governor.propose(
  //   [owner.address], [0], ["0x"], `Account Abstraction Test ${Date.now()}`
  // );
  // const proposeRes = await proposeTx.wait();
  // console.log(`Test Proposal: ${proposeTx.hash}`);
  // const proposeEventSig = ethers.utils.id("ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)");
  // const proposeCallEvent = proposeRes.logs.find(log => log.topics[0] === proposeEventSig);
  // if (proposeCallEvent) {
  //   const parsedEvent = Governor.interface.parseLog(proposeCallEvent);
  //   proposalId = parsedEvent.args.proposalId;
  //   console.log('Proposal ID:', proposalId);
  // } else {
  //   throw Error('No Proposal Created.');
  // }
  // process.exit(0);

  /* Get Contract Wallet's Address & Nonce */
  const salt = 0; // unique identifier
  const walletAddress = await factory.getAddress(owner.address, salt);
  const walletNonce = await nonceManager.getNonce(walletAddress, 0);
  console.log(`Address: ${walletAddress}`);
  console.log(`Nonce: ${walletNonce}`);

  /* Call UserOp */

  // initCode
  let initCode = "0x";
  if ((await ethers.provider.getCode(walletAddress)) === "0x") {
    const Factory = await ethers.getContractFactory("WalletFactory");
    initCode = factory.address +
      Factory.interface.encodeFunctionData(
        "createAccount(address,uint256)",
        [owner.address, salt]
      ).slice(2);
  }

  // // Test
  // const target = await ethers.deployContract("Counter"); // Sample Contract
  // const Target = await ethers.getContractFactory("Counter");
  // console.log(`Counter: ${await target.counter()}`);

  // judging
  let vote = 0;
  let preference = "The agent strictly opposes the use of the foundation's money for any projects that do not directly align with the foundation's core mission and objectives. The agent believes that any diversion of funds to other projects, regardless of their potential benefits, undermines the foundation's purpose and should be avoided at all costs.";
  // Example: https://compound.finance/governance/proposals/289
  let proposalDescription = "Trust Setup for DAO investment into GoldCOMP";

  const apiKey = process.env.OPENAI_API_KEY;
  const query = `You are an agent with the following preference:
"${preference}"

A proposal has been presented with the following description:
"${proposalDescription}"

Based on your preference and the details of the proposal, respond with only one of the following numbers:
- 0 for "Against"
- 1 for "For"
- 2 for "Abstain"`;
  vote = JSON.parse(await callChatGPT(apiKey, query));
  console.log("Agent: ", vote);

  // callData
  const Wallet = await ethers.getContractFactory("Wallet");
  const callData = Wallet.interface.encodeFunctionData(
    "execute(address,uint256,bytes)",
    // [target.address, 0, Target.interface.encodeFunctionData("up()", [])] // Test
    [
      governor.address,
      0,
      Governor.interface.encodeFunctionData("castVote(uint256,uint8)", [
        proposalId,
        vote /* For */
      ])
    ]
  );
  console.log(callData);

  let userOp = {
    sender: walletAddress,
    nonce: walletNonce,
    initCode: initCode,
    callData: callData,
    accountGasLimits: ethers.utils.solidityPack(
      ["uint128", "uint128"],
      [4_000_000, 9_000_000]
    ),
    preVerificationGas: 150_000,
    gasFees: ethers.utils.solidityPack(
      ["uint128", "uint128"],
      [ethers.utils.parseUnits("0", "gwei"), ethers.utils.parseUnits("0", "gwei")]
    ),
    paymasterAndData: "0x",
    signature: "0x"
  };

  const coder = ethers.utils.defaultAbiCoder;
  const packedData = coder.encode(
    [
      "address",
      "uint256",
      "bytes32",
      "bytes32",
      "bytes32",
      "uint256",
      "bytes32",
      "bytes32",
    ],
    [
      userOp.sender,
      userOp.nonce,
      ethers.utils.keccak256(userOp.initCode),
      ethers.utils.keccak256(userOp.callData),
      userOp.accountGasLimits,
      userOp.preVerificationGas,
      userOp.gasFees,
      ethers.utils.keccak256(userOp.paymasterAndData),
    ]
  );
  const enc = coder.encode(
    ["bytes32", "address", "uint256"],
    [ethers.utils.keccak256(packedData), entryPoint.address, (await ethers.provider.getNetwork()).chainId]
  );
  const userOpHash = ethers.utils.keccak256(enc);
  const sig = await agent.signMessage(
    ethers.utils.arrayify(userOpHash)
  );
  userOp.signature = "0x01" + sig.slice(2);

  console.log("userOpHash:", userOpHash);
  console.log(userOp);

  const txHandleOps = await entryPoint.handleOps([userOp], deployer.address /* beneficiary */)
  const txHandleOpsRes = await txHandleOps.wait();
  console.log(`Handle Ops: ${txHandleOps.hash}`);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).then(() => {
  process.exit();
});
