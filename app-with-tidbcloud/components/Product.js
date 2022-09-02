// import Image from 'next/image'

export default function Product({ product }) {
  const { contract, link, count, collection_name, image, animation } = product

  return (
    <div
      className="max-w-[250px] rounded overflow-hidden shadow-lg"
      key={product.contract}
    >
      <a href={link}>
      <img
        className="w-full"
        width={250}
        height={250}
        src={image}
        alt={collection_name}
      />
      </a>
      <div className="px-6 py-4">
        <a href={link} target="_blank"><p className="text-blue-600 text-xl">{collection_name}</p></a>
        <p className="text-gray-900 text-m">Recent trasaction count: {count}</p>
      </div>
    </div>
  )
}
