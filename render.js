const { ipcRenderer } = require('electron')
const http = require('http')
const fs = require('fs')
const { spawn, spawnSync } = require('child_process')
const encoding = require('encoding')
const colorfulimg = require('colorfulimg')

let json
let obj
let dataCount = 0
var coreResult = ''
//const textDecoder = new TextDecoder('gb2312')

$(document).ready(() => {
    setInterval(IconControl, 100)

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

    if (obj.setting.musicSource == 0) {
        ipcRenderer.on('playMusic', async (event, id, name, artists, url) => {
            $('#music-name').text(name)
            $('#artist').text(artists)
            $('#audio').attr('src', url.data[0].url)
            GetImg(id)
            SwitchPlayStatus()
        })
    }
    if (obj.setting.musicSource == 1) {
        $('#control-bar').css('display', 'none')
        var child = spawn('./Core/Windows/Release/SmtcNetCore.exe')

        child.stdout.on('data', (data) => {
            //coreResult = textDecoder.decode(data)
            //var splitResult = data.toString()
            //var splitResult = textDecoder.decode(data)
            var splitResult = encoding.convert(data, 'UTF8', 'GBK')
            splitResult = splitResult.toString()
            splitResult = splitResult.split(',')
            if (splitResult[0] == 'OnAnyMediaPropertyChanged') {
                coreResult = ''
                coreResult += encoding.convert(data, 'UTF8', 'GBK')
            }
            else {
                coreResult += encoding.convert(data, 'UTF8', 'GBK')
            }
            if (coreResult.charAt(coreResult.length - 1) == '=') {
                //coreResult.slice(0, -1)
                console.log(coreResult)
                splitResult = coreResult.split(',')
                $('#music-source').html(` <b>·</b> ${splitResult[1]}`)
                $('#music-name').text(splitResult[2])
                $('#artist').text(splitResult[3])
                SmtcImg(splitResult[4].slice(0, -1))
            }
        })
    }
})

function SwitchPlayStatus() {
    let player = $('#audio')[0]
    if (player.paused) {
        player.play()
    }
    else {
        player.pause()
    }
}

function topChange() {
    ipcRenderer.send('topChange', 'dick')
    $('.pin i').toggle()
}

function progressBarTest() {
    ipcRenderer.send('progressChange', 0)
}

function IconControl() {
    let player = $('#audio')[0]
    const playIcon = 'bi bi-play-fill'
    const pauseIcon = 'bi bi-pause-fill'
    if (player.paused) {
        $('#playIcon').attr('class', playIcon)
    }
    else {
        $('#playIcon').attr('class', pauseIcon)
    }
}

function GetImg(id) {
    http.get(`${obj.setting.api.toString()}/album?id=${id}`, (req, res) => {
        var html = ''
        req.on('data', (data) => {
            html += data
        })
        req.on('end', async () => {
            html = JSON.parse(html)
            let imgUrl = html.album.picUrl
            $('#music-img').attr('src', imgUrl)
            const musicImg = $('#music-img')[0]
            musicImg.addEventListener('load', () => {
                /*const canvas = $('#canvas')[0].getContext('2d')
                canvas.width = musicImg.width
                canvas.height = musicImg.height
                canvas.drawImage(musicImg, 0, 0)
                let imgData = (canvas.getImageData(0, 0, canvas.width, canvas.height)).data
                const colorList = {}
                let i = 0
                while (i < imgData.length) {
                    const r = imgData[i]
                    const g = imgData[i + 1]
                    const b = imgData[i + 2]
                    const a = imgData[i + 3]
                    i += 4
                    const key = [r, g, b].join(',')
                    key in colorList ? ++colorList[key] : (colorList[key] = 1)
                }
                let arr = []
                for (let key in colorList) {
                    arr.push({
                        rgba: `rgba(${key})`,
                        num: colorList[key]
                    })
                }
                arr = arr.sort((a, b) => b.num - a.num)
                console.log(arr)
                //document.documentElement.style.setProperty('--background-color', arr[0].rgba);
                //if (arr.length > 1) {
                //    $('body').css('background-color', arr[1].rgba)
                //}
                //else {
                $('body').css('background-color', arr[0].rgba)
                //}*/
                $('body').css('background-color', `rgb(${colorfulimg(musicImg).r}, ${colorfulimg(musicImg).g}, ${colorfulimg(musicImg).b})`)
            })

        })
    })
}

function SmtcImg(base64) {
    $('#music-img').attr('src', 'data:image/png;base64,' + base64)
    const musicImg = $('#music-img')[0]
    musicImg.addEventListener('error', () => {
        window.location.reload()
    })
    musicImg.addEventListener('load', () => {
        /*const canvas = $('#canvas')[0].getContext('2d')
        canvas.width = musicImg.width
        canvas.height = musicImg.height
        canvas.drawImage(musicImg, 0, 0)
        let imgData = (canvas.getImageData(0, 0, canvas.width, canvas.height)).data
        const colorList = {}
        let i = 0
        while (i < imgData.length) {
            const r = imgData[i]
            const g = imgData[i + 1]
            const b = imgData[i + 2]
            const a = imgData[i + 3]
            i += 4
            const key = [r, g, b].join(',')
            key in colorList ? ++colorList[key] : (colorList[key] = 1)
        }
        let arr = []
        for (let key in colorList) {
            arr.push({
                rgba: `rgb(${key})`,
                num: colorList[key]
            })
        }
        arr = arr.sort((a, b) => b.num - a.num)
        console.log(arr)
        $('body').css('background-color', arr[0].rgba)*/
        $('body').css('background-color', `rgb(${colorfulimg(musicImg).r}, ${colorfulimg(musicImg).g}, ${colorfulimg(musicImg).b})`)
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}