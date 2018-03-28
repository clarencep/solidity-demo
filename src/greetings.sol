pragma solidity ^0.4.0;
/* 
	The following is an extremely basic example of a solidity contract. 
	It takes a string upon creation and then repeats it when greet() is called.
*/

contract Greeter         // The contract definition. A constructor of the same name will be automatically called on contract creation. 
{
    address creator;     // At first, an empty "address"-type variable of the name "creator". Will be set in the constructor.
    string greeting;     // At first, an empty "string"-type variable of the name "greeting". Will be set in constructor and can be changed.

    event GreetingChangedEvent(string oldGreeting, string newGreeting, address who);

    function Greeter(string _greeting) public payable   // The constructor. It accepts a string input and saves it to the contract's "greeting" variable.
    {
        creator = msg.sender;
        greeting = _greeting;
    }

    function greet() public constant returns (string)          
    {
        return greeting;
    }
    
    function getBlockNumber() public constant returns (uint) // this doesn't have anything to do with the act of greeting
    {													// just demonstrating return of some global variable
        return block.number;
    }
    
    function setGreeting(string _newgreeting)  public
    {
        string memory oldGreeting = greeting;
        greeting = _newgreeting;

        // in non-constant functions, who modifies the blockchange/storage, 
        // return values cannot be used, but we can emit events.
        emit GreetingChangedEvent(oldGreeting, _newgreeting, msg.sender);
    }
    
     /**********
     Standard kill() function to recover funds 
     **********/
    
    function kill() public
    { 
        if (msg.sender == creator)  // only allow this action if the account sending the signal is the creator
            selfdestruct(creator);       // kills this contract and sends remaining funds back to creator
    }

}