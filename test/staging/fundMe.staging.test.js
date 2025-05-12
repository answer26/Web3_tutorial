const { ethers, getNamedAccounts, deployments, network } = require("hardhat")
const { assert, expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("test fundme contract", async function () {
        let fundMe
        let firstAccount
        beforeEach(async function () {
            await deployments.fixture(["all"])
            firstAccount = (await getNamedAccounts()).firstAccount
            const fundMeDeployment = await deployments.get("FundMe")
            fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
        })

        it("fund and getFund successfully",
            async function () {
                await fundMe.fund({ value: ethers.parseEther("0.5") })
                await new Promise(resolve => setTimeout(resolve, 181 * 1000))
                const getFundTx = await fundMe.getFund()
                const getFundReceipt = await getFundTx.wait()
                expect(getFundReceipt)
                    .to.be.emit(fundMe, "FundWithdrawByOwner")
                    .withArgs(ethers.parseEther("0.5"))
            }
        )

        it("fund and reFund successfully",
            async function () {
                await fundMe.fund({ value: ethers.parseEther("0.1") })
                await new Promise(resolve => setTimeout(resolve, 181 * 1000))
                const reFundTx = await fundMe.refund()
                const reFundReceipt = await reFundTx.wait()
                expect(reFundReceipt)
                    .to.be.emit(fundMe, "RefundByOwner")
                    .withArgs(firstAccount, ethers.parseEther("0.1"))
            }
        )

    })
