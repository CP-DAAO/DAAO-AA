const { ethers } = require("hardhat");

async function main() {
  const deployer = (await ethers.getSigners())[0];
  const agent = (await ethers.getSigners())[1];
  console.log(`Deployer: ${deployer.address}, ${await ethers.provider.getBalance(deployer.address)}`);
  console.log(`Agent: ${agent.address}, ${await ethers.provider.getBalance(deployer.address)}`);

  const entryPoint = await ethers.getContractAt("IEntryPoint",
    "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
  );
  console.log(`EntryPoint: ${entryPoint.address}`);

  const factory = await ethers.deployContract("WalletFactory", [
    entryPoint.address,
    agent.address
  ], {});
  await factory.deployed();
  console.log(`WalletFactory: ${factory.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).then(() => {
  process.exit();
});
