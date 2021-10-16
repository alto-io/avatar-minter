const { ethers } = require("hardhat");
const { use, expect, assert } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("NFT Tests", function () {
  let myContract;
  const promoAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const startURI = "https://api.arcadians.io/";
  const promoAmount = 200;

  describe("YourCollectible", function () {
    it("Should deploy YourCollectible", async function () {
      const YourCollectible = await ethers.getContractFactory("YourCollectible");

      myContract = await YourCollectible.deploy();
    });

    describe("on initialize", function () {
      it("promoaddress should have initial tokens", async function () {
        const promoAddressBalance = await myContract.balanceOf(promoAddress);
        expect(promoAddressBalance).to.equal(promoAmount);
      });

      it("totalSupply should start at promoAmount", async function () {
        expect(await myContract.totalSupply()).to.equal(promoAmount);
      });

      it("baseURI should be correct", async function () {
        console.log("base URI: " + startURI);
        expect(await myContract.baseURI()).to.equal(startURI);        
      });

      it("tokenURI should be correct", async function () {
        const id = 15;
        const tokenURI = startURI + id.toString()
        console.log("token URI: " + tokenURI);
        expect(await myContract.tokenURI(id)).to.equal(tokenURI);        
      });

    });

    describe("on presale", function () {

      it("user should not be able to buy if presale not started", async function () {

        const [owner] = await ethers.getSigners();
        const ownerAddress = owner.address;
        let correctError = false;

        try {
          await myContract.presale(ownerAddress, 1);
        }
        catch (e) {
          correctError = e.toString().includes("Presale hasn't started");
        }

        expect(correctError).to.equal(true);
      });

      it("only whitelisted users sending correct eth amount can buy during presale", async function () {

        const [owner, addr1, addr2] = await ethers.getSigners();
        const notWhitelistedAddress = addr1.address;
        const whiteListedAddress = addr2.address;
        let correctError = false;

        // start presale
        await myContract.setPresalePauseStatus(false);

        try {
          await myContract.connect(addr1).presale(notWhitelistedAddress, 1);
        }
        catch (e) {
          correctError = e.toString().includes("You're not eligible for the presale");
        }

        // not whitelisted should error
        expect(correctError).to.equal(true);
        correctError = false;

        // check that error should occur if wrong amount is sent
        try {
          var overrides = {
            value: 4 * 10**14
          }
          await myContract.connect(addr2).presale(whiteListedAddress, 1, overrides);
        }
        catch (e) {
          correctError = e.toString().includes("Ether amount sent is not correct");
        }
        
        expect(correctError).to.equal(true);

        
        // check that user can properly purchase and that token amount correctly updates

        // purchase 1
        try {
          var overrides = {
            value: 1 * 10**14
          }
          await myContract.connect(addr2).presale(whiteListedAddress, 1, overrides);
        }
        catch (e) {
          assert.fail("whitelisted account unable to purchase 1")
        }

        // purchase 8
        try {
          var overrides = {
            value: 8 * 10**14
          }
          await myContract.connect(addr2).presale(whiteListedAddress, 8, overrides);
        }
        catch (e) {
          assert.fail("whitelisted account unable to purchase 8")
        }

        // purchase 20
        try {
          var overrides = {
            value: 20 * 10**14
          }
          await myContract.connect(addr2).presale(whiteListedAddress, 20, overrides);
        }
        catch (e) {
          assert.fail("whitelisted account unable to purchase 20")
        }

        const balance = await myContract.balanceOf(whiteListedAddress);

        expect(balance).to.equal(29);


       // set Max Presale to 29, purchases should fail
         correctError = false;
        await myContract.setMaxPresale(29);

        try {
          var overrides = {
            value: 1 * 10**14
          }
          await myContract.connect(addr2).presale(whiteListedAddress, 1, overrides);
        }
        catch (e) {
          correctError = e.toString().includes("Exceeds maximum presale supply");
        }

        expect(correctError).to.equal(true);

      });


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
