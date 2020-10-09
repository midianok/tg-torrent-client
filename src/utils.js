module.exports.debounce = (func, milliseconds) => {

    let isCooldown = false;

    return function() {
        if (isCooldown) return;

        func.apply(this, arguments);

        isCooldown = true;

        setTimeout(() => isCooldown = false, milliseconds);
    };

}

module.exports.formatBytes =  (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports.getBuffer = (file, callback) => {
    return new Promise(((resolve, reject) => {
            file.getBuffer( async (err, buf) => {
                if (err) reject(err);
                await callback(buf);
                resolve();
            });
        })
    )
};


