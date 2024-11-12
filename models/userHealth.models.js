import mongoose from "mongoose";

const userhealthSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    goals: {
        type: String,
        required: true
    },
    gender:{
        type: String,
        required: true,
    },
    height: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    bmi: {
        type: Number,
        required: false
    },
    cal: {
        type: Number,
        required: true
    },
    carb: {
        type: Number,
        required: true
    },
    prot: {
        type: Number,
        required: true
    },
    fat:{
        type: Number,
        required: true
    },


});

export const UserHealth = mongoose.model("UserHealth",userhealthSchema, "User-Health");