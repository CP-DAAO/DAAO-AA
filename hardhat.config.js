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
        url: 'https://sepolia.base.org',
        blockNumber: 13795621,
      },
      chainId: 84532,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    base: {
      url: 'https://base.llamarpc.com',
      chainId: 8453,
      accounts: [process.env.PRIVATE_KEY, process.env.AGENT_KEY, process.env.OWNER_KEY],
    },
    baseSepolia: {
      url: 'https://sepolia.base.org',
      chainId: 84532,
      accounts: [process.env.PRIVATE_KEY, process.env.AGENT_KEY, process.env.OWNER_KEY],
    },

    op: {
      url: 'https://optimism.llamarpc.com',
      chainId: 10,
      accounts: [process.env.PRIVATE_KEY, process.env.AGENT_KEY, process.env.OWNER_KEY],
    },
    opSepolia: {
      url: 'https://sepolia.optimism.io',
      chainId: 11155420,
      accounts: [process.env.PRIVATE_KEY, process.env.AGENT_KEY, process.env.OWNER_KEY],
    },

    metalTestnet: {
      url: 'https://testnet.rpc.metall2.com',
      chainId: 1740,
      accounts: [process.env.PRIVATE_KEY, process.env.AGENT_KEY, process.env.OWNER_KEY],
    },
  },

  mocha: {
    timeout: 99999999,
  }
};
