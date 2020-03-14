const mongoose = require('mongoose');
const request = require('supertest');
const { User } = require('../../../models/User');

let server;

describe('/api/users', () => {
    beforeEach(() => {
        server = require('../../../index');
    });
    afterEach(async () => {
        server.close();
        await User.deleteMany({});
    });
    describe('GET /', () => {
        let token, admin;
        const generateToken = () => {
            return new User(
                {
                    name: 'Dilshad Rana',
                    email: 'somemail@yahoo.com',
                    password: 'Somepassword2020?',
                    isAdmin: admin//true for admin rights, false for non-admin user.
                }
            ).generateAuthToken();
        };
        it('should return all the users', async () => {
            User.insertMany(
                [
                    { name: 'Rana dilshad', email: 'dilshad.rana@protonmail.com', password: 'ranaMota123?' },
                    { name: 'Rana Mota', email: 'mota.rana@protonmail.com', password: 'dilshadMota123?' }
                ]
            );
            adming = false;
            token = generateToken();
            const res = await request(server).get('/api/users/').set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body.some(g => g.name === 'Rana Dilshad'));
            expect(res.body.some(g => g.name === 'Rana Mota'));
        });
        it('should return 404, if the User collection has no document, and the input is valid', async () => {
            admin = true;
            token = generateToken();
            const res = await request(server).get('/api/users/').set('x-auth-token', token).send();
            expect(res.status).toBe(404);
        });
        it('should return 401 if client is not logged in', async () => {
            token = '';
            const res = await request(server).get('/api/users/').set('x-auth-token', token).send();
            expect(res.status).toBe(401);
        });
    });
    describe('GET /:token', () => {
        let admin, token;
        const generateToken = () => {
            return new User(
                {
                    name: 'Dilshad Rana',
                    email: 'somemail@yahoo.com',
                    password: 'Somepassword2020?',
                    isAdmin: admin//true for admin rights, false for non-admin user.
                }
            ).generateAuthToken();
        };
        it('should return th current user if a valid token is passed.', async () => {
            const user = new User({ name: 'Rana dilshad', email: 'dilshad.rana@protonmail.com', password: 'ranaMota123?', isAdmin: false });
            token = user.generateAuthToken();
            await user.save();
            //console.log(await User.findById(user._id.toHexString())); 
            const res = await request(server).get('/api/users/' + 'me').set('x-auth-token', token).send();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', user.name);
            expect(res.body).toHaveProperty('_id', user._id.toString());
        });
        it('should return 401, if invalid token is passed', async () => {
            const user = new User({ name: 'Rana dilshad', email: 'dilshad.rana@protonmail.com', password: 'ranaMota123?', isAdmin: false });
            await user.save();
            token = '';//Not sending token at all.
            const res = await request(server).get('/api/users/' + 'me').set('x-auth-token', token).send();
            expect(res.status).toBe(401);
        });
    });
    describe('POST /', () => {
        let admin, user;
        const createUser = () => {
            return new User(
                {
                    name: 'Dilshad Rana',
                    email: 'somemail@yahoo.com',
                    password: 'Somepassword2020?',
                    isAdmin: admin//true for admin rights, false for non-admin user.
                }
            );
        };
        it('should return 401, if client is not logged in', async () => {
            const res = await request(server).post('/api/users');
            expect(res.status).toBe(401);
        });
        it('should return 403, if client is logged in but is not admin', async () => {
            admin = false;
            const user = createUser();
            token = user.generateAuthToken();
            const res = await request(server)
                .post('/api/users')
                .set('x-auth-token', token)
                .send(
                    {
                        name: 'Mota Rana',
                        email: 'mota.email@yahoo.com',
                        password: 'Somepassword2020?',
                        isAdmin: true
                    }
                );
            //console.log(` ================================> ${res.text} `);
            expect(res.status).toBe(403);
        });
        it('should save user, if the input is valid and no account exists with this email.', async () => {
            admin = true;
            user = createUser();
            token = user.generateAuthToken();
            const res = await request(server)
                .post('/api/users/')
                .set('x-auth-token', token)
                .send(
                    {
                        name: 'Mota Rana',
                        email: 'mota.mail@yahoo.com',
                        password: 'Somepassword2021?',
                        isAdmin: true
                    }
                );
            //console.log(` ================================> ${res.text} `);
            expect(res.body).toHaveProperty('name', 'Mota Rana');
            expect(res.status).toBe(200);
        });
        it('should return 400, if the name is less than 2 characters.', async () => {
            admin = true;
            user = createUser();
            token = user.generateAuthToken();
            const res = await request(server)
                .post('/api/users/')
                .set('x-auth-token', token)
                .send(
                    {
                        name: 'M',
                        email: 'mota.mail@yahoo.com',
                        password: 'Somepassword2021?',
                        isAdmin: true
                    }
                );
            //console.log(` ================================> ${res.text} `);
            //console.log(` ================================> ${res.status} `);
            expect(res.status).toBe(400);
        });
        it('should return 400, if the email is less than 5 characters.', async () => {
            admin = true;
            user = createUser();
            token = user.generateAuthToken();
            const res = await request(server)
                .post('/api/users/')
                .set('x-auth-token', token)
                .send(
                    {
                        name: 'Mota Rana',
                        email: 'mo@y',
                        password: 'Somepassword2021?',
                        isAdmin: true
                    }
                );
            //console.log(` ================================> ${res.text} `);
            //console.log(` ================================> ${res.status} `);
            expect(res.status).toBe(400);
        });
        it('should return 400, if the password is less than 8 characters.', async () => {
            admin = true;
            user = createUser();
            token = user.generateAuthToken();
            const res = await request(server)
                .post('/api/users/')
                .set('x-auth-token', token)
                .send(
                    {
                        name: 'Mota Rana',
                        email: 'mo@y',
                        password: 'Sd21?',
                        isAdmin: true
                    }
                );
            //console.log(` ================================> ${res.text} `);
            //console.log(` ================================> ${res.status} `);
            expect(res.status).toBe(400);
        });
        it('should return 400, if the password is not given.', async () => {
            admin = true;
            user = createUser();
            token = user.generateAuthToken();
            const res = await request(server)
                .post('/api/users/')
                .set('x-auth-token', token)
                .send(
                    {
                        name: 'Mota Rana',
                        email: 'some.email.mota@yahoo.com',
                        password: '',
                        isAdmin: true
                    }
                );
            //console.log(` ================================> ${res.text} `);
            //console.log(` ================================> ${res.status} `);
            expect(res.status).toBe(400);
        });
        it('should return 400, if the email is more than 255 characters.', async () => {
            admin = true;
            user = createUser();
            token = user.generateAuthToken();
            const res = await request(server)
                .post('/api/users/')
                .set('x-auth-token', token)
                .send(
                    {
                        name: 'Mota Rana',
                        email: 'moddddddddddddddddddddddddddkjlfsdjflksadjflkasdjflasjfsajdflsjflkfkjdlfjlkdsjflasjdfjsadlfjalsdfjlksdjflkasdjfklasjflksjdfkjasddlkfjasdlkfjlksdjfklsadjfjasdlkfjsdfjlsjfsjflsdjflsdjfsjasdldfjlas@yahoo.com',
                        password: 'Somepassword2021?',
                        isAdmin: true
                    }
                );
            //console.log(` ================================> ${res.text} `);
            expect(res.status).toBe(400);
        });
        it('should return 400, if the name is more than 50 characters.', async () => {
            admin = true;
            user = createUser();
            token = user.generateAuthToken();
            const res = await request(server)
                .post('/api/users/')
                .set('x-auth-token', token)
                .send(
                    {
                        name: new Array(27).join('Ma'),//console.log(new Array(27).join('Ma').length);
                        email: 'mota.mail@yahoo.com',
                        password: 'Somepassword2021?',
                        isAdmin: true
                    }
                );
            //console.log(` ================================> ${res.text} `);
            //console.log(` ================================> ${res.status} `);
            expect(res.status).toBe(400);
        });
        it('should return the newly created user, if the input is valid.', async () => {
            admin = true;
            user = createUser();
            token = user.generateAuthToken();
            const res = await request(server)
                .post('/api/users/')
                .set('x-auth-token', token)
                .send(
                    {
                        name: 'Mota Rana',
                        email: 'mota.email@yahoo.com',
                        password: 'Somepassword2021?',
                        isAdmin: true
                    }
                );
            //console.log(` ================================> ${res.text} `);
            expect(res.text).toMatch(/Mota Rana/);
            expect(res.text).toMatch(/mota.email@yahoo.com/);
            expect(res.text).toMatch(/true/);
        });
        it('should return 400, if the input is valid but an account already exists with this email.', async () => {
            await User.collection.insertOne(
                {
                    name: 'Mota Rana',
                    email: 'somemail@yahoo.com', //Allready existing mail.
                    password: 'Somepassword2021?',
                    isAdmin: true
                }
            );
            admin = true;
            user = createUser();
            token = user.generateAuthToken();
            const res = await request(server)
                .post('/api/users/')
                .set('x-auth-token', token)
                .send(
                    {
                        name: 'Mota Rana',
                        email: 'somemail@yahoo.com', //Allready existing email.
                        password: 'Somepassword2021?',
                        isAdmin: true
                    }
                );
            //console.log(` ===================================================> ${res.text} `)
            expect(res.status).toBe(400);
        });
    });
    describe('DELETE /:id', () => {
        let admin, token, userToDelete, userDoc;
        const generateToken = () => {
            return new User(
                {
                    name: 'Dilshad Rana',
                    email: 'somemail@yahoo.com',
                    password: 'Somepassword2020?',
                    isAdmin: admin//true for admin rights, false for non-admin user.
                }
            ).generateAuthToken();
        };
        beforeEach(async () => {
            userDoc = await User.collection.insertOne({
                name: 'Mota Rana',
                email: 'mota.mail@yahoo.com',
                password: 'Somepassword2020?',
                isAdmin: false
            });
            userToDelete = userDoc.ops[0];
        });
        const exec = () => {
            admin = true;
            token = generateToken();
            return request(server)
                .delete('/api/users/' + userToDelete._id)
                .set('x-auth-token', token)
                .send()
        };
        it('should return 401, if user is not logged in', async () => {
            const res = await request(server).delete('/api/users/' + userToDelete._id);
            expect(res.status).toBe(401);
        });
        it('should return 403, if user is logged in but is not admin', async () => {
            admin = false;
            token = generateToken();
            const res = await request(server)
                .delete('/api/users/' + userToDelete._id)
                .set('x-auth-token', token)
                .send()
            expect(res.status).toBe(403);
        });
        it('should delete the user with valid input', async () => {
            const res = await exec();
            const deletedUser = await User.findById(userToDelete._id);
            expect(deletedUser).toBeNull();
        });
        it('should return the deleted user without password with valid input', async () => {
            const deletedUser = await exec();
            //console.log('*******************************************');
            //console.log(deletedUser.text);
            //console.log(deletedUser.text.includes(userToDelete.password));
            //console.log('*******************************************');
            expect(deletedUser.text).toMatch(/Mota Rana/);
            expect(deletedUser.text).toMatch(/mota.mail@yahoo.com/);
            expect(deletedUser.text.includes(userToDelete.password)).toBe(false);
        });
    });
    describe('PUT /:id', () => {
        let admin, token, userToEdit, newName, id;

        const createUser = () => {
            return new User(
                {
                    name: 'Dilshad Rana',
                    email: 'dilshad.mail@yahoo.com',
                    password: 'Somepassword2020?',
                    isAdmin: admin
                }
            );
        };

        beforeEach(async () => {
            admin = true;
            userToEdit = createUser();
            await userToEdit.save();
            //id = userToEdit._id.toHexString();
            id = userToEdit._id;
            token = userToEdit.generateAuthToken();
            newName = 'Mota Saheb';
        });
        const exec = async () => {
            return await request(server)
                .put('/api/users/' + id)
                .set('x-auth-token', token)
                .send(
                    {
                        name: newName,
                        email: 'mota.mail@yahoo.com',
                        password: 'Somepassword2021?',
                        isAdmin: true
                    }
                );
        };
        it('should return 401, if user is not logged in', async () => {
            const res = await request(server).put('/api/users/' + id);
            expect(res.status).toBe(401);
        });
        it('should return 403, if user is logged in but is not admin', async () => {
            let someUser = new User({ name: 'Dilshad Rana', email: 'some.mail@yahoo.com', password: 'Somepassword2020?', isAdmin: false });
            await someUser.save();
            console.log(await User.findById(someUser._id));
            const someToken = someUser.generateAuthToken();
            const res = await request(server)
                .put('/api/users/' + someUser._id)
                .set('x-auth-token', someToken)
                .send(
                    {
                        name: newName,
                        email: 'some.mail@yahoo.com',
                        password: 'Somepassword2021?',
                        isAdmin: true
                    }
                );
            expect(res.status).toBe(403);
        });
        it('should edit the user with valid input', async () => {
            const res = await exec();
            const editedUser = await User.findById(id);
            expect(editedUser.name).toBe(newName);
        });
        it('should return the edited user without password with valid input', async () => {
            const res = await exec();
            //console.log(res.text);
            expect(res.text).toMatch(/Mota Saheb/);
        });
    });
}); 