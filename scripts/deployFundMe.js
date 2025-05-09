const { ethers } = require("hardhat")

async function main() {

    const fundMeFactory = await ethers.getContractFactory("FundMe")
    console.log("contract deploying")

    const fundMe = await fundMeFactory.deploy(10)
    await fundMe.waitForDeployment()
    console.log("contract has been deployed successfully, contract address is" + fundMe.target);

    if(hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY){
        console.log("Waiting for 5 confirmations")
        await fundMe.deploymentTransaction().wait(5)
        await verifyFundMe(fundMe.target, [10])
    } else {
        console.log("verificaton skipped..")
    }
    
    const [firstAccount, secondAccount] = await ethers.getSigners()

    const fundTx = await fundMe.fund({value: ethers.parseEther("0.5")})
    await fundTx.wait()

    const balanceOfContract = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of the contract is ${balanceOfContract}`)

    const fundTxSecond = await fundMe.connect(secondAccount).fund({value: ethers.parseEther("0.5")})
    await fundTxSecond.wait()

    const balanceOfContractSecond = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of the contract is ${balanceOfContractSecond}`)

    const firstAccountbalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address)
    const secondAccountbalanceInFundMe =await fundMe.fundersToAmount(secondAccount.address)
    console.log(`Balance of first account ${firstAccount.address} is ${firstAccountbalanceInFundMe}`)
    console.log(`Balance of first account ${secondAccount.address} is ${secondAccountbalanceInFundMe}`)
}

async function verify(fundMeAddr, args) {
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
      });
}

main().then().catch((error) => {
    console.error(error)
    process.exit(0)
})