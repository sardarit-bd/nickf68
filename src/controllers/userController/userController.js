import User from "../../models/User.js";


const getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};


const getUser = async (req, res) => {
  const users = await User.findById(req.user.id).select("-password").lean();
  res.json(users);
};




/*********** modules export from here ************/
export {
  getAllUsers,
  getUser
};
