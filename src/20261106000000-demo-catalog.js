'use strict'

const now = new Date()
const categories = [
  { id: 1, name: 'Tênis', slug: 'tenis', use_in_menu: true },
  { id: 2, name: 'Casual', slug: 'casual', use_in_menu: true },
  { id: 3, name: 'Corrida', slug: 'corrida', use_in_menu: true },
  { id: 4, name: 'Camisetas', slug: 'camisetas', use_in_menu: true },
  { id: 5, name: 'Acessórios', slug: 'acessorios', use_in_menu: true },
]

const products = [
  { id: 1, name: 'Tênis Urban Classic', slug: 'tenis-urban-classic', stock: 20, price: 399.9, discount: 299.9, description: 'O clássico que acompanha qualquer caminho.', categories: [1, 2], image: '/produc-image-4.jpeg', sizes: '38,39,40,41,42,43' },
  { id: 2, name: 'Tênis Runner Pro', slug: 'tenis-runner-pro', stock: 18, price: 529.9, discount: 449.9, description: 'Leveza e resposta a cada passo.', categories: [1, 3], image: '/home-slide-8.jpeg', sizes: '37,38,39,40,41,42' },
  { id: 3, name: 'Tênis Street Low', slug: 'tenis-street-low', stock: 12, price: 329.9, discount: 0, description: 'Design urbano para qualquer ocasião.', categories: [1, 2], image: '/produc-image-2.jpeg', sizes: '38,39,40,41,42,43' },
  { id: 4, name: 'Tênis Air Motion', slug: 'tenis-air-motion', stock: 15, price: 449.9, discount: 379.9, description: 'Amortecimento macio para ir mais longe.', categories: [1, 3], image: '/produc-image-5.jpeg', sizes: '37,38,39,40,41,42' },
  { id: 5, name: 'Camiseta Essential', slug: 'camiseta-essential', stock: 30, price: 119.9, discount: 89.9, description: 'Toque macio e caimento confortável.', categories: [4], image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', sizes: 'P,M,G,GG' },
  { id: 6, name: 'Moletom Comfort', slug: 'moletom-comfort', stock: 16, price: 219.9, discount: 0, description: 'Aconchegante por dentro e cheio de estilo.', categories: [2], image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85', sizes: 'P,M,G,GG' },
  { id: 7, name: 'Mochila Everyday', slug: 'mochila-everyday', stock: 10, price: 239.9, discount: 189.9, description: 'Espaço para a sua rotina com visual minimalista.', categories: [5], image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', sizes: '' },
  { id: 8, name: 'Tênis Court Retro', slug: 'tenis-court-retro', stock: 14, price: 349.9, discount: 0, description: 'Silhueta retrô com conforto de hoje.', categories: [1, 2], image: '/produc-image-1.jpeg', sizes: '38,39,40,41,42,43' },
]

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('categories', categories.map((category) => ({
      ...category,
      created_at: now,
      updated_at: now,
    })))

    await queryInterface.bulkInsert('products', products.map((product) => ({
      id: product.id,
      enabled: true,
      name: product.name,
      slug: product.slug,
      use_in_menu: true,
      stock: product.stock,
      description: product.description,
      price: product.price,
      price_with_discount: product.discount,
      created_at: now,
      updated_at: now,
    })))

    const categoryLinks = products.flatMap((product) =>
      product.categories.map((category_id) => ({ product_id: product.id, category_id })),
    )
    await queryInterface.bulkInsert('product_categories', categoryLinks)
    await queryInterface.bulkInsert('product_images', products.map((product) => ({
      product_id: product.id,
      enabled: true,
      path: product.image,
    })))
    await queryInterface.bulkInsert('product_options', products
      .filter((product) => product.sizes)
      .map((product) => ({
        product_id: product.id,
        title: 'Tamanho',
        shape: 'square',
        radius: 3,
        type: 'text',
        values: product.sizes,
      })))
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('product_categories', null, {})
    await queryInterface.bulkDelete('product_options', null, {})
    await queryInterface.bulkDelete('product_images', null, {})
    await queryInterface.bulkDelete('products', null, {})
    await queryInterface.bulkDelete('categories', null, {})
  },
}
