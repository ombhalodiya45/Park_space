const mongoose = require("mongoose");
const login = require("./models/schema.js");

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

let allChats = [
    {
        from:"om",
        to:"chand",
        msg:"hello brother",
        created_at: new Date()
    },
    {
        from:"om",
        to:"jenu",
        msg:"a jadi su karas",
        created_at: new Date()
    },
    {
        from:"om",
        to:"chigu",
        msg:"company ma pply kryu",
        created_at: new Date()
    },
    {
        from:"chigu",
        to:"om",
        msg:"ha bhai kri didhu",
        created_at: new Date()
    }
]

login.deleteMany(allChats);

