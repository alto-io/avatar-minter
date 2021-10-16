pragma solidity >=0.6.0 <0.7.0;
//SPDX-License-Identifier: MIT

//import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract YourCollectible is ERC721, Ownable {

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  uint256 public maxMint = 20;
  uint256 public price = 1 * 10**14; // 550 * 10**14; //0.055 ETH;
  bool public salePaused = false;
  uint public constant MAX_ENTRIES = 10000;

  constructor() public ERC721("Arcadians", "ARC") {
    _setBaseURI("https://api.arcadians.io/");
    _tokenIds.increment();
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
        require(msg.value >= price * _num,"Ether amount sent is not correct");
        mint(_to, _num);
    }    

  function setURI(string memory baseURI) 
      public
      onlyOwner
  {
    _setBaseURI(baseURI);
  }
}
