const fs = require('fs')

let json
let obj

$(document).ready( () => {
    try
    {
        json = fs.readFileSync('./config.json')
        json = json.toString()
    }
    catch(err)
    {
        const title = '设置'
        const body = '配置文件读取失败\n' + err
        new window.Notification(title, {body:body})
    }

    obj = JSON.parse(json)
    $('#api').val(obj.setting.api)
    $('#music-source').val(obj.setting.musicSource)
})

function SaveSetting()
{
    obj.setting.api = $('#api').val()
    obj.setting.musicSource = $('#music-source').val()
    json = JSON.stringify(obj)
    fs.writeFile('./config.json', json, (err) => {
        if (err)
        {
            const title = '设置'
            const body = '保存失败\n' + err
            new window.Notification(title, {body:body})
        }
        else
        {
            const title = '设置'
            const body = '保存成功'
            new window.Notification(title, {body:body})
        }
    })
}