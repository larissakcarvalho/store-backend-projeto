const fs = require('fs/promises')
const path = require('path')
const { randomUUID } = require('crypto')
const AppError = require('../utils/AppError')

const storageDirectory = path.resolve(__dirname, '..', '..', 'uploads')
const maxImageBytes = 2 * 1024 * 1024
const imageTypes = {
  'image/png': { extension: 'png', signature: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/jpeg': { extension: 'jpg', signature: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  'image/gif': { extension: 'gif', signature: (buffer) => ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6)) },
  'image/webp': { extension: 'webp', signature: (buffer) => buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' },
}

function inferImageType(buffer) {
  return Object.entries(imageTypes).find(([, definition]) => definition.signature(buffer))?.[0]
}

function decodeBase64(value) {
  const compact = value.replace(/\s/g, '')
  if (
    !compact
    || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact)
  ) {
    throw new AppError('O conteúdo da imagem não é um base64 válido.')
  }
  const buffer = Buffer.from(compact, 'base64')
  if (!buffer.length || buffer.length > maxImageBytes) {
    throw new AppError('A imagem deve ter tamanho entre 1 byte e 2 MB.')
  }
  return buffer
}

async function prepareImages(images) {
  if (!images) return { images, createdFiles: [] }
  const createdFiles = []

  try {
    const preparedImages = []
    for (const image of images) {
      if (image.deleted || image.content === undefined) {
        preparedImages.push(image)
        continue
      }

      if (image.content.startsWith('/')) {
        if (image.content.startsWith('//')) throw new AppError('O caminho da imagem é inválido.')
        preparedImages.push({ ...image, path: image.content })
        continue
      }

      let payload = image.content
      let declaredType = image.type
      const dataUri = image.content.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s)
      if (dataUri) {
        payload = dataUri[2]
        if (declaredType && declaredType !== dataUri[1]) {
          throw new AppError('O tipo da imagem não corresponde ao conteúdo enviado.')
        }
        declaredType = dataUri[1]
      } else {
        let url
        try {
          url = new URL(image.content)
        } catch {
          url = null
        }
        if (url) {
          if (!['http:', 'https:'].includes(url.protocol)) throw new AppError('A URL da imagem deve usar HTTP ou HTTPS.')
          preparedImages.push({ ...image, path: image.content })
          continue
        }
      }

      const buffer = decodeBase64(payload)
      const detectedType = inferImageType(buffer)
      if (!detectedType || (declaredType && declaredType !== detectedType)) {
        throw new AppError('O conteúdo enviado não corresponde a uma imagem PNG, JPEG, GIF ou WebP válida.')
      }

      const fileName = `${randomUUID()}.${imageTypes[detectedType].extension}`
      const filePath = path.join(storageDirectory, fileName)
      await fs.mkdir(storageDirectory, { recursive: true })
      await fs.writeFile(filePath, buffer, { flag: 'wx' })
      createdFiles.push(filePath)
      preparedImages.push({ ...image, path: `/media/${fileName}` })
    }
    return { images: preparedImages, createdFiles }
  } catch (error) {
    await Promise.all(createdFiles.map((filePath) => fs.unlink(filePath)))
    throw error
  }
}

async function removePreparedImages(preparedImages) {
  await Promise.all(preparedImages.createdFiles.map((filePath) => fs.unlink(filePath)))
}

async function removeStoredImages(paths) {
  const filePaths = paths
    .filter((imagePath) => /^\/media\/[0-9a-f-]+\.(?:png|jpg|gif|webp)$/i.test(imagePath))
    .map((imagePath) => path.join(storageDirectory, path.basename(imagePath)))
  await Promise.all(filePaths.map((filePath) => fs.unlink(filePath)))
}

module.exports = { prepareImages, removePreparedImages, removeStoredImages }
