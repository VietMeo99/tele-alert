import axios from "axios";
// Interfaces
import { ICreateToken } from "../../interfaces/token.interface";

// Services
import * as tokenService from "../../services/token/token.service";
import * as telegramService from "../../services/telegram/telegramService";
import { formatBalance } from "../../common/helper/bigNumber";
import { contract } from "../../cron/pool-token.cron";

// Utilities

export const createTokenHandle = async (params: ICreateToken) => {
  try {
    const token = await tokenService.createToken(params);
  } catch (e) {
    //
  }
};

const telegramAlertToken = async (params: ICreateToken) => {
  try {
    await telegramService.sendNotification(
      {
        ...params,
        pool_id: params.pool_id,
        token_account_ids: params.token_account_ids,
        token_symbols: params.token_symbols,
        token_price: formatBalance(params.token_price),
        liq: formatBalance(params.liq),
      },
      {
        isGenerateTelegramHTML: true,
      }
    );
  } catch (error) {}
};

export const alertTokenHandle = async (params: ICreateToken) => {
  try {
    telegramAlertToken(params);
  } catch (error) {
    if (params.token_contract === contract) {
      await telegramAlertToken(params);
    }
  }
};

export async function getSignerAccountId(
  transactionHash: string
): Promise<string | null> {
  const url = `https://nearblocks.io/_next/data/nearblocks/en/txns/${transactionHash}.json?hash=${transactionHash}`;

  const headers = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    // cookie:
    //   "_ga=GA1.1.734901468.1704366077; rpcUrl=https://beta.rpc.mainnet.near.org; _ga_BWQNL2NX10=GS1.1.1729555440.546.1.1729556059.0.0.0",
    // pragma: "no-cache",
    // priority: "u=1, i",
    // referer: `https://nearblocks.io/txns/${transactionHash}`,
    // "sec-ch-ua":
    //   '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    // "sec-ch-ua-mobile": "?0",
    // "sec-ch-ua-platform": '"macOS"',
    // "sec-fetch-dest": "empty",
    // "sec-fetch-mode": "cors",
    // "sec-fetch-site": "same-origin",
    // "user-agent":
    //   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    // "x-nextjs-data": "1",
  };

  try {
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      return response.data.pageProps.data.txns[0].signer_account_id;
    }
  } catch (error) {
    console.error("Error fetching signer account ID:", error?.message);
  }

  return null;
}

export async function getTransactionHash(
  contract: string
): Promise<string | null> {
  const url = `https://nearblocks.io/_next/data/nearblocks/en/address/${contract}.json/`;

  const headers = {
    accept: "*/*",
    // "accept-language": "en-US,en;q=0.9",
    // "cache-control": "no-cache",
    // pragma: "no-cache",
  };

  try {
    console.log("url :", url);
    const response = await axios.get(url, { headers });
    console.log("response :", response);

    const transactionHash =
      response.data.pageProps.contractData.deployments[0].transaction_hash;
    return transactionHash;
  } catch (error) {
    console.error("Error fetching transaction hash:", error?.message);
    return null;
  }
}

export async function getSignerFromContract(
  contract: string
): Promise<string | null> {
  console.log("contract :", contract);

  const transactionHash = await getTransactionHash(contract);
  console.log("transactionHash :", transactionHash);

  if (transactionHash) {
    return await getSignerAccountId(transactionHash);
  }
  return null;
}

// example
