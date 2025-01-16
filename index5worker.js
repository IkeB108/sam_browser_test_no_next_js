importScripts('fflate.js');

self.onmessage = async function(e) {
    const file = e.data;
    const unzipped = {};
    const CHUNK_SIZE = 64 * 1024; // 64KB chunks
    let offset = 0;
    
    // Create unzip instance
    const unzip = new fflate.Unzip();
    
    unzip.onfile = (file) => {
        const { name } = file;
        let chunks = [];
        
        file.ondata = (err, chunk, final) => {
            if (err) {
                self.postMessage({ error: err.message });
                return;
            }
            
            if (chunk) chunks.push(chunk);
            if (final) {
                const blob = new Blob(chunks);
                chunks = [];
                const reader = new FileReader();
                reader.onload = () => {
                    unzipped[name] = reader.result;
                    if (Object.keys(unzipped).length === unzip.count) {
                        self.postMessage(unzipped);
                    }
                };
                reader.readAsText(blob);
            }
        };
        
        file.start();
    };

    // Stream the file in chunks
    const processNextChunk = () => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const chunk = new Uint8Array(e.target.result);
            const isLastChunk = offset + chunk.length >= file.size;
            
            try {
                unzip.push(chunk, isLastChunk);
            } catch (err) {
                console.error(err)
                self.postMessage({ error: err.message });
                return;
            }
            
            if (!isLastChunk) {
                offset += chunk.length;
                readNextChunk();
            }
        };
        
        reader.onerror = () => {
            self.postMessage({ error: 'Error reading file chunk' });
        };
        
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        reader.readAsArrayBuffer(chunk);
    };

    const readNextChunk = () => {
        // Use setTimeout to avoid blocking and allow other operations
        setTimeout(processNextChunk, 0);
    };

    // Start processing
    readNextChunk();
};