import express, { response } from "express";
import bodyParser from "body-parser"
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./Routes/route.js"

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api", authRoutes);

//was a suggested change- reason: await isnt supporeted outside of async function
//const client=await mongoose.connect('mongodb+srv://zpdoss:the23rdTeam@cop4331.kbakb.mongodb.net/COP4331LargeProject?retryWrites=true&w=majority&appName=COP4331');
mongoose.connect('mongodb+srv://zpdoss:the23rdTeam@cop4331.kbakb.mongodb.net/COP4331LargeProject?retryWrites=true&w=majority&appName=COP4331')
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

app.use((req, res, next) =>
{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS'
  );
  next();
});

//Lets us know server is running on given port
//app.listen(5001); // start Node + Express server on port 5000
app.listen(5079, () => {
  console.log("Server is running on port 5079");
});