import css from "./Homepage.css";
import background from "./Assets/cyberpunk-city.png";
import logo from "./Assets/crypto-phoenix.png";


function Homepage(props) {


    
    
    
    
    return(
        <section>
            <div class="hero">
                <h1>Become a Web3 Developer today!</h1>
                <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.</p>
            </div>
            <div>
                <img position="absolute" alt="test" width="500" src={logo} />
            </div>

        </section>



    )
}

export default Homepage;