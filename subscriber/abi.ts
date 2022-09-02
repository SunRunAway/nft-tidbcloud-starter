export const ABI_ERC1155 = [{
    type: 'address',
    name: 'operator',
    indexed: true
}, {
    type: 'address',
    name: 'from',
    indexed: true
}, {
    type: 'address',
    name: 'to',
    indexed: true
}, {
    type: 'uint256',
    name: 'id'
}, {
    type: 'uint256',
    name: 'value'
}]

export const ABI_ERC721 = [{
    type: 'address',
    name: 'from',
    indexed: true
}, {
    type: 'address',
    name: 'to',
    indexed: true
}, {
    type: 'uint256',
    name: 'tokenId',
    indexed: true
}]

export const ABI_METADATA_ERC721 = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "tokenURI",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];


export const ABI_METADATA_ERC1155 = [
    {
        "constant":true,
        "inputs":[
            {
                "internalType": "uint256",
                "name": "_id",
                "type": "uint256"
            }
        ],
        "name": "uri",
        "outputs":[
            {
                "internalType":"string",
                "name":"",
                "type":"string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];