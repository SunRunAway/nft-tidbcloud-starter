import { createAlchemyWeb3 } from "@alch/alchemy-web3";
const web3 = createAlchemyWeb3(
    "wss://eth-mainnet.g.alchemy.com/v2/8NRxAwl5aa1WVN-6Qnz5Vr_oQW8ZBabp",
  );
import axios from 'axios';
import axiosRetry from 'axios-retry';

axiosRetry(axios, {
    retries: 3, 
    retryDelay: (retryCount) => {
        console.log(`retry attempt: ${retryCount}`);
        return retryCount * 2000;
    },
    retryCondition: (error) => {
        return error.response.status === 503;
    },
});

const { ABI_ERC721, ABI_ERC1155, ABI_METADATA_ERC1155, ABI_METADATA_ERC721 } = require('./abi');


import mysql, { ResultSetHeader } from 'mysql2/promise'

const dbURL = process.env.DATABASE_URL;

const database = "nft"
const table = "transaction"

function addIPFSProxy(ipfsHash) {
    const URL = "https://gateway.ipfs.io/ipfs/";
    const hash = ipfsHash.replace(/^ipfs?:\/\//, '');
    const ipfsURL = URL + hash;
    return ipfsURL
}

async function getNFTMetadata(url, token_id) {

    try {
        let res;
        if (url.includes('api.opensea.io/api'))
            url = url.replace("0x{id}", token_id);
        else if (url.includes('https://') || url.includes('http://'))
            url = url.replace("{id}", token_id);
        else if (url.startsWith('data:application/json;base64,')) // data url
            return Buffer.from(url.substring(29), 'base64').toString();
        else
            url = addIPFSProxy(url);

        // console.log(`url in getNFTMetadata: ${url} and token_id ${token_id}`)

        const request = new Request(url);
        const response = await fetch(request);
        const metadata = await response.json();
        // console.log("metadata", metadata); // Metadata in JSON
        return metadata
    } catch (error) {
        console.log('error url :', url, error)
        return {
            error: true,
            error_message: error.message,
            error_data: error.response.data,
            url: url
        }
    }
}

async function subscribeETH() {
    console.log("connecting to database...")
    const con = await mysql.createConnection(dbURL);

    await con.execute(`CREATE DATABASE IF NOT EXISTS ${database};`)
    await con.execute(`use ${database};`)
    

    var createTblTransaction = `CREATE TABLE IF NOT EXISTS ${table}(
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME default current_timestamp,
        block INT NOT NULL,
        hash VARCHAR(255) NOT NULL,
        operator VARCHAR(255) default NULL,
        from_address VARCHAR(255) NOT NULL,
        to_address VARCHAR(255) NOT NULL,
        contract VARCHAR(255) NOT NULL,
        token_id VARCHAR(255) NOT NULL
    );`
    await con.execute(createTblTransaction);

    var createTblNFT = `CREATE TABLE IF NOT EXISTS nft(
        contract VARCHAR(255) NOT NULL,
        token_id VARCHAR(255) NOT NULL,
        metadata JSON,
        value    INT,
        CONSTRAINT token_contract UNIQUE(contract,token_id)        
    );`
    await con.execute(createTblNFT);
    
    let options721 = {
        topics: [
            web3.utils.sha3('Transfer(address,address,uint256)')
        ]
    };
    
    let options1155 = {
        topics: [
            web3.utils.sha3('TransferSingle(address,address,address,uint256,uint256)')
        ]
    };
    
    let subscription721 = web3.eth.subscribe('logs', options721);
    let subscription1155 = web3.eth.subscribe('logs', options1155);
    
    subscription721.on('data', async event => {
        if (event.topics.length == 4) {
            const transaction = web3.eth.abi.decodeLog(ABI_ERC721, event.data, [event.topics[1], event.topics[2], event.topics[3]]);
            console.log(`\n` +
                `New ERC-712 transaction found in block ${event.blockNumber} with hash ${event.transactionHash}\n` +
                `From: ${(transaction.from === '0x0000000000000000000000000000000000000000') ? 'New mint!' : transaction.from}\n` +
                `To: ${transaction.to}\n` +
                `Token contract: ${event.address}\n` +
                `Token ID: ${transaction.tokenId}`
            );
            
            const contract = new web3.eth.Contract(ABI_METADATA_ERC721, event['address']);

            let metadata
            try {
                const nftResult = await contract.methods.tokenURI(transaction.tokenId).call();
                metadata = await getNFTMetadata(nftResult, transaction.tokenId);
            } catch (error) {
                console.log(`@ Error metadata Url getting with token_id : ${transaction.tokenId} and contract ${contract}`);
            }
            if (metadata != null) {
                const sql = `INSERT INTO nft VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE metadata = ?`;
                const values = [event['address'], transaction.tokenId, JSON.stringify(metadata), null, JSON.stringify(metadata)];
                const result = await con.execute(sql, values);
                console.log("Number of NFTs inserted: ", (result[0] as ResultSetHeader).affectedRows);
            }


            const sql2 = "INSERT INTO transaction(block, hash, from_address, to_address, contract, token_id) VALUES (?, ?, ?, ?, ?, ?)";
            const values2 = [event.blockNumber, event.transactionHash, transaction.from, transaction.to, event.address, transaction.tokenId];
            const result = await con.execute(sql2, values2);
            console.log("Number of trasactions inserted: ", (result[0] as ResultSetHeader).affectedRows);
        }
    })
    
    subscription1155.on('data', async event => {
        const transaction = web3.eth.abi.decodeLog(ABI_ERC1155, event.data, [event.topics[1], event.topics[2], event.topics[3]]);
        console.log(`\n` +
            `@ New ERC-1155 transaction found in block ${event['blockNumber']} with hash ${event['transactionHash']}\n` +
            `- Operator: ${transaction['operator']}\n` +
            `- From: ${(transaction['from'] === '0x0000000000000000000000000000000000000000') ? 'New mint!' : transaction['from']}\n` +
            `- To: ${transaction['to']}\n` +
            `- tokenId: ${transaction['id']}\n` +
            `- Value: ${transaction['value']}`
        );

        const contract = new web3.eth.Contract(ABI_METADATA_ERC1155, event.address);

        let metadata
        try {
            const nftResult = await contract.methods.uri(transaction.id).call();
            metadata = await getNFTMetadata(nftResult, transaction.id);
        } catch (error) {
            console.log(`@ Error metadata Url getting with token_id : ${transaction['id']} and contract ${contract}`);
        }            
        if (metadata != null) {
            const sql = `INSERT INTO nft VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE metadata = ?, value = ?`;
            const values = [event['address'], transaction['id'], JSON.stringify(metadata), transaction['value'], JSON.stringify(metadata), transaction['value']];
            const result = await con.execute(sql, values);
            console.log("Number of NFTs inserted: ", (result[0] as ResultSetHeader).affectedRows);
        }


        const sql = "INSERT INTO transaction(block, hash, operator, from_address, to_address, contract, token_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const values = [event.blockNumber, event.transactionHash, transaction.operator, transaction.from, transaction.to, event.address, transaction.id];
        const result = await con.execute(sql, values);
        console.log("Number of trasactions inserted: ", (result[0] as ResultSetHeader).affectedRows);
    })
    
    subscription721.on('error', err => { throw err });
    subscription1155.on('error', err => { throw err });
    
    subscription721.on('connected', nr => console.log('Subscription on ERC-721 started with ID %s', nr));
    subscription1155.on('connected', nr => console.log('Subscription on ERC-1155 started with ID %s', nr)); 
}

subscribeETH();

