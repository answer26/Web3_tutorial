//function deployFunction() {
//    console.log("this is a deploy function")
//}

const { network } = require("hardhat")
const { developmentChains, networkConfig, LOCK_TIME, CONFIRMATIONS} = require("../helper-hardhat-config")

//module.exports.dufault = deployFunction
//module.exports = async(hre) => {
//    const getNamedAccounts = hre.getNamedAccounts
//    const deployments = hre.deployments
//    console.log("this is a deploy function")
//}

module.exports = async({getNamedAccounts, deployments}) => {
    const {firstAccount} = await getNamedAccounts()
    const {deploy} = deployments

    let dataFeedAddr
    let confirmations
    if(developmentChains.includes(network.name)) {
        const MockV3Aggregator = await deployments.get("MockV3Aggregator")
        dataFeedAddr = MockV3Aggregator.address
        confirmations = 0
    } else {
        dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed
        confirmations = CONFIRMATIONS
    }

    const fundMe = await deploy("FundMe", {
        from: firstAccount,
        args: [LOCK_TIME, dataFeedAddr],
        log: true,
        waitConfirmations: confirmations
    })

    if(hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        await hre.run("verify:verify", {
            address: fundMe.address,
            constructorArguments: [LOCK_TIME, dataFeedAddr],
          });
    } else {
        console.log("Network is not sepolia, verification skipped...")
    }
    
}

module.exports.tags = ["all", "fundme"]