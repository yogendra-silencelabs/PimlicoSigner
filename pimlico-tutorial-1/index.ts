import "dotenv/config"
import { writeFileSync } from 'fs'
import {
    ENTRYPOINT_ADDRESS_V07, 
    GetUserOperationReceiptReturnType, 
    UserOperation,
    bundlerActions, 
    createSmartAccountClient, 
    getAccountNonce, 
    getSenderAddress, 
    getUserOperationHash, 
    signUserOperationHashWithECDSA, 
    waitForUserOperationReceipt
} from "permissionless"
import { 
    privateKeyToSafeSmartAccount, 
    privateKeyToSimpleSmartAccount, 
    signerToSafeSmartAccount 
} from "permissionless/accounts"
import { pimlicoBundlerActions, pimlicoPaymasterActions } from "permissionless/actions/pimlico"
import { createPimlicoBundlerClient, createPimlicoPaymasterClient } from "permissionless/clients/pimlico"
import { 
    Address, 
    Hash, 
    Hex, 
    concat, 
    createClient, 
    createPublicClient, 
    encodeFunctionData, 
    http, 
    parseAbiItem 
} from "viem"
import { generatePrivateKey, privateKeyToAccount, signMessage } from "viem/accounts"
import { lineaTestnet, polygonMumbai, sepolia } from "viem/chains"
import { create } from "domain"
import { viemSigner } from "./viemSigner"

console.log("Hello world!")

const apiKey = "1be83993-fd5c-4906-aff2-f535c65fee3f"
const paymasterUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${"1be83993-fd5c-4906-aff2-f535c65fee3f"}`

const signer = await viemSigner()
console.log("psigner", signer)
const privateKey =
	(process.env.PRIVATE_KEY as Hex) ??
	(() => {
		const pk = generatePrivateKey()
		writeFileSync(".env", `PRIVATE_KEY=${pk}`)
		return pk
	})()
 
export const publicClient = createPublicClient({
    chain: sepolia,
	transport: http("https://rpc.ankr.com/eth_sepolia"),
})
 
export const paymasterClient = createPimlicoPaymasterClient({
	transport: http(paymasterUrl),
	entryPoint: ENTRYPOINT_ADDRESS_V07,
})
console.log("signer",privateKeyToAccount(privateKey))
const account = await signerToSafeSmartAccount(publicClient, {
    signer: signer,
    entryPoint: ENTRYPOINT_ADDRESS_V07, // global entrypoint
    safeVersion: "1.4.1",
})
console.log("account",account)
 
console.log(`Smart account address: https://sepolia.etherscan.io/address/${account.address}`)

const bundlerUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${"1be83993-fd5c-4906-aff2-f535c65fee3f"}`
 
const bundlerClient = createPimlicoBundlerClient({
	transport: http(bundlerUrl),
	entryPoint: ENTRYPOINT_ADDRESS_V07,
})
 
const smartAccountClient = createSmartAccountClient({
	account,
	entryPoint: ENTRYPOINT_ADDRESS_V07,
	chain: sepolia,
	bundlerTransport: http(bundlerUrl),
	middleware: {
		gasPrice: async () => {
			return (await bundlerClient.getUserOperationGasPrice()).fast
		},
		sponsorUserOperation: paymasterClient.sponsorUserOperation,
	},
})
const txHash = await smartAccountClient.sendTransaction({
	to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	value: 0n,
	data: "0x1234",
})
 
console.log(`User operation included: https://sepolia.etherscan.io/tx/${txHash}`)