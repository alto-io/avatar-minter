const { ethers, waffle } = require("hardhat");
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
        try {
          await myContract.presale(1);
        }
        catch (e) {
          correctError = e.toString().includes("Presale hasn't started");
        }

        expect(correctError).to.equal(true);
      });

      it("only whitelisted users sending correct eth amount can buy during presale", async function () {

        const [owner, notWhitelistedAddress, whiteListedAddress] = await ethers.getSigners();
        const price = 10 * 10**12;
        let correctError = false;

        // start presale
        await myContract.setPresalePauseStatus(false);

        try {
          await myContract.connect(notWhitelistedAddress).presale(1);
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
            value: 2 * price
          }
          await myContract.connect(whiteListedAddress).presale(1, overrides);
        }
        catch (e) {
          correctError = e.toString().includes("Ether amount sent is not correct");
        }
        
        expect(correctError).to.equal(true);

        
        // check that user can properly purchase and that token amount correctly updates

        // purchase 1
        try {
          var overrides = {
            value: price
          }
          await myContract.connect(whiteListedAddress).presale(1, overrides);
        }
        catch (e) {
          assert.fail("whitelisted account unable to purchase 1")
        }

        // purchase 8
        try {
          var overrides = {
            value: 8 * price
          }
          await myContract.connect(whiteListedAddress).presale(8, overrides);
        }
        catch (e) {
          assert.fail("whitelisted account unable to purchase 8")
        }

       // set Max Presale to 9, purchases should fail
         correctError = false;
        await myContract.setMaxPresale(9);

        try {
          var overrides = {
            value: price
          }
          await myContract.connect(whiteListedAddress).presale(1, overrides);
        }
        catch (e) {
          correctError = e.toString().includes("Exceeds maximum presale supply");
        }

        expect(correctError).to.equal(true);


      correctError = false;
      await myContract.setMaxPresale(3000);

        // purchase 25, should fail due to maxMint
        try {
          var overrides = {
            value: 25 * price
          }
          await myContract.connect(whiteListedAddress).presale(25, overrides);
        }
        catch (e) {
          correctError = e.toString().includes("You can mint a maximum of 20 at a time");
        }


        // purchase 20, should fail due to max prebuys
        try {
          var overrides = {
            value: 20 * price
          }
          await myContract.connect(whiteListedAddress).presale(20, overrides);
        }
        catch (e) {
          correctError = e.toString().includes("Max prebuys for address reached");
        }

        // make sure total is still 9
        const balance = await myContract.balanceOf(whiteListedAddress.address);
        expect(balance).to.equal(9);

      });

    });

    describe("OG Purchases", function () {

      it("OG should be able to prebuy at OG price", async function () {

        // start presale
        await myContract.setPresalePauseStatus(false);

       // set Max Presale to 3000
       await myContract.setMaxPresale(3000);

        const [owner, addr1, addr2, ogAddress] = await ethers.getSigners();
        const ogPrice = 5 * 10**12;

        // purchase 1
        try {
          var overrides = {
            value: ogPrice
          }
          await myContract.connect(ogAddress).presale(1, overrides);
        }
        catch (e) {
          assert.fail("og account unable to purchase 1")
        }


      });
    });

    describe("Public Sale", function () {

      it("Presale should be disabled if sale has already started", async function () {

        let correctError = false;
        // start sale
        await myContract.setSalePauseStatus(false);

        try {
          await myContract.presale(1);
        }
        catch (e) {
          correctError = e.toString().includes("Sale is already ongoing");
        }

        expect(correctError).to.equal(true);

      });

      it("og should be able to buy during public sale at og rate", async function () {
        const [owner, addr1, addr2, og1, og2] = await ethers.getSigners();
        const ogPrice = 5 * 10**12;

        try {
          var overrides = {
            value: ogPrice
          }
          await myContract.connect(og1).buy(1, overrides);
          await myContract.connect(og2).buy(1, overrides);
        }
        catch (e) {
          assert.fail("og account unable to buy 1 during public sale")
        }

      });

      it("non-og address should be able to buy during public sale at base rate", async function () {
        const [owner, addr1, addr2, og1, og2, addr3, addr4, addr5] = await ethers.getSigners();
        const price = 10 * 10**12;

        try {
          var overrides = {
            value: price
          }
          await myContract.connect(owner).buy(1, overrides);
          await myContract.connect(addr1).buy(1, overrides);
          await myContract.connect(addr2).buy(1, overrides);
          await myContract.connect(addr3).buy(1, overrides);
          await myContract.connect(addr4).buy(1, overrides);
          await myContract.connect(addr5).buy(1, overrides);
        }
        catch (e) {
          assert.fail("one account failed to buy during public sale")
        }

      });

      it("purchases still possible past max totalPresale", async function () {        
        const [owner, addr1, addr2, og1, og2, addr3, addr4, addr5] = await ethers.getSigners();
        const price = 10 * 10**12;

        // set Max Presale to 5
       await myContract.setMaxPresale(5);


        try {
          var overrides = {
            value: 5 * price
          }
          await myContract.connect(owner).buy(5, overrides);
          await myContract.connect(addr1).buy(5, overrides);
          await myContract.connect(addr2).buy(5, overrides);
        }
        catch (e) {
          assert.fail("one account failed to buy during public sale")
        }

      });


    });

    describe("withdraw tests", function () {
      it("Should be able withdraw eth to contract owner", async function () {
        const provider = waffle.provider;
        const [owner] = await ethers.getSigners();
        
        const ownerBalance = await provider.getBalance(owner.address);

        await myContract.withdrawAll();

        const newOwnerBalance = await provider.getBalance(owner.address);
        const contractBalance = await provider.getBalance(myContract.address);

        assert(newOwnerBalance.gt(ownerBalance));
        expect(contractBalance.toNumber()).to.equal(0);
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
