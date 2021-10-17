pragma solidity >=0.6.0 <0.7.0;
//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract YourCollectible is ERC721, Ownable {

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  uint256 public maxMint = 10;
  uint256 public maxPresaleMint = 5;
  uint256 public price = 10 * 10**12; //5500 * 10**13; //0.055 ETH;
  uint256 public ogPrice = 5 * 10**12; //4675 * 10**13; //0.04675 ETH;
  bool public salePaused = true;
  bool public presalePaused = true;
  uint public maxTotalPresale = 5000;
  uint public maxPrebuysPerAddress = 5;
  uint public maxBuysPerAddress = 20;

  uint public constant MAX_ENTRIES = 10000;
  address promoAddress;

  mapping (address => bool) og;
  mapping (address => bool) wl;
  mapping (address => uint256) public prebuysPerAddress;
  mapping (address => uint256) public buysPerAddress;


  constructor() public ERC721("Arcadians", "ARC") {
    _setBaseURI("https://api.arcadians.io/");
    _tokenIds.increment();

    promoAddress = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    mint(promoAddress, 200);

    // OG
    og[0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266] = false;
    og[0x70997970C51812dc3A010C7d01b50e0d17dc79C8] = false;
    og[0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC] = false;
    og[0x90F79bf6EB2c4f870365E785982E1f101E93b906] = true;
    og[0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65] = true;
    og[0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc] = false;


    // WL 
    wl[0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266] = true;
    wl[0x70997970C51812dc3A010C7d01b50e0d17dc79C8] = false;
    wl[0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC] = true;
    wl[0x90F79bf6EB2c4f870365E785982E1f101E93b906] = true;
    wl[0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65] = false;
    wl[0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc] = false;

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
     * @param _num number of NFTs minted (Max is 20)
     */
    function buy(uint256 _num) 
        public 
        payable 
    {
        require(!salePaused, "Sale hasn't started");
        require(_num < (maxMint+1),"Amount to mint exceeds maximum per transaction");

        require(msg.value == price * _num,"Ether amount sent is not correct");

        // buyers can only buy a maximum amount
        require(buysPerAddress[msg.sender] + _num <= maxBuysPerAddress,
                "Max buys for address reached");
  
        buysPerAddress[msg.sender] += _num;

        mint(msg.sender, _num);
    }    

    /**
     * @dev Public function for purchasing presale {num} amount of tokens. Requires whitelistEligible()
     * Calls mint() for minting processs
     * @param _num number of NFTs minted (Max is 20)
     */
    function presale(uint256 _num)
        public
        payable
    {
        require(!presalePaused, "Presale hasn't started");
        require(salePaused, "Sale is already ongoing");
        require(whitelistEligible(msg.sender), "You're not eligible for the presale");
        require(_num < (maxPresaleMint+1),"Amount to mint exceeds maximum per transaction");
        require(_tokenIds.current() + _num < maxTotalPresale, "Exceeds maximum presale supply");

        // check og status
        if (ogEligible(msg.sender)) {
          require(msg.value == ogPrice * _num,"OG: Ether amount sent is not correct");
        }

        else {
          require(msg.value == price * _num,"Ether amount sent is not correct");
        }

        // prebuyers can only buy a maximum amount
        require(prebuysPerAddress[msg.sender] + _num <= maxPrebuysPerAddress,
                "Max prebuys for address reached");
  
        prebuysPerAddress[msg.sender] += _num;
        mint(msg.sender, _num);
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

    /**
     * @dev Function for the owner to setMaxPresale.
     */
    function setMaxPresale(uint val)
        public
        onlyOwner
    {
        maxTotalPresale = val;
    }

    /**
     * @dev Function for the owner to setMaxMint.
     */
    function setMaxMint(uint val)
        public
        onlyOwner
    {
        maxMint = val;
    }    

    /**
     * @dev Function for the owner to setMaxPrebuysPerAddress.
     */
    function setMaxPrebuysPerAddress(uint val)
        public
        onlyOwner
    {
        maxPrebuysPerAddress = val;
    }

    /**
     * @dev Public function for checking whitelist eligibility.
     * @param _to verify address is eligible for presale
     */
    function whitelistEligible(address _to)
        public
        view
        returns (bool)
    {
        return (og[_to] || wl[_to]);
    }

    /**
     * @dev Public function for checking OG eligibility.
     * @param _to verify address is OG
     */
    function ogEligible(address _to)
        public
        view
        returns (bool)
    {
        return og[_to];
    }    

    /** @dev Function for withdrawing sale ETH
    */
    function withdrawAll()
        public
        onlyOwner
    {
        require(payable(owner()).send(address(this).balance));
    }
}
