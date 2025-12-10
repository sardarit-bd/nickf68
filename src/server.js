import app from "./app.js";
import connectDB from './config/db.js';
import environment from "./config/env.js";


/******** PORT Define *******/
const PORT = process.env.PORT;


/********** Connect to Database Here **********/
connectDB();



/*********** Start The Server ***********/

if (environment === "development") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port: ${PORT} in ${environment} mode`);
  });
}



export default app;