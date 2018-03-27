const fs = require('fs')
const path = require('path')
const util = require('util')
const Web3 = require('web3')


~(async () => {


    const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))



    // compile the contract:
    util.log("compiling...")
    const contractSource = fs.readFileSync(path.join(__dirname, 'src/greetings.sol'), 'utf8')
    const contractCompiled = await web3.eth.compile.solidity(contractSource)
    
    
    util.log("compiled: ", contractCompiled)
    util.log("ABI definition: ", contractCompiled.info.abiDefinition)
    
    const deployCode = contractCompiled.code
    const deployAddr = web3.eth.accounts[0]
    util.log("deploying contract to %o...", deployAddr);
    
    contractCompiled.new({data: deployCode, from: deployAddr}, function(err, myContact){
        if (err){
            util.log("deploy failed: ", err)
            return
        }
    
        if (!myContact.address){
            util.log("deploying... the hash: ", myContact.transactionHash)
            return
        }
    
        util.log("deployed successfully.")
    
        const testAddr = web3.eth.accounts[1]
    
        util.log("test setGreeting...")
        myContact.setGreeting.sendTransaction("Hell world!", {from: testAddr})
    
        util.log("test get greeting...")
        const greeting = myContact.greet.call();
        util.log("got greeting: ", greeting)
    
        util.log("kill the contact.")
        myContact.kill.call();
    
        util.log("end.")
    })
    
    
})();

