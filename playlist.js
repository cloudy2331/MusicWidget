const http = require('http')
const fs = require('fs')
const { ipcRenderer } = require('electron')

let json
let obj
let songResult

$(document).ready(() => {
    try {
        json = fs.readFileSync('./config.json')
        json = json.toString()
    }
    catch (err) {
        const title = '设置'
        const body = '配置文件读取失败\n' + err
        new window.Notification(title, { body: body })
    }

    obj = JSON.parse(json)
})

$(document).keyup((e) => {
    switch(e.keyCode)
    {
        case 13:
            SearchMusic()
            return
    }
})

function SearchMusic() {
    serchText = $('#searchText').val();

    http.get(obj.setting.api.toString() + '/search?keywords=' + serchText, (req, res) => {
        document.getElementById('music_list').innerHTML = '';
        var html = ''
        req.on('data', (data) => {
            html += data
        })
        req.on('end', () => {
            songResult = JSON.parse(html)
            console.log(songResult)
            for (i = 0; i < songResult.result.songs.length; i++) {
                var songId = songResult.result.songs[i].id
                var songName = songResult.result.songs[i].name
                var songArtists = songResult.result.songs[i].artists[0].name
                /*for (j = 0; j < songResult.result.songs[i].artists.length; i++)
                {
                    if (j == songResult.result.songs[i].artists.length - 1)
                    {
                        songArtists += songResult.result.songs[i].artists[j].name
                    }
                    else
                    {
                        songArtists += songResult.result.songs[i].artists[j].name + '/'
                    }
                }*/
                var songAlbum = songResult.result.songs[i].album.name
                var songLengthM = Math.floor((songResult.result.songs[i].duration / (1000 * 60)) % 60)
                var songLengthS = Math.floor((songResult.result.songs[i].duration / 1000) % 60)
                if (songLengthS < 10) {
                    songLengthS = '0' + songLengthS.toString()
                }
                var fee = songResult.result.songs[i].fee
                var imgId = songResult.result.songs[i].album.id

                var songList =
                    `<div class="song" id="${songId}">
                    <div class="musicName">
                        <span>${songName}</span>
                    </div>
                    <div class="artists">
                        <span>${songArtists}</span>
                    </div>
                    <div class="time">
                        <span>${songLengthM}:${songLengthS}</span>
                    </div>
                    <div class="musicControl">
                        <i class="bi bi-play-fill" onclick="PlaySong(${songId}, ${imgId}, '${songName}', '${songArtists}')"></i>
                        <i class="bi bi-plus" onclick="AddSongList(${songId}, '${songName}')"></i>
                    </div>
                </div>`

                if (fee == 0 || fee == 8) {
                    document.getElementById('music_list').innerHTML += songList
                }
            }
        })
    })
}

function AddSongList(id, songName) {

}

function PlaySong(id, imgId, name, artists) {
    http.get(`${obj.setting.api.toString()}/song/url/v1?id=${id}&level=exhigh`, (req, res) => {
        var html = ''
        req.on('data', (data) => {
            html += data
        })
        req.on('end', () => {
            //ipcRenderer.send('playMusic', html)
            ipcRenderer.once('requestContentId', (event, data) => {
                console.log('id:' + data)
                html = JSON.parse(html)
                console.log(html)
                ipcRenderer.sendTo(Number(data), 'playMusic', imgId, name, artists, html)
            })
            ipcRenderer.send('getContentId', 0)            
        })
    })
}