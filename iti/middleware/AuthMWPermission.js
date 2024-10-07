// Authorization middleware 

const jwt = require("jsonwebtoken");

module.exports = (req,res,nxt)=>{
    const token = req.header("x-auth-token");
    if(!token) return res.status(401).send("Access Denied");
    try{
    const decodedPayload = jwt.verify(token,process.env.JWT_SECRET);

    // check role is admin or not
    if(!decodedPayload.isAdmin) return res.status(401).send("Access Denied");
    nxt();
    
    }
    catch(err){
        res.status(400).send("Invalid Token...");
    }
    }