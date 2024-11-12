
import bcryptjs from 'bcryptjs'
import { sendVerificationEmail, sendWelcomeEmail, sendForgotPasswordEmail, sendResetSuccessEmail} from "../mailtrap/emails.js";
import { User } from "../models/user.models.js";
import { Meal } from "../models/meals.models.js";
import { Macro } from "../models/macros.models.js";
import { UserHealth } from "../models/userHealth.models.js";
import axios from "axios"
import crypto from "crypto"

export const register = async (req, res) =>
    {
      const{firstName, lastName, email, login, password} = req.body;    
      try {
          if (!email || !password || !firstName || !lastName || !login )
          {
              throw new Error("All fields are required");
          }
  
          const userAlreadyExists = await User.findOne({
            $or: [
              {email:email},
              {login:login}
            ]
          });
          if(userAlreadyExists)
          {
              return res.status(400).json({success: false, message: "User already exists"});
          }
  
          const hashedPassword = await bcryptjs.hash(password, 10);
          const verificationToken = Math.floor(100000 + Math.random()*900000).toString();
          const user = new User({
              email,
              login,
              password: hashedPassword,
              firstName,
              lastName,
              verificationToken,
              verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000
          })
  
          await user.save();
  
          await sendVerificationEmail(user.email, verificationToken);
  
          res.status(201).json({
              success: true,
              message: "User created successfully",
              user:{
                  ...user._doc,
                  password: undefined,
              }
          })
      } catch (error) {
          res.status(400).json({success: false, message: error.message});
      }
};

export const verify = async (req, res) =>
{
    const{code} = req.body;
    try{
        const user = await User.findOne({
                verificationToken: code,
                verificationTokenExpiresAt: {$gt: Date.now() },
            })
        
        if(!user){
            return res.status(400).json({success: false, message: "Invalid or expired verification code"})
        }
        
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();
        
        await sendWelcomeEmail(user.email, user.name);
              
        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error){
        console.log("error in verify Email", error);
        res.status(500).json({success: false, message: "Server error"})
    }
}

export const login = async (req, res) =>
{
    const { login, password } = req.body;
    try {
        
        const user = await User.findOne({login});
        if(!user) {
            return res.status(400).json({ success: false, message : "Invalid credentials login"})
        }
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(400).json({ success: false, message : "Invalid credentials"})
        }


        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        })

    } catch (error) {
        console.log("Error in Login",error);
        return res.status(400).json({ success: false, message : error.message})
    }
}

export const resendVerification = async (req, res) => {
    const{email} = req.body;   
    
    try {
        
        if (!email )
        {
            throw new Error("Email is required");
        }

        const userNeedVerification = await User.findOne({email});
        if(!userNeedVerification)
        {
            return res.status(400).json({success: false, message: "User does not already exists"});
        }

        const verificationToken = Math.floor(100000 + Math.random()*900000).toString();
        userNeedVerification.verificationToken=verificationToken
        userNeedVerification.verificationTokenExpiresAt= Date.now() + 24 * 60 * 60 * 1000

        await userNeedVerification.save();


        await sendVerificationEmail(userNeedVerification.email, verificationToken);

        res.status(201).json({
            success: true,
            message: "User verification resent successfully",
            user:{
                ...userNeedVerification._doc,
                password: undefined,
            }
        })
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
}

export const forgotPassword = async (req, res) => {
    const { email } = req.body
    
    try {
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({ success: false, message: "User not found"});
        }

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now()+ 1 * 60 * 60 * 1000;
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;

        await user.save()

        await sendForgotPasswordEmail(user.email,`http://localhost:65/reset-password/${resetToken}`);
         console.log(resetToken);
        res.status(200).json({success: true, message: "Password reset link sent to your email"})
    } catch (error) {
        console.log("Error in forgotPassword ", error);
        res.status(400).json({success: false, message: error.message});
  }
}

export const resetPassword = async (req, res) => {
    try {
        const {token} = req.params;
        const {password} = req.body;
        console.log(token);
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: {$gt: Date.now()},
        })
    
        if(!user){
            return res.status(400).json({success: false, message: "Invalid or expired reset token"})
        }
    
        const hashedPassword = await bcryptjs.hash(password,10);
        
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();
    
        await sendResetSuccessEmail(user.email);
    
        res.status(200).json({success: true, message: "Password reset successful"})
    } catch (error) {
        console.log("Error in resetPassword", error);
        res.status(400).json({success: false, message: error.message});
    }
}

export const nutrition = async (req, res) => {
    const apiKey = 'tS8CYPn0f0Bw5wvGzxDFiA==IYBR2OoJUsUv0mwo'; 
    const query = req.body;
    console.log(query.query);
    const url = "https://api.calorieninjas.com/v1/nutrition?query=" + query.query
    
    await axios.get(url, {
        headers: {
            'X-Api-Key': apiKey
        }
    })
    .then(response => {
        console.log(response.data)
        res.status(200).json({
            success: true,
            message: response.data
        })
    })
    .catch((error) => {
        res.status(400).json({
            success: false,
            message: "Nutrition info recieved unsuccessfully, "+ error,
        })
    });
}

export const recipe = async (req, res) => {
    const query = req.body;
    const url = "https://www.themealdb.com/api/json/v1/1/search.php?s=" + query.query
    console.log(url);
    await axios.get(url)
       
    .then(response => {
        console.log(response.data)
        res.status(200).json({
            success: true,
            message: response.data
        })
     })
    .catch((error) => {
        res.status(400).json({
            success: false,
            message: "Recipe info recieved unsuccessfully, "+ error,
        })
    });
}

//Meal Collection-------------------
//creates a meal
//input: (all meal info)
export const createmeal = async (req, res) => {
    try {
        //uses schema 
        const newmeal = new Meal(req.body);
        await newmeal.save();
        return res.status(201).json({
          success:true, message: "Meal succesfully created", meal: newmeal
        })
        
    } catch (error) {
        //which type of error is it?
        //doesnt meet schema 
        if(error.name== "ValidationError" || error.name== "CastError"){
          return res.status(400).json({
            success:false,
            message: "Invalid input"
         })
        }
        else{
          return res.status(500).json({
            success:false,
            message: "Internal Server Error"
         })
        }
        
    }
}

//searches for all meals or specific search
//input:userId, search
export const searchmeal = async (req, res) => {
    const { userId, search } = req.query;
    try {
        const meals = await  Meal.find({userId});
         //meals found
        if(meals.length>0){
            if(search){
                //refine the search to parital matches()
                const refmeals= meals.filter(item =>item.name.toLowerCase().includes(search.toLowerCase()));
                if(refmeals.length === 0){
                    return res.status(200).json({
                        success:true, message: "No meals found"
                    })
                }
                else{
                    return res.status(200).json({
                        success:true, message: "Meals found", meals: refmeals
                    })
                }
            }
            else{
            //return meals
                return res.status(200).json({
                    success:true, message: "Meals found", meals: meals
                })
            }
        }
        //no meals found
        else {
            return res.status(200).json({
                success:true, message: "No meals found"
            })
        }
    } catch (error) {
        if(error.name== "ValidationError" || error.name== "CastError"){
            return res.status(400).json({
                success:false,
                message: "Invalid input"
            })
         }
        else{
            return res.status(500).json({
                success:false,
                message: "Internal Server Error"
            })
        }

    }
}

// Update a meal (input: mealId in URL, new meal data in request body(no userId))
export const updatemeal = async (req, res) => {
    try {
        const { mealId } = req.params;
        const  oldmeal = await Meal.findOne({_id:mealId});//find meal
        if(oldmeal){
            //update meal
            const {name, cal, carb, prot, fat } = req.body;
            oldmeal.name=name;
            oldmeal.cal=cal;
            oldmeal.carb=carb;
            oldmeal.prot=prot;
            oldmeal.fat=fat;
            await oldmeal.save();
            return res.status(200).json({
                success:true, message: "Meals updated", meal: oldmeal
            })
        }
        else{
          //not found
            return res.status(404).json({
                success:false, message: "Meal not found"
            })
        }
    } catch (error) {
        //bad mealId
        if(error.name === "ValidationError") {
            return res.status(400).json({
                success:false, message: "Invalid new meal input"
            })
        }
        //bad meal data
        else if(error.name==="CastError"){
            return res.status(400).json({
                success:false, message: "MealId format doesn't conform with schema"
            })
        }
        //general server error
        else{
            return res.status(500).json({
                success:false, message: "Internal server error"
            })
        }
    }
}

//deletes a meal by its _id / object id/
export const deletemeal = async (req, res) => {
    try {
        const { mealId } = req.params;
        const  oldmeal = await Meal.findByIdAndDelete({_id:mealId});//find meal and delete
        if(oldmeal===null){
            return res.status(404).json({
                success:false, message: "Meal not found"
            })
        }
        else{
            return res.status(200).json({
                success:true, message: "Meals deleted"
            })
        }
    } catch (error) {
        //bad input parameter
        if(error.name==="CastError"){
            return res.status(400).json({
                success:false, message: "MealId format doesn't conform with schema"
            })
        }
        //general server error
        else{
            return res.status(500).json({
                success:false, message: "Internal server error"
            })
        }
    }
}
//---------------------------------------

//userHealth Collection------------------
//createuserhealth(should only be used once)
//input:(all UserHealth fields)
export const createuserhealth = async (req, res) => {
    try {
        //check for duplicates
        const dup = await UserHealth.findOne({userId : req.body.userId})
        if(dup){
            return res.status(400).json({
                success:false, message: "no duplicate UserHealth"
            })
        }
        //uses schema 
        const newUserHealth = new UserHealth(req.body);
        await newUserHealth.save();
        return res.status(201).json({
            success:true, message: "Health info saved", UserHealth: newUserHealth
        })
    } catch (error) {
        if(error.name== "ValidationError" || error.name== "CastError"){
            return res.status(400).json({
                success:false,
                message: "Invalid input"
            })
        }
        else{
            return res.status(500).json({
                success:false,
                message: "Internal Server Error"
            })
        }
        
    }
      
}

//getuserhealth- get users health info 
//input: userId (from parameters)
export const getuserhealth = async (req, res) => {
    try {
        const healthInfo = await UserHealth.findOne({userId: req.params.userId});//find meal
        if(healthInfo==null){//not found
            return res.status(404).json({
                success:false, message: "Health Info not found",
            })
        }
        else{
            return res.status(200).json({//found
                success:true, message: "Health Info found", UserHealth: healthInfo
            })
        }
    } catch (error) {
        //invalid userID
        if(error.name==="CastError"){
            return res.status(400).json({
                success:false, message: "userId format doesn't conform with schema"
            })
        }
        //general server error
        else{
            return res.status(500).json({
                success:false, message: "Internal server error"
            })
        }
    }
}

//updateuserhealth-updates userhealth info
//input:(all UserHealth fields)
export const updateuserhealth = async (req, res) => {
    try {
        const{gender, goals, height, weight, bmi, userId, cal, carb, fat, prot}=req.body
        const  curInfo = await UserHealth.findOneAndUpdate(
            {userId}, {gender, goals, height, weight, bmi, cal, carb, fat, prot}, {new : true}
        )
        //success
        if(curInfo){
            return res.status(200).json({
                success:true, message: "Health Info updated", UserHealth: curInfo
            })
        }
        else{
            //userHealth not set up(not created)
            return res.status(404).json({
                success:false, message: "UserHealth not set up yet"
            })
        } 
    } catch(error){
        //bad Health info
        if(error.name === "ValidationError") {
            return res.status(400).json({
                success:false, message: "Invalid Health Info input"
            })
        }
        //bad userId
        else if(error.name==="CastError"){
            return res.status(400).json({
                success:false, message: "userId format doesn't conform with schema"
            })
        }
        //general server error
        else{
            return res.status(500).json({
                success:false, message: "Internal server error"
            })
        }
    }
}

//deleteuserhealth- deletes users-Health info
//input: userId (from parameters)
export const deleteuserhealth = async (req, res) => {
    try {
        const{userId}= req.params
        const  olduserhealth = await UserHealth.findOneAndDelete({userId});//find meal and delete
        if(olduserhealth===null){
            return res.status(404).json({
                success:false, message: "UserHealth not found"
            })
        }
        else{
            return res.status(200).json({
                success:true, message: "Info deleted"
            })
        }
    
    }catch(error) {
        //bad input parameter
        if(error.name==="CastError"){
            return res.status(400).json({
                success:false, message: "userId format doesn't conform with schema"
            })
        }
        //general server error
        else{
            return res.status(500).json({
                success:false, message: "Internal server error"
            })
        }
        
    }
}
//---------------------------------------------------
 
//Macro collection-----------------------------------------------
//createmacro- creates a users macro counter 
//setting it at base numbers from userHealth info
//input: userId
export const createmacro = async (req, res) => {
    try {
        //check for duplicates
        const dup = await Macro.findOne({userId: req.body.userId})
        if(dup){
            return res.status(400).json({
                success:false, message: "no duplicate Macro"
            })
        }
        const healthInfo = await UserHealth.findOne({userId: req.body.userId})
        if(healthInfo){
            const newmacro = new Macro({
                userId: req.body.userId, 
                cal: healthInfo.cal, 
                carb: healthInfo.carb,
                fat: healthInfo.fat, 
                prot: healthInfo.prot
            })
            await newmacro.save();
            return res.status(201).json({
                success:true, message: "Macros info saved", Macro: newmacro
            })
        }
        else{
            return res.status(404).json({
                success:false, message: "UserHealth info not set up yet"
            })
        }
    } catch (error) {
        if(error.name== "ValidationError" || error.name== "CastError"){
            return res.status(400).json({
                success:false,
                message: "Invalid input"
             })
        }
        else{
            return res.status(500).json({
                success:false,
                message: "Internal Server Error"
            })
        }
    }
}

//getmacro- gets the macro info for a specific user
//input:userId (from parameters)
export const getmacro = async (req, res) => {
    try {
        const{userId} = req.params
        const macro = await Macro.findOne({userId : userId})
        if(macro==null){//not found
            return res.status(404).json({
                success:false, message: "Macro not found",
            })
        }
        else{
            return res.status(200).json({//found
                success:true, message: "Macro Info found", Macro: macro
            })
        }
    } catch (error) {
          //invalid userID
        if(error.name==="CastError"){
            return res.status(400).json({
                success:false, message: "userId format doesn't conform with schema"
            })
        }
        //general server error
        else{
            return res.status(500).json({
                success:false, message: "Internal server error"
            })
        }
    }
}

//updatemacro- updates the macros with 4 options
//(reset(R), customupdate(CU), add(A), subtract(S))
//input: userId, search ((from parameters))
//       cal, carb, fat, prot (from body unless search ==R)
export const updatemacro = async (req, res) => {
    try {
        const{userId, search} = req.params
        //const{cal,carb, fat, prot}= req.body
        if(search){
            if(search==="R"){
                //find info from userhealth
                const healthInfo = await UserHealth.findOne({userId: userId})
                if(healthInfo){
                    const  macro = await Macro.findOneAndUpdate(
                        {userId}, {cal: healthInfo.cal, carb: healthInfo.carb, fat:healthInfo.fat, prot: healthInfo.prot}, {new : true}
                    )
                    //success
                    if(macro){
                        return res.status(200).json({
                            success:true, message: "Macros Reset", Macro: macro
                        })
                    }
                    else{
                        return res.status(404).json({
                            success:false, message: "Macros not set up yet"
                        })
                    }
              
                }
                else{
                    //userHealth not set up(not created)
                    return res.status(404).json({
                        success:false, message: "UserHealth not set up yet"
                    })
                }
            }
            else if(search==="CU"){
                const{cal,carb, fat, prot}= req.body
                const  macro = await Macro.findOneAndUpdate(
                    {userId}, {cal, carb, fat, prot}, {new : true}
                )
                //success
                if(macro){
                    return res.status(200).json({
                        success:true, message: "Macros updated", Macro: macro
                    })
                }
                else{
                    return res.status(404).json({
                        success:false, message: "Macros not set up yet"
                    })
                }
            }
            else if(search==="A"){
                const{cal,carb, fat, prot}= req.body
                const  macro = await Macro.findOneAndUpdate(
                    {userId}, {$inc: {cal: cal, carb: carb, fat: fat, prot: prot}}, {new : true}
                )
                //success
                if(macro){
                    return res.status(200).json({
                        success:true, message: "Macros given back,forgot to eat", Macro: macro
                    })
                }
                else{
                    return res.status(404).json({
                        success:false, message: "Macros not set up yet"
                    })
                }
            }
            else if(search==="S"){
                const{cal,carb, fat, prot}= req.body
                const  macro = await Macro.findOneAndUpdate(
                    {userId}, {$inc: {cal: -cal, carb: -carb, fat: -fat, prot: -prot}}, {new : true}
                )
                //success
                if(macro){
                    return res.status(200).json({
                        success:true, message: "Meal eaten", Macro: macro
                    })
                }
                else{
                    return res.status(404).json({
                        success:false, message: "Macros not set up yet"
                    })
                }
            }
      
        }
    } catch (error) {
        //bad Health info
        if(error.name === "ValidationError") {
            return res.status(400).json({
                success:false, message: "Invalid Health Info input"
            })
        }
        //bad userId
        else if(error.name==="CastError"){
            return res.status(400).json({
                success:false, message: "userId format doesn't conform with schema"
            })
        }
        //general server error
        else{
            return res.status(500).json({
                success:false, message: "Internal server error"
            })
        }
    }
}

//deletemacro- deletes macro
//input: userId (from parameters)
export const deletemacro = async (req, res) => {
    try {
        const{userId}= req.params
        const  oldmacro = await Macro.findOneAndDelete({userId});//find meal and delete
        if(oldmacro===null){
            return res.status(404).json({
                success:false, message: "macro not found"
            })
        }
        else{
            return res.status(200).json({
                success:true, message: "macro deleted"
            })
        }
    }catch(error) {
        //bad input parameter
        if(error.name==="CastError"){
            return res.status(400).json({
                success:false, message: "userId format doesn't conform with schema"
            })
        }
        //general server error
        else{
            return res.status(500).json({
                success:false, message: "Internal server error"
            })
        }
        
    }  
}
//-----------------------------------------------------
