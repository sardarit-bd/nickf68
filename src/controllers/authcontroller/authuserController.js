import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import generateToken from "../../utils/generateToken.js";



/********************  User registration Controller here ***********************/
const registerUser = async (req, res) => {

  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) return res.status(400).json({ message: "User already exists" });


    // Hash the password
    const salt = await bcrypt.genSalt(10); // 10 = number of salt rounds
    const hashedPassword = await bcrypt.hash(password, salt);



    // Create user with hashed password
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });


    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/******************** Login User Controller here ***********************/

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // If valid → return user data and token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id, user.name, user.role),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};




export {
  loginUser, registerUser
};

