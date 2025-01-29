import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // cloudinary url
      required: true,
    },
    videoFilePublicId: {
      type: String, // cloudinary public id
    },
    thumbnail: {
      type: String, // cloudinary url
    },
    thumbnailPublicId: {
      type: String, // cloudinary public id
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

videoSchema.pre("remove", async function (next) {
  try {
    await this.model("User").updateMany(
      { watchHistory: this._id },
      { $pull: { watchHistory: this._id } }
    );
    await this.model("Comment").deleteMany({ video: this._id });
    await this.model("Like").deleteMany({ video: this._id });
    await this.model("Playlist").updateMany(
      { videos: this._id },
      { $pull: { videos: this._id } }
    );
    next();
  } catch (error) {
    next(error);
  }
});

export const Video = mongoose.model("Video", videoSchema);
