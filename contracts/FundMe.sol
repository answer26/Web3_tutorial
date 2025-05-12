// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract FundMe {

    mapping (address => uint256) public fundersToAmount;
    uint MININUM_VALUE = 100 * 10 ** 18;
    AggregatorV3Interface public dataFeed;
    uint constant TARGET = 1000 * 10 ** 18;
    address public owner;
    uint deploymentTimestamp;
    uint lockTime;
    address erc20Addr;
    bool public getFundSuccess = false;
    
    event FundWithdrawByOwner(uint);
    event RefundByFunder(address, uint)

    constructor(uint _locktime, address dataFeedAddr) {
        dataFeed = AggregatorV3Interface(dataFeedAddr);
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
        lockTime = _locktime;
    }

    function fund() external payable {
        require(convertEthToUsd(msg.value) >= MININUM_VALUE, "Send more ETH");
        require(block.timestamp < deploymentTimestamp + lockTime, "window is closed");
        fundersToAmount[msg.sender] = msg.value;
    }

    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundId */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    function convertEthToUsd(uint ethAmount) internal view returns (uint) {
        uint ethPrice = uint(getChainlinkDataFeedLatestAnswer());
        return ethAmount * ethPrice / (10 ** 8);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    function getFund() external windowClose onlyOwner{
        require(convertEthToUsd(address(this).balance) >= TARGET, "Target is not reached");
        
        
        //payable(msg.sender).transfer(address(this).balance);
        bool success;
        uint balance = address(this).balance;
        (success, )= payable(msg.sender).call{value: balance}("");
        require(success, "transfer tx failed");
        fundersToAmount[msg.sender] = 0;
        getFundSuccess = true;//flag
        emit FundWithdrawByOwner(balance);
    }

    function refund() external windowClose {
        require(convertEthToUsd(address(this).balance) < TARGET, "Target is reached");
        require(fundersToAmount[msg.sender] != 0, "there is no fund for you");
        
        bool success;
        uint balance = fundersToAmount[msg.sender];
        (success, )= payable(msg.sender).call{value: balance}("");
        require(success, "transfer tx failed");
        fundersToAmount[msg.sender] = 0;
        emit RefundByFunder(msg.sender, balance);
    }

    function setFunderToAmount(address _funder, uint amountToUpdate) external  {
        require(msg.sender == erc20Addr, "you do not have permission to call this function");
        fundersToAmount[_funder] = amountToUpdate;
    }

    function setErc20Addr(address _erc20Addr) public onlyOwner {
        erc20Addr = _erc20Addr;
    }

    modifier windowClose() {
        require(block.timestamp >= deploymentTimestamp + lockTime, "window is closed");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "this function can only be called by owner");
        _;
    }
}