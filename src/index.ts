import Main from './main/main';
(async () => {
    await new Main()
        .initialize();
})()
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
