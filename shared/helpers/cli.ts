export const run = (main: () => Promise<void>): void => {
    main()
        .then(() => {
            console.log('🍊 Done!')
            process.exit(0);
        })
        .catch((err) => {
            console.log('🍊 Error!', err)
            process.exit(1);
        });
};