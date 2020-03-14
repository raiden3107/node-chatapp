const socket = io()
const $messageForm = document.querySelector('#message-form')
const $messageInputForm = $messageForm.querySelector('input')
const $messageButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#send-location')
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $messages = document.querySelector('#messages')
const $locationTemplate = document.querySelector('#location-template').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    const visibleHeight = $messages.offsetHeight
    const containerHeight = $messages.scrollHeight
    const scrollOffset = $messages.scrollTop + visibleHeight
    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render($locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageButton.setAttribute('disabled','disabled')
    const msg = e.target.elements.message.value
    socket.emit('sendMessage', msg, (error) => {
        $messageButton.removeAttribute('disabled')
        $messageInputForm.value = ''
        $messageInputForm.focus()
        if(error){
            return alert(error)
        }
        console.log('Message Delivered!')
    })
})

$sendLocation.addEventListener('click', (e) => {
    e.preventDefault()
    $sendLocation.setAttribute('disabled','disabled')
    if(!navigator.geolocation){
        return alert('Your browser does not support this function.')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        const {longitude, latitude} = position.coords
        socket.emit('sendLocation', {longitude, latitude}, () => {
            $sendLocation.removeAttribute('disabled')
            console.log('Location Shared!')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render($sidebarTemplate, {room, users})
    document.querySelector('#sidebar').innerHTML = html
})