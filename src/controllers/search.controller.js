import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const searchContent = asyncHandler(async (req, res) => {
    // Import necessary models
    // Import other models as needed

    // Get search query from request
    const query = req.query.q;
    console.log("Search query:", query);
    // Validate search query
    if (!query?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Search query is required"
        });
    }

    try {
        // Search in Videos collection
        const videos = await Video.aggregate([
            {
                $search: {
                    index: "videoSearchIndex",
                    "text": {
                        "path": ["title", "description"],
                        "query": query,
                        "fuzzy": {
                            "maxEdits": 1
                        }
                    }
                }
            }
            ,
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                fullName: 1,
                                avatar: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $arrayElemAt: ["$owner", 0] }
                }
            },
            {
                $project: {
                    "_id": 1,
                    "title": 1,
                    "description": 1,
                    "thumbnail": 1,
                    "videoFile": 1,
                    "duration": 1,
                    "views": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                    "owner": 1
                }
            }
        ])

        // Search in Users collection
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { fullName: { $regex: query, $options: 'i' } }
            ]
        }).limit(10);


        // Combine search results
        const searchResults = {
            videos,
            users,
        };

        // Return search results
        return res.status(200).json({
            success: true,
            data: searchResults
        });

    } catch (error) {
        console.error("Search error:", error);
        return res.status(500).json({
            success: false,
            message: "Error performing search",
            error: error.message
        });
    }
})

const autoCompleteSearch = asyncHandler(async (req, res) => {
    const query = req.query.q;

    const videos = await Video.find({
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    }).limit(10).select('title');

    const users = await User.find({
        $or: [
            { username: { $regex: query, $options: 'i' } },
            { fullName: { $regex: query, $options: 'i' } }
        ]
    }).limit(10).select('username fullName');

    const autoCompleteSearchResults = {
        videos,
        users,
    }

    return res.status(200).json(new ApiResponse(200, autoCompleteSearchResults, "Auto-complete search results fetched successfully."));
})

export { searchContent, autoCompleteSearch }