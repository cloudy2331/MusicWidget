const { ipcRenderer } = require('electron')
const http = require('http')
const fs = require('fs')
const app = require('electron')
const path = require('path')
const { spawn, spawnSync } = require('child_process')
const encoding = require('encoding')
const colorfulimg = require('colorfulimg')

let json
let obj
let dataCount = 0
var coreResult = ''
let audioDevice = 'unknnown device'
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
        $('#smtcPlayIcon').css('display', 'none')
        ipcRenderer.on('playMusic', async (event, id, name, artists, url) => {
            $('#music-name').text(name)
            $('#artist').text(artists)
            $('#audio').attr('src', url.data[0].url)
            GetImg(id)
            SwitchPlayStatus()
        })
    }
    if (obj.setting.musicSource == 1) {
        // $('#control-bar').css('display', 'none')
        $('#playIcon').css('display', 'none')
        let child = spawn('./Core/Windows/Release/SmtcNetCore.exe')

        child.stdout.on('data', (data) => {
            //coreResult = textDecoder.decode(data)
            //var splitResult = data.toString()
            //var splitResult = textDecoder.decode(data)
            var splitResult = encoding.convert(data, 'UTF8', 'GBK')
            splitResult = splitResult.toString()
            splitResult = splitResult.split(',')
            if (splitResult[0] == 'OnAnyMediaPropertyChanged') {
                $('#music-name').text('loading...').attr('title', 'loading...')
                $('#artist').text('loading...').attr('title', 'loading...')
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
                // if (ipcRenderer.sendSync('getLanguage') == 'zh-Hans-CN') {
                if (splitResult[1] == 'cloudmusic.exe') {
                    $('#music-source').html(` <b>·</b> 网易云音乐`)
                }
                // }
                $('#music-name').text(splitResult[2]).attr('title', splitResult[2])
                $('#artist').text(splitResult[3]).attr('title', splitResult[3])
                SmtcImg(splitResult[4].slice(0, -1))
            }
        })
    }

    ipcRenderer.send('topChange', obj.setting.sticky)
    // window.electronAPI.topChange(obj.sticky)
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

function SwitchPlayStatusSmtc() {
    // let child = spawn('./Core/Windows/nircmd/nircmdc.exe sendkeypress 0xb3')
    let child = spawn(path.join('./Core/Windows/nircmd/nircmdc.exe'), ['sendkeypress', '0xb3'])
}

function NextPlay() {
    let child = spawn(path.join('./Core/Windows/nircmd/nircmdc.exe'), ['sendkeypress', '0xb0'])
}

function LastPlay() {
    let child = spawn(path.join('./Core/Windows/nircmd/nircmdc.exe'), ['sendkeypress', '0xb1'])
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

    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            devices.forEach(device => {
                if (device.kind === 'audiooutput' && device.deviceId === 'default') {
                    $('#sound-device').text(device.label.split('-')[1])
                    $('#sound-device').attr('title', device.label)
                }
            })
        }).catch(err => {
            $('#sound-device').text('unknnown device')
            $('#sound-device').attr('title', 'unknnown device')
        })
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

                let bc = [colorfulimg(musicImg).r, colorfulimg(musicImg).g, colorfulimg(musicImg).b]
                let coefficient = Math.floor(255 / bc.toSorted((a, b) => b - a)[0])
                let tc = []
                for (i = 0; i < bc.length; i++) {
                    if (bc[i] > 127.5) {
                        tc[i] = Math.floor(bc[i] / 3)
                    }
                    else {
                        if (coefficient < 3) {
                            tc[i] = bc[i] * coefficient
                        }
                        else {
                            tc[i] = bc[i] * 3
                        }
                    }
                }

                document.documentElement.style.setProperty('--text-color', `rgb(${tc[0]}, ${tc[1]}, ${tc[2]})`)
                $('body').css('background-color', `rgb(${bc[0]}}, ${bc[1]}, ${bc[2]})`)
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

        let bc = [colorfulimg(musicImg).r, colorfulimg(musicImg).g, colorfulimg(musicImg).b]
        let coefficient = Math.floor(255 / bc.toSorted((a, b) => b - a)[0])
        let tc = []
        // for (i = 0; i < bc.length; i++) {
        //     if (bc[i] > 127.5) {
        //         tc[i] = Math.floor(bc[i] / 3)
        //     }
        //     else {
        //         if (coefficient < 3) {
        //             tc[i] = bc[i] * coefficient
        //         }
        //         else {
        //             tc[i] = bc[i] * 3
        //         }
        //     }
        // }
        let hsl = rgbToHsl(colorfulimg(musicImg).r, colorfulimg(musicImg).g, colorfulimg(musicImg).b)
        // tc = adjustHsl(hsl.h, hsl.s, hsl.l + 20)
        tc = adjustHsl(hsl.h, hsl.s, hsl.l + (16.30968 / hsl.l))

        document.documentElement.style.setProperty('--text-color', `hsl(${tc[0]}, ${tc[1]}%, ${tc[2]}%)`)
        $('body').css('background-color', `rgb(${bc[0]}}, ${bc[1]}, ${bc[2]})`)
        $('body').css('background-color', `rgb(${colorfulimg(musicImg).r}, ${colorfulimg(musicImg).g}, ${colorfulimg(musicImg).b})`)
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function adjustHsl(h, s, l) {
    return [h, s, l];
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max == min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h, s, l };
}