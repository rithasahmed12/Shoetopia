const isLogin = async (req, res, next) => {
  try {
    if (req.session.admin) {
      next();
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    res.redirect("/500");
  }
};
//------------------------------------------------------------------------------------------
const isLogout = async (req, res, next) => {
  try {
    if (req.session.admin) {
      res.redirect("/admin/dashboard");
    } else {
      next();
    }
  } catch (error) {
    res.redirect("/500");
  }
};

module.exports = {
  isLogin,
  isLogout,
};
