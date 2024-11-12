import mongoose from "mongoose";

const macroSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

export const Macro = mongoose.model("Macro",macroSchema);