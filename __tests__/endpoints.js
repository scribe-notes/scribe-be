const request = require("supertest")

const server = require('.././index.js')

describe('POST register', () => {
    it('should post a new blog and return a status code of 404', () => {
      return request(server)
        .post('/users/')
        .send({ username:"testing_username",email:"bsoghigigigigi@gmail.com",password:"F363636ddjjddrfsa13!"})
        .then(response => {
          expect(response).toHaveProperty('status', 201);
        });
    })},
describe('POST Login', () => {
        it('should post a new blog and return a status code of 500', () => {
          return request(server)
            .post('/login')
            .send({username:"testing_username",email:"bsoghigigigigi@gmail.com",password:"F36"})
            .then(response => {
              expect(response).toHaveProperty('status', 500);
            });
        });
        it('LOGIN', () => {
          return request(server)
            .post('/login')
            .send({ username:"testing_username",email:"bsoghigigigigi@gmail.com",password:"F363636ddjjddrfsa13!"})
            .then(res => {
                expect(res.type).toMatch(/json/);
              });
        });
      }))