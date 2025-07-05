const express = require("express");
const app = express();

const port = 3000;
const mongoose = require("mongoose");


main()
    .then(() => {
        console.log("connection sucessfull");
    })
    .catch((err) =>
        console.log(err)
    );

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/parkspace');

}


//root route
app.get("/",(req,res)=>{
    res.send("working");
});

//port check
app.listen(port,()=>{
    console.log(`server running on ${port}`);
});