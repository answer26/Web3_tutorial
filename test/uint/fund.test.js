const { ethers, getNamedAccounts, deployments } = require("hardhat")
const { assert, expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("test fundme contract", async function () {
        let fundMe
        let fundMeSecondAccount
        let firstAccount
        let secondAccount
        let mockV3Aggregator
        beforeEach(async function () {
            await deployments.fixture(["all"])
            firstAccount = (await getNamedAccounts()).firstAccount
            secondAccount = (await getNamedAccounts()).secondAccount
            const fundMeDeployment = await deployments.get("FundMe")
            mockV3Aggregator = await deployments.get("MockV3Aggregator")
            fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
            fundMeSecondAccount = await ethers.getContractAt("FundMe", secondAccount)
        })

        it("test if the owner is msg.sender", async function () {
            await fundMe.waitForDeployment()
            assert.equal((await fundMe.owner()), mockV3Aggregator.address)
        })

        it("test if the datafeed is assigned correctly", async function () {
            await fundMe.waitForDeployment()
            assert.equal((await fundMe.dataFeed()),)
        })

        it("window closed, value grater than minimum , fund failed",
            async function () {
                await helpers.time.increase(200)
                await helpers.mine()

                expect(fundMe.fund({ value: ethers.parseEther("0.1") }))
                    .to.be.revertedWith("window is closed")
            }
        )

        it("window open, value is less than minimum, fund failed",
            async function () {
                expect(fundMe.fund({ value: ethers.parseEther("0.01") }))
                    .to.be.revertedWith("Send more ETH")
            }
        )

        it("Window open, value is grater minimum, fund success",
            async function () {
                await fundMe.fund({ value: ethers.parseEther("0.1") })
                const balance = await fundMe.fundersToAmount(firstAccount)
                expect(balance).to.equal(ethers.parseEther("0.1"))
            }
        )

        it("not owner, window closed, target reached, getFund failed",
            async function () {
                await fundMe.fund({ value: ethers.parseEther("1") })

                await helpers.time.increase(200)
                await helpers.mine()

                await expect(fundMeSecondAccount.getFund())
                    .to.be.revertedWith("this function can only be called by owner")
            }
        )

        it("window open, target reached, getFund failed",
            async function () {
                await fundMe.fund({ value: ethers.parseEther("1") })
                await expect(fundMe.getFund())
                    .to.be.revertedWith("window is not closed")
            }
        )

        it("window closed, target is not reached, getFund failed",
            async function () {
                await fundMe.fund({ value: ethers.parseEther("0.1") })
                await helpers.time.increase(200)
                await helpers.mine()
                await expect(fundMe.getFund())
                    .to.be.revertedWith("target is not closed")
            }
        )

        it("window closed, target reached, getFund success",
            async function () {
                await fundMe.fund({ value: ethers.parseEther("1") })
                await helpers.time.increase(200)
                await helpers.mine()
                await expect(fundMe.getFund())
                    .to.emit(fundMe, "FundWithdrawByOwner")
                    .withArgs(ethers.parseEther("1"))
            }
        )

        it("window open, target not reached, funder has balance",
            async function () {
                await fundMe.fund({ value: ethers.parseEther("0.1") })
                await expect(fundMe.refund())
                    .to.be.revertedWith("window is not closed");
            }
        )

        it("window closed, target reached, funder has balance",
            async function () {
                await fundMe.fund({ value: ethers.parseEther("1") })
                await helpers.time.increase(200)
                await helpers.mine()
                await expect(fundMe.refund())
                    .to.be.revertedWith("target is reached");
            }
        )
        it("window closed, target not reached, funder does not has balance",
            async function () {
                await fundMe.fund({ value: ethers.parseEther("0.1") })
                await helpers.time.increase(200)
                await helpers.mine()
                await expect(fundMeSecondAccount.refund())
                    .to.be.revertedWith("there is no fund for you");
            }
        )

        it("window closed, target not reached, funder has balance",
            async function () {
                await fundMe.fund({ value: ethers.parseEther("0.1") })
                await helpers.time.increase(200)
                await helpers.mine()
                await expect(fundMe.refund())
                    .to.emit(fundMe, "RefundByFunder")
                    .withArgs(firstAccount, ethers.parseEther("0.1"))
            }
        )
    })