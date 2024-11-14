"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRadiumPoolToken = void 0;
const cron_1 = require("cron");
const common_helper_1 = require("../common/helper/common.helper");
const raydium_1 = require("../controllers/raydium/raydium");
const cronExpression50s = "*/50 * * * * *";
const cronExpression15s = "*/15 * * * * *";
const cronExpression10s = "*/10 * * * * *";
// const cronExpression5m = "*/5 * * * *";
exports.checkRadiumPoolToken = new cron_1.CronJob(cronExpression50s, async () => {
    await (0, common_helper_1.delay)(Math.random() * 1500);
    (0, raydium_1.getPools)({});
});
//# sourceMappingURL=raydium.cron.js.map