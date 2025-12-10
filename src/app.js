/****** core modules import here *******/
import cors from "cors";
import express from "express";
import './config/env.js';


/*******internal files import here *******/
import paymentRoutes from "./routes/paymentRoutes/paymentRoutes.js";
import webhookRoute from "./routes/paymentRoutes/webhookRoute.js";


/****** express app initilazation here *******/
const app = express();


/********** strip weebhooks Routes Define Here *********/
app.use("/api/stripe", webhookRoute);



/********* Body Data Parse **********/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/*********** Middleware Here ***********/
app.use(cors());
app.use(express.json());


/********** strip Routes Define Here *********/
app.use("/api/stripe", paymentRoutes);




/******* Export the module ******/
export default app;
