// webworker.js
import myTarStream from 'https://cdn.skypack.dev/tar-stream/'

let extract = tar.extract();
let chunks = [];

extract.on('entry', function(header, stream, next) {
    postMessage({
        type: 'file',
        name: header.name,
        size: header.size
    });

    // Consume the stream to move to next entry
    stream.on('data', function(chunk) {
        // We don't need to do anything with the data
    });

    stream.on('end', function() {
        next();
    });

    stream.resume();
});

extract.on('finish', function() {
    postMessage({
        type: 'status',
        message: 'Processing complete!'
    });
});

onmessage = function(e) {
    if (e.data.chunk) {
        // Process new chunk
        extract.write(e.data.chunk);
        postMessage({
            type: 'status',
            message: 'Processing chunk...'
        });
    }
    
    if (e.data.done) {
        // End the stream when all chunks are processed
        extract.end();
    }
};

onerror = function(error) {
    postMessage({
        type: 'status',
        message: 'Error: ' + error.message
    });
};