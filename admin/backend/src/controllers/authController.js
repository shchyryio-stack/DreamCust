const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const login = async (req, res) => {
  const { login, password } = req.body;

  try {
    const employee = await Employee.findOne({ login });

    if (employee && (await employee.matchPassword(password))) {
      if (!employee.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      const token = generateToken(employee._id);

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        _id: employee._id,
        login: employee.login,
        fullName: employee.fullName,
        corporateEmail: employee.corporateEmail,
        department: employee.department,
        position: employee.position,
        role: employee.role,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id).select('-password');
    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// For initial setup
const register = async (req, res) => {
  const { login, password, corporateEmail, fullName, phoneNumber, position, department, age } = req.body;

  try {
    const employeeExists = await Employee.findOne({ $or: [{ login }, { corporateEmail }] });

    if (employeeExists) {
      return res.status(400).json({ message: 'Employee already exists' });
    }

    const employee = await Employee.create({
      login,
      password,
      corporateEmail,
      fullName,
      phoneNumber,
      position,
      department,
      age
    });

    if (employee) {
      res.status(201).json({
        _id: employee._id,
        login: employee.login,
        fullName: employee.fullName,
      });
    } else {
      res.status(400).json({ message: 'Invalid employee data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { login, logout, getMe, register };
