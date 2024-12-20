import * as telegramService from "../../services/telegram/telegramService";

const getHomePage = (req: any, res: any) => {
  // return res.render("homepage.ejs");
  return res.send("Express TS on Vercel");
};

interface Request {
  body: any; // Thay đổi kiểu dữ liệu nếu cần
  img?: string;
}

interface QueueItem {
  req: Request;
  resolve: () => void;
  reject: (error: any) => void;
}

const queue: QueueItem[] = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;
  const { req, resolve, reject } = queue.shift()!; // Sử dụng '!' để đảm bảo không null

  try {
    await telegramService.sendNotification(req.body);
    resolve();
  } catch (error) {
    console.log("error :", error?.message);
    reject(error);
  } finally {
    isProcessing = false;
    // Gọi lại processQueue sau 1 giây nếu còn yêu cầu trong hàng đợi
    setTimeout(processQueue, 1000);
  }
};

// const handlePushTelegramNotificationController = (
//   req: Request,
//   _res?: any
// ): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     queue.push({ req, resolve, reject });
//     processQueue();
//   });
// };

const handlePushTelegramNotificationController = async (
  req: Request
): Promise<void> => {
  try {
    await telegramService.sendNotification(req.body);
  } catch (error) {
    console.log("error :", error?.message);
  }
};

const handlePushPhotoTelegramNotificationController = async (req: Request) => {
  try {
    console.log("send :", req.body);
    await telegramService.sendPhoto(req.body, req.img);
    console.log("done!");
  } catch (error) {
    console.log("error :", error?.message);
  }
};

const getTelegramPage = (req: any, res: any) => {
  return res.render("telegram.ejs");
};

const sendAnimation = async () => {
  await telegramService.sendMeAGif();
  return;
};

export {
  getHomePage,
  getTelegramPage,
  sendAnimation,
  handlePushTelegramNotificationController,
  handlePushPhotoTelegramNotificationController,
};
