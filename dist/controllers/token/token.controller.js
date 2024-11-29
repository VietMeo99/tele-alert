"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTokenController = void 0;
exports.fetchFirstTransaction = fetchFirstTransaction;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const axios_1 = __importDefault(require("axios"));
// Services
const tokenService = __importStar(require("../../services/token/token.service"));
// Utilities
const api_response_utility_1 = __importDefault(require("../../utilities/api-response.utility"));
const bigNumber_1 = require("../../common/helper/bigNumber");
const bigNumber_2 = require("../../common/helper/bigNumber");
const homepageController_1 = require("../common/homepageController");
const common_helper_1 = require("../../common/helper/common.helper");
const createTokenController = async (req, res) => {
    try {
        const params = {
            liq: req.body.liq,
            token_account_ids: req.body.token_account_ids,
            token_price: req.body.token_price,
            token_symbols: req.body.token_symbols,
            pool_id: req.body.pool_id,
            token_contract: req.body.token_contract,
        };
        const token = await tokenService.createToken(params);
        return api_response_utility_1.default.result(res, token, http_status_codes_1.default.CREATED);
    }
    catch (e) {
        return api_response_utility_1.default.error(res, http_status_codes_1.default.BAD_REQUEST);
    }
};
exports.createTokenController = createTokenController;
let id = "2789842780";
async function fetchFirstTransaction() {
    console.log("v2 running cron job crawl ro check txn ...");
    try {
        const response = await axios_1.default.get("https://nearblocks.io/_next/data/nearblocks/en/address/e0xa477.near.json?id=e0xa477.near&tab=txns", {
            headers: {
                accept: "*/*",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            },
        });
        const transactions = response?.data?.pageProps?.data?.txns;
        if (transactions.length > 0) {
            const firstTransaction = transactions[0];
            if (firstTransaction?.id !== id) {
                id = firstTransaction?.id;
                (0, homepageController_1.handlePushTelegramNotificationController)({
                    body: (0, common_helper_1.generateTelegramHTML)({
                        id: firstTransaction?.id,
                        signer_account_id: firstTransaction?.signer_account_id,
                        receiver_account_id: firstTransaction?.receiver_account_id,
                        transaction_hash: `https://nearblocks.io/txns/${firstTransaction?.transaction_hash}`,
                        balance: (0, bigNumber_1.formatBalance)((0, bigNumber_2.bigNumber)(firstTransaction?.actions?.[0]?.deposit).dividedBy(Math.pow(10, 24))),
                    }),
                });
            }
        }
        else {
            console.log("No transactions found.");
        }
    }
    catch (error) {
        console.error("Error fetching data txns");
    }
}
//# sourceMappingURL=token.controller.js.map