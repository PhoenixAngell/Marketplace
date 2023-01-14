import MarketplaceABI from "./MarketplaceABI.json";
import IERC20 from "./IERC20.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

// export const itemContext = createContext(null);
// export const itemData = itemData;


function ContractAPI() {
    const initTokens = {
        usdcAddress: "0x6ef12Ce6ad90f818E138a1E0Ee73Ad43E56F33e4",
        usdtAddress: "0x27D324cddb6782221c6d5E1DFAa9B2b0C6673184",
        usdcInterface: null,
        usdtInterface: null
    }
    const marketAddress = "0x66ebA0908d4F95a137F4C9c19c701fAC8DDF5a52"
    

    // Set to true once all Web3 conditions are met
    const [isInitialized, setInit] = useState(false);
    // Stores provider for use in loading marketplace item data
    const [provider, setProvider] = useState(new ethers.providers.Web3Provider(window.ethereum));
    // Contains the entire Marketplace marketContract object
    const [marketContract, setContract] = useState(null);
    // Contains provider, signer, marketContract, and accounts
    const [walletData, setWeb3] = useState(null);
    const [tokens, setTokens] = useState(null)

    const [itemData, setItemData] = useState(null);

    const connectTokens = () => {
        console.log("CT: Running connectTokens(",walletData,")");
        const tempTokens = initTokens;
        const signer = walletData.signer;
        console.log("CT: Signer = ", signer);
        
        console.log("CT: Getting USDC interface:");
        tempTokens.usdcInterface = new ethers.Contract(tempTokens.usdcAddress, IERC20, signer);
        console.log(tempTokens.usdcInterface);
        
        console.log("CT: Getting USDT interface:");
        tempTokens.usdtInterface = new ethers.Contract(tempTokens.usdtAddress, IERC20, signer);
        console.log(tempTokens.usdtInterface);
        
        console.log("CT: Setting tokens:");
        console.log(tempTokens);
        setTokens(tempTokens);
    }

    /**
     * Connects to the Marketplace smart contract and the user's wallet
     * @returns {Object} Object containing provider, accounts, signer, and marketContract
     */
    const connectMarketplace = async () => {
        console.log("CC: Running connectMarketplace")

        console.log("CC: Getting Marketplace marketContract:");
        const marketContract = new ethers.Contract(marketAddress, MarketplaceABI, walletData.signer);
        console.log(marketContract);
        
        console.log("CC: Setting marketContract");
        setContract(marketContract);
    }

    const getItemData = async () => {
        // NOTE: More item properties may be added in future
        console.log("CC: Retrieving itemPrice:");
        const itemPrice = (await marketContract.itemPrice()).toNumber();
        console.log(itemPrice);
        
        console.log("CC: Retrieving userBalance:");
        const userBalance = (await marketContract.balanceOf(walletData.userAddress)).toNumber();
        console.log(userBalance);

        console.log("CC: Retrieving hasBought:")
        const hasBought = await marketContract.alreadyBought(walletData.userAddress);
        console.log(hasBought);

        console.log("CC: Setting itemData");
        setItemData({
            itemPrice: itemPrice,
            hasBought: hasBought,
            userBalance: userBalance
        });
    }

    /**
     * Connects user's Web3 wallet, and stores data inside walletData state variable 
     * @returns {Object, null} walletData created during connection, or null if no accounts are detected.
     */
    const connectWallet = async (provider) => {
        console.log("CW: Running connectWallet");
        if(window.ethereum && window.ethereum.isMetaMask){
            console.log("CW: Wallet detected")

            console.log("CC: Getting provider:");
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            console.log(provider);

            console.log("CW: Requesting accounts");
            const accounts = await provider.send("eth_requestAccounts");

            if(accounts.length == 0){
                alert("No accounts detected");
                return null;
            }
            console.log("CW: Accounts detected:");
            console.log(accounts);

            console.log("CW: Getting signer:");
            const signer = provider.getSigner();
            console.log(signer);

            console.log("CW: Getting user's address");		
            const userAddress = await signer.getAddress();
            console.log("CW: userAddress = " + userAddress);

            console.log("CW: Creating walletData:")
            const walletData = {
                provider: provider,
                accounts: accounts,
                signer: signer,
                userAddress: userAddress
            };
            console.log(walletData);
    
            if(walletData !== null){
                console.log("CW: Setting walletData");
                setWeb3(walletData);
                
                console.log("CW: Returning walletData");
                return walletData;
            } else {
                console.log("CW: walletData not initialized");
                return;
            }
        }
    }


    /**
     * Checks if the user has already bought an item
     * @returns {Bool} True if user already owns item, false if not
     */
    const checkIfBought = async () => {
        console.log("CIB: Running checkIfBought");
        if(itemData.hasBought === null){
            console.log("CIB: hasBought is null");
            console.log("CIB: Calling marketplace.alreadyBought");
            const hasBought = await marketContract.alreadyBought(walletData.userAddress);
            console.log("CIB: hasBought = " + hasBought);
            console.log("CIB: Setting hasBought");
            const newItemData = itemData;
            newItemData.hasBought = hasBought;
            setItemData(newItemData);
        }
        if(itemData.hasBought){
            console.log("CIB: hasBought = ", itemData.hasBought);
            alert("You already bought that!");
            console.log("CIB: Returning true");
            return true;
        }
        if(!itemData.hasBought){
            console.log("CIB: hasBought = ", itemData.hasBought);
            console.log("CIB: Returning false");
            return false;
        }
    }

    const purchaseWithUSDC = async () => {
        console.log("PWUSDC: Running purchaseWithUSDC");
        console.log("PWUSDC: Checking value of hasBought:");
        console.log(itemData.hasBought);
        if(itemData.hasBought === null){
            console.log("PWUSDC: hasBought is null");
            console.log("PWUSDC: Calling checkIfBought");
            const hasBought = await checkIfBought();
        }
        if(itemData.hasBought){
            console.log("PWUSDC: hasBought is true, returning");
            return;
        } else {
            console.log("PWUSDC: hasBought is false, processing purchase");

            // Approve USDC for purchase
            await approveUSDC();

            const marketplace = walletData.marketContract;
            console.log("PWUSDC: Calling marketplace.payInUSDC()");
            const receipt = await marketplace.payInUSDC();
            console.log("PWUSDC: Awaiting transaction confirmation");
            const txStatus = await receipt.wait();
            if(txStatus.confirmations > 0){
                console.log("PWUSDC: Transaction confirmed");
                alert("You have bought the item");
            }
        }
    }

    /**
     * Approves enough USDC to purchase one item, if not already approved
     * @returns {Bool} Flag indicating user is approved to purchase item
     */
    const approveUSDC = async () => {
        console.log("AUSDC: Running approveUSDC");

        console.log("AUSDC: Checking if marketplace has allowance");
        const allowance = await tokens.usdcInterface.allowance(walletData.userAddress, marketContract.address);
        if(allowance >= itemData.itemPrice){
            return true;
        } else {
            const approvalStatus = await tokens.usdcInterface.approve(marketContract.address, marketContract.itemPrice())
            const txStatus = approvalStatus.wait();
            if(txStatus.confirmations > 0){
                return true;
            }
        }

    }

    /**
     * Connects user's wallet, initiates React effects that connect to marketplace and token contracts
     */
    const initializeWeb3 = async () => {
        console.log("IW3: Running initializeWeb3")
        if(!isInitialized){
            console.log("IW3: Calling connectWallet");
            await connectWallet();
        } else {
            alert("You are already connected to Web3")
        }
    }


    // Checks if walletData and tokens have been initialized, sets isInitialized flag to true when ready
    useEffect(() => {
        console.log("Effect: Checking walletData, marketContract, and tokens");
        if(isInitialized) return;

        if(walletData !== null && marketContract === null){
            console.log("Effect: Calling connectMarketplace");
            connectMarketplace();
        }
        else if(marketContract !== null && tokens === null){
            console.log("Effect: Calling connectTokens");
            connectTokens();
        }
        else if(tokens !== null && itemData === null){
            console.log("Effect: Calling getItemData");
            getItemData();
        }
        else if(
                walletData !== null && 
                marketContract !== null && 
                tokens !== initTokens && 
                itemData !== null
            ){
            console.log("Effect: Setting isInitialized = true");
            setInit(true);
        }
    }, [walletData, marketContract, tokens])


    return (
        <div className="connect">
            <a href="#" onClick={initializeWeb3}>Connect Wallet</a>
        </div>
    );
}


export default ContractAPI;