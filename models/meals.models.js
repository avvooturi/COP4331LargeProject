import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true    //Up for debate
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

export const Meal = mongoose.model("Meal",mealSchema);