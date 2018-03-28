const fs = require('fs')
const path = require('path')
const util = require('util')
const Web3 = require('web3')


~(async () => {

    // please start testrpc first -- command: `testrpc -a 10 -u 0,1,2,3,4,5`, package: "ethereumjs-testrpc"
    const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))



    // compile the contract:
    util.log("compiling...")
    const contractSource = fs.readFileSync(path.join(__dirname, 'src/greetings.sol'), 'utf8')
    // contractSource = fs.readFileSync('src/greetings.sol', 'utf8')
    
    /// The following line will throw Error: `Returned error: Error: Method eth_compileSolidity not supported.`
    /// The reason is solidity compiler is deprecated and removed from web3.
    /// So, now we use solc instead.
    // const contractCompiled = await web3.eth.compile.solidity(contractSource)
    
    const solc = require('solc')
    const solcOutput = solc.compile({sources: {main: contractSource}}, 1)
    // util.log("solc output:", solcOutput)

    if (solcOutput.errors && solcOutput.errors.length){
        util.log("Error: solc compile failed, details: ", solcOutput.errors)
        return
    }

    // Since we only have one contract, so just get the first one.
    const contractCompiled = Object.values(solcOutput.contracts)[0]
    
    util.log("compiled.")
    // util.log("compiled: ", contractCompiled)
    
    // const deployAddr = web3.eth.accounts[0]
    // const acc = web3.eth.accounts.create()
    const accountsList = await web3.eth.getAccounts()
    const deployAddr = accountsList[0]
    const contractBytecode = '0x' + contractCompiled.bytecode
    const contractAbi = JSON.parse(contractCompiled.interface)
    const gasEstimate = await web3.eth.estimateGas({data: contractBytecode})
    const myContact = new web3.eth.Contract(contractAbi, {
        from: deployAddr,
        gas: gasEstimate,
        data: contractBytecode,
    })

    util.log("deploying the contract by addr %o(balance=%o) gasEstimate=%o...", deployAddr, await web3.eth.getBalance(deployAddr), gasEstimate);
    // myContact.deploy({data: contractBytecode})
    myContact.deploy({arguments: ["Hello world!"]}) // arguments will be passed to the contract's constructor
            .send({from: deployAddr, gas: gasEstimate * 10}) // send() returns a Promise
            /// `error` event will cause the Promise rejected, so we use .catch(err=>...) instead.
            // .on('error', function(error){
            //     util.log("Error: failed to deploy, detail:", error)
            // })
            .on('transactionHash', function(transactionHash){
                util.log("deploy transaction hash: ", transactionHash)
            })
            .on('receipt', function(receipt){
                util.log("deploy receipt: ", receipt)
            })
            .on('confirmation', function(confirmationNum, receipt){
                if (confirmationNum <= 6){
                    util.log("got confirmations number: ", confirmationNum)
                }
            })
            .then(async function(myContactInstance){            
                util.log("deployed successfully.")
                util.log("now the addr %o balance is %o", deployAddr, await web3.eth.getBalance(deployAddr))

                testContact(myContactInstance)
            })
            .catch(err => {
                util.log("Error: failed to deploy, detail:", err)
            })    


    async function testContact(myContactInstance){
        try {
            const testAddr = accountsList[1]
            util.log("testing with address: %o (balance: %o)", testAddr, await web3.eth.getBalance(testAddr))

            util.log("test get greeting...")
            const greeting = await myContactInstance.methods.greet().call({from: testAddr})
            util.log("got greeting: ", greeting)
            util.log("after greet address %o balance is %o", testAddr, await web3.eth.getBalance(testAddr))



            util.log("test setGreeting...")

            // in non-constant functions, who modifies the blockchange/storage, 
            // return values cannot be used, but events can be emitted.
            const res = await myContactInstance.methods.setGreeting("Hi world!").send({from: testAddr})
            util.log("setGreeting result: ", res)
            util.log("setGreeting emitted events: ", res.events)
                  
            // note: setGreeting() cannot use call() -- must use send()
            //  -- send() will send a transaction and spend gas.
            //  -- while call() only call a "constant" or "view" method and spent no gas.
            // await myContactInstance.methods.setGreeting("Hi world!").call({from: testAddr})
            // await new Promise(resolve => setTimeout(resolve, 2000)) // sleep a while not help

            util.log("after setGreeting address %o balance is %o", testAddr, await web3.eth.getBalance(testAddr))

            util.log("test get greeting...")
            const greeting2 = await myContactInstance.methods.greet().call({from: testAddr})
            util.log("got greeting: ", greeting2)
            util.log("after greet address %o balance is %o", testAddr, await web3.eth.getBalance(testAddr))

            util.log("kill the contact.")
            await myContactInstance.methods.kill().call({from: testAddr})
            util.log("after kill address %o balance is %o", testAddr, await web3.eth.getBalance(testAddr))

            util.log("end.")
        } catch (e){
            util.log("Error: tests failed: ", e)
        }
    }
})();
