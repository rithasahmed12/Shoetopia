const User = require("../models/usersModels");

const isLogin = async (req, res, next) => {
  try {
    if (req.session.userId) {
      if (req.path === "/login") {
        res.redirect("/home");
        return;
      }

      next();
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    res.redirect("/500");
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.userId) {
      res.redirect("/home");
      return;
    }

    next();
  } catch (error) {
    res.redirect("/500");
  }
};

const checkBlocked = async (req, res, next) => {
  const userId = req.session.userId;

  if (userId) {
    try {
      const user = await User.findOne({ _id: userId });

      if (user && user.is_blocked == 1) {
        return res.redirect("/blocked-user");
      }
    } catch (error) {
      res.redirect("/500");
    }
  }

  next();
};

module.exports = {
  isLogin,
  isLogout,
  checkBlocked,
};
