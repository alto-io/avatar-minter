const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("NFT Tests", function () {
  let myContract;

  describe("YourCollectible", function () {
    it("Should deploy YourCollectible", async function () {
      const YourCollectible = await ethers.getContractFactory("YourCollectible");

      myContract = await YourCollectible.deploy();
    });

    describe("setURI()", function () {
      it("Should be able to set a new tokenURI", async function () {
        const newTokenURI = "https://ipfs.io/ipfs/QmTBP8FvkTzZsezpccQxLTyFgMCL6BjjvSgLp12bKFK6ZV/";
        console.log("new URI: " + newTokenURI);
        await myContract.setURI(newTokenURI);
        expect(await myContract.baseURI()).to.equal(newTokenURI);
      });
    });
  });
});
