
import passport from 'passport'
import LocalStrategy from 'passport-local'
import GithubStrategy from 'passport-github2'
import GoogleStrategy from 'passport-google-oauth20'
import userModel from '../models/users.models.js'
import { createHash, isValidPassword } from '../utils.js'
import config from '../config.js'

const initPassport = () => {
    const verifyRegistration = async (req, username, password, done) => {
        try {

            const user = req.body

            const userInDb = await userModel.findOne({ $or: [{ username: user.username }, { email: user.email }]})
            
            if (userInDb){
                if (userInDb.email === user.email) return done(`ERROR`, false)
                return done(null, false)
            }

            user.password = createHash(user.password)

            const process = await userModel.create(user)

            return done(null, process)
        } catch (err) {
            return done(`Error passport local: ${err.message}`)
        }
    }

    const verifyRestoration = async (req, username, password, done) => {
        try {

            const restoreData = req.body

            if (restoreData.username.length === 0 || restoreData.newPassword.length === 0) {
                return done('Username and new password are required', false)
            }

            const user = await userModel.findOne({ username: restoreData.username})

            if (!user) return done(null, false)

            const process = await userModel.findOneAndUpdate({ username: restoreData.username }, { password: createHash(restoreData.newPassword) })

            return done(null, process)
  
        } catch (err) {
            return done(`Error passport local: ${err.message}`)
        }
    }

    const verifyGithub = async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await userModel.findOne({ $or: [{ email: profile._json.email}, { username: profile.username}]})

            if (!user) {
                const name_parts = profile._json.name.split(' ')
                const newUser = {
                    firstName: name_parts[0],
                    lastName: name_parts[1],
                    email: profile._json.email || ' ',
                    username: profile.username,
                    password: ' '
                }
    
                const process = await userModel.create(newUser)
    
                return done(null, process)
            } else {
                done(null, user)
            }
        } catch (err) {
            return done(`Error passport Github: ${err.message}`)
        }
    }

    const verifyGoogle = async (accessToken, refreshToken, profile,  done) => {
        try {
            const user = await userModel.findOne({ $or: [{ email: profile._json.email}, { username: profile.id}]})

             if (!user) {
                const newUser = {
                    firstName: profile._json.given_name || ' ',
                    lastName: profile._json.family_name || ' ',
                    email: profile._json.email || ' ',
                    username: profile.id,
                    password: ' '
                }
    
                const process = await userModel.create(newUser)
    
                return done(null, process)
            } else {
                done(null, user)
            }
        } catch (err) {
            return done(`Error passport Google: ${err.message}`)
        }
    }

    passport.use('github', new GithubStrategy({
        clientID: config.GITHUB_CLIENT_ID,
        clientSecret: config.GITHUB_CLIENT_SECRET,
        callbackURL: config.GITHUB_CALLBACK_URL
    }, verifyGithub))

    passport.use('google', new GoogleStrategy({
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.GOOGLE_CALLBACK_URL
    }, verifyGoogle))
    
    passport.use('register', new LocalStrategy({
        passReqToCallback: true,
        usernameField: 'username',
        passwordField: 'password'
    }, verifyRegistration))

   passport.use('restorepassword', new LocalStrategy({
        passReqToCallback: true,
        usernameField: 'username',
        passwordField: 'newPassword'
    },  verifyRestoration))

    passport.serializeUser((user, done) => {
        done(null, user._id)
    })
        
    passport.deserializeUser(async (id, done) => {
        try {
            done(null, await userModel.findById(id))
        } catch (err) {
            done(err.message)
        }
    })
}

export default initPassport