var express = require('express')
var app = express()
var srvr = require('http').createServer(app)
const session = require('express-session')
const bodyparser = require('body-parser')
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json());
const { v4: uuidv4, v4 } = require('uuid')
app.set('view engine', 'ejs')
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: false
    }
}));
app.use(express.static(__dirname + '/public'))
const usr = require('./schemas/usr')
const mssg = require('./schemas/mesg')
var io = require('socket.io')(srvr)
const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://meme_lord:1234@cluster0.3sx7v.mongodb.net/chatapp2?retryWrites=true&w=majority',
    {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })

// import all the chemas
const friends = require('./schemas/friends')
const reqs = require('./schemas/friendrqs')
const lastms = require('./schemas/lastmsg')
const cnts = require('./schemas/counter')
const group = require('./schemas/groupChat')
const members = require('./schemas/members')
const userz = require('./schemas/usr')


app.post('/frdrq', (req, res) => {
    var { reciever } = req.body;
    var x = new reqs({ sender: req.session.user.ID * 1, reciever: reciever });
    x.save((er) => {
        if (er) throw er;
        else res.send({ data: { me: req.session.user.ID * 1, yu: reciever } })
    })
})

app.post('/updlastms', (req, res) => {
    var { sender, reciever, body } = req.body;
    lastms.findOneAndUpdate({ $and: [{ sender: sender }, { reciever: reciever }] }, { body: body }, (er, dt) => {
        if (er) throw er;
        else res.send(dt)
    })
})

app.post('/createfd', (req, res) => {
    var { fr1, fr2 } = req.body;
    var x = new friends({
        fr1: fr1 * 1,
        fr2: fr2 * 1
    });
    x.save((er) => {
        if (er) throw er;
        else res.send({ data: 1 })
    })
})
/**/



app.get('/myreqs', (req, res) => {
    var me = req.session.user.ID * 1
    reqs.aggregate([
        {
            $match: {
                $and: [{ reciever: me }]
            }
        },
        {
            $lookup: {
                from: "userzs",
                localField: "sender",
                foreignField: "ID",
                as: "uss"
            }
        },
        {
            $project: {
                uname: "$uss.uname",
                ID: "$uss.ID",
                propic: "$uss.propic"
            }
        }
    ], (er, dt) => {
        if (er) throw er;
        else {
            if (dt.length == 0) res.send({ data: 0 })
            else {
                for (let n = 0; n < dt.length; n++) {
                    dt[n]['uname'] = dt[n].uname[0]
                    dt[n]['ID'] = dt[n].ID[0]
                    dt[n]['propic'] = dt[n].propic[0]
                }
                res.send({ data: dt })
            }
        }
    })
})

app.get('/myfriends', (req, res) => {
    try {
        var me = req.session.user.ID * 1
        friends.aggregate([
            {
                $match: {
                    $or:
                        [{ fr1: me }, { fr2: me }]
                }
            },
            {
                $lookup: {
                    from: "userzs",
                    foreignField: "ID",
                    localField: "fr2",
                    as: "ff1"
                }
            },
            {
                $lookup: {
                    from: "userzs",
                    foreignField: "ID",
                    localField: "fr1",
                    as: "ff2"
                }
            },
            {
                $project: {
                    f1: "$ff1",
                    f2: "$ff2"
                }
            }
        ], (er, dat) => {
            var ans = []
            vis = {}
            for (let n = 0; n < dat.length; n++) {
                if (dat[n] != null) {

                    if (dat[n].f1 != null && dat[n].f1[0].ID != me && vis[dat[n].f1[0].ID] == null) {
                        vis[dat[n].f1[0].ID] = 1;
                        dat[n].f1[0].pwd = null;
                        dat[n].f1[0].userpageID = null;
                        dat[n].f1[0]._id = null
                        ans.push(dat[n].f1[0])
                    }
                    if (dat[n].f1 != null && dat[n].f2[0].ID != me && vis[dat[n].f2[0].ID] == null) {
                        vis[dat[n].f2[0].ID] = 1;
                        dat[n].f2[0].pwd = null;
                        dat[n].f2[0].userpageID = null;
                        dat[n].f2[0]._id = null
                        ans.push(dat[n].f2[0])
                    }
                }
            }
            res.send({ data: ans })
        })
    } catch (error) {
        res.redirect('/')
    }
})

var PORT = process.env.PORT || 3000;
srvr.listen(PORT)
app.get('/', (req, res) => {
    if (req.session.user != null) res.redirect('/home')
    else res.render('login.ejs')
})

app.get('/home', (req, res) => {
    if (req.session.user == null) res.redirect('/')
    else res.render('index.ejs', { me: req.session.user.ID, myname: req.session.user.uname, propic: req.session.user.propic })
})
app.get('/logout', (req, res) => {
    req.session.user = null;
    res.redirect('/')
})



app.post('/login', (req, res) => {
    var { un, pw } = req.body
    usr.find({ $and: [{ uname: un }, { pwd: pw }] }, (er, rws) => {
        if (!rws.length) res.send({ data: 0 })
        else {
            req.session.user = rws[0];
            res.send({ data: 1 })
        }
    })
})

app.get('/mysentrqsts', (req, res) => {
    if (req.session.user == null) res.redirect('/')
    var me = req.session.user.ID * 1;
    reqs.find({ sender: me }, (er, dt) => {
        if (er) throw er;
        else {
            res.send({ data: dt })
        }
    })
})

app.get('/mypending', (req, res) => {
    if (req.session.user == null) res.redirect('/')
    var me = req.session.user.ID * 1;
    reqs.aggregate([
        {
            $match: {
                $and: [{ sender: me }]
            }
        },
        {
            $lookup: {
                from: "userzs",
                foreignField: "ID",
                localField: "reciever",
                as: "pers"
            }
        },
        {
            $project: {
                ID: "$pers.ID",
                uname: "$pers.uname",
                propic: "$pers.propic"
            }
        }
    ], (er, dt) => {
        if (er) throw er;
        if (dt.length == 0) {
            res.send({ data: [] })
        }
        else {
            for (let n = 0; n < dt.length; n++) {
                dt[n].ID = dt[n].ID[0];
                dt[n].uname = dt[n].uname[0];
                dt[n].propic = dt[n].propic[0]
            }
            res.send({ data: dt })
        }
    })
})

app.get('/frdreqs', (req, res) => {
    var me = req.session.user.ID * 1;
    reqs.find({ reciever: me }, (er, dt) => {
        if (er) throw er;
        else {
            res.send({ data: dt })
        }
    })
})

app.get('/everyone', (req, res) => {
    if (req.session.user == null) res.redirect('/')
    var me = req.session.user.ID * 1;
    usr.find({ $nor: [{ ID: me }] }, (er, dt) => {
        if (er) throw er;
        for (let n = 0; n < dt.length; n++)dt[n].pwd = null;
        res.send({ data: dt })
    })
})

app.get('/mybds', (req, res) => {
    if (req.session.user == null) res.redirect('/')
    var me = req.session.user.ID * 1;
    friends.find({ $or: [{ fr1: me }, { fr2: me }] }, (er, dt) => {
        if (er) throw er;
        res.send({ data: dt })
    })
})




app.post('/conf', (req, res) => {
    if (req.session.user == null) res.redirect('/')
    var me = req.session.user.ID;
    var { sender } = req.body
    reqs.findOneAndRemove({ $and: [{ reciever: me }, { sender: sender }] }, (er, dt) => {
        if (er) throw er;
        else {
            res.send({ stt: 1 })
        }
    })
})

app.post('/unfr', (req, res) => {
    if (req.session.user == null) res.redirect('/')
    var { ID } = req.body;
    var me = req.session.user.ID * 1;
    var id = ID * 1;
    friends.findOneAndDelete({ $or: [{ $and: [{ fr1: me }, { fr2: id }] }, { $and: [{ fr2: me }, { fr1: id }] }] }, (er, dt) => {
        if (er) throw er;
        else {
            res.send({ data: me })
        }
    })
})

app.post('/reg', (req, res) => {
    var { unm, pwd } = req.body;
    cnts.findById('cc', (ee, x) => {
        var us = x.usr;
        var x = new usr({
            ID: us + 1,
            uname: unm,
            pwd: pwd,
            userpageID: null,
            messagepageID: null,
            propic: null
        })
        x.save((err) => {
            if (err) res.send({ data: 0 })
            else {
                req.session.user = x;

                cnts.findByIdAndUpdate('cc', { usr: us + 1 }, (er, f) => {
                    res.send({ data: us + 1 })
                })
            }
        })
    })

})

io.on('connection', (sockt) => {
    sockt.on('joined', (room, dt) => {
        sockt.join(room)
        sockt.to(room).emit('sex', 'voda')
    })
    sockt.on('requestCall', (room, data) => {
        sockt.to(room).emit('newcall', { url: data.data, from: data.from })
    })
    sockt.on('callUser', (data) => {
        userz.findOne({ ID: data.reciever * 1 }, (er, dt) => {
            sockt.broadcast.to(dt.userpageID).emit('newcall', { url: data.data, from: data.from })
        })
    })
    sockt.on('leave', room => {
        sockt.leave(room)
    })
    sockt.on('userpageID', (dat) => {

        usr.findOne({ ID: dat.me }, (er, dt) => {
            if (er) throw er;
            else {
                if (dt.userpageID == null)
                    sockt.broadcast.emit('newUser', { ID: dt.ID, uname: dt.uname })
                usr.findOneAndUpdate({ ID: dat.me }, { userpageID: sockt.id }, (erx, dt) => {
                    if (erx) throw erx;
                })
            }
        })
    })


    sockt.on('unfriended', (dat) => {
        var { sender, reciever } = dat;
        usr.findOne({ ID: reciever }, (er, dt) => {
            if (er) throw er;
            usr.findOne({ ID: sender }, (ee, user) => {
                if (dt.userpageID != null) sockt.broadcast.to(dt.userpageID).emit('friendremoved', { ID: user.ID, uname: user.uname, type: 1, propic: user.propic })
            })
        })
    })

    sockt.on('accepted', (dat) => {
        var { sender, reciever } = dat;
        usr.findOne({ ID: reciever }, (er, dt) => {
            if (er) throw er;
            usr.findOne({ ID: sender }, (ee, user) => {
                if (dt.userpageID != null) sockt.broadcast.to(dt.userpageID).emit('friendReqAccepted', { ID: user.ID, uname: user.uname, type: 1, propic: user.propic })
            })
        })
    })

    sockt.on('rejected', (data) => {
        var { sender, reciever } = data;
        usr.findOne({ ID: reciever }, (e, rejectedUser) => {
            rejectedUser.pwd = null;
            usr.findOne({ ID: sender }, (er, rejector) => {
                rejector.pwd = null;
                sockt.broadcast.to(rejectedUser.userpageID).emit('requestRejected', { ID: rejector.ID, uname: rejector.uname, propic: rejector.propic })
            })
        })
    })



    sockt.on('sentfriendreq', (dat) => {
        var { sender, reciever } = dat;
        usr.findOne({ ID: reciever }, (er, dt) => {
            if (er) throw er;
            usr.findOne({ ID: sender }, (ee, user) => {
                if (dt.userpageID != null) sockt.broadcast.to(dt.userpageID).emit('recievedReq', { ID: user.ID, uname: user.uname, propic: user.propic })
            })
        })
    })
    sockt.on('cancelledReqs', (data) => {
        var { sender, reciever } = data;
        usr.findOne({ ID: reciever * 1 }, (e, dt) => {
            usr.findOne({ ID: sender }, (er, clint) => {
                sockt.broadcast.to(dt.userpageID).emit('requestRemoved', { ID: clint.ID, uname: clint.uname, propic: clint.propic });
            })
        })
    })
    sockt.on('sendms', (dat) => {
        var { sender, reciever, body, typ } = dat;
        cnts.findById('cc', (q, sm) => {
            var nmb = sm.mesg;
            var x = new mssg({
                sender: sender * 1,
                reciever: reciever * 1,
                body: body,
                ID: nmb,
                typ: typ
            })
            x.save((er) => {
                if (er) throw er;
                else {
                    usr.findOne({ ID: sender * 1 }, (err, rws) => {
                        if (err) throw err;
                        dat['uname2'] = rws.uname;
                        lastms.findOneAndDelete({
                            $and: [{ typ: typ }, {
                                $or: [{ $and: [{ sender: sender }, { reciever: reciever }] },
                                { $and: [{ sender: reciever }, { reciever: sender }] }]
                            }]
                        }, (er, dt) => {
                            if (er) throw er;
                            if (1) {
                                var j = new lastms({
                                    sender: sender,
                                    reciever: reciever,
                                    body: body,
                                    msid: nmb,
                                    typ: typ
                                })
                                j.save((ee) => {
                                    if (ee) throw ee;
                                    else {
                                        cnts.findByIdAndUpdate('cc', { mesg: nmb + 1 }, (ex, d) => {
                                            if (ex) throw ex;

                                        })
                                    }
                                })
                            }
                        })
                        if (!typ) {
                            usr.findOne({ ID: reciever }, (aaa, ppp) => {
                                sockt.broadcast.to(ppp.userpageID).emit('messageaise', dat)
                            })
                        }
                        else {
                            group.findOne({ ID: reciever * 1 }, (ex, ans) => {
                                sockt.to(ans.originalName).emit('sex', dat)
                            })
                        }
                    })
                }
            })
        })


    })

    sockt.on('new_group_message', (room, data) => {
        sockt.to(room).emit('got_a_group_message', data)
    })

    sockt.on('user_added', (data) => {
        usr.findOne({ ID: data.reciever * 1 }, (er, d) => {
            sockt.broadcast.to(d.userpageID).emit('u_r_added', data)
        })
    })

})



app.get('/getMyLstm', async (req, res) => {
    if (req.session.user == null) res.redirect('/')
    else {
        var x = req.session.user.ID;
        var frs = await friends.find({ $or: [{ fr1: x }, { fr2: x }] })

        var mems = await lastms.find({ $or: [{ sender: x }, { reciever: x }] })
        var vis1 = {}
        for (let n = 0; n < frs.length; n++) {
            vis1[frs[n].fr1 + frs[n].fr2 - x] = 1
        }

        var grups = await members.aggregate([
            {
                $match: {
                    $and: [
                        { member: x }
                    ]
                }
            },
            {
                $lookup: {
                    foreignField: "reciever",
                    localField: "group",
                    from: "lastmsgs",
                    as: "msg"
                }
            },
            {
                $project: {
                    sender: "$msg.sender",
                    reciever: "$msg.reciever",
                    body: "$msg.body",
                    typ: "$msg.typ"
                }
            }
        ])


        var ans = []
        for (let n = 0; n < mems.length; n++) {
            if (vis1[mems[n].sender + mems[n].reciever - x] != null) {
                ans.push(mems[n])
            }

        }
        for (let n = 0; n < grups.length; n++) {
            var v = { ...grups[n] };
            try {
                var r = {
                    sender: v.sender[0],
                    reciever: v.reciever[0],
                    body: v.body[0],
                    typ: v.typ[0]
                }
                ans.push(r)
            } catch (error) {

            }


        }
        ans.sort((a, b) => {
            return a.msid - b.msid
        })
        res.send({ data: ans })
    }

})

app.get('/findUsr/:id', (req, res) => {
    usr.findOne({ ID: req.params.id * 1 }, (er, dr) => {
        if (dr == null) res.send({ data: { uname: null, ID: null } })
        else res.send({ data: { uname: dr.uname, ID: dr.ID, propic: dr.propic } })
    })
})

app.post('/delrq', (req, res) => {
    var { reciever } = req.body;
    var me = req.session.user.ID;
    reqs.findOneAndDelete({ $and: [{ sender: me }, { reciever: reciever * 1 }] }, (er, dt) => {
        if (er) throw er;
        else res.send({ me: -1 })
    })
})

app.get('/getGroupID', (req, res) => {
    cnts.findById('cc', (er, dt) => {
        if (er) throw er;
        else res.send({ data: dt.groups })
    })
})

app.post('/registerGroupx', async (req, res) => {
    var { groupname, owner, originalName, ID } = req.body;
    var x = new group({
        groupname: groupname,
        owner: owner,
        originalName: originalName,
        ID: ID
    })
    /**/
    await cnts.findByIdAndUpdate('cc', { groups: ID })
    x.save((er) => {
        if (er) throw er;
        else {

            res.send({ data: 1 })
        }
    })
})

app.post('/insertmember', (req, res) => {
    var { group, memberr } = req.body;
    var x = new members({
        group: group,
        member: memberr
    })
    x.save((er) => {
        if (er) throw er;
        else res.send({ data: 1 })
    })
})

app.get('/getGroupDet/:id', (req, res) => {
    group.findOne({ ID: req.params.id * 1 }, (er, dt) => {
        if (er) throw er;
        else {
            res.send({ data: dt })
        }
    })
})

app.post('/saveNewMessage', async (req, res) => {
    var { sender, reciever, typ, body } = req.body
    var x = await cnts.findById('cc')
    var id = x.mesg + 1
    var s = new mssg({
        ID: id,
        sender: sender,
        reciever: reciever,
        typ: 1,
        body: body
    })
    await cnts.findByIdAndUpdate('cc', { mesg: id })
    s.save((er) => {
        if (er) throw er;
        else {
            res.send({ data: id })
        }
    })
})

app.post('/updatelstmGroup', async (req, res) => {
    var { msid, sender, reciever, typ, body } = req.body;
    await lastms.findOneAndDelete({
        $and: [
            { typ: typ },
            { reciever: reciever }
        ]
    })
    var x = new lastms({
        sender: sender,
        reciever: reciever,
        body: body,
        msid: msid,
        typ: typ
    })
    x.save((er) => {
        if (er) throw er;
        else res.send({ data: '1' })
    })
})

app.get('/chatwith/:id', (req, res) => {
    if (req.session.user == null) {
        res.redirect('/')
    }
    else {
        var me = req.session.user.ID * 1;
        var yu = req.params.id * 1
        friends.findOne({ $or: [{ $and: [{ fr1: me }, { fr2: yu }] }, { $and: [{ fr1: yu }, { fr2: me }] }] }, (rrr, fr) => {
            if (rrr) throw rrr;
            if (fr == null) res.redirect('/');
            else {
                mssg.find({
                    $and: [
                        { typ: 0 },
                        {
                            $or:
                                [{
                                    $and:
                                        [{ sender: me }, { reciever: yu }]
                                },
                                {
                                    $and:
                                        [{ sender: yu }, { reciever: me }]
                                }]
                        }
                    ]
                }, (er, dat) => {
                    if (er) throw er;
                    else {
                        res.send({ data: dat })
                    }
                })
            }
        })
    }

})

app.get('/getGroupChatWith/:id', (req, res) => {
    if (req.session.user == null) {
        res.redirect('/')
    }
    else {
        var me = req.session.user.ID * 1;
        var yu = req.params.id * 1
        members.findOne({
            $and: [{
                group: yu,
                member: me
            }]
        }, (rrr, fr) => {
            if (rrr) throw rrr;
            if (fr == null) res.redirect('/');
            else {
                mssg.find({
                    $and: [
                        { typ: 1 },
                        { reciever: yu }
                    ]
                }, (er, dat) => {
                    if (er) throw er;
                    else {
                        res.send({ data: dat })
                    }
                })
            }
        })
    }
})


app.get('/getAllMygrups', (req, res) => {
    try {
        var x = req.session.user.ID * 1;
        members.aggregate([
            {
                $match: {
                    $and: [{
                        member: x
                    }]
                }
            },
            {
                $lookup: {
                    from: "groups",
                    localField: "group",
                    foreignField: "ID",
                    as: "grup"
                }
            },
            {
                $project: {
                    originalName: "$grup.originalName",
                    ID: "$grup.ID",
                    groupname: "$grup.groupname"
                }
            }

        ], (er, dt) => {
            if (er) throw er;
            else {
                for (let n = 0; n < dt.length; n++) {
                    try {
                        dt[n].ID = dt[n].ID[0];
                        dt[n].originalName = dt[n].originalName[0]
                        dt[n].groupname = dt[n].groupname[0]
                    } catch (ex) {

                    }
                }
                res.send({ data: dt })
            }
        })
    } catch (error) {
        res.redirect('/')
    }
})

app.get('/getAllmembers/:id', (req, res) => {
    try {
        var me = req.session.user.ID;
        members.find({ group: req.params.id * 1 }, (er, dt) => {
            var ans = []
            for (let n = 0; n < dt.length; n++) {
                ans.push(dt[n].member)
            }
            res.send({ data: ans })
        })
    } catch (error) {
        res.redirect('/')
    }
})


app.get('/findRelation/:id', async (req, res) => {
    try {
        var me = req.session.user.ID
        var u = req.params.id * 1
        var ff = await friends.findOne({
            $or: [
                {
                    $and: [
                        { fr1: me },
                        { fr2: u }
                    ]
                },
                {
                    $and: [
                        { fr2: me },
                        { fr1: u }
                    ]
                }
            ]
        })
        if (ff != null) res.send({ data: 1 })
        else {
            var rq = await reqs.findOne({
                $and: [
                    {
                        sender: me
                    },
                    { reciever: u }
                ]
            })
            if (rq != null) res.send({ data: 2 })
            else {
                rq = await reqs.findOne({
                    $and: [
                        {
                            sender: u
                        },
                        { reciever: me }
                    ]
                })
                if (rq != null) res.send({ data: 3 })
                else {
                    res.send({ data: 4 })
                }
            }
        }
    } catch (error) {
        res.redirect('/')
    }
})

app.post('/setPropic', (req, res) => {
    var { propic, ID } = req.body;
    userz.findOneAndUpdate({ ID: ID }, { propic: propic }, (er, dt) => {
        req.session.user.propic = propic;
        res.send({ data: 1 })
    })
})

app.post('/removeMe', (req, res) => {
    try {
        var me = req.session.user.ID * 1
        var { group } = req.body;
        members.findOneAndRemove({ $and: [{ member: me }, { group: group }] }, (er, dt) => {
            if (er) throw er;
            else res.send({ data: '1' })
        })
    } catch (error) {

    }
})

app.get('/getlink', (req, res) => {
    res.send({ data: v4() })
})

app.get('/getlstmgp/:id', async (req, res) => {
    try {
        var me = req.session.user.ID;
        var gp = req.params.id * 1
        var mem = await members.findOne({ $and: [{ group: gp }, { member: me }] })
        if (mem == null) {
            res.redirect('/')
        }
        else {
            lastms.findOne({ $and: [{ reciever: gp }, { typ: 1 }] }, (er, dt) => {
                if (er) throw er;
                else res.send({ data: dt })
            })
        }
    } catch (error) {

    }
})
