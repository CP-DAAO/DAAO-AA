require("@nomicfoundation/hardhat-toolbox");

require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2 ** 32 - 1
      },
    },
  },

  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: 'https://84532.rpc.thirdweb.com',
      },
      chainId: 84532,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    base: {
      url: 'https://base.llamarpc.com	',
      chainId: 8453,
      accounts: [process.env.PRIVATE_KEY],
    },
    baseSepolia: {
      url: 'https://84532.rpc.thirdweb.com',
      chainId: 84532,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
