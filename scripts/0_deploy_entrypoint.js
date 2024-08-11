const { ethers } = require("hardhat");

async function main() {
    const deployer = (await ethers.getSigners())[0];
    console.log(`Deployer: ${deployer.address}, ${await ethers.provider.getBalance(deployer.address)}`);

    const entryPoint = await ethers.deployContract("EntryPoint", [], {});
    console.log(`EntryPoint: ${entryPoint.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}).then(() => {
    process.exit();
});
