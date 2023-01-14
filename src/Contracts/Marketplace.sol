//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// import "../../IERC20.sol";
// import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Dependencies/IERC20.sol";
import "./Dependencies/AggregatorV3Interface.sol";

// Goerli: 0x66ebA0908d4F95a137F4C9c19c701fAC8DDF5a52
contract MarketplaceItem {
    IERC20 public iUSDC; // 0x6ef12Ce6ad90f818E138a1E0Ee73Ad43E56F33e4
    IERC20 public iUSDT; // 0x27D324cddb6782221c6d5E1DFAa9B2b0C6673184
    AggregatorV3Interface internal constant ethUSD = AggregatorV3Interface(0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e);

    mapping(address => bool) public alreadyBought;
    mapping(address => uint256) public balanceOf;
    uint public itemPrice = 2500000;
    address public owner = payable(msg.sender);


    // ETH/USD price feed: 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
    constructor(address iUSDCAddress, address iUSDTAddress) {
        iUSDC = IERC20(iUSDCAddress);
        iUSDT = IERC20(iUSDTAddress);
    }

    function payInUSDC() public returns(bool) {
        require(msg.sender == owner || !alreadyBought[msg.sender], "Already bought");
        require(iUSDC.balanceOf(msg.sender) >= itemPrice, "Insufficient USDC");

        alreadyBought[msg.sender] = true;
        balanceOf[msg.sender] += 1;

        iUSDC.transferFrom(msg.sender, owner, itemPrice);

        return alreadyBought[msg.sender];
    }

    function payInUSDT() public returns(bool) {
        require(msg.sender == owner || !alreadyBought[msg.sender], "Already bought");
        require(iUSDT.balanceOf(msg.sender) >= itemPrice, "Insufficient USDT");

        alreadyBought[msg.sender] = true;
        balanceOf[msg.sender] += 1;

        iUSDT.transferFrom(msg.sender, owner, itemPrice);

        return alreadyBought[msg.sender];
    }

    // Get the USD price of ETH
    // Returns with 8 decimals
    function getETHPrice() public view returns(int) {
        (
            /*uint80 roundID*/, 
            int price, 
            /*uint startedAt*/, 
            /*uint timeStamp*/, 
            /*uint80 answeredInRound*/) = ethUSD.latestRoundData();
        
        return price; // 1400 * 10**8
    }

    function priceInETH() public view returns(int) {
        return int(itemPrice * 1e20) / getETHPrice();
    }

    function payInETH() public payable returns(bool) {
        require(msg.sender == owner || !alreadyBought[msg.sender], "Already bought");
        require(msg.value == uint(priceInETH()), "Invalid ETH");

        alreadyBought[msg.sender] = true;
        balanceOf[msg.sender] += 1;

        (bool success,) = owner.call{value: msg.value}("");
        require(success, "Transfer failed");

        return alreadyBought[msg.sender] = true;
    }

}