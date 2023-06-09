import Head from 'next/head'
import * as LitJsSdk from '@lit-protocol/lit-node-client'
import { useState } from 'react';

const chain = 'ethereum'

const accessControlConditions = [
  {
    contractAddress: "",
    standardContractType: "",
    chain: chain,
    method: "eth_getBalance",
    parameters: [":userAddress", "latest"],
    returnValueTest: {
      comparator: ">=",
      value: "1000000000000", // 0.000001 ETH
    },
  },
];

const encryptAndSave = async (input: string): Promise<[string, string]> => {
  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(input)
  const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: chain})
  const client = new LitJsSdk.LitNodeClient({litNetwork: 'serrano'})
  await client.connect()
  const encryptedSymmetricKey = await client.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    authSig,
    chain,
  })
  return [LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16"), await LitJsSdk.blobToBase64String(encryptedString)]
}

const decrypt = async (encryptedStr:string, encryptedSymmetricKey: string): Promise<string> => {
  const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: chain})
  const client = new LitJsSdk.LitNodeClient({litNetwork: 'serrano'})
  await client.connect()
  const symmetricKey = await client.getEncryptionKey({
    accessControlConditions,
    toDecrypt: encryptedSymmetricKey,
    chain,
    authSig,
  })

  return await LitJsSdk.decryptString(LitJsSdk.base64StringToBlob(encryptedStr), symmetricKey)
}

export default function Home() {
  const [input, setInput] = useState('')
  const [encryptedSymmetricKey, setEncryptedSymmetricKey] = useState('')
  const [encryptedString, setEncryptedString] = useState('')
  const [decryptedString, setDecryptedString] = useState('')

  return (
    <>
      <Head>
        <title>Lit protocol playglound</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <input value={input} onChange={e => setInput(e.target.value)} />
        <button onClick={ async () => {
          const [key, str] = await encryptAndSave(input)
          setEncryptedString(str)
          setEncryptedSymmetricKey(key)
        }}> encrypt & save </button>
        <p>
          encryptedString: {encryptedString}
        </p>
        <p>
          encryptedSymmetricKey: {encryptedSymmetricKey}
        </p>
      </div>
      <div>
        <button onClick={ async () => {
          const str = await decrypt(encryptedString, encryptedSymmetricKey)
          setDecryptedString(str)
        }}> decrypt </button>
        <p>
          decryptedString: {decryptedString}
        </p>
      </div>
    </>
  )
}
