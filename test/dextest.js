const Dex = artifacts.require("Dex");
const Link = artifacts.require("Link");
const truffleAssert = require('truffle-assertions');


const LINK_TICKER = web3.utils.utf8ToHex("LINK");
const BUY_SIDE = 0;
const SELL_SIDE = 1;

contract("Dex", accounts => {
    let dex;
    let link
    before(async function () {
        dex = await Dex.deployed();
        link = await Link.deployed();
    });
    //The user must have enough ETH deposited such that deposited ETH >= buy order amount
    //ETH balance will be 11 ETH per account
    it("should throw an error when the user's ETH balance is less than a buy limit order amount", async () => {
        await truffleAssert.reverts(
            dex.createLimitOrder(BUY_SIDE, LINK_TICKER, 10, 1)
        )
    });

    it("should pass when the user's ETH balance is greater than than a buy limit order amount", async () => {
        dex.depositEth({ value: web3.utils.toWei('11', 'ether') });
        await truffleAssert.passes(
            dex.createLimitOrder(BUY_SIDE, LINK_TICKER, 10, 1)
        )
    });
    
    //The user must have enough tokens deposited such that token balance >= sell order amount

    it("should throw an error when the user's token balance is less than a sell order amount", async () => {
        await truffleAssert.reverts(
            dex.createLimitOrder(SELL_SIDE, LINK_TICKER, 10, 1)
        );
    });

    it("should pass when the user's token balance is greater than a sell order amount", async () => {
        await dex.addTokenSupport(LINK_TICKER, link.address);
        await link.approve(dex.address, 601);
        await dex.deposit(601, LINK_TICKER);
        await truffleAssert.passes(
            dex.createLimitOrder(SELL_SIDE, LINK_TICKER, 10, 1)
        );
    });

    //The buy orderbook should be ordered from highest to lowest in price starting at index 0
    it("should be ordered from highest to lowest in price, starting from index 0", async () => {
        await dex.createLimitOrder(BUY_SIDE, LINK_TICKER, 1, 3);
        await dex.createLimitOrder(BUY_SIDE, LINK_TICKER, 1, 1);
        await dex.createLimitOrder(BUY_SIDE, LINK_TICKER, 1, 2);
        let buyOrderBook = await dex.getOrderBook(LINK_TICKER, 0);
        for (let i = 0; i < buyOrderBook.length - 1; i++) {
            assert(buyOrderBook[i] >= buyOrderBook[i + 1], "Orderbook is not in correct order");
        }

    });

    //The sell orderbook should be ordered from lowest to highest in price starting at index 0
    it("should be ordered from highest to lowest in price, starting from index 0", async () => {
        await dex.createLimitOrder(SELL_SIDE, LINK_TICKER, 300, 1);
        await dex.createLimitOrder(SELL_SIDE, LINK_TICKER, 100, 1);
        await dex.createLimitOrder(SELL_SIDE, LINK_TICKER, 200, 1);
        let sellOrderBook = await dex.getOrderBook(LINK_TICKER, 1);
        for (let i = 0; i < sellOrderBook.length - 1; i++) {
            assert(sellOrderBook[i] <= sellOrderBook[i + 1], "Orderbook is not in correct order");
        }
    });
});