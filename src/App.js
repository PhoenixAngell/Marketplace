import logo from './logo.svg';
import './App.css';
import {BrowserRouter as Router, Switch, Route, Routes} from 'react-router-dom';
import { useState, useEffect, useContext, createContext } from "react";
import Homepage from "./Components/Homepage.js";
import Product from "./Components/Product.js";
import ContractAPI from './Contracts/ContractAPI';
// import initializeWeb3, {getItemData} from './Contracts/web3Funcs';



function App() {


  return (
    <div className="App">
      <script src='./Contracts/web3Funcs.js'>
      </script>
      <header>
        <nav>
          <div className="logo">
            <h1><a href="">CryptoPhoenix Academy</a></h1>
          </div>
          <ul>
            <li><a href="./">Home</a></li>
            <li><a href="./Product">Products</a></li>
            <li className='nav-cta'><a href="#">Connect</a></li>
            {/* <li className='nav-cta'>{<ContractAPI />}</li> */}
            {/* <li className='nav-cta'><a href='#' onClick={initializeWeb3}>Connect Wallet</a></li> */}
          </ul>



        </nav>
      </header>

      {/* This section uses Routing to only display particular components */}
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/Product" element={<Product />} />
        </Routes>

      </Router>

    </div>
  );
}

export default App;
