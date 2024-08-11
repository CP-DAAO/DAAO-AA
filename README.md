# Account Abstraction Wallet for DAAO

This script automatically casts a vote via agent, in favor of a specified proposal ID.

# Contract Addresses

### BASE Network

- **WalletFactory**: `0x49411A1ED6fb13F949d0D84a5a62EE7F6202177b`
- **Governor**: `0x9bEe222fDb28F6AedcD9ab349f0c9DCAFFae9a97`
- **Token**: `0xaFcAB3B22E92d925fBbF45ae6FA7d1aa85724487`
- **Timelock**: `0x7De94f71C5d6DB2Cdd87ceFd8984f8178525a0e4`

[Example `castVote` Transaction via AA (BlockScout)](https://base-sepolia.blockscout.com/tx/0x30dac05e70832f5cd01a77422c1970e1e728c8ba0f49edbbad912f011e298982)

### OP Network

- **WalletFactory**: `0x49411A1ED6fb13F949d0D84a5a62EE7F6202177b`
- **Governor**: `0xAb563D95Aeb44aA2aa4FD49Bb7915E7C55CdEeB9`
- **Token**: `0xd3631F0ac03Cbee7FeA3ca472064e469385344d1`
- **Timelock**: `0x97BD38745620387f14e34B3658C316b65da561D1`

[Example `castVote` Transaction via AA (BlockScout)](https://optimism-sepolia.blockscout.com/tx/0x305544f74bcf37a06b15f531274690703d41db3e6d444c257de674afa325721d)

---

# Test

1. **Set Proposal ID:**

   In the `scripts/2_castVote.js` file.
   - Update the `Governor` address.
   - Modify the `proposalId` variable to update the proposal ID.

2. **Environment Variables:**

   Create a `.env` file in the root of the project and add the following content:

   ```bash
   PRIVATE_KEY=<DEPLOYER_PK>
   AGENT_KEY=<AI_AGENT_PK>
   OWNER_KEY=<EOA_PK>
   OPENAI_API_KEY=<API_KEY>
   ```

3. **Run the Script:**

   Run the following command to cast the vote in favor:

   ```bash
   $ npx hardhat run scripts/2_castVote_agent.js --network baseSepolia
   $ npx hardhat run scripts/2_castVote_agent.js --network opSepolia
   ```
