import { MailtrapClient } from "mailtrap";


const TOKEN = 'dfcda2b469386a3fdf88fbfd8042bb3d';


export const mailtrapClient = new MailtrapClient({
  token: TOKEN,
});

export const sender = {
  email: "hello@cop4331-t23.xyz",
  name: "Nutrition Tracker Team",
};