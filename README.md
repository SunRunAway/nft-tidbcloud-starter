# NFT TiDB Cloud Starter

This is NFT [TiDB Cloud](https://tidbcloud.com/) Starter. It has two components:
* subscriber
    * It is an backend service that subscribes to the blockchain and stores the data in TiDB Cloud.
* app-with-tidbcloud
    * It is a website service that uses TiDB Cloud as the database for fetching hottest NFT colletions.

## Demo

https://nft-tidbcloud-starter.vercel.app/

![image](https://user-images.githubusercontent.com/867381/189273023-c3e40ad9-252d-433e-aba9-94362e6bc56f.png)

![image](https://user-images.githubusercontent.com/867381/189272850-d8528076-f1d7-4a9e-852c-d27406d74576.png)


## Set up the database

1. Go to [TiDB Cloud](https://tidbcloud.com/), register a free account. 
2. Create a cluster(Free Developer Tier is ok for testing), and configure the password and IP Access List. 
3. Click "connnect" and write your `DATABASE_URL="mysql://<username>:<password>@<host>:<port>/nft"`

## Run the subscriber

```bash
cd subscriber
export DATABASE_URL="mysql://<username>:<password>@<host>:<port>/nft"
npm install
npm start
```

## Run the App

Run the app with following command:

```bash
cd app-with-tidbcloud
export DATABASE_URL="mysql://<username>:<password>@<host>:<port>/nft"
npm install
npm run dev
```

Open your browser at [localhost:3000](localhost:3000) to see the running application.


