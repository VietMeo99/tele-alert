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
exports.generateTelegramHTML = generateTelegramHTML;
exports.writeFile = writeFile;
exports.delay = delay;
const fs_1 = __importDefault(require("fs"));
function generateTelegramHTML(data) {
    let html = "==========\n"; // Thêm đường gạch ngang ở trên
    for (const key in data) {
        html += `<b>${key}:</b> ${data[key]}\n`;
    }
    html += "=========="; // Thêm đường gạch ngang ở dưới
    return html.trim();
}
function writeFile(name, data) {
    const jsonData = JSON.stringify(data, null, 2); // Convert the JSON object to a string with indentation
    fs_1.default.writeFile(name, jsonData, "utf8", (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`File ${name} saved successfully.`);
    });
}
function delay() {
    return __awaiter(this, arguments, void 0, function* (time = 3000) {
        yield new Promise((resolve) => setTimeout(resolve, time));
    });
}
//# sourceMappingURL=common.helper.js.map