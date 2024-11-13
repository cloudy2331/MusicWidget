const { ipcRenderer } = require('electron')
const http = require('http')
const fs = require('fs')
const app = require('electron')
const path = require('path')
const { spawn, spawnSync } = require('child_process')
const encoding = require('encoding')
const colorfulimg = require('colorfulimg')
const chroma = require('chroma-js')

let json
let obj
let dataCount = 0
var coreResult = ''
let audioDevice = 'unknnown device'
//const textDecoder = new TextDecoder('gb2312')

//初始化
$(document).ready(() => {
    setInterval(IconControl, 100)

    try {
        // console.log(path.join(app.getAppPath('exe'), 'config.json'))
        // json = fs.readFileSync('./config.json')
        json = fs.readFileSync(path.join(__dirname, 'config.json'))
        json = json.toString()
    }
    catch (err) {
        const title = '设置'
        const body = '配置文件读取失败\n' + err
        new window.Notification(title, { body: body })
    }

    obj = JSON.parse(json)

    //这两个if应该写成switch，防止config.json中的musicSource值错误，但是修改他们看着就麻烦，反正我也不打算维护api模式
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
        // let child = spawn('./Core/Windows/Release/SmtcNetCore.exe')
        let child = spawn(path.join(__dirname, 'Core', 'Windows', 'Release', 'SmtcNetCore.exe'))

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

                const appName = new Map()
                appName.set(/cloudmusic/i, '网易云音乐')
                appName.set(/spotify/i, 'Spotify')
                appName.set(/kugou/i, '酷狗音乐')

                appName.forEach((value, key) => {
                    if (key.test(splitResult[1])) {
                        $('#music-source').html(` <b>·</b> ${value}`)
                    }
                })

                $('#music-name').text(splitResult[2]).attr('title', splitResult[2])
                $('#artist').text(splitResult[3]).attr('title', splitResult[3])
                SmtcImg(splitResult[4].slice(0, -1))
            }
        })
    }

    ipcRenderer.send('topChange', obj.setting.sticky)
    // window.electronAPI.topChange(obj.sticky)
})

//#region 功能控制
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
    let child = spawn(path.join(__dirname, 'Core/Windows/nircmd/nircmdc.exe'), ['sendkeypress', '0xb3'])
}

function NextPlay() {
    let child = spawn(path.join(__dirname, 'Core/Windows/nircmd/nircmdc.exe'), ['sendkeypress', '0xb0'])
}

function LastPlay() {
    let child = spawn(path.join(__dirname, 'Core/Windows/nircmd/nircmdc.exe'), ['sendkeypress', '0xb1'])
}

function topChange() {
    ipcRenderer.send('topChange', 'dick')
    $('.pin i').toggle()
}

function Reload() {
    window.location.reload()
}

function progressBarTest() {
    ipcRenderer.send('progressChange', 0)
}
//#endregion

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

//api模式
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

//smtc模式
function SmtcImg(base64) {
    $('#music-img').attr('src', 'data:image/png;base64,' + base64)
    const musicImg = $('#music-img')[0]
    musicImg.addEventListener('error', () => {
        window.location.reload()
    })
    musicImg.addEventListener('load', () => {
        let bc = [colorfulimg(musicImg).r, colorfulimg(musicImg).g, colorfulimg(musicImg).b]
        let coefficient = Math.floor(255 / bc.toSorted((a, b) => b - a)[0])
        let tc = [0, 0, 0]
        let ct = 'dark'
        let hsl = rgbToHsl(colorfulimg(musicImg).r, colorfulimg(musicImg).g, colorfulimg(musicImg).b)

        //切换颜色方案
        switch (obj.setting.colorScheme) {
            case '0':
                //material方案
                console.log(hsl)
                if (hsl.l < 0.5) {
                    ct = 'dark'
                } else {
                    ct = 'light'
                }
                ipcRenderer.invoke('getTextColor', `${bc[0]},${bc[1]},${bc[2]})`, ct).then(res => {
                    document.documentElement.style.setProperty('--text-color', `${res}`)
                    console.log(res)
                })
                break

            case '1':
                //hsl方案
                tc = adjustHsl(hsl.h, hsl.s, hsl.l + (16.30968 / hsl.l))
                document.documentElement.style.setProperty('--text-color', `hsl(${tc[0]}, ${tc[1]}%, ${tc[2]}%)`)
                break

            default:
                //material方案
                console.log(hsl)
                if (hsl.l < 0.5) {
                    ct = 'dark'
                } else {
                    ct = 'light'
                }
                ipcRenderer.invoke('getTextColor', `${bc[0]},${bc[1]},${bc[2]})`, ct).then(res => {
                    document.documentElement.style.setProperty('--text-color', `${res}`)
                    console.log(res)
                })
                break
        }

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

//rgb to oklch
function rgbToXyz(rgb) {
    // 将 RGB 值归一化到 [0, 1]
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;

    // 线性化 RGB 值
    r = (r <= 0.04045) ? (r / 12.92) : Math.pow((r + 0.055) / 1.055, 2.4);
    g = (g <= 0.04045) ? (g / 12.92) : Math.pow((g + 0.055) / 1.055, 2.4);
    b = (b <= 0.04045) ? (b / 12.92) : Math.pow((b + 0.055) / 1.055, 2.4);

    // 转换到 XYZ
    const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
    const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

    return [x, y, z];
}

function xyzToLab(xyz) {
    // 归一化的白点 D65
    const x = xyz[0] / 95.047;
    const y = xyz[1] / 100.000;
    const z = xyz[2] / 108.883;

    const fx = (x > 0.008856) ? Math.pow(x, 1 / 3) : (x * 7.787 + 16 / 116);
    const fy = (y > 0.008856) ? Math.pow(y, 1 / 3) : (y * 7.787 + 16 / 116);
    const fz = (z > 0.008856) ? Math.pow(z, 1 / 3) : (z * 7.787 + 16 / 116);

    const l = (116 * fy) - 16;
    const a = 500 * (fx - fy);
    const bValue = 200 * (fy - fz);

    return [l, a, bValue];
}

function labToOklch(lab) {
    const l = lab[0];
    const a = lab[1];
    const b = lab[2];

    const c = Math.sqrt(a ** 2 + b ** 2);
    const h = Math.atan2(b, a) % (2 * Math.PI); // 角度弧度转换

    return [l, c, h];
}

function rgbToOklch(rgb) {
    const xyz = rgbToXyz(rgb);
    const lab = xyzToLab(xyz);
    const oklch = labToOklch(lab);
    return oklch;
}

//oklch get text color
function chooseTextColor(bgOklch) {
    const bgL = bgOklch[0];
    const bgC = bgOklch[1];
    const bgH = bgOklch[2];
    //claculate fornt color lightness
    const threshold = 0.179;
    const textL = bgL < threshold ? 1 : bgL - (bgL - threshold) / 1.5;
    const textC = bgC + 0.05;
    return [bgL, textC, bgH];
}