import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { logAudit } from '../utils/auditLogger.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, status } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'Cashier',
      phone: phone || '',
      status: status || 'active'
    });

    await logAudit({
      req,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user._id.toString(),
      details: { name: user.name, email: user.email, role: user.role }
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;
    if (password) user.password = password; // pre('save') hook will hash it

    await user.save();

    await logAudit({
      req,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user._id.toString(),
      details: { name: user.name, role: user.role, status: user.status }
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    await logAudit({
      req,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: req.params.id,
      details: { email: user.email, role: user.role }
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json({ success: true, roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
