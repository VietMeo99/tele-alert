"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
require("module-alias/register");
const express_config_1 = __importDefault(require("./configs/express.config"));
const logger_config_1 = __importDefault(require("./configs/logger.config"));
const db_mysql_1 = __importDefault(require("./database/db.mysql"));
const PORT = process.env.PORT || 8000;
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    // connectDB
    yield (0, db_mysql_1.default)();
    // cron job
    // job.start();
    // checkReleasePoolToken.start();
    // test
    // testF()
    express_config_1.default.listen(PORT, () => {
        logger_config_1.default.info(`Server running at ${PORT}`);
    });
});
main();
//# sourceMappingURL=server.js.map