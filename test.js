
const { Buffer } = await import('node:buffer')
// const crypto = await import('node:crypto')
const { ethers } = await import('npm:ethers')

const curve = 'P-256'

const abiCoder = ethers.AbiCoder.defaultAbiCoder()

// function jsonToQueryString(json) {
//  const extractKeys = (obj, prefix = '') => {
//    return Object.keys(obj).reduce((keys, key) => {
//      const value = obj[key]
//      const newPrefix = prefix ? `${prefix}.${key}` : key
//      if (value && typeof value === 'object' && !Array.isArray(value)) {
//        keys.push(...extractKeys(value, newPrefix))
//      } else {
//        keys.push({
//          key: newPrefix,
//          value: value
//        })
//      }
//      return keys
//    }, [])
//  }
//  // Extract and flatten all keys
//  const pairs = extractKeys(json)
//  // Sort by keys
//  pairs.sort((a, b) => a.key.localeCompare(b.key))
//  // Join into query string format
//  return pairs
//    .map(({ key, value }) => `${key}=${value}`)
//    .join('&')
// }
// const metadata = await Functions.makeHttpRequest({ url: args[0], timeout: 10000 })
//  .then(res => res.data)
// const imageB64 = await Functions.makeHttpRequest({ url: metadata.image, responseType: 'arraybuffer', timeout: 10000 })
//  .then(r => Buffer.from(r.data).toString('base64'))
// const proof = await Functions.makeHttpRequest({ url: metadata.proof, timeout: 10000 })
//  .then(res => res.data)
// if (proof.content.value.mediadata !== imageB64) {
//  throw new Error('Image hash mismatch')
// }
// const pubkey = proof.secp256r1.pubkey
// const signature = proof.secp256r1.signature
// let contentToSha = ''
// if (proof.content.type == 'public') {
//  contentToSha = jsonToQueryString(proof.content.value)
// }
// if (proof.content.type == 'private') {
//  contentToSha = proof.content.value.encrypted
// }
// await crypto.subtle.digest('SHA-256', Buffer.from(contentToSha))
//  .then(b => {
//    const sha256 = Buffer.from(b).toString('hex')
//    if (sha256 !== proof.sha256) {
//      throw new Error('Invalid sha256')
//    }
//  })

const pubkey = "BFd13VX35oXWjJQsFR+fucU9UhwPAQadvkzfa+3z5GmldbKHyNXknLUT2mnCaqjFhR26v/yonBdhc0RU9JzCq4s=" 
const signature = "MEQCIAs6fYaNRateYmvea8klc8KzWilMbjeBGitdmHBrv9kkAiBLNTpnM46C68mVQP4/eyyzk5Szf+IMY5vhfQzBQZ7pTw=="
const message = "fd59e13bb74d845477fc8ee394d216d41c1904367bcda6bf729a89264c68ed66"

// Convert base64 pubkey to PEM format
// function toPEM(pubKeyBase64) {
//   const pemHeader = '-----BEGIN PUBLIC KEY-----\n'
//   const pemFooter = '\n-----END PUBLIC KEY-----'
  
//   // Create SPKI format
//   const pubKeyBuf = Buffer.from(pubKeyBase64, 'base64')
//   const spkiHeader = Buffer.from([
//     0x30, 0x59, // SEQUENCE
//     0x30, 0x13, // SEQUENCE
//     0x06, 0x07, // OID
//     0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // 1.2.840.10045.2.1 (ecPublicKey)
//     0x06, 0x08, // OID
//     0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // 1.2.840.10045.3.1.7 (P-256)
//     0x03, 0x42, // BIT STRING
//     0x00 // no padding bits
//   ])
  
//   const spkiPubKey = Buffer.concat([spkiHeader, pubKeyBuf])
//   const spkiB64 = spkiPubKey.toString('base64')
  
//   return pemHeader + spkiB64.match(/.{1,64}/g).join('\n') + pemFooter
// }

// const publicKeyPEM = toPEM(pubkey)

const publicKey = await crypto.subtle.importKey('raw', Buffer.from(pubkey, 'base64'), { name: 'ECDSA', namedCurve: curve }, true, ['verify'])

// const verify = crypto.createVerify('RSA-SHA256')
// verify.write(Buffer.from(proof.sha256))
// verify.end()

const signatureBuffer = Buffer.from(signature, 'base64')
const messageBuffer = Buffer.from(message, 'hex')
const verified = await crypto.subtle.verify({ name: 'ECDSA', namedCurve: curve, hash: { name: 'SHA-256' } }, publicKey, signatureBuffer, messageBuffer)

// const signatureBuffer = Buffer.from(signature, 'base64')
// const verified = verify.verify(publicKeyPEM, signatureBuffer)
if (verified) {
    throw new Error('Invalid signature')
}

return Functions.encodeString(message)

// const values = [{ message }]
// const types = ['tuple(string message)']
// const encoded = abiCoder.encode(types, values)
// const bytes = ethers.getBytes(encoded)
// console.log(bytes)
// return bytes;
