import { Wallet, ethers } from "ethers";
import { serialize } from "v8";
import { TransactionSerializedLegacy, createPublicClient, createWalletClient, custom, hashTypedData, http, serializeSignature, verifyMessage } from "viem";
import { generatePrivateKey, signTransaction, toAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

async function signMessageWithPrivateKey(message: any, privateKey: string): Promise<string> {
  const wallet = new Wallet(privateKey);

  // Sign the message
  const signature = await wallet.signMessage(message);
  console.log("signature from signMessageWithPrivateKey", signature);
  return signature;
}

const privateKey = generatePrivateKey();
const wallet = new Wallet(privateKey);
console.log("wallet", wallet.publicKey);

const address = wallet.address;
export async function viemSigner() {
  return {
    address: address as `0x${string}`,
    source: 'privateKey',
    nonceManager: undefined,
    type: "local" as const, // Ensure this is the literal "local"
    publicKey: wallet.publicKey as `0x${string}`,
    async signMessage({ message }: { message: any }): Promise<`0x${string}`> {
      console.log("message obj?", message);
      let messageString: `0x${string}`;
      if (typeof message !== "string") {
        messageString = `0x${Buffer.from(message.raw.slice(2), 'hex').toString('hex')}` as `0x${string}`;
      } else {
        messageString = `0x${Buffer.from(message.slice(2), 'hex').toString('hex')}` as `0x${string}`;
      }

      const sign = await signMessageWithPrivateKey(messageString, privateKey);
      console.log("verify message props INSIDE", address, messageString, sign);

      let messageCheck = await verifyMessage({
        message: messageString,
        signature: `0x${sign}`,
        address: address as `0x${string}`,
      });

      console.log("messageCheck", messageCheck);
      return `0x${sign}` as `0x${string}`;
    },
    async signTransaction(transaction: any): Promise<`0x02${string}` | `0x01${string}` | `0x03${string}` | TransactionSerializedLegacy> {
      console.log("signTransaction p", transaction);
      return await signTransaction({ transaction, privateKey });
    },
    async signTypedData(typedData: any): Promise<`0x${string}`> {
      console.log("signTypedData p");
      const sign = await signMessageWithPrivateKey(hashTypedData(typedData), privateKey);
      return serializeSignature(sign) as `0x${string}`;
    },
  };
}
