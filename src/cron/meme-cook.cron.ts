import axios from "axios";
import { CronJob } from "cron";
import fs from "fs";
import path from "path";
import {
  BigNumber,
  bigNumber,
  formatBalance,
} from "../common/helper/bigNumber";
import { handlePushTelegramNotificationController } from "../controllers/common/homepageController";
import {
  delay,
  formatBigNumberByUnit,
  generateTelegramHTML,
} from "../common/helper/common.helper";
import { fetchAndProcessPools } from "./pool-token.cron";

interface Trade {
  is_deposit: boolean;
  meme_id: number;
  account_id: string;
  amount: string;
  amount_num: number;
  fee: string;
  fee_num: number;
  timestamp_ms: number;
  receipt_id: string;
}

const infoDepositPath = path.join(
  process.cwd(),
  "src",
  "seeds",
  "info-deposit.seed.json"
);

const readInfoFromFile = (): Array<Array<string | number>> => {
  const data = fs.readFileSync(infoDepositPath, "utf-8");
  return JSON.parse(data);
};

const writeInfoToFile = (info: any) => {
  fs.writeFileSync(infoDepositPath, JSON.stringify(info, null, 2), "utf-8");
};

export const fetchMemeTrades = async (
  memeId: number | string,
  options?: Partial<{ isSortDown: boolean }>
  // decreasing
) => {
  const url = `https://api.meme.cooking/trades?meme_id=${memeId}`;

  try {
    const response = await axios.get<Trade[]>(url, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/json",
        origin: "https://meme.cooking",
        pragma: "no-cache",
        priority: "u=1, i",
        referer: "https://meme.cooking/",
        "sec-ch-ua":
          '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      },
    });

    const accountMap: Record<string, BigNumber> = {};

    const uniqueIds = new Set();
    const filteredData = response.data.filter((item) => {
      if (uniqueIds.has(item.receipt_id)) {
        return false;
      } else {
        uniqueIds.add(item.receipt_id);
        return true;
      }
    });

    filteredData.forEach((trade) => {
      const amountValue = bigNumber(trade.amount).dividedBy(Math.pow(10, 24));
      const feeValue = bigNumber(trade.fee).dividedBy(Math.pow(10, 24));
      if (trade.is_deposit) {
        accountMap[trade.account_id] = bigNumber(
          accountMap[trade.account_id] || 0
        )
          .plus(amountValue)
          .plus(feeValue);
      } else {
        accountMap[trade.account_id] = bigNumber(accountMap[trade.account_id])
          .minus(amountValue)
          .minus(feeValue);
      }
    });

    const result: Array<{
      account_id: string;
      amount: BigNumber;
    }> = Object.entries(accountMap).map(([account_id, amount]) => ({
      account_id,
      amount,
    }));

    const totalAmount = result.reduce(
      (sum, item) => sum.plus(item.amount),
      new BigNumber(0)
    );

    if (totalAmount.isZero()) {
      return;
    }

    const sortedResult = result
      .sort((a, b) =>
        options?.isSortDown
          ? b.amount.minus(a.amount).toNumber()
          : a.amount.minus(b.amount).toNumber()
      )
      .map((i) => {
        const percent = i.amount.dividedBy(totalAmount).multipliedBy(100);
        return {
          ...i,
          amount: formatBalance(i.amount) + " Near",
          percent: percent.toFixed(2) + " %",
          numberOfTokens: `Σ1B => ≈ ${formatBigNumberByUnit(
            bigNumber(1000000000).multipliedBy(percent).dividedBy(100)
          )}`,
        };
      });

    console.log(sortedResult, formatBalance(totalAmount, 2) + " Near");

    const existingData = readInfoFromFile();

    const updatedData = [
      [
        memeId,
        formatBalance(totalAmount, 2) + " Near",
        ...sortedResult
          .sort((a, b) =>
            bigNumber(b.percent.split(" ")[0])
              .minus(a.percent.split(" ")[0])
              .toNumber()
          )
          .map((i, index) => ({ top: index + 1, ...i })),
      ],
      ...existingData.filter((i) => !i.includes(memeId)),
    ];

    writeInfoToFile(updatedData);

    return totalAmount;
  } catch (error) {
    console.error("Error fetching meme trades:", error?.message);
  }
};

const idsPath = path.join(
  process.cwd(),
  "src",
  "seeds",
  "ids-meme-full-cap.seed.json"
);

const readMemeIdsFromFile = () => {
  if (fs.existsSync(idsPath)) {
    const data = fs.readFileSync(idsPath, "utf-8"); // Đọc file
    const memeIdArray = JSON.parse(data); // Chuyển đổi JSON thành mảng
    return new Set(memeIdArray); // Trả về Set
  }
  return new Set(); // Trả về Set rỗng nếu file không tồn tại
};

const writeMemeIdsToFile = () => {
  const memeIdArray = Array.from(sentMemeIds);
  fs.writeFileSync(idsPath, JSON.stringify(memeIdArray, null, 2), "utf-8");
};

const sentMemeIds = readMemeIdsFromFile();

export interface Meme {
  meme_id: number;
  owner: string;
  end_timestamp_ms: number;
  name: string;
  symbol: string;
  decimals: number;
  total_supply: string;
  team_allocation: string;
  reference: string;
  reference_hash: string;
  deposit_token_id: string;
  soft_cap: string;
  hard_cap: string;
  last_change_ms: number;
  total_supply_num: number;
  soft_cap_num: number;
  hard_cap_num: number;
  created_blockheight: number;
  created_timestamp_ms: number;
  total_deposit: string;
  total_deposit_num: number;
  total_deposit_fees: string;
  total_deposit_fees_num: number;
  total_withdraw_fees: string;
  total_withdraw_fees_num: number;
  is_finalized: boolean;
  token_id: string | null;
  pool_id: string | null;
  description: string;
  twitterLink: string;
  telegramLink: string;
  website: string;
  image: string;
  coronated_at_ms: number | null;
  replies_count: number;
  staker_count: number;
  vesting_duration_ms: number;
  cliff_duration_ms: number;
}

const filePath = path.join(
  process.cwd(),
  "src",
  "seeds",
  "meme-cook.seed.json"
);

function readExistingMemes(): Meme[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data) as Meme[];
}

function writeExistingMemes(memes: Meme[]): void {
  fs.writeFileSync(filePath, JSON.stringify(memes, null, 2), "utf8");
}

function generateTelegramHTMLMemeCook(meme: Meme): string {
  const decimals = meme.decimals || 18; // Mặc định là 18 nếu không có
  const totalSupply = bigNumber(meme.total_supply)
    .dividedBy(Math.pow(10, decimals))
    .toFixed(2);
  const teamAllocation = bigNumber(meme.team_allocation || 0)
    .dividedBy(Math.pow(10, decimals))
    .toFixed(2);
  const totalDeposit = bigNumber(meme.total_deposit)
    .dividedBy(Math.pow(10, 24))
    .toFixed(2);
  const softCap = bigNumber(meme.soft_cap)
    .dividedBy(Math.pow(10, 24))
    .toFixed(2);
  const hardCap = bigNumber(meme.hard_cap || 0)
    .dividedBy(Math.pow(10, 24))
    .toFixed(2);
  const memeContract = meme.token_id
    ? meme.token_id
    : `${meme.symbol}-${meme.meme_id}.meme-cooking.near`.toLowerCase();

  const memeDetails = {
    "⭐ Contract": memeContract,
    "⭐ PoolID": meme.pool_id || "N/A",
    TotalDeposit: `${formatBalance(totalDeposit)} Near`,
    HardCap: `${formatBalance(hardCap)} Near`,
    Decimals: meme.decimals,
    _: "==============================",
    "⭐ OwnerLink": `https://nearblocks.io/address/${meme.owner}?tab=tokentxns`,
    XLink: `https://x.com/search?q=${meme.owner}&src=typed_query`,
    TokenLink: `https://nearblocks.io/token/${memeContract}`,
    "⭐ RefLink": `https://app.ref.finance/#usdt.tether-token.near|${memeContract}`,
    "⭐ DexLink": meme.pool_id
      ? `https://dexscreener.com/near/refv1-${meme.pool_id}`
      : "N/A",
    __: "==============================",
    MemeLink: `https://meme.cooking/meme/${meme.meme_id}`,
    Twitter: meme.twitterLink || "N/A",
    Telegram: meme.telegramLink || "N/A",
    Website: meme.website || "N/A",
    ___: "==============================",
    TotalSupply: `${formatBalance(totalSupply)}`,
    "⭐ TeamAllocation": meme.team_allocation
      ? `${formatBalance(
          bigNumber(teamAllocation)
            .dividedBy(totalSupply)
            .multipliedBy(100)
            .toFixed(2)
        )}% - ${formatBalance(teamAllocation)}`
      : "N/A",
    CliffEnd: `${Number(meme.cliff_duration_ms) / (1000 * 60 * 60 * 24)} days`,
    Vesting: `${Number(meme.vesting_duration_ms) / (1000 * 60 * 60 * 24)} days`,
    SoftCap: `${formatBalance(softCap)} Near`,
    ID: meme.meme_id,
    Name: meme.name,
    Symbol: meme.symbol,
    // Description: meme.description || "N/A",
    // Image: `https://plum-necessary-chameleon-942.mypinata.cloud/ipfs/${meme.image}`,
    Tag: "From Meme Cooking",
  };

  return generateTelegramHTML(memeDetails);
}

const existingMemes = readExistingMemes();

const ownerIgnore = [
  "tokenlab.near",
  "memecoinscash.near",
  "mina_yoshizawa.near",
  "jav_idol.near",
  "w3_lab.tg",
  "wink_gambler.tg",
];

async function fetchActiveMemes(): Promise<Meme[]> {
  try {
    const response = await axios.get<Meme[]>("https://api.meme.cooking/meme", {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/json",
        origin: "https://meme.cooking",
        pragma: "no-cache",
        priority: "u=1, i",
        referer: "https://meme.cooking/",
        "sec-ch-ua":
          '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        // "user-agent":
        //   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      },
    });

    // Lọc các meme còn thời gian
    const activeMemes = response.data;
    // const currentTime = Date.now();
    // const activeMemes = response.data.filter(
    //   (meme) => meme.end_timestamp_ms + 30 * 60 * 1000 > currentTime
    // );
    response.data.forEach((m) => {
      const hasHardCap =
        bigNumber(m.total_deposit).gte(m.hard_cap) &&
        bigNumber(m.hard_cap).gte(m.soft_cap);

      if (hasHardCap && !sentMemeIds.has(m.meme_id)) {
        handlePushTelegramNotificationController({
          body: generateTelegramHTMLMemeCook(m),
        });
        if (!m.pool_id) {
          fetchAndProcessPools();
        }
        // fetchMemeTrades(m.meme_id)
        // Thêm meme_id vào Set để tránh gửi lại
        sentMemeIds.add(m.meme_id);
        console.log([...sentMemeIds]);
        writeMemeIdsToFile();
      }
    });

    const newMemes = activeMemes
      .filter((activeMeme) => {
        const isNotInExistingMemes = !existingMemes.some(
          (existingMeme) => existingMeme.meme_id === activeMeme.meme_id
        );
        return isNotInExistingMemes;
      })
      .map((meme) => {
        const memeContract = meme.token_id
          ? meme.token_id
          : `${meme.symbol}-${meme.meme_id}.meme-cooking.near`.toLowerCase();

        return { ...meme, token_id: memeContract };
      });

    if (newMemes.length) {
      try {
        if (newMemes.filter((i) => !ownerIgnore.includes(i.owner)).length) {
          handlePushTelegramNotificationController({
            body: newMemes
              .filter((i) => !ownerIgnore.includes(i.owner))
              .map((i: any) => generateTelegramHTMLMemeCook(i))
              .join("\n\n"),
          });
        }
      } catch (error) {
        console.log("error :", error);
      }

      // Thêm các meme mới vào mảng hiện có và ghi lại vào file
      existingMemes.unshift(...newMemes);
      // const updatedMemes = [...newMemes, ...existingMemes];
      writeExistingMemes(existingMemes);
    }

    return newMemes;
  } catch (error) {
    console.error("Error fetching memes:", error?.message);
    return [];
  }
}

const cronExpression20s = "*/20 * * * * *";
const cronExpression15s = "*/15 * * * * *";
const cronExpression10s = "*/10 * * * * *";
const cronExpression5s = "*/5 * * * * *";
const checkMemeCooking = new CronJob(cronExpression10s, async () => {
  await delay(Math.random() * 1500);
  console.log(`v2 running cron job crawl meme cook ...`);
  fetchActiveMemes();
  return;
});

const getMemeTradesCron = (
  memeId: number | string,
  options?: Partial<{ isSortDown: boolean }>
) => {
  return new CronJob(cronExpression5s, () => {
    fetchMemeTrades(memeId, options);
  });
};

export { checkMemeCooking, getMemeTradesCron };
