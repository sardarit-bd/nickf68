/****** core modules import here *******/
import cors from "cors";
import express from "express";


/*******internal files import here *******/
import authRoutes from './routes/authroute/authUserRoutes.js';
import healthRoutes from "./routes/health/healthRoute.js";
import paymentRoutes from "./routes/paymentRoutes/paymentRoutes.js";
import userRoutes from './routes/userroute/userRoutes.js';



/****** express app initilazation here *******/
const app = express();



/********* Body Data Parse **********/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/*********** Middleware Here ***********/
app.use(cors());
app.use(express.json());




/********** auth Routes Define Here *********/
app.use("/", authRoutes);


/********** user Routes Define Here *********/
app.use("/", userRoutes);



/********** strip Routes Define Here *********/
app.use("/payment", paymentRoutes);




/********** health check Routes Define Here *********/
app.use("/", healthRoutes);




/******* Export the module ******/
export default app;
