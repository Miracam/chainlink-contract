const { Buffer } = await import('node:buffer')
const crypto = await import('node:crypto')

const curve = 'P-256'
// function fromCompressedPublicKey(compressedKey, format = 'base64') {
//     console.log(crypto.ECDH.convertKey)
//     const key = crypto.ECDH.convertKey(compressedKey, curve, format, 'base64', 'uncompressed')
//     const keyBuffer = Buffer.from(key, 'base64')
//     // return new crypto.ECDSA({
//     //   x: keyBuffer.slice(1, curveLength + 1),
//     //   y: keyBuffer.slice(curveLength + 1)
//     // })
//   }
// const hexString = "0x3fde9af72c8b5a0fe2589f8f7ea1a71307b3cdf5e5e944ba1022b7522b5e229c5775dd55f7e685d68c942c151f9fb9c53d521c0f01069dbe4cdf6bedf3e469a575b287c8d5e49cb513da69c26aa8c5851dbabffca89c1761734454f49cc2ab8b0b3a7d868d45ab5e626bde6bc92573c2b35a294c6e37811a2b5d98706bbfd9244b353a67338e82ebc99540fe3f7b2cb39394b37fe20c639be17d0cc1419ee94f"
// const hexWithoutPrefix = hexString.slice(2) // Remove '0x' prefix
// const bytes = new Uint8Array(hexWithoutPrefix.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
// return bytes


// const { ethers } = await import('npm:ethers')
// const abiCoder = ethers.AbiCoder.defaultAbiCoder()
// function extract(pubkey: string, signature: string) {
//  const pubKeyBuf = Buffer.from(pubkey, 'base64')
//  const signatureBuffer = Buffer.from(signature, 'base64')
//  const x = pubKeyBuf.subarray(1, 33)
//  const y = pubKeyBuf.subarray(33)
//  const [r, s] = derToRS(signatureBuffer)
//  return { x, y, r, s }
// }
// function derToRS(der: Buffer) {
//  let offset = 3
//  let dataOffset
//  if (der[offset] == 0x21) {
//    dataOffset = offset + 2
//  }
//  else {
//    dataOffset = offset + 1
//  }
//  const r = der.slice(dataOffset, dataOffset + 32)
//  offset = offset + der[offset] + 1 + 1
//  if (der[offset] == 0x21) {
//    dataOffset = offset + 2
//  }
//  else {
//    dataOffset = offset + 1
//  }
//  const s = der.slice(dataOffset, dataOffset + 32)
//  return [r, s]
// }
function jsonToQueryString(json) {
 const extractKeys = (obj, prefix = '') => {
   return Object.keys(obj).reduce((keys, key) => {
     const value = obj[key]
     const newPrefix = prefix ? `${prefix}.${key}` : key
     if (value && typeof value === 'object' && !Array.isArray(value)) {
       keys.push(...extractKeys(value, newPrefix))
     } else {
       keys.push({
         key: newPrefix,
         value: value
       })
     }
     return keys
   }, [])
 }
 // Extract and flatten all keys
 const pairs = extractKeys(json)
 // Sort by keys
 pairs.sort((a, b) => a.key.localeCompare(b.key))
 // Join into query string format
 return pairs
   .map(({ key, value }) => `${key}=${value}`)
   .join('&')
}
const metadata = await Functions.makeHttpRequest({ url: args[0], timeout: 10000 })
 .then(res => res.data)
const imageB64 = await Functions.makeHttpRequest({ url: metadata.image, responseType: 'arraybuffer', timeout: 10000 })
 .then(r => Buffer.from(r.data).toString('base64'))
const proof = await Functions.makeHttpRequest({ url: metadata.proof, timeout: 10000 })
 .then(res => res.data)
if (proof.content.value.mediadata !== imageB64) {
 throw new Error('Image hash mismatch')
}
const pubkey = proof.secp256r1.pubkey
const signature = proof.secp256r1.signature
let contentToSha = ''
if (proof.content.type == 'public') {
 contentToSha = jsonToQueryString(proof.content.value)
}
if (proof.content.type == 'private') {
 contentToSha = proof.content.value.encrypted
}
await crypto.subtle.digest('SHA-256', Buffer.from(contentToSha))
 .then(b => {
   const sha256 = Buffer.from(b).toString('hex')
   if (sha256 !== proof.sha256) {
     throw new Error('Invalid sha256')
   }
 })

// const pubkey = "BFd13VX35oXWjJQsFR+fucU9UhwPAQadvkzfa+3z5GmldbKHyNXknLUT2mnCaqjFhR26v/yonBdhc0RU9JzCq4s=" 
// const signature = "MEQCIAs6fYaNRateYmvea8klc8KzWilMbjeBGitdmHBrv9kkAiBLNTpnM46C68mVQP4/eyyzk5Szf+IMY5vhfQzBQZ7pTw=="
// const message = "fd59e13bb74d845477fc8ee394d216d41c1904367bcda6bf729a89264c68ed66"

// Convert base64 pubkey to PEM format
function toPEM(pubKeyBase64) {
  const pemHeader = '-----BEGIN PUBLIC KEY-----\n'
  const pemFooter = '\n-----END PUBLIC KEY-----'
  
  // Create SPKI format
  const pubKeyBuf = Buffer.from(pubKeyBase64, 'base64')
  const spkiHeader = Buffer.from([
    0x30, 0x59, // SEQUENCE
    0x30, 0x13, // SEQUENCE
    0x06, 0x07, // OID
    0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // 1.2.840.10045.2.1 (ecPublicKey)
    0x06, 0x08, // OID
    0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // 1.2.840.10045.3.1.7 (P-256)
    0x03, 0x42, // BIT STRING
    0x00 // no padding bits
  ])
  
  const spkiPubKey = Buffer.concat([spkiHeader, pubKeyBuf])
  const spkiB64 = spkiPubKey.toString('base64')
  
  return pemHeader + spkiB64.match(/.{1,64}/g).join('\n') + pemFooter
}

const publicKeyPEM = toPEM(pubkey)

const verify = crypto.createVerify('RSA-SHA256')
verify.write(Buffer.from(proof.sha256))
verify.end()

const signatureBuffer = Buffer.from(signature, 'base64')
const verified = verify.verify(publicKeyPEM, signatureBuffer)
if (verified) {
    throw new Error('Invalid signature')
}
// console.log(verified)
return Functions.encodeString(signature)


// const cryptoKey = fromCompressedPublicKey(pubkey)
// console.log(cryptoKey)

// Convert sha256 hex to ArrayBuffer
// const messageBuffer = Buffer.from(sha256, 'hex')

// const verified = await crypto.subtle.verify(
//   { name: 'ECDSA', hash: { name: 'SHA-256' } },
//   cryptoKey,
//   signatureBuffer,
//   messageBuffer
// )
// console.log(verified)
// const extracted = extract(proof.secp256r1.pubkey, proof.secp256r1.signature)
// const sha256Buffer = await crypto.subtle.digest('SHA-256', Buffer.from(proof.sha256))
// const hash = '0x' + Buffer.from(sha256Buffer).toString('hex')
// const x = '0x' + extracted.x.toString('hex')
// const y = '0x' + extracted.y.toString('hex')
// const r = '0x' + extracted.r.toString('hex')
// const s = '0x' + extracted.s.toString('hex')
const values = [{ hash, x, y, r, s }]
// console.log(values)
const types = ['tuple(string signature, string url)']
const encoded = abiCoder.encode(types, values)
const bytes = ethers.getBytes(encoded)
return bytes;
