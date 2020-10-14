const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
var address='http://localhost:3000';
const server = require('../server');
var assert = require('assert').strict;

//create a user(successful)
describe('Create a new user', function() {
  it('Should create a new user', async function(){
      await chai.request(address)
          .post('/users/create')
          .send(
            {
              username: "nanana",
              password: "hello1",
            }
          )
          .then(response => {
            expect(response.status).to.equal(201);
            return chai.request(address).get('/users/create');
          })
          .then(readResponse => {
            expect(readResponse.body.users[readResponse.body.users.length - 1].username).to.equal("nanana");
            expect(readResponse.body.users[readResponse.body.users.length - 1].password).to.equal(bcrypt.hashSync("hello1", 6));  
          })
          .catch(error => {
              assert.fail(error)
          })
  })
});

//Create a new user(missing parameters)
describe('Create a new user, missing parameters', function() {
  before(function() {
    server.start();
  });

  after(function() {
    server.stop();
  })
  it('User can not be created', async function(){
      await chai.request(address)
          .post('/users/create')
          .send(
            {
              username: "nanana"
            }
          )
          .then(response => {
            expect(response.status).to.equal(400);
            return chai.request(address).get('/users/create');
          })
          .catch(error => {
              assert.fail(error)
          })
  })
});

//Show the items

describe('item operations', function() {

  before(function() {
    server.start();
  });

  after(function() {
    server.stop();
  })

  describe('show all items', function() {

    it('Should respond with an array of all the items', async function() {
      await chai.request(address)
        .get('/items')
        .then(response => {
          expect(response.status).to.equal(200);
          expect(response.body).to.be.a('object');
          expect(response.body).to.have.a.property('items');
          expect(response.body.items).to.be.a('array');
          expect(response.body.items[0]).to.be.a('object');
          expect(response.body.items[0]).to.have.a.property('id');
          expect(response.body.items[0]).to.have.a.property('userId');
          expect(response.body.items[0]).to.have.a.property('title');
          expect(response.body.items[0]).to.have.a.property('category');
          expect(response.body.items[0]).to.have.a.property('location');
          expect(response.body.items[0]).to.have.a.property('description');
          expect(response.body.items[0]).to.have.a.property('delivery_type');
          expect(response.body.items[0]).to.have.a.property('sellers_information');
          expect(response.body.items[0]).to.have.a.property('price');
          expect(response.body.items[0]).to.have.a.property('images');
          expect(response.body.items[0]).to.have.a.property('posting_date');
        })
        .catch(error => {
          expect.fail(error)
        })
    })
  });
  //Show item with specific id
  describe('Show item with given id', function() {

    it('Should find the item', async function() {
      await chai.request(address)
        .get('/items/1')
        .then(response => {
            assert.strictEqual(response.status, 200)
        })
        .catch(error => {
          expect.fail(error)
        })
    })
  });
  //Item with specific id doesn't exist
  describe('item with given id not found', function() {

    it('Should not find the item and respond with status 404', async function() {
      await chai.request(address)
        .get('/items/5')
        .then(response => {
            assert.strictEqual(response.status, 404)
        })
        .catch(error => {
          expect.fail(error)
        })
    })
  });
  //Add a new item
  describe('Add new item', function() {
    it('Should create a new item', async function() {
      await chai.request(address)
        .post('/items/create')
        .set('Authorization', 'Bearer ' + userJwt)
        .send(
          {
            "userId": 1,
            "title": "Cizmi",
            "category": "Clothes",
            "location": "Turku",
            "description": "Leather boots, number 38",
            "delivery_type": "delivery",           
            "sellers_information": "Nina, email: nina@gmail.com",
            "price": "40e, price is nit fixed",
            "images": []         
        })
        .then(response => {
          expect(response).to.have.property('status');
          expect(response.status).to.equal(201);
        })
        .catch(error => {
          assert.fail(error);
        });
    });
  });
  //Delete an item
  describe('Delete an item', function(){
    it('should delete an item', async function(){
        await chai.request('http://localhost:3000')
            .delete('/items/1')
            .then(response => {
                assert.strictEqual(response.status, 200)
            })
            .catch(error => {
                assert.fail(error)
            })

    })
});
//search items based on location/find
describe('search item based on location', function() {
  it('Should find array of items', async function() {
    await chai.request(address)
      .get('/items/search/location/Oulu')
      .then(response => {
          assert.strictEqual(response.status, 200)
      })
      .catch(error => {
        expect.fail(error)
      })
  })
});
//search items based on location/not found
describe('search item based on location', function() {
  it('Should find array of items', async function() {
    await chai.request(address)
      .get('/items/search/city/Oulu')
      .then(response => {
          assert.strictEqual(response.status, 404)
      })
      .catch(error => {
        expect.fail(error)
      })
  })
});
//search based on date
describe('search item based on date created', function() {
  it('Should find array of items', async function() {
    await chai.request(address)
      .get('/items/search/date_created/2020-14-10')
      .then(response => {
          assert.strictEqual(response.status, 200)
      })
      .catch(error => {
        expect.fail(error)
      })
  })
});
//search based on category
describe('search item based on category', function() {
  it('Should find array of items', async function() {
    await chai.request(address)
      .get('/items/search/category/cars')
      .then(response => {
          assert.strictEqual(response.status, 200)
      })
      .catch(error => {
        expect.fail(error)
      })
  })
});
});