const parseTorrent = require('parse-torrent');
const WebTorrent = require('webtorrent');
const fs = require('fs');
const { debounce, getBuffer, formatBytes } = require('./utils')


module.exports.processMessage = (magnet, torrentDir, onUpdate, pushFile, onDownloadComplete, onDone, onError) => {

    const infoHash = tryParseTorrent(magnet);
    if (!infoHash) {
        onError('It\'s not a magnet link');
        return;
    }
    const client = new WebTorrent();

    client.on('error', err => onError(err));

    client.add(magnet, { path: torrentDir}, async torrent => {
        let torrentSize = 0;
        torrent.files.forEach(file => torrentSize += file.length);

        if (torrentSize > 50 * 1024 * 1024) {
            await onError("Torrent size can not be more than 50Mb");
            return;
        }

        const onDownload = () => {
            const downloaded = formatBytes(torrent.downloaded, 2);
            const fullSize = formatBytes(torrentSize, 2);
            const progress = (torrent.progress * 100).toFixed(0);

            onUpdate(progress, downloaded, fullSize);
        };
        const onDownloadDebounced = debounce(onDownload, 500);

        torrent.on('download', onDownloadDebounced);

        torrent.on('done', async () => {
            await onDownloadComplete();

            const promises = [];
            torrent.files.forEach(file => promises.push(getBuffer(file, buf => pushFile(buf, file.name))));
            await Promise.all(promises);

            await onDone();

            await client.remove(magnet, () => fs.rmdir(torrentDir, { recursive: true }, err => {}));
        });
    });

};

const tryParseTorrent = (torrent) => {
    try {
        return parseTorrent(torrent);
    }
    catch (e) {
        return null;
    }
}


