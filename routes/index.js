var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Code Coverage" });
});

// router.get("/api/log", function (req, res) {
//   res.send("islog");
// });
module.exports = router;
