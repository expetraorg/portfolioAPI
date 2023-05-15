const express = require("express");
const cors = require("cors");
const {axios, AxiosRequestConfig, AxiosPromise, AxiosResponse } = require("axios");
const { Network, Alchemy, Utils } = require("alchemy-sdk");
require("dotenv").config();

//Alchemy API keys
const apiKey = "s7rg0ydiXztVJObN2ODEvpmU-VxhHY3p";
const apiKeyMatic = "krNk1IldZnJSlp77BIfm6sbfjHasjh5p";

const app = express();
const port = process.env.PORT || 3006;

app.use(cors());

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get("/nativeBalanceAlchemy", async (req, res) => {
  try {
    const { address, chain } = req.query;
    const config = {
      apiKey: apiKey,
    };

    const configMatic = {
      apiKey: apiKeyMatic,
      network: Network.MATIC_MAINNET, // Replace with your network.
    };
    let alchemy = new Alchemy(config);
    let requestPrice =
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

    if (chain === "0x1") {
      requestPrice =
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

      alchemy = new Alchemy(config);
    } else if (chain === "0x89") {
      alchemy = new Alchemy(configMatic);
      requestPrice =
        "https://api.coingecko.com/api/v3/simple/price?ids=wmatic&vs_currencies=usd";
    }

    // Get balance and format in terms of ETH
    let balance = await alchemy.core.getBalance(address, "latest");
    balance = Utils.formatEther(balance);

    const response = await axios.get(requestPrice);
    if (chain === "0x1") {
      response.data.ethereum.usd = response.data.ethereum.usd;
      response.data.ethereum.balance = balance;
      response.data.ethereum.balanceInUSD =
        balance * response.data.ethereum.usd;
      res.send(response.data.ethereum);
    } else if (chain === "0x89") {
      response.data.wmatic.usd = response.data.wmatic.usd;
      response.data.wmatic.balance = balance;
      response.data.wmatic.balanceInUSD = balance * response.data.wmatic.usd;
      res.send(response.data.wmatic);
    }

    //console.log(`Balance of ${address}: ${balance} ETH`);
  } catch (e) {
    res.send(e);
  }
});

//Alchemy part:
app.get("/nftBalanceAlchemy", async (req, res) => {
  const { address, chain } = req.query;
  //https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}/getContractMetadata

  let baseURL = `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner`;
  if (chain === "0x1") {
    baseURL = `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner`;
  } else if (chain === "0x89") {
    baseURL = `https://polygon-mainnet.g.alchemy.com/nft/v3/${apiKeyMatic}/getNFTsForOwner`;
  }

  var config = {
    method: "get",
    url: `${baseURL}?owner=${address}`,
  };
  try {
    const response = await axios(config)
      .then((response) => {
        //console.log(JSON.stringify(response.data, null, 2));
        res.send(response.data);
      })
      .catch((error) => console.log(error));

    //const userNFTs = response.data;
    //res.send(userNFTs);
  } catch (e) {
    res.send(e);
  }
});

app.get("/tokenBalancesAlchemy", async (req, res) => {
  try {
    const { address, chain } = req.query;
    // Replace with your Alchemy api key:
    const config = {
      apiKey: apiKey,
      network: Network.ETH_MAINNET, // Replace with your network.
    };
    const configMatic = {
      apiKey: apiKeyMatic,
      network: Network.MATIC_MAINNET, // Replace with your network.
    };
    let alchemy = new Alchemy(config);

    if (chain === "0x1") {
      alchemy = new Alchemy(config);
    } else if (chain === "0x89") {
      alchemy = new Alchemy(configMatic);
    }

    // The wallet address / token we want to query for:
    let balances = await alchemy.core.getTokenBalances(address);
    // Remove tokens with zero balance
    let nonZeroBalances = balances.tokenBalances.filter((token) => {
      return token.tokenBalance !== "0";
    });

    // Counter for SNo of final output
    let i = 1;
    // Loop through all tokens with non-zero balance

    for (let token of nonZeroBalances) {
      try {
        // Get balance of token
        let balance = token.tokenBalance;

        // Get metadata of token
        const metadata = await alchemy.core.getTokenMetadata(
          token.contractAddress
        );
        //console.log(metadata);
        // Compute token balance in human-readable format
        balance = balance / Math.pow(10, metadata.decimals);
        balance = balance.toFixed(3);

        //nonZeroBalances[i-1].usd = priceResponse.data.usdPrice;

        // Print name, balance, and symbol of token
        //console.log(`${i++}. ${metadata.name}: ${balance} ${metadata.symbol}`);
        nonZeroBalances[nonZeroBalances.indexOf(token)].balance = balance;
        nonZeroBalances[nonZeroBalances.indexOf(token)].name = metadata.name;
        nonZeroBalances[nonZeroBalances.indexOf(token)].symbol =
          metadata.symbol;
        nonZeroBalances[nonZeroBalances.indexOf(token)].decimals =
          metadata.decimals;
        nonZeroBalances[nonZeroBalances.indexOf(token)].logo = metadata.logo;
      } catch (error) {
        //console.log(error);
        let index = nonZeroBalances.indexOf(token);
        nonZeroBalances.splice(index, 1);
      }
    }

    //console.log(`Token balances of ${address} \n`, nonZeroBalances);

    res.send(nonZeroBalances);
  } catch (e) {
    res.send(e);
  }
});

app.get("/tokenBalancesAlchemyWithPrices", async (req, res) => {
  try {
    const { address, chain } = req.query;
    // Replace with your Alchemy api key:
    const config = {
      apiKey: apiKey,
      network: Network.ETH_MAINNET, // Replace with your network.
    };
    const configMatic = {
      apiKey: apiKeyMatic,
      network: Network.MATIC_MAINNET, // Replace with your network.
    };
    let alchemy = new Alchemy(config);
    let chainName = "ethereum";

    if (chain === "0x1") {
      alchemy = new Alchemy(config);
      chainName = "ethereum";
    } else if (chain === "0x89") {
      alchemy = new Alchemy(configMatic);
      chainName = "polygon-pos";
    }

    // The wallet address / token we want to query for:
    let balances = await alchemy.core.getTokenBalances(address);
    // Remove tokens with zero balance
    let nonZeroBalances = balances.tokenBalances.filter((token) => {
      return token.tokenBalance !== "0";
    });

    for (let token of nonZeroBalances) {
      try {
        // Get balance of token
        let balance = token.tokenBalance;

        // Get metadata of token
        const metadata = await alchemy.core.getTokenMetadata(
          token.contractAddress
        );
        //console.log(metadata);
        // Compute token balance in human-readable format
        balance = balance / Math.pow(10, metadata.decimals);
        balance = balance.toFixed(3);

        //nonZeroBalances[i-1].usd = priceResponse.data.usdPrice;

        // Print name, balance, and symbol of token
        //console.log(`${i++}. ${metadata.name}: ${balance} ${metadata.symbol}`);
        nonZeroBalances[nonZeroBalances.indexOf(token)].balance = balance;
        nonZeroBalances[nonZeroBalances.indexOf(token)].name = metadata.name;
        nonZeroBalances[nonZeroBalances.indexOf(token)].symbol =
          metadata.symbol;
        nonZeroBalances[nonZeroBalances.indexOf(token)].decimals =
          metadata.decimals;
        nonZeroBalances[nonZeroBalances.indexOf(token)].logo = metadata.logo;
      } catch (error) {
        //console.log(error);
        let index = nonZeroBalances.indexOf(token);
        nonZeroBalances.splice(index, 1);
      }
    }

    for (let token of nonZeroBalances) {
      try {
        //console.log(chainName);
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/simple/token_price/${chainName.toString()}?contract_addresses=${
            token.contractAddress
          }&vs_currencies=usd`
        );
        //console.log(response);
        nonZeroBalances[nonZeroBalances.indexOf(token)].usd =
          response.data[token.contractAddress].usd;
        nonZeroBalances[nonZeroBalances.indexOf(token)].balanceInUSD =
          response.data[token.contractAddress].usd *
          nonZeroBalances[nonZeroBalances.indexOf(token)].balance;
      } catch (error) {
        //console.log(error);
        let index = nonZeroBalances.indexOf(token);
        nonZeroBalances.splice(index, 1);
      }
    }

    res.send(nonZeroBalances);
  } catch (e) {
    res.send(e);
  }
});

