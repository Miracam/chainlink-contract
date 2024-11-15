const { ethers } = await import('npm:ethers')

const proof = await Functions.makeHttpRequest({ url: `https://api.miracam.xyz/access_nft?url=${args[0]}`, timeout: 9000 })
    .then(res => {
        if (res.error) {
            throw new Error(res.message)
        }
        return res.data
    })


if (!proof.valid) {
    throw new Error('Invalid proof')
}

const values = [{ owner: proof.owner, attester: proof.attester }]
const types = ['tuple(address owner, string attester)']
const abiCoder = ethers.AbiCoder.defaultAbiCoder()
const encoded = abiCoder.encode(types, values)
const bytes = ethers.getBytes(encoded)
return bytes;
