# 🌱🎭🌍

# Time Guarden

We're interested in using a world computer to play massive multiplayer online role-playing games which craft narrative in insightful, surprising and delightful ways which cannot be predicted entirely from the sturcture suggested here. 

Game designers ought to present [nuggets of truth with as little contrivance as possible](https://kernel.community/en/learn/module-5/reveal-the-universe), and so we must understand what truth blockchains as a media environment make available. It is a truth about time. Ever since the invention of writing and books, and especially since Gutenberg, we have been as time travellers, casting conscious experience far beyond the boundaries of our own lives. Now, we're finally getting good at it: the shared state we are creating together will exist for a period of time difficult to conceive of from the perspective of an individual life. It is this insight with which we wish to play.

## The Setup

1. We create a contract, `TimeTraveller.sol` which has a guardian. This guardian can change every X number of blocks so that, if time were extended to infinity, it would eventually touch all addresses in 2^256 address space. 
2. The likelihood of guarding `TimeTraveller.sol` is therefore infinitesimal, so there is an auction mechanism which allows you to claim guardianship for the next period of blocks.
3. Being a guardian means you can use `TimeTraveller.sol` to deploy your own `TimeSeed.sol`, which is a simple stub that has a few unique attributes based on when you deploy it, and one function that operates like MakerDAO governance "spells" and lets you, as the TimeSeed's owner, add any arbitrary code you like to your seed.

## Possible Emergent Features

### Magician's or Alchemist's Shop

The simplest application possible: sell spells to non-devs to power up their TimeSeeds for any kind of role-playing that takes place. We're inspired by [Rarity](https://github.com/andrecronje/rarity) in this regard.

### Time Branches

What does it mean to be "next to each other in time"?

We can create simple environments which assign plots of land (space) to any deployed TimeSeed. Each time branch can be organised according to a different pattern or principle: TimeSeed plots spiralling out from the centre, or next to each other along a linear grid starting from the top right, or bottom left etc. This means you're next to someone in the spiral, but a huge distance away on the grid.

### Star Signs or Seasons

Each TimeSeed can be in a specific constellation (or [season](https://blog.simondlr.com/posts/seasons-longevity-in-community-tokens)) based on the unique attributes it is deployed with. Much like star signs, this can be used to role-play within a slightly more constricted context.

In essence, we want to provide as open an environment as possible, while still giving enough structure to things so that genuinely creative, fun and collaborative games can develop. Time is a wonderful seed around which to crystallize this hope, but we'll need your most playful takes to make this into a reality.

## Challenges

1. What kind of auction mechanism should we use for the guardianship of `TimeTraveller.sol`? Commit-reveal schemes are likely a bit too complex: we want something safe, but really easy and intuitive to use.
2. How can we change guardian addresses in such a way that guardianship will provably cycle through the whole address space on Ethereum without collisions, and without using expensive 3rd party VRF services?
3. What is the best and most gas-efficient way to implement `TimeSeed.sol` such that we can have functional MakerDAO-like spells which the owners can use, hopefully without it costing too much?
4. What other minimal environments (spatial or role-playing or other) can we provide for people to play in that will help developer a healthy gaming community around this scaffolding?

## 🏃‍♀️ Developer Quick Start
Required: [Node](https://nodejs.org/dist/latest-v12.x/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable) and [Git](https://git-scm.com/downloads)

```
git clone https://github.com/alto-io/game-legos.git
```
```
cd game-legos
yarn install
yarn start
```

> in a second terminal window, start your 📱 frontend:

```
cd game-legos
yarn chain
```

> in a third terminal window, 🛰 deploy your contract:

```
cd game-legos
yarn deploy
```

📱 Open http://localhost:3000 to see the app


🕵🏻‍♂️ Inspect the `Debug Contracts` tab to figure things out.

💼 Edit your deployment script `deploy.js` in `packages/hardhat/scripts`

🔏 Edit your smart contract `YourCollectible.sol` in `packages/hardhat/contracts`

📝 Edit your frontend `App.jsx` in `packages/react-app/src`

🔑 Create wallet links to your app with `yarn wallet` and `yarn fundedwallet`

⬇️ Installing a new package to your frontend? You need to `cd packages/react-app` and then `yarn add PACKAGE`

