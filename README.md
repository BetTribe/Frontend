# BeTribe - Decentralized Chat-Based Betting Platform

BeTribe is a decentralized chat-based betting platform built on the  blockchain. It enables users to chat and place bets simultaneously using XMTP, ensuring transparency through smart contracts and AI-driven result verification. The platform provides a seamless betting experience with automated resolution mechanisms.

## Features

- **Decentralized Betting**: Users can place bets directly through chat messages without relying on centralized bookmakers.
- **AI-Driven Result Verification**: AI agents fetch and verify match results from external data sources to resolve bets fairly.
- **Seamless Chat Integration**: Built on XMTP, allowing real-time betting conversations and interactions.
- **Smart Contract Transparency**: Bets and payouts are managed through immutable smart contracts for fairness.
- **Multi-Network Deployment**: Contracts are deployed on the Mantle network, ensuring scalability and efficiency.

## How It Works

1. **Join the Chat**: Users enter a chatroom where betting discussions take place.
2. **Place a Bet**: Users can place bets using a simple command format, e.g., `bet 1 ETH on Team A to win`.
3. **Data Fetching**: The AI agent retrieves live match data from the Soccer API (`https://api.soccersapi.com/v2.2/livescores/`).
4. **Result Verification**: AI processes the match data and determines the bet outcome.
5. **Automated Settlement**: The smart contract processes winnings and distributes rewards accordingly.

## Deployment

BeTribe smart contracts are deployed on the Mantle network for efficient execution and low-cost transactions.

## Technologies Used

- **Blockchain**: Mantle
- **Messaging Protocol**: XMTP
- **Smart Contracts**: Solidity
- **AI Integration**: Ollama model for result verification
- **Frontend**: React.js

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- MetaMask or a compatible Web3 wallet
- XMTP client setup

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/betribe.git
   cd betribe
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file and configure API keys, XMTP settings, and smart contract addresses.

4. Start the development server:
   ```sh
   npm run dev
   ```

## Roadmap

- [ ] Expand betting categories beyond sports.
- [ ] Introduce social features like leaderboards and communities.
- [ ] Optimize AI verification with additional data sources.
- [ ] Support multiple blockchain networks.

## Contributing

We welcome contributions! Feel free to submit pull requests or open issues for discussion.

## License

This project is licensed under the MIT License.

## Contact

For questions or collaborations, reach out via [your email] or open an issue in the repository.

