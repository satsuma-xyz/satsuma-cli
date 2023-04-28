export const run = (main: () => Promise<void>): void => {
    main()
        .then(() => {
            process.exit(0);
        })
        .catch((err) => {
            process.exit(1);
        });
};