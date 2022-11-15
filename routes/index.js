const express = require('express');
const axios = require('axios');

const router = express.Router();

const URL = 'http://localhost:8002/v2';
axios.defaults.headers.origin = 'http://localhost:4000'; // origin에 헤더 추가

// 밑에거 함수로 만들어놓음
const request = async (req, api, data) => {
    try {
        if (!req.session.jwt) { // 세션에 토큰이 없으면
            const tokenResult = await axios.post(`${URL}/token`, {
            clientSecret: process.env.CLIENT_SECRET});
            req.session.jwt = tokenResult.data.token;  // 세션에 토큰 저장
        }
        return await axios.get(`${URL}${api}`, {data: data} , {
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


// router.get('/test', async (req, res, next) => { // 토큰 테스트 라우터
//     try {
//         if (!req.session.jwt) { // 세션에 토큰이 없으면 토큰 발급 시도
//             const tokenResult = await axios.post(`${URL}/token`, {
//                 clientSecret: process.env.CLIENT_SECRET,
//             });
//             if (tokenResult.data && tokenResult.data.code === 200) { // 토큰 발급 성공 (토큰.data & 토큰.data.code=200)
//                 req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장.
//             } else { // 토큰 발급 실패
//                 return res.json(tokenResult.data); // 발급 실패 사유 응답
//             }
//         }
//         // 발급받은 토큰 테스트
//         const result = await axios.get(`${URL}${api}`, {
//             headers: { authorization: req.session.jwt },  // 클라이언트! 세션키를 받은거를 headers에 API 요청
//         });
//         return res.json(result.data);
//     } catch (error) {
//         console.error(error);
//         if (error.response.status === 419) { // 토큰 만료 시 토큰 재발급 받기
//             return res.json(error.response.data);
//         }
//         return next(error);
//     }
// });


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
        res.render("guestbook", {guestbooks : result.data.payload}) // guestbook html에 보여주기!
    } catch (error) {
        console.error(error);
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