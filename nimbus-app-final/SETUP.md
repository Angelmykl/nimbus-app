# Nimbus App — Setup Instructions

## 🚀 Quick Start (New Codespace)

1. Create a new GitHub repo called `nimbus-app`
2. Open it in Codespaces
3. Upload this zip into the Codespace file explorer
4. Run these commands:

```bash
unzip nimbus-app-final.zip
mv nimbus-app-final/* .
mv nimbus-app-final/.gitignore .
rm -rf nimbus-app-final
npm install
npx expo start --web
```

5. Press `w` or open the forwarded port link — app loads in browser!

---

## 📱 Screens

| Screen | Route | Description |
|---|---|---|
| Welcome | `/welcome` | Create or import wallet |
| Home | `/home` | Dashboard — balance, card, actions |
| Send | `/send` | Send USDC to any address |
| Card | `/card` | Nimbus Card NFT — mint & view |
| Bazarc | `/bazarc` | Marketplace — buy & sell |
| Notifications | `/notifications` | Transaction history |
| Profile | `/profile` | Wallet info & settings |
| Import | `/import` | Import wallet via private key |

---

## 🔗 Deployed Contracts (Arc Testnet)

| Contract | Address |
|---|---|
| NimbusCard NFT | `0x8C6Adc731dCE434F8e3CA15fc77044FAf5b05EAa` |
| BazarcEscrow | `0x84ad5530aDCe451d13f66eBFAF253b6eb91DCA4c` |
| USDC | `0x3600000000000000000000000000000000000000` |

Explorer: https://testnet.arcscan.app

---

## 💳 To Mint a Nimbus Card

The NimbusCard contract uses `onlyOwner` for minting.
The deployer wallet is: `0xC802Aca1766Aa343b54D5Bde70D4E90655468AD0`

To mint a card:
1. Go to Profile → Import Different Wallet
2. Import the deployer private key from your nimbus-contracts `.env`
3. Go to Card tab → Tap "Mint My Nimbus Card"
4. The NFT will be issued to that wallet

---

## 🛒 Bazarc Flow

1. **Buyer** taps Buy → USDC goes into BazarcEscrow contract
2. **Buyer** receives item → taps "Confirm Received"
3. **Escrow** releases USDC to seller minus 0.1% fee

---

## ⚠️ Testnet Notice

All funds on Arc Testnet have no real value.
Get free testnet USDC at: https://faucet.circle.com
Select "Arc Testnet" and paste your wallet address.

---

## 🗓️ What's Next (Week 3)

- [ ] WalletConnect integration (connect MetaMask)
- [ ] Product photo upload via IPFS
- [ ] QR code scanner for receiving
- [ ] Push notifications for incoming USDC
- [ ] Bazarc order tracking screen
- [ ] Nimbus SDK npm package
