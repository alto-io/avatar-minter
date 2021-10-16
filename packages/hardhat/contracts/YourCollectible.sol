pragma solidity >=0.6.0 <0.7.0;
//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract YourCollectible is ERC721, Ownable {

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  uint256 public maxMint = 20;
  uint256 public price = 1 * 10**14; // 550 * 10**14; //0.055 ETH;
  bool public salePaused = true;
  bool public presalePaused = true;

  uint public constant MAX_ENTRIES = 10000;
  address promoAddress;

  mapping (address => bool) wl;


  constructor() public ERC721("Arcadians", "ARC") {
    _setBaseURI("https://api.arcadians.io/");
    _tokenIds.increment();

    promoAddress = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    mint(promoAddress, 200);

    wl[0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266] = true; // owner
    // wl[0x70997970C51812dc3A010C7d01b50e0d17dc79C8] = true; // addr1

    wl[0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC] = true;
  }

    /**
     * @dev Private function for minting. Should not be called outside of buy(), presale() or the constructor
     * Wraps around _safeMint() to enable batch minting
     * @param _to recipient of the NFT minted
     * @param _num number of NFTs minted
     */
    function mint(address _to, uint256 _num)
        private
    {
        require(_tokenIds.current() + _num < MAX_ENTRIES, "Exceeds maximum supply");
        for(uint256 i; i < _num; i++){
          _safeMint( _to, _tokenIds.current());
          _tokenIds.increment();
        }
    }

    /**
     * @dev Public function for purchasing {num} amount of tokens. Checks for current price. 
     * Calls mint() for minting processs
     * @param _to recipient of the NFT minted
     * @param _num number of NFTs minted (Max is 20)
     */
    function buy(address _to, uint256 _num) 
        public 
        payable 
    {
        require(!salePaused, "Sale hasn't started");
        require(_num < (maxMint+1),"You can mint a maximum of 20 at a time");
        require(msg.value == price * _num,"Ether amount sent is not correct");
        mint(_to, _num);
    }    

    /**
     * @dev Public function for purchasing presale {num} amount of tokens. Requires whitelistEligible()
     * Calls mint() for minting processs
     * @param _to recipient of the NFT minted
     * @param _num number of NFTs minted (Max is 20)
     */
    function presale(address _to, uint256 _num)
        public
        payable
    {
        require(!presalePaused, "Presale hasn't started");
        require(wl[_to], "You're not eligible for the presale");
        require(_num < (maxMint+1),"You can mint a maximum of 20 NFTPs at a time");
        require(msg.value == price * _num,"Ether amount sent is not correct");
        mint(_to, _num);
    }    

  function setURI(string memory baseURI) 
      public
      onlyOwner
  {
    _setBaseURI(baseURI);
  }

    /**
     * @dev Function for the owner to start or pause the sale depending on {bool}.
     */
    function setSalePauseStatus(bool val)
        public
        onlyOwner
    {
        salePaused = val;
    }

    /**
     * @dev Function for the owner to start or pause the presale depending on {bool}.
     */
    function setPresalePauseStatus(bool val)
        public
        onlyOwner
    {
        presalePaused = val;
    }  
}
