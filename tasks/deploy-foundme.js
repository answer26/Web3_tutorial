const { task } = require("hardhat/config")

task("deploy-foundme", "deploy and verify fundme contract").setAction(async (taskArgs, hre) => {
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    console.log("contract deploying")

    const fundMe = await fundMeFactory.deploy(300)
    await fundMe.waitForDeployment()
    console.log("contract has been deployed successfully, contract address is" + fundMe.target);

    if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("Waiting for 5 confirmations")
        await fundMe.deploymentTransaction().wait(5)
        await verifyFundMe(fundMe.target, [300])
    } else {
        console.log("verificaton skipped..")
    }
})

async function verify(fundMeAddr, args) {
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
      });
}

module.exports = {}