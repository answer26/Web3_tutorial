const { task } = require("hardhat/config")

task("interact-fundme", "interact with foundme contract")
    .addParam("addr", "fundme contract address")
    .setAction(async (taskArgs, hre) => {

        const fundMeFactory = await ethers.getContractFactory("FundMe")
        const fundMe = fundMeFactory.attach(taskArgs.addr)

        const [firstAccount, secondAccount] = await ethers.getSigners()

        const fundTx = await fundMe.fund({ value: ethers.parseEther("0.5") })
        await fundTx.wait()

        const balanceOfContract = await ethers.provider.getBalance(fundMe.target)
        console.log(`Balance of the contract is ${balanceOfContract}`)

        const fundTxSecond = await fundMe.connect(secondAccount).fund({ value: ethers.parseEther("0.5") })
        await fundTxSecond.wait()

        const balanceOfContractSecond = await ethers.provider.getBalance(fundMe.target)
        console.log(`Balance of the contract is ${balanceOfContractSecond}`)

        const firstAccountbalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address)
        const secondAccountbalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address)
        console.log(`Balance of first account ${firstAccount.address} is ${firstAccountbalanceInFundMe}`)
        console.log(`Balance of second account ${secondAccount.address} is ${secondAccountbalanceInFundMe}`)
    })

module.exports = {}