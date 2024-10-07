const express = require("express");
const router = express.Router();
const auth = require("../middleware/AuthMWPermission");
const { User } = require("../models/UserModelDB");

// auth -> authorization
// update user role to admin

router.put("/:id", auth, async (req, res) => {
    try{
    // remember that findByIdAndUpdate() no longer accepts a callback
    // { new: true }  Add this option to return the modified document
        const user= await User.findByIdAndUpdate({ _id: req.params.id },{ isAdmin: true }, { new: true });

        
  if (!user) {
    return res.status(404).send("User not found");
  }

  return res.status(200).send(`${user.name}'s role is set to admin`);
    }
    catch (err) {
        if (err.name === "CastError" && err.kind === "ObjectId") {
          return res.status(400).send("Invalid ID format");
        }
      
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }

});

module.exports=router;

