const express = require('express');
const axios = require('axios');

const router = express.Router();

const URL = 'http://localhost:8002/v2';
axios.defaults.headers.origin = 'http://localhost:4000'; // origin에 헤더 추가

// 밑에거 함수로 만들어놓음
const request = async (req, api) => {  // 파라미터 data 삭제
    try {
        if (!req.session.jwt) { // 세션에 토큰이 없으면
            const tokenResult = await axios.post(`${URL}/token`, {
            clientSecret: process.env.CLIENT_SECRET});
            req.session.jwt = tokenResult.data.token;  // 세션에 토큰 저장
        }
        return await axios.get(`${URL}${api}`, {  // {data: data} 삭제
            headers: { authorization: req.session.jwt }  // 토큰 발급받아 세션에 저장
        });  // API 요청
    } catch (error) {
        if (error.response.status === 419) {  // 토큰 만료 시 토큰 재발급 받기
            delete req.session.jwt;
            return request(req, api);
        }  // 419 외의 다른 에러면
        return error.response;
    }
};


const request_post = async (req, api, data) => {
    try {
        if (!req.session.jwt) { // 세션에 토큰이 없으면
            const tokenResult = await axios.post(`${URL}/token`, {
                clientSecret: process.env.CLIENT_SECRET});
            req.session.jwt = tokenResult.data.token;  // 세션에 토큰 저장
        }
        return await axios.post(`${URL}${api}`, {data: data},{
            headers: { authorization: req.session.jwt }  // 토큰 발급받아 세션에 저장
        });  // API 요청
    } catch (error) {
        if (error.response.status === 419) {  // 토큰 만료 시 토큰 재발급 받기
            delete req.session.jwt;
            return request(req, api);
        }  // 419 외의 다른 에러면
        return error.response;
    }
};




router.get('/mypost', async (req, res, next) => {
    try {
        const result = await request(req, '/posts/my');
        res.json(result.data);
    } catch (error) {
        console.error(error);
        next(error);
    }
})

router.get('/myguestbook', async (req, res, next) => {
    try {
        const result = await request(req, '/guestbook/my');
        // res.json(result.data);       // result에 담긴 결과값 보여줘야함
        console.log(result.data);
        res.render("guestbook", {"guestbooks" : result.data.payload}) // guestbook html에 보여주기!
    } catch (error) {
        console.error(error);
        next(error);
    }
})

router.get('/guestbooks/delete/:id', async (req, res, next) => {
    console.log('삭제', req.params.id);
    try {
        const result = await request(req, '/guestbooks/delete/' + req.params.id);
        // res.json(result.data);
        console.log(result.data);
        if (result.data.code === 200) {
            res.redirect('/myguestbook');
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
})


router.get('/guestbooks/update/:id', async (req, res, next) => {
    console.log('삭제', req.params.id);
    try {
        const result = await request(req, '/guestbooks/update/' + req.params.id);
        // res.json(result.data);
        if (result.data.code === 200) {
            console.log(result.data.payload);

            res.render("guestupdate", {"guestbooks" : result.data.payload});
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
})




router.get('/guestbookform',  (req, res,next) => {
    res.render('guestform');
})

router.post('/guestbookscreate', async (req, res, next) => {
    const {name, email, content} = req.body;
    let data = {
        name, email, content
    }
    try {
        const result = await request_post(req, '/guestbooks/create', data); // await 꼭 붙여주기 !! promise 떠서 자꾸 안됐음,,
        res.json(result.data);
        console.log('result -> ', result);
    }
    catch (error){
        console.error(error);
    }
})


router.post('/guestbooksupdate', async (req, res, next) => {
    const {id, name, email, content} = req.body;
    let data = {
        id:'id', name:'name', email:'email', content:'content'
    }
    try {
        const result = await request_post(req, '/guestbooks/update', data);
        res.json(result.data);
        console.log('result -> ', result);
    }
    catch (error){
        console.error(error);
    }
})





router.get('/search/:hashtag', async (req,res,next) => {
    try {
        const result = await request(
            req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
        );
        res.json(result.data);
    } catch (error) {
        if (error.code) {
            console.error(error);
            next(error);
        }
    }
});

router.get('/', (req, res) => {
    res.render('main', { key: process.env.CLIENT_SECRET });
});



module.exports = router;