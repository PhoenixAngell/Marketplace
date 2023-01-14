import css from "./Homepage.css";
import MarketplaceABI from "../Contracts/MarketplaceABI.json";
import IERC20 from "../Contracts/IERC20.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Card from "./Card.js";
import CyberpunkCity from "./Assets/cyberpunk-city.png"
import AlienCity from "./Assets/alien-city.jpg"
import PhoenixLogo from "./Assets/phoenix-logo.png"
// import { itemContext } from "../Contracts/ContractAPI";


function Product(props) {
    
    
    return(
        <div>
            <main>
                <section className="cards">
                    <Card 
                        name="Cyberpunk City 1" 
                        imageURL={CyberpunkCity} 
                        description="A purple cyberpunk city during day"
                    />
                    <Card 
                        name="Alien City" 
                        imageURL={AlienCity} 
                        description="An alien city"
                    />


                </section>
            </main>
        </div>


    )
}

export default Product;