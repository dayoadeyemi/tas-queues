document.cookie='browser=true'
var source
function cleanupListeners(){ if (source) source.close() }
if (!!window.EventSource) {
    Notification.requestPermission().then(function(result) {
        source = new EventSource('/tasks/updates');
        source.addEventListener('data', function(e) {
            var task = JSON.parse(e.data)
            var n = new Notification( 'New '+ task.queue + ' task', {
                body: task.title
            });
            n.onclick = function(){ location.reload() }
        }, false)

        source.addEventListener('error', function(e) {
            if (e.readyState == EventSource.CLOSED) {
                console.log("Connection was closed")
            }
        }, false)
    });
}