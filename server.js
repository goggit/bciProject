const express =  require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

app.use(bodyParser.json())
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Site for selling and bying used items in Finland<br/>Join us!<br>")
})

let apiInstance = null;

exports.start = () => {
    apiInstance = app.listen(port, () => {
        console.log(`App listening at http://localhost:3000`)
    })
}

exports.stop = () => {
    apiInstance.close();
}

let users = [
    {
        id: 1,
        username: 'username',
        password: 'password'
    }
]

let items = [
    {
        id: 1,
        userId: 1,
        title: 'item_title',
        category: 'cars',
        location: "Oulu",
        description: "tell something about this item",
        delivery_type: 'pickup',           
        sellers_information: 'Telephone: 071228392, call between 6pm and 8pm',
        price: "25e",
        images: ["https:\/\/di2ponv0v5otw.cloudfront.net\/posts\/2018\/04\/03\/5ac40cddc9fcdf4b47b58d15\/m_5ac40f642c705de8541b9887.jpg",
        "https:\/\/di2ponv0v5otw.cloudfront.net\/posts\/2017\/12\/26\/5a42a77761ca109158060bcc\/m_5a42a7a49d20f07cfd06085a.jpg"
        ],
        posting_date: new Date().toISOString().slice(0, 10)
    },
    {
        id: uuidv4(),
        userId: 1,
        title: 'tittlee',
        category: 'clothes',
        location: "Oulu",
        description: "tell something about this item",
        delivery_type: 'delivery',           
        sellers_information: 'Marija, Telephone: 071555392',
        price: "10e",
        images: [],
        posting_date: new Date().toISOString().slice(0, 10)
    }
]

/*********************************************
 * HTTP Basic Authentication
 * Passport module used
 * http://www.passportjs.org/packages/passport-http/
 ********************************************/

const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;

passport.use(new BasicStrategy(
    function (username, password, done) {
        const user=users.filter(function (el) {
            return el.username===username;
        });
        if (user == undefined) {
            // Username not found
            console.log("HTTP Basic username not found");
            return done(null, false, {
                message: "HTTP Basic username not found"
            });
        }

        /* Verify password match */
        if (bcrypt.compareSync(password, user.password) == false) {
            // Password does not match
            console.log("HTTP Basic password not matching username");
            return done(null, false, {
                message: "HTTP Basic password not found"
            });
        }
        return done(null, user);
    }
));


/*********************************************
 * JWT authentication
 * Passport module is used, see documentation
 * http://www.passportjs.org/packages/passport-jwt/
 ********************************************/

const jwtSecretKey = require('./jwt-key.json');
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy,
ExtractJwt = require('passport-jwt').ExtractJwt;
let options = {}

/* Configure the passport-jwt module to expect JWT
   in headers from Authorization field as Bearer token */
options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();

/* This is the secret signing key.
   You should NEVER store it in code  */
options.secretOrKey = jwtSecretKey.secret;

passport.use(new JwtStrategy(options, function (jwt_payload, done) {
    console.log("Processing JWT payload for token content:");
    console.log(jwt_payload);


    /* Here you could do some processing based on the JWT payload.
    For example check if the key is still valid based on expires property.
    */
    const now = Date.now() / 1000;
    if (jwt_payload.exp > now) {
        done(null, jwt_payload.user);
    } else { // expired
        done(null, false);
    }
}));

/*
POST /login
User logs in with username and password
 */

app.get( '/login', passport.authenticate('basic', {
        session: false
    }),
    (req, res) => {
        const body = {
            id: req.user.id,
            username: req.user.username
        };
        const payload = {
            user: body
        };
        const options = {
            expiresIn: '1d'
        }
        const token = jwt.sign(payload, jwtSecretKey.secret, options);

        return res.json({
            token
        });
    })
//Show all the items
app.get('/items', (req, res) => {
    res.json({
        items
      });
})

//Show a specific item
app.get('/items/:id', (req, res) =>{
    let item=items.find(el => el.id==req.params.id);
    if(!item){
        return res.status(404).json({
            "message": "Item is not found and can't be shown"
        });
    }
    res.send("Title: "+item["title"]+"<br/>Category: "+item["category"]+"<br/>Location: "+item["location"]+
    "<br/>Description: "+item["description"]+"<br/>Delivery type: "+item["delivery_type"]
    +"<br/>Information about the seller: "+item["sellers_information"]+"<br/>Price: "+item["price"]+
    "<br/>Images: "+item["images"])
    res.sendStatus(200).json({
        status: "Item is shown"
    });
})

//Edit a specific item
app.put('/items/:id', passport.authenticate('jwt', {
    session: false
}), (req, res) =>{
    let item_to_edit=items.find(x => x.id == req.params.id);
    if (item_to_edit!==undefined) {
        return res.status(404).json({
            "message": "Item is not found and can't be edited."
        });
    }else if(!req.body.title || !req.body.price || !req.body.category || !req.body.delivery_type 
        || !req.body.delivery_type || !req.body.sellers_information){
            return res.status(400).json({
                "message": "Required parameters are missing"
        });
    }else if(req.body.delivery_type!="pickup" || req.body.delivery_type!="delivery"){
        return res.status(406).json({
            "message": "Delivery type not accepted, choose between 'pickup' or 'delivery'."
        });
    }else if(req.body.userId!=item_to_edit.userId){
        return res.status(401).json({
            "message": "User is not authorized to edit this item."
        });
    }
    else{
        for(const key in req.body){
            item_to_edit[key]=req.body[key];
        }
        res.sendStatus(200).json({
            status: "Item successfully edited"
        });
    }
})

//Delete a specific item
app.delete('/items/:id', passport.authenticate('jwt', {
    session: false
}), (req, res) =>{
    let item_to_delete=items.findIndex(x => x.id == req.params.id);
    if (item_to_delete==-1) {
        return res.status(404).json({
            "message": "Item with the given id doesn't exist"
        });
    }else if(req.body.userId!=item_to_delete.userId){
        return res.status(401).json({
            "message": "You are not authorised to delete this item"
        });
    }else{
        items.splice(item_to_delete,1);
        res.sendStatus(200).json({      
            status: "Item deleted"
        });
    }
})


/*
search items by category:
search by date: date needs to be in a format year-mounth-day
search by date: city in Finland
*/
app.get('/items/search/:option/:value', (req, res) =>{
    var foundObjects=[];
    if (req.params.option === "location") {
        var newArray = items.filter(function (el) {
            return el.location===req.params.value;
        });
        for (x in newArray) {
            foundObjects.push(newArray[x].title);
        }
        res.send(foundObjects.toString());
        res.sendStatus(200).json({
            status: "Search successfull"
        });
    }else if(req.params.option==="date_created"){
        var date_passed=req.params.value.toString();
        if(date_passed.length!=10){
            return res.status(400).json({
                "message": "Incorrect Query Paramethers."
            }); 
        }else{
            var newArray = items.filter(function (el) {
                return el.posting_date===req.params.value;
            });
            for (x in newArray) {
                foundObjects.push(newArray[x].title);
            }
            res.send(foundObjects.toString());
            res.sendStatus(200).json({
                status: "Search successfull"
            });
        }
    }else if(req.params.option==="category"){       
        var newArray = items.filter(function (el) {
            return el.category===req.params.value;
        });
        for (x in newArray) {
            foundObjects.push(newArray[x].title);
        }
        res.send(foundObjects.toString());
        res.sendStatus(200).json({
            status: "Search successfull"
        });
    }else{
        return res.status(404).json({
            "message": "Incorrect Query Paramethers"
        });
    }
})

//Creating a new user
app.post('/users/create', (req, res) =>{
    if (!req.body.password) {
        return res.status(400).json({
            "message": "Password is missing."
        })
    } else if (!req.body.username) {
        return res.status(400).json({
            "message": "Username is missing."
        })
    }else{
        const user = 
            {
                id: uuidv4(),
                username: req.body.username,
                password: bcrypt.hashSync(req.body.password, 6)
            }
            users.push(user);
            res.sendStatus(201).json({
                status: "User created"
            });
    }
});

//Creating a new (selling)item 
app.post('/items/create', passport.authenticate('jwt', {
    session: false
}), (req, res) => {

    // Bad-request response if one or more reqired information is missing
    if (!req.body.title) {
        return res.status(400).json({
            "message": "Tittle is missing."
        });
    } else if (!req.body.price) {
        return res.status(400).json({
            "message": "Price information is missing"
        });
    } else if (!req.body.category) {
        return res.status(400).json({
            "message": "Please choose a category."
        });
    }  else if (!req.body.location) {
        return res.status(400).json({
            "message": "Location information is missing"
        });
    } else if (!req.body.delivery_type) {
        return res.status(400).json({
            "message": "Please choose a delivery type."
        });
    } else if (!req.body.sellers_information) {
        return res.status(400).json({
            "message": "Seller's information is missing"
        });
    }else if(req.body.delivery_type!="pickup" && req.body.delivery_type!="delivery"){
        return res.status(406).json({
            "message": "Delivery type not accepted, choose between 'pickup' or 'delivery'"
        });   
    }else{
        const item={
                id: uuidv4(),
                userId: req.body.userId,
                title: req.body.title,
                category: req.body.category,
                location: req.body.location,
                description: req.body.description,
                delivery_type: req.body.delivery_type,           
                sellers_information: req.body.sellers_information,
                price: req.body.price,
                images: req.body.images,            //TODO add max 4 images
                posting_date: new Date().toISOString().slice(0, 10)
            }
            items.push(item);
            res.sendStatus(201).json({
                status: "Item Created"
            });
        }
    });



