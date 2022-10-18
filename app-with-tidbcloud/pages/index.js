import Head from 'next/head'
import Product from '../components/Product'
import prisma from '../lib/prisma'

export default function Home({ products }) {
  return (
    <div>
      <Head>
        <title>TiDB Cloud NFT Quickstart</title>
        <meta name="description" content="TiDB Cloud NFT Quickstart" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="p-10 mx-auto max-w-4xl">
        <h1 className="text-6xl font-bold mb-4 text-center">TiDB Cloud NFT Quickstart</h1>
        <p className="mb-20 text-xl text-center">
          🔥 See hottest NFTs in the world 🔥
        </p>
        <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 justify-items-center  gap-4">
          {products.map((product) => (
            <Product product={product} key={product.contract} />
          ))}
        </div>
      </main>

      <footer></footer>
    </div>
  )
}

export async function getServerSideProps(context) {
  const products = await prisma.$queryRaw`
WITH hottest_transaction AS (
    SELECT
        contract,
        Count(1) AS count
    FROM transaction
    GROUP BY contract
    ORDER BY count DESC
), collection AS (
    SELECT
        contract,
        Any_value(Json_unquote(Json_extract(metadata, '$.name'))) AS collection_name,
        Any_value(Json_unquote(Json_extract(metadata, '$.image'))) AS image
    FROM nft
    GROUP BY contract
),
hottest_collection AS (
    SELECT
        hottest_transaction.contract,
        count,
        collection_name,
        image
    FROM hottest_transaction
    LEFT JOIN collection ON hottest_transaction.contract = collection.contract
    WHERE image is not NULL and TRIM(image) != ''
    LIMIT 9
)
SELECT
    contract,
    concat("https://nft.coinbase.com/collection/ethereum/", contract) AS link,
    count,
    IFNULL(substring_index(collection_name, '#', 1), "N/A") AS collection_name,
    IF(
        LEFT(image, 7) = "ipfs://",
        Concat("https://gateway.ipfs.io/ipfs/", Substr(image, 7)),
        image
    ) AS image
FROM hottest_collection order by count desc;
`

  return {
    props: { products },
  }
}
