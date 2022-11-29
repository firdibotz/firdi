"use strict";
const { default: makeWASocket, DisconnectReason, useSingleFileAuthState, makeInMemoryStore, downloadContentFromMessage, jidDecode, generateForwardMessageContent, generateWAMessageFromContent } = require("@adiwajshing/baileys")
const fs = require("fs");
const chalk = require('chalk')
const logg = require('pino')
const { serialize, fetchJson, sleep, getBuffer } = require("./function/myfunc");
const { nocache, uncache } = require('./function/chache.js');

let setting = JSON.parse(fs.readFileSync('./options/config.json'));
let session = `./${setting.sessionName}.json`
const { state, saveState } = useSingleFileAuthState(session)

const memory = makeInMemoryStore({ logger: logg().child({ level: 'fatal', stream: 'store' }) })

const connectToWhatsApp = async () => {
const conn = makeWASocket({
printQRInTerminal: true,
logger: logg({ level: 'fatal' }),
browser: ['Gurabot MD','Safari','1.0.0'],
auth: state
})
memory.bind(conn.ev)

conn.ev.on('messages.upsert', async m => {
var msg = m.messages[0]
if (!m.messages) return;
if (msg.key && msg.key.remoteJid == "status@broadcast") return
msg = serialize(conn, msg)
msg.isBaileys = msg.key.id.startsWith('BAE5') || msg.key.id.startsWith('3EB0')
require('./index')(conn, msg, m, setting, memory)
})

conn.ev.on('creds.update', () => saveState)

conn.reply = (from, content, msg) => conn.sendMessage(from, { text: content }, { quoted: msg })

conn.ws.on('CB:call', async (json) => {
const user_Call = json.content[0].attrs['call-creator']
conn.sendMessage(user_Call, { text: 'Maaf kamu terdeteksi telepon bot!\n5 detik lagi kamu akan,\ndiblokir otomatis oleh bot.'})
await sleep(5000)
conn.updateBlockStatus(user_Call, 'block')
})

conn.ev.on('connection.update', (update) => {
console.log('Connection update:', update)
if (update.connection === 'open') 
console.log("Connected with " + conn.user.id)
else if (update.connection === 'close')
connectToWhatsApp()
})

return conn
}
connectToWhatsApp()
.catch(err => console.log(err))
