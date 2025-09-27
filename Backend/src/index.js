const express = require("express");
const path = require("path");
const app = express();
const cookieParser = require("cookie-parser");
const middleware = require("./middlewares/Middlewares");
require("dotenv").config();

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("", middleware.authenticate_token);
app.use("", middleware.authorize_user);

app.use("", require("./routes/Routes"));

app.listen(PORT, (error) => {
  if (error) throw error;
  console.log("server starts at ::", PORT);
});
