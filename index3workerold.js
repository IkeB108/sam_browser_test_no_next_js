// When the user inputs a zip file, unzip the file with fflate using a stream
// (to support large zip files). 
// Then, list all the files in the zip and their sizes (in bytes) on the page.

self.importScripts('https://cdn.jsdelivr.net/npm/fflate@0.8.0/umd/index.min.js');

self.onmessage = async (event) => {
    const file = event.data;
    try {
        const stream = file.stream();
        const reader = stream.getReader();

        const unzipper = new fflate.Unzip();
        let fileListHtml = "<strong>Files in zip:</strong><br>";
        
        unzipper.onfile = (entry) => {
            /*
            entry is an object with the properties:
            -- name (string, the filename)
            -- start() (function)
            -- terminate() (function)
            
            There is no property for the size of the file
            */
            fileListHtml += `${entry.name}: unknown bytes<br>`;
        };

        let processedBytes = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            unzipper.push(value);
            processedBytes += value.byteLength;

            const progress = Math.round((processedBytes / file.size) * 100);
            self.postMessage({ type: 'progress', data: progress });
        }

        self.postMessage({ type: 'fileList', data: fileListHtml });
        self.postMessage({ type: 'complete' });
    } catch (error) {
        self.postMessage({ type: 'error', data: error });
    }
};
