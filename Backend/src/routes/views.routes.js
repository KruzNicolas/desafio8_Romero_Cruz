
import { Router, query } from "express"
import { authToken } from "../utils.js"

const router = Router()

router.get('/login', async (req, res) => {
    if (req.session.user){
        res.redirect('/products')
    } else {
        res.render('login', {})
    }
})

router.get('/products', async (req, res) => {
    if(req.session.user){
        res.render('products', { user: req.session.user})
    } else {
        res.redirect('login')
    }
})

router.get('/loginjwt', async (req, res) => {
    res.render('loginjwt', {})
})

router.get('/productsjwt', authToken, async (req, res) => {
    res.render('productsjwt', { user: req.user.user})
})

router.get('/register', async (req, res) => {
    res.render('register', {})
})

router.get('/restorepassword', async (req, res) => {
    res.render('restorePassword', {})
})

router.get('/profile', async (req, res) => {
    if (req.session.user){
        res.render('profile', { user: req.session.user})
    } else {
        res.redirect('/login')
    }
    
})

export default router