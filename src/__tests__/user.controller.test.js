const { loginUser } = require('../controllers/user.controller');
const { User } = require('../models/user.model');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const mongoose = require('mongoose');

// Mock dependencies
jest.mock('../models/user.model.js');
jest.mock('../utils/ApiError.js');
jest.mock('../utils/ApiResponse.js');
jest.mock('jsonwebtoken');

describe('loginUser', () => {
    let req, res, next, mockUser;

    beforeEach(() => {
        // Setup request and response objects
        req = {
            body: {
                identifier: 'testuser',
                password: 'password123'
            }
        };
        
        res = {
            status: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        
        next = jest.fn();
        
        // Mock user data
        mockUser = {
            _id: new mongoose.Types.ObjectId(),
            username: 'testuser',
            email: 'test@example.com',
            isPasswordCorrect: jest.fn().mockResolvedValue(true),
            generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
            generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
            save: jest.fn().mockResolvedValue(true)
        };

        // Reset all mocks
        jest.clearAllMocks();

        // Default mock implementation for User.findOne
        User.findOne.mockResolvedValue(mockUser);
        User.findById.mockResolvedValue({
            _id: mockUser._id,
            username: mockUser.username,
            email: mockUser.email
        });
        
        // Mock ApiResponse constructor
        ApiResponse.mockImplementation((statusCode, data, message) => ({
            statusCode,
            data,
            message,
            success: statusCode < 400
        }));

        // Mock ApiError
        ApiError.mockImplementation((statusCode, message) => {
            const error = new Error(message);
            error.statusCode = statusCode;
            return error;
        });
    });

    it('should login user successfully with valid credentials', async () => {
        await loginUser(req, res);
        
        expect(User.findOne).toHaveBeenCalledWith({
            $or: [{ email: req.body.identifier }, { username: req.body.identifier }]
        });
        
        expect(mockUser.isPasswordCorrect).toHaveBeenCalledWith(req.body.password);
        expect(User.findById).toHaveBeenCalledWith(mockUser._id);
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.cookie).toHaveBeenCalledWith('accessToken', expect.any(String), expect.any(Object));
        expect(res.cookie).toHaveBeenCalledWith('refreshToken', expect.any(String), expect.any(Object));
        expect(res.json).toHaveBeenCalled();
    });

    it('should throw error if identifier or password is missing', async () => {
        req.body = { identifier: '' };
        
        await expect(loginUser(req, res)).rejects.toThrow();
        expect(ApiError).toHaveBeenCalledWith(400, 'Username or Password is required.');
    });

    it('should throw error if user does not exist', async () => {
        User.findOne.mockResolvedValue(null);
        
        await expect(loginUser(req, res)).rejects.toThrow();
        expect(ApiError).toHaveBeenCalledWith(404, 'User does not exist');
    });

    it('should throw error if password is incorrect', async () => {
        mockUser.isPasswordCorrect.mockResolvedValue(false);
        
        await expect(loginUser(req, res)).rejects.toThrow();
        expect(ApiError).toHaveBeenCalledWith(401, 'Invalid User Ceredentials');
    });

    it('should return user data and tokens in response', async () => {
        await loginUser(req, res);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                user: expect.any(Object),
                accessToken: expect.any(String),
                refreshToken: expect.any(String)
            }),
            message: 'User logged in Successfully'
        }));
    });
});