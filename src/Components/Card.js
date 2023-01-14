import css from "./Card.css";
import MarketplaceABI from "../Contracts/MarketplaceABI.json";
import IERC20 from "../Contracts/IERC20.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getItemData } from "../Contracts/web3Funcs";

function Card(props) {
    
    const initTokens = {
        usdcAddress: "0x6ef12Ce6ad90f818E138a1E0Ee73Ad43E56F33e4",
        usdtAddress: "0x27D324cddb6782221c6d5E1DFAa9B2b0C6673184",
        usdcInterface: null,
        usdtInterface: null
    }
    const emptyItemData = {
        itemPrice: null, // Dollar price
        itemETHPrice: null, // ETH price, in wei
        hasBought: false, // Indicates if user has already bought this item
        userBalance: null // User's balance of this item
    }
    const emptyWalletData = {
        provider: null,
        accounts: null,
        signer: null,
        userAddress: null,
        userBalance: null // ETH balance, in ETH
    }
    const marketAddress = "0x66ebA0908d4F95a137F4C9c19c701fAC8DDF5a52"
    

    // Set to true once all Web3 conditions are met
    const [isInitialized, setInit] = useState(false);
    // Stores provider for use in loading marketplace item data
    const [provider, setProvider] = useState(new ethers.providers.Web3Provider(window.ethereum));
    // Contains the entire Marketplace marketContract object
    const [marketContract, setContract] = useState(null);
    // Contains provider, signer, marketContract, and accounts
    const [walletData, setWalletData] = useState(null);

    // Stablecoin contracts and state variables
    const [tokens, setTokens] = useState(null)
    const [usdcApproved, setUSDCApproved] = useState(false);
    const [usdtApproved, setUSDTApproved] = useState(false);

    const [itemData, setItemData] = useState(emptyItemData);

    /**
     * Connects user's Web3 wallet, and stores user's data inside walletData state variable 
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

            console.log("CW: Getting user's ETH balance:");
            const userBalance = await getETHBalance(signer);
            
            console.log("CW: Creating walletData:")
            const walletData = {
                ...emptyWalletData,
                provider: provider,
                accounts: accounts,
                signer: signer,
                userAddress: userAddress,
                userBalance: userBalance
            };
            console.log(walletData);
            
            if(walletData !== null){
                console.log("CW: Setting walletData");
                setWalletData(walletData);
                
                console.log("CW: Returning walletData");
                return walletData;
            } else {
                console.log("CW: walletData not initialized");
                return;
            }
        }
    }

    const connectTokens = (walletData) => {
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
    const connectMarketplace = (walletData) => {
        console.log("CC: Running connectMarketplace")

        console.log("CC: Getting Marketplace marketContract:");
        const marketContract = new ethers.Contract(marketAddress, MarketplaceABI, walletData.signer);
        console.log(marketContract);
        
        console.log("CC: Setting marketContract");
        setContract(marketContract);
    }
    
    const updateItemData = async () => {
        console.log("UID: Retrieving itemPrice:");
        const itemPrice = (await marketContract.itemPrice()).toNumber();
        console.log(itemPrice);

        console.log("UID: Calling getETHPrice:");
        const itemETHPrice = await getETHPrice();
        console.log(itemETHPrice);

        console.log("UID: Creating timestamp:");
        const timeUpdated = Date.now();
        console.log(timeUpdated);
    
        console.log("UID: Retrieving userBalance:");
        const userBalance = (await marketContract.balanceOf(walletData.userAddress)).toNumber();
        console.log(userBalance);
    
        console.log("UID: Retrieving hasBought:")
        const hasBought = await marketContract.alreadyBought(walletData.userAddress);
        console.log(hasBought);
    
        console.log("UID: Setting itemData:");
        const newItemData = {
            ...itemData,
            itemPrice: itemPrice,
            itemETHPrice: itemETHPrice,
            hasBought: hasBought,
            userBalance: userBalance
        }
        console.log(newItemData);
        setItemData(newItemData);
    }


    /**
     * Gets, formats, and returns an item's ETH price
     * @returns {Number} Formatted item ETH price
     */
    const getETHPrice = async () => {
        console.log("GETHP: Running getETHPrice")
        console.log("GETHP: Retrieving and formatting item's ETH price");
        const itemETHPrice = ethers.utils.formatEther(await marketContract.priceInETH());
        console.log("GETHP: itemETHPrice = ", itemETHPrice);
        
        console.log("GETHP: Returning itemETHPrice");
        return itemETHPrice;
    }

    /**
     * Formats the stablecoin price into a standard fiat format
     * @param {Number} itemPrice Price of item in USDC/USDT 
     * @returns {Number} Stablecoin price in $X.XX format 
     */
    const formatItemPrice = (itemPrice) => {
        console.log("FIP: Running formatItemPrice")
        if(itemData){
            console.log("FP: Formatting itemData.itemPrice:")
            const formattedPrice = '$' + (itemPrice / (10**6)).toFixed(2);
            console.log(formattedPrice); // "$2.50"
            return formattedPrice;
        }
    }

    /**
     * Formats 
     * @param {BigNumber} ethAmount Amount of ETH returned from the blockchain in BigNumber format 
     * @returns {Number} Amount of ETH with 18 decimals
     */
    const formatETH = (ethAmount) => {
        console.log("FETH: Running formatETH(",ethAmount,")");
        if(ethAmount === undefined || ethAmount === null){
            return "Invalid ETH Amount"
        } else {
            // const formattedETHPrice = (ethAmount).toFixed(6) + " ETH";
            const formattedETHPrice = (parseFloat(ethAmount)).toFixed(6) + " ETH";
            console.log(formattedETHPrice);
            return formattedETHPrice;
        }
    }

    /**
     * Gets, formats, and returns a user's ETH balance
     * @param {Object} signer Optional: Signer object from ethers.js, only needed if walletData has not been initialized yet 
     * @returns {Number} Formatted ETH balance
     */
    const getETHBalance = async (signer) => {
        console.log("GETHB: Running getETHBalance")
        if(walletData){
            signer = walletData.signer;
        }
        console.log("GETHB: Retrieving and formatting user's ETH balance:");
        const userBalance = parseFloat(ethers.utils.formatEther(await signer.getBalance()));
        console.log(userBalance);
        
        console.log("GETHB: Returning userBalance");
        return userBalance;
    }

    const updateETHBalance = async () => {
        console.log("UETHB: Running updateETHBalance")
        console.log("UETHB: Calling getETHBalance:")
        const ethBalance = await getETHBalance();
        console.log("UETHB: Updated walletData")
        const newWalletData = {
            ...walletData,
            userBalance: ethBalance
        }
        setWalletData(newWalletData);
    }


    // /**
    //  * Checks if the user has already bought an item
    //  * @returns {Bool} True if user already owns item, false if not
    //  */
    // const checkIfBought = async () => {
    //     console.log("CIB: Running checkIfBought");
    //     if(itemData.hasBought === null){
    //         console.log("CIB: hasBought is null");
    //         console.log("CIB: Calling marketplace.alreadyBought");
    //         const userBought = await marketContract.alreadyBought(walletData.userAddress);
    //         console.log("CIB: hasBought = " + userBought);
    //         console.log("CIB: Setting hasBought");
    //         const newItemData = {
    //             ...itemData,
    //             hasBought: userBought
    //         };
    //         console.log("CIB: Setting itemData.hasBought = ", userBought);
    //         setItemData(newItemData);
    //     }
    //     if(itemData.hasBought){
    //         console.log("CIB: hasBought = ", itemData.hasBought);
    //         alert("You already bought that!");
    //         console.log("CIB: Returning true");
    //         return true;
    //     }
    //     if(!itemData.hasBought){
    //         console.log("CIB: hasBought = ", itemData.hasBought);
    //         console.log("CIB: Returning false");
    //         return false;
    //     }
    // }


    const purchaseWithUSDC = async () => {
        console.log("PWUSDC: Running purchaseWithUSDC");

        console.log("PWUSDC: Checking value of hasBought and itemPrice:");
        console.log(itemData.hasBought, itemData.itemPrice);
        console.log("PWUSDC: Checking value of usdcApproved:");
        console.log(usdcApproved);
        if(itemData.hasBought === null || itemData.itemPrice === null){
            console.log("PWUSDC: Calling updateItemData");
            await updateItemData();
        // } else if(itemData.hasBought){
        //     console.log("PWUSDC: hasBought is true");
        //     // return;
        } else if(usdcApproved) {
            console.log("PWUSDC: processing purchase");

            console.log("PWUSDC: Calling marketplace.payInUSDC()");
            const receipt = await marketContract.payInUSDC();
            console.log("PWUSDC: Awaiting transaction confirmation");
            const txStatus = await receipt.wait();
            if(txStatus.confirmations > 0){
                console.log("PWUSDC: Transaction confirmed");
                await updateItemData();
                console.log("PWUSDC: Setting usdcApproved = false");
                setUSDCApproved(false);
            }
        }
    }

    // Called by useEffect after sufficient allowance is confirmed
    const purchaseWithUSDT = async () => {
        console.log("PWUSDT: Running purchaseWithUSDT");

        console.log("PWUSDT: Checking value of hasBought, itemPrice:");
        console.log(itemData.hasBought, itemData.itemPrice);
        console.log("PWUSDT: Checking value of usdtApproved:");
        console.log(usdtApproved);
        if(itemData.hasBought === null || itemData.itemPrice === null){
            console.log("PWUSDT: Calling updateItemData");
            await updateItemData();
        // } else if(itemData.hasBought){
        //     console.log("PWUSDT: hasBought is true");
        //     // return;
        } else if(usdtApproved) {
            console.log("PWUSDT: processing purchase");

            console.log("PWUSDT: Calling marketplace.payInUSDT()");
            const receipt = await marketContract.payInUSDT();
            console.log("PWUSDT: Awaiting transaction confirmation");
            const txStatus = await receipt.wait();
            if(txStatus.confirmations > 0){
                console.log("PWUSDT: Transaction confirmed");
                await updateItemData();
                console.log("PWUSDT: Setting usdtApproved = false");
                setUSDTApproved(false);
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
        const allowance = (await tokens.usdcInterface.allowance(walletData.userAddress, marketContract.address)).toNumber();
        console.log(allowance);
        if(allowance >= itemData.itemPrice && itemData.itemPrice !== null){
            console.log("AUSDC: Marketplace has allowance");
            console.log("AUSDC: Setting usdcApproved = true");
            setUSDCApproved(true);
            return;
        } else if(itemData.itemPrice !== null) {
            console.log("AUSDC: Marketplace does not have allowance");
            console.log("AUSDC: Calling iUSDC.approve(",marketContract.address, itemData.itemPrice);
            // const approvalStatus = await tokens.usdcInterface.approve(marketContract.address, marketContract.itemPrice())
            const approvalStatus = await tokens.usdcInterface.approve(marketContract.address, itemData.itemPrice)
            console.log("AUSDC: Awaiting transaction confirmation");
            const txStatus = await approvalStatus.wait();
            if(txStatus.confirmations > 0){
                console.log("AUSDC: Transaction confirmed");
                console.log("AUSDC: Setting usdtApproved = true");
                setUSDCApproved(true);
                return;
            }
        } else alert("AUSDC: Error with itemPrice");
    }

    /**
     * Approves enough USDC to purchase one item, if not already approved
     * @returns {Bool} Flag indicating user is approved to purchase item
     */
    const approveUSDT = async () => {
        console.log("AUSDT: Running approveUSDT");

        console.log("AUSDT: Checking if marketplace has allowance:");
        const allowance = (await tokens.usdtInterface.allowance(walletData.userAddress, marketContract.address)).toNumber();
        console.log(allowance);
        if(allowance >= itemData.itemPrice && itemData.itemPrice !== null){
            console.log("AUSDT: Marketplace has allowance");
            console.log("AUSDT: Setting usdtApproved = true");
            setUSDTApproved(true);
            return;
        } else if(itemData.itemPrice !== null) {
            console.log("AUSDT: Marketplace does not have allowance");
            console.log("AUSDT: Calling iUSDT.approve(",marketContract.address, itemData.itemPrice,")");
            const approvalStatus = await tokens.usdtInterface.approve(marketContract.address, itemData.itemPrice);
            // const approvalStatus = await tokens.usdcInterface.approve(marketContract.address, marketContract.itemPrice())
            console.log("AUSDT: Awaiting transaction confirmation");
            const txStatus = await approvalStatus.wait();
            if(txStatus.confirmations > 0){
                console.log("AUSDT: Transaction confirmed");
                console.log("AUSDT: Setting usdtApproved = true");
                setUSDTApproved(true);
                return;
            }
        } else setUSDTApproved(false);
    }

    // Initiates an ETH purchase
    const initETHPurchase = () => {
        
    }

    // Purchases 1 item with ETH
    const purchaseWithETH = async () => {
        console.log("PWETH: Running purchaseWithETH");
        const ethBalance = await walletData.signer.getBalance();
        const ethPrice = ethers.utils.parseEther(itemData.itemETHPrice);

        console.log("PWETH: Comparing user's ETH balance to item's ETH price");
        console.log(ethBalance," >= ",ethPrice);
        if(ethBalance >= ethPrice){
            console.log("PWETH: Calling marketplace.payInETH({value: ",ethPrice,"})");
            const receipt = await marketContract.payInETH({value: ethPrice});

            console.log("PWETH: Awaiting transaction confirmation");
            const txStatus = await receipt.wait();

            if(txStatus.confirmations > 0){
                console.log("PWETH: Transaction confirmed");

                console.log("PWETH: Calling updateItemData");
                await updateItemData();

                console.log("PWETH: Calling updateETHBalance");
                await updateETHBalance();
            }
        }
    }

    const initialize = async () => {
        console.log("CB: Running checkBought");
        console.log("CB: Calling connectWallet");
        const walletData = await connectWallet();
        console.log("CB: calling connectMarketplace(",walletData,")");
        await connectMarketplace(walletData);
        console.log("CB: Calling connectTokens");
        await connectTokens(walletData);
    }
    
    // Initiates Web3 connection
    useEffect(() => {
        initialize();
    }, [])

    // useEffect(() => {
    //     if(walletData == emptyWalletData){
    //         console.log("Effect: walletData, calling connectWallet")
    //         connectWallet();
    //     }
    // }, [walletData])

    /**
     * Updates user's ETH balance and item's ETH price
     */
    const updateETHData = async () => {
        console.log("UETHD: Running updateETHData")
        console.log("UETHD: Calling getETHBalance:")
        const ethBalance = await getETHBalance();
        console.log(ethBalance);
        console.log("UETHD: Calling updateItemData:")
        await updateItemData();
        console.log("UETHD: Setting walletData.ethBalance");
        const newWalletData = {
            ...walletData,
            ethBalance: ethBalance
        }
        console.log(newWalletData);
        setWalletData(newWalletData);
    }

    // Automatically updates ETH price and user ETH balance every 10 seconds
    const autoUpdateETH = async () => {
        setTimeout(() => {
            updateETHData();
            autoUpdateETH();
        }, 10000)
    }


    // Populates itemData after connection to Marketplace is established, essential for app loading!
    useEffect(() => {
        console.log("EFFECT: marketContract changed:")
        console.log(marketContract);
        if(marketContract){
            updateItemData();
        }
    }, [marketContract])

    useEffect(() => {
        console.log("EFFECT: Stablecoin purchase effect triggered");
        console.log("EFFECT: usdcApproved = ", usdcApproved);
        console.log("EFFECT: usdtApproved = ", usdtApproved);
        if(usdcApproved){
            console.log("EFFECT: Calling purchaseWithUSDC");
            purchaseWithUSDC();
            return;
        } else if(usdtApproved){
            console.log("EFFECT: Calling purchaseWithUSDT");
            purchaseWithUSDT();
            return;
        }
    }, [usdcApproved, usdtApproved])

    // useEffect(() => {
    //     console.log("EFFECT: ethPrice updated");
    //     console.log("EFFECT: isInitialized = ", isInitialized);
    //     console.log("EFFECT: itemData.ethPrice = ", itemData.itemETHPrice);
    //     if(itemData.itemETHPrice === null || itemData.itemETHPrice === undefined){
    //         const newETHPrice = getETHPrice()
    //         const newItemData = {
    //             ...itemData,
    //             itemETHPrice: newETHPrice
    //         }
    //         setItemData(newItemData);
    //         // updateItemData();
    //     }
    // }, [itemData])

    // Checks if walletData and tokens have been initialized, sets isInitialized flag to true when ready
    useEffect(() => {
        if(isInitialized) return;
        console.log("Effect: Checking walletData, marketContract, and tokens");

        if(walletData !== null && marketContract === null){
            console.log("Effect: Calling connectMarketplace");
            connectMarketplace();
        }
        else if(marketContract !== null && tokens === null){
            console.log("Effect: Calling connectTokens");
            connectTokens();
        }
        else if(
                walletData !== null && 
                marketContract !== null && 
                tokens !== initTokens && 
                itemData !== null
            ){
            console.log("Effect: Setting isInitialized = true");
            setInit(true);
            console.log("Effect: Beginning ETH price auto-update function");
            autoUpdateETH();
        }
    }, [walletData, marketContract, itemData, tokens])


    return(
        <div class="card">
            <div class="card__image-container">
                <img
                    src={props.imageURL}
                    width="300"
                />
            </div>
            <div class="card__content">
                <p class="card__title text--medium">
                    {props.name}
                </p>
                <div class="card__info">
                    <p class="text--medium">
                        {props.description}
                    </p>
                </div>
                {/* {itemData.hasBought == true ? */}
                {itemData.itemPrice === null ?
                    <div>
                        <p>ERROR: itemPrice failed to load</p>
                    </div>

                    :

                    <div>
                        <div>
                            {/* USDC logo */}
                            <img class="buyIcon" width="50" src="https://imgur.com/MQHRBrg.png" onClick={approveUSDC}></img>
                            {/* USDT logo */}
                            <img class="buyIcon" width="50" src="https://imgur.com/wndKTZS.png" onClick={approveUSDT} ></img>
                            {/* ETH logo */}
                            <img class="buyIcon" width="50" src="https://imgur.com/sQsv7UD.png" onClick={purchaseWithETH} ></img>
                        </div>
                        <div>
                            <p class="card__price text__price">
                                {formatItemPrice(itemData.itemPrice)}
                            </p>
                            <p class="card__price text__price">
                                {formatETH(itemData.itemETHPrice)}
                            </p>
                            <p class="card__price text__price">You have bought {itemData.userBalance} items</p>
                        </div>
                    </div>                
                } 
            </div>
        </div>


    )
}

export default Card;