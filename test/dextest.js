const Dex = artifacts.require("Dex");
const Link = artifacts.require("Link");
const truffleAssert = require('truffle-assertions');

contract("Dex", accounts => {
    //The user must have enough ETH deposited such that deposited ETH >= buy order amount
    //ETH balance will be 10 ETH per account
    it("should throw an error when the user's ETH balance is less than a buy limit order amount", async () => {
        let dex = await Dex.deployed()
        let link = await Link.deployed()
        await truffleAssert.reverts(
            dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 10, 1)
        )
        dex.depositEth({value: 10})
        await truffleAssert.passes(
            dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 10, 1)
        )
    });

    //The user must have enough tokens deposited such that token balance >= sell order amount

    it("should throw an error when the user's token balance is less than a sell order amount", async () => {
        let dex = await Dex.deployed();
        let link = await Link.deployed();
        await truffleAssert.reverts(
            dex.createLimitOrder(1, web3.utils.utf8ToHex('LINK'), 10, 1)
        );
        await link.approve(500, dex.address);
        await dex.deposit(10, web3.utils.utf8ToHex('LINK'));
        await truffleAssert.passes(
            dex.createLimitOrder(1, web3.utils.utf8ToHex('LINK'), 10, 1)
        );
    });

    //The buy orderbook should be ordered from highest to lowest in price starting at index 0
    it("should be ordered from highest to lowest in price, starting from index 0", async () => {
        let dex = await Dex.deployed();
        let link = await Link.deployed();
        await link.approve(500, dex.address);
        await dex.createLimitOrder(0, web3.utils.utf8ToHex('LINK'), 1, 300);
        await dex.createLimitOrder(0, web3.utils.utf8ToHex('LINK'), 1, 100);
        await dex.createLimitOrder(0, web3.utils.utf8ToHex('LINK'), 1, 200);
        let buyOrderBook = getOrderBook(web3.utils.utf8ToHex('LINK'), 0);
        assert(buyOrderBook.length > 0);
        assert.equal(
            buyOrderBook,
            buyOrderBook.sort((a, b) => {
            return b.price - a.price;
        }));
    });

    //The sell orderbook should be ordered from lowest to highest in price starting at index 0
    it("should be ordered from highest to lowest in price, starting from index 0", async () => {
        let dex = await Dex.deployed();
        let link = await Link.deployed();
        await link.approve(500, dex.address);
        await dex.createLimitOrder(0, web3.utils.utf8ToHex('LINK'), 1, 300);
        await dex.createLimitOrder(0, web3.utils.utf8ToHex('LINK'), 1, 100);
        await dex.createLimitOrder(0, web3.utils.utf8ToHex('LINK'), 1, 200);
        let sellOrderBook = getOrderBook(web3.utils.utf8ToHex('LINK'), 1);
        assert(sellOrderBook.length > 0);
        assert.equal(
            sellOrderBook,
            sellOrderBook.sort((a, b) => {
            return a.price - b.price;
        }));
    });
});