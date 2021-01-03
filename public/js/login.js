function getel(x) {
    return document.getElementById(x)
}

var firebaseConfig = {
    apiKey: "AIzaSyBQSes_ECwHaryrF8vfsjVD_1wWf7cz8Wc",
    authDomain: "pqrs-9e8eb.firebaseapp.com",
    databaseURL: "https://pqrs-9e8eb.firebaseio.com",
    projectId: "pqrs-9e8eb",
    storageBucket: "pqrs-9e8eb.appspot.com",
    messagingSenderId: "998501066190",
    appId: "1:998501066190:web:0be1a2a2d5116d7c77b79f",
    measurementId: "G-54PCTERKRM"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();



$('#login').submit((e) => {
    e.preventDefault()
    var data = {
        un: getel('username').value,
        pw: getel('password').value
    }
    $.ajax({
        url: '/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: (res) => {
            if (res.data == 0) alert('invalid username/password');
            else window.location.href = '/home'
        }
    })
})

var db = {}
$('#signup').submit((e) => {
    e.preventDefault()

    var data = {
        unm: getel('usernameSgn').value,
        pwd: getel('passwordSgn').value
    }
    $.ajax({
        url: '/reg',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: (res) => {
            if (res.data == 0) alert('invalid username');
            else {
                // 
                getel('regBtn').innerHTML = 'Loading...'
                upload('pros/', ['propic'], 0, 1, res.data)
            }
        }
    })


})





function upload(namee, filez, state, lnt, ID) {
    const ref = firebase.storage().ref()
    const file = document.querySelector("#" + filez[state]).files[0]
    var x = filez.length == 1 ? 'proPiz' + ID : filez[state];
    const name = namee + x;
    const metadata = {
        contentType: file.type
    }
    const task = ref.child(name).put(file, metadata)
    task
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then(url => {
            db["" + filez[state]] = url
            if (state < filez.length - 1) {

                upload(namee, filez, state + 1, lnt, ID)
            }
            else {

                $.ajax({
                    url: '/setPropic',
                    data: JSON.stringify({ propic: db[filez[0]], ID: ID }),
                    contentType: 'application/json',
                    method: 'POST',
                    success: (res) => {
                        window.location.href = '/home'
                    }
                })
            }
        })
}